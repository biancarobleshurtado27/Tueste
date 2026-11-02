import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
import { closeDb, getDbPath } from './db.js';
import { PRESETS_12M, REFERENCE_PLANS_24M } from '../shared/tuesteModel.js';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function startBackendServer(port = 3001) {
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

// 1. Levantar Backend en 127.0.0.1:3001 y crear un escenario propio antes de reiniciar
let backend1 = await startBackendServer(3001);
let frontend = await startStaticFrontendServer(0);

try {
  // Crear escenario propio vía API
  const createRes = await fetch(`${backend1.baseUrl}/api/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Escenario Persistente E2E ($4.000 + Pack)',
      note: 'Creado antes de reiniciar el backend',
      params12m: PRESETS_12M.combinado,
      plan24m: REFERENCE_PLANS_24M.propioB
    })
  });
  assert.equal(createRes.status, 201);
  const createdData = await createRes.json();
  const savedId = createdData.scenario.id;
  console.log(`[OK] Escenario creado en SQLite (ID #${savedId}) antes de reiniciar el servidor`);

  // Reiniciar el backend (cerrar servidor HTTP y cerrar conexión SQLite)
  await backend1.close();
  closeDb();
  console.log('[OK] Backend detenido y SQLite cerrado');

  // Levantar nueva instancia del backend en 127.0.0.1:3001
  const backend2 = await startBackendServer(3001);
  try {
    console.log('[OK] Backend reiniciado en 127.0.0.1:3001');

    // Abrir el frontend React en Google Chrome real con las 3 secciones activas y comprobar que carga el escenario guardado tras el reinicio
    const domOnline = await dumpDomWithChrome(`${frontend.baseUrl}/?tab=todas`);
    assert.ok(
      domOnline.includes('Backend y SQLite Conectados'),
      'El frontend React en Chrome debe mostrar estado conectado al backend'
    );
    assert.ok(
      domOnline.includes('Escenario Persistente E2E ($4.000 + Pack)'),
      'El frontend React en Chrome debe listar el escenario recuperado desde SQLite tras el reinicio'
    );
    assert.ok(
      domOnline.includes('54,5455') && domOnline.includes('54,7961'),
      'La Calculadora (Sección 1) debe mostrar CAC real $54,5455 y LTV $54,7961'
    );
    assert.ok(
      domOnline.includes('72,34') && domOnline.includes('46,5162'),
      'El Tablero (Sección 2) debe mostrar CAC Agencia $72,34 y LTV $46,5162'
    );
    assert.ok(
      domOnline.includes('31.765,4254') &&
        domOnline.includes('79.596,45') &&
        domOnline.includes('95.566,24') &&
        domOnline.includes('134.058,51'),
      'El Simulador 24M (Sección 3) debe mostrar Caja M1 $31.765,4254 y Cajas M24 de los planes'
    );
    console.log('[OK] Google Chrome renderizó las 3 secciones en React conectadas al backend y mostró el escenario persistido tras reinicio');

    // Actualizar escenario propio y luego eliminarlo
    const updRes = await fetch(`${backend2.baseUrl}/api/scenarios/${savedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Escenario E2E Actualizado',
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
    console.log(`[OK] Escenario #${savedId} actualizado y eliminado correctamente`);
  } finally {
    await backend2.close();
    closeDb();
  }

  // 2. Con el backend APAGADO, abrir el frontend React en Google Chrome y verificar que:
  //    - Muestra el aviso de error de conexión (#offlineWarningBanner)
  //    - Permite seguir calculando en vivo sin perder las entradas del usuario
  console.log('[OK] Probando el frontend React en Chrome con el backend APAGADO (modo sin conexión)...');
  const domOffline = await dumpDomWithChrome(`${frontend.baseUrl}/?tab=todas`);
  assert.ok(
    domOffline.includes('Backend no disponible') && domOffline.includes('offlineWarningBanner'),
    'Cuando el backend está apagado, el frontend debe mostrar el aviso de modo sin conexión'
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
