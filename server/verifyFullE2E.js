import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import express from 'express';
import { createApp } from './app.js';
import { closeDb, getDbPath } from './db.js';
import { PRESETS_12M, REFERENCE_PLANS_24M } from '../shared/tuesteModel.js';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

function resolveChromeBinary() {
  const candidates = [
    process.env.CHROME_BIN,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
  return candidates.find(p => fs.existsSync(p)) || 'google-chrome';
}

const CHROME_PATH = resolveChromeBinary();

async function startBackendServer(port = 3001) {
  try {
    await fetch(`http://127.0.0.1:${port}/api/_takeover`, { method: 'POST' });
    await new Promise(r => setTimeout(r, 300));
  } catch {
    // No había instancia previa en el puerto
  }
  const app = createApp();
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        server,
        port: addr.port,
        baseUrl: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise(res => server.close(res))
      });
    });
    server.on('error', reject);
  });
}

function startStaticFrontendServer(port = 0) {
  const app = express();
  app.use(express.static(DIST_DIR));
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        server,
        port: addr.port,
        baseUrl: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise(res => server.close(res))
      });
    });
    server.on('error', reject);
  });
}

async function dumpDomWithChrome(url) {
  const { stdout } = await execFileAsync(
    CHROME_PATH,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--virtual-time-budget=3500',
      '--dump-dom',
      url
    ],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  );
  return stdout;
}

console.log('=== PRUEBA INTEGRAL END-TO-END (BACKEND + SQLITE + REACT FRONTEND EN CHROME) ===');
console.log('Base de datos SQLite:', getDbPath());

let backend1 = await startBackendServer(3001);
let frontend = await startStaticFrontendServer(0);

try {
  // 1. Crear escenario llamado "Prueba de persistencia" antes de reiniciar
  const createRes = await fetch(`${backend1.baseUrl}/api/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Prueba de persistencia',
      note: 'Creado antes de reiniciar el backend',
      params12m: PRESETS_12M.combinado,
      plan24m: REFERENCE_PLANS_24M.propioB
    })
  });
  assert.equal(createRes.status, 201);
  const createdData = await createRes.json();
  const savedId = createdData.scenario.id;
  console.log(`[OK] Escenario "Prueba de persistencia" creado en SQLite (ID #${savedId}) antes de reiniciar el servidor`);

  // Reiniciar el backend (cerrar servidor HTTP y cerrar conexión SQLite)
  await backend1.close();
  closeDb();
  console.log('[OK] Backend detenido y SQLite cerrado');

  // Levantar nueva instancia del backend en 127.0.0.1:3001
  const backend2 = await startBackendServer(3001);
  try {
    console.log('[OK] Backend reiniciado en 127.0.0.1:3001');

    // Comprobar vista inicial: muestra primero resultados y controles (panel Mis escenarios cerrado por defecto)
    const domDefault = await dumpDomWithChrome(`${frontend.baseUrl}/?tab=todas`);
    assert.ok(
      domDefault.includes('Guardado disponible'),
      'El encabezado debe mostrar "Guardado disponible"'
    );
    assert.ok(
      !domDefault.includes('id="panel-mis-escenarios"'),
      'Al abrir una sección debe mostrar primero resultados y controles, con el panel "Mis escenarios" plegado'
    );
    assert.ok(
      domDefault.includes('id="seccion-informacion-tecnica"'),
      'La sección secundaria "Información técnica del sistema" debe existir al final'
    );

    // Abrir el panel desplegable "Mis escenarios" y verificar los textos simplificados y el escenario persistido
    const domWithPanel = await dumpDomWithChrome(`${frontend.baseUrl}/?tab=todas&panel=open`);
    assert.ok(
      domWithPanel.includes('Mis escenarios') && domWithPanel.includes('Guardar escenario'),
      'El panel desplegable debe usar los textos simplificados "Mis escenarios" y "Guardar escenario"'
    );
    assert.ok(
      domWithPanel.includes('Prueba de persistencia'),
      'El frontend React en Chrome debe listar "Prueba de persistencia" tras el reinicio del backend'
    );
    assert.ok(
      domWithPanel.includes('54,5455') && domWithPanel.includes('54,7961'),
      'La Calculadora (Sección 1) debe mostrar CAC real $54,5455 y LTV $54,7961'
    );
    assert.ok(
      domWithPanel.includes('72,34') && domWithPanel.includes('46,5162'),
      'El Tablero (Sección 2) debe mostrar CAC Agencia $72,34 y LTV $46,5162'
    );
    assert.ok(
      domWithPanel.includes('31.765,4254') &&
        domWithPanel.includes('79.596,45') &&
        domWithPanel.includes('95.566,24') &&
        domWithPanel.includes('134.058,51'),
      'El Simulador 24M (Sección 3) debe mostrar Caja M1 $31.765,4254 y Cajas M24 de los planes'
    );
    console.log('[OK] Google Chrome verificó la presentación limpia, las 3 secciones y el escenario persistido tras reinicio');

    // Actualizar "Prueba de persistencia" y luego eliminar únicamente ese plan de prueba
    const updRes = await fetch(`${backend2.baseUrl}/api/scenarios/${savedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Prueba de persistencia',
        note: 'Actualizado en prueba E2E',
        params12m: PRESETS_12M.cambio1,
        plan24m: REFERENCE_PLANS_24M.propioA
      })
    });
    assert.equal(updRes.status, 200);

    const delRes = await fetch(`${backend2.baseUrl}/api/scenarios/${savedId}`, {
      method: 'DELETE'
    });
    assert.equal(delRes.status, 200);
    console.log(`[OK] Escenario "Prueba de persistencia" (#${savedId}) actualizado y eliminado correctamente`);
  } finally {
    await backend2.close();
    closeDb();
  }

  // 2. Con el backend APAGADO, abrir el frontend React en Google Chrome y verificar que:
  //    - Muestra el aviso de que no se pueden guardar cambios (#offlineWarningBanner)
  //    - Permite seguir calculando en vivo sin perder las entradas del usuario
  console.log('[OK] Probando el frontend React en Chrome con el backend APAGADO (modo sin conexión)...');
  const domOffline = await dumpDomWithChrome(`${frontend.baseUrl}/?tab=todas`);
  assert.ok(
    domOffline.includes('Guardado no disponible') &&
      domOffline.includes('offlineWarningBanner') &&
      domOffline.includes('no se pueden guardar cambios'),
    'Cuando el backend está apagado, el frontend debe avisar que no se pueden guardar cambios'
  );
  assert.ok(
    domOffline.includes('54,5455') && domOffline.includes('54,7961') && domOffline.includes('Mes 12'),
    'Cuando el backend está apagado, la calculadora sigue funcionando con todas las entradas y resultados'
  );
  console.log('[OK] Google Chrome verificó el modo sin conexión: muestra alerta y conserva cálculos y entradas intactas');
} finally {
  try {
    await backend1.close();
  } catch {
    // ya cerrado
  }
  await frontend.close();
  closeDb();
}

console.log('=== PRUEBA E2E COMPLETA PASÓ EXITOSAMENTE ===');
