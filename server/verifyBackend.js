import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from './app.js';
import { closeDb, getDbPath } from './db.js';
import { PRESETS_12M, REFERENCE_PLANS_24M } from '../shared/tuesteModel.js';

function startServer(port = 0) {
  const app = createApp();
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise(res => server.close(res))
      });
    });
    server.on('error', reject);
  });
}

async function reqJson(baseUrl, method, path, body = undefined) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  return { status: res.status, data };
}

console.log('=== VERIFICACIÓN DE BACKEND EXPRESS Y PERSISTENCIA SQLITE ===');
console.log('Archivo SQLite:', getDbPath());

// Iniciar servidor (Instancia 1)
let srv1 = await startServer(0);

try {
  // 1. Healthcheck
  const health = await reqJson(srv1.baseUrl, 'GET', '/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.ok, true);
  console.log('[OK] GET /api/health responde 200 online');

  // 2. Verificar que /api/calculate ignora resultados falsos enviados por el cliente y recalcula
  const calcRes = await reqJson(srv1.baseUrl, 'POST', '/api/calculate', {
    params12m: PRESETS_12M.actual,
    plan24m: REFERENCE_PLANS_24M.base8k,
    result12m: { cacReal: 1.23, ltvPond: 999999 }, // resultado falso que el servidor debe ignorar
    result24m: { cajaMes24: 999999 }
  });
  assert.equal(calcRes.status, 200);
  assert.ok(Math.abs(calcRes.data.result12m.cacReal - 54.54545454545455) < 1e-7, 'Recalcula CAC real en servidor');
  assert.ok(Math.abs(calcRes.data.result12m.ltvPond - 54.79607068771632) < 1e-9, 'Recalcula LTV en servidor');
  assert.ok(Math.abs(calcRes.data.result24m.cajaMes1 - 31765.4254) < 1e-6, 'Recalcula Caja M1 en servidor');
  console.log('[OK] POST /api/calculate recalcula en el servidor e ignora resultados del cliente');

  // 3. Rechazar valores no finitos, inversiones fuera de $0-$20.000, porcentajes fuera de rango y planes sin 24 meses
  const badInv = await reqJson(srv1.baseUrl, 'POST', '/api/scenarios', {
    name: 'Inversión fuera de rango',
    params12m: { ...PRESETS_12M.actual, inversion: 25000 }
  });
  assert.equal(badInv.status, 400, 'Debe rechazar inversión > $20.000 con 400');

  const badPct = await reqJson(srv1.baseUrl, 'POST', '/api/scenarios', {
    name: 'Porcentaje fuera de rango',
    params12m: { ...PRESETS_12M.actual, pctSusc: -5 }
  });
  assert.equal(badPct.status, 400, 'Debe rechazar porcentaje < 0% con 400');

  const badMonths = await reqJson(srv1.baseUrl, 'POST', '/api/scenarios', {
    name: 'Plan de 12 meses en lugar de 24',
    plan24m: { ...REFERENCE_PLANS_24M.propioA, investments: Array(12).fill(4000) }
  });
  assert.equal(badMonths.status, 400, 'Debe rechazar plan que no tenga exactamente 24 meses');

  const badNonFinite = await reqJson(srv1.baseUrl, 'POST', '/api/scenarios', {
    name: 'Valor no numérico',
    params12m: { ...PRESETS_12M.actual, inversion: 'no_es_numero' }
  });
  assert.equal(badNonFinite.status, 400, 'Debe rechazar valores no finitos con 400');
  console.log('[OK] Validación del servidor rechaza fuera de rango, no finitos y planes != 24 meses (400)');

  // 4. Distinguir entre entrada incorrecta y un plan válido de calcular que incumple el piso de caja ($5.000):
  //    Este último debe poder guardarse y mostrarse como plan inviable (planViable24m: false).
  const inviablePlanRes = await reqJson(srv1.baseUrl, 'POST', '/api/scenarios', {
    name: 'Prueba Agencia Inviable ($16k + 30% BF)',
    note: 'Incumple el piso de $5.000 desde el Mes 3',
    params12m: PRESETS_12M.agencia,
    plan24m: REFERENCE_PLANS_24M.agenciaAll
  });
  assert.equal(inviablePlanRes.status, 201, 'Un plan que incumple el piso de caja sí debe poder guardarse (201)');
  assert.equal(inviablePlanRes.data.scenario.planViable24m, false, 'Debe marcarse como plan inviable (planViable24m: false)');
  assert.equal(inviablePlanRes.data.scenario.result24m.valid, false, 'result24m.valid debe ser false');
  const inviableId = inviablePlanRes.data.scenario.id;
  console.log(`[OK] Plan calculable que rompe el piso de caja se guarda (id=${inviableId}) y se marca como inviable`);

  // 5. Proteger escenarios originales de referencia contra sobrescritura o eliminación
  const putRef = await reqJson(srv1.baseUrl, 'PUT', '/api/scenarios/actual', {
    name: 'Intento sobrescribir referencia',
    params12m: PRESETS_12M.cambio1
  });
  assert.equal(putRef.status, 403, 'No debe permitir sobrescribir escenarios originales de referencia');

  const delRef = await reqJson(srv1.baseUrl, 'DELETE', '/api/scenarios/actual');
  assert.equal(delRef.status, 403, 'No debe permitir eliminar escenarios originales de referencia');
  console.log('[OK] Escenarios originales de referencia protegidos contra sobrescritura y borrado (403)');

  // 6. Guardar un plan propio, reiniciar el backend (cerrando servidor y conexión SQLite) y volver a cargarlo
  const createProp = await reqJson(srv1.baseUrl, 'POST', '/api/scenarios', {
    name: 'Plan Propio Verificado ($4.000 + Pack)',
    note: 'Propuesta recomendada para Diego antes del viernes',
    params12m: PRESETS_12M.combinado,
    plan24m: REFERENCE_PLANS_24M.propioB
  });
  assert.equal(createProp.status, 201);
  const savedId = createProp.data.scenario.id;
  assert.ok(savedId > 0);
  console.log(`[OK] Escenario propio creado en SQLite con ID=${savedId}`);

  // Cerrar servidor 1 y cerrar conexión SQLite para simular reinicio real del proceso backend
  await srv1.close();
  closeDb();
  console.log('[OK] Servidor 1 detenido y conexión SQLite cerrada (simulando reinicio del backend)');

  // Iniciar nueva instancia del servidor (Instancia 2)
  const srv2 = await startServer(0);
  try {
    const getAfterRestart = await reqJson(srv2.baseUrl, 'GET', `/api/scenarios/${savedId}`);
    assert.equal(getAfterRestart.status, 200);
    assert.equal(getAfterRestart.data.scenario.name, 'Plan Propio Verificado ($4.000 + Pack)');
    assert.ok(Math.abs(getAfterRestart.data.scenario.result12m.cacReal - 50.0) < 1e-9);
    assert.ok(Math.abs(getAfterRestart.data.scenario.result24m.cajaMes24 - 134058.50807479493) < 1e-5);
    console.log(`[OK] Escenario ID=${savedId} recuperado intacto desde SQLite tras reiniciar el backend`);

    // 7. Actualizar el escenario propio
    const updateRes = await reqJson(srv2.baseUrl, 'PUT', `/api/scenarios/${savedId}`, {
      name: 'Plan Propio Actualizado ($4.000 sin Pack)',
      note: 'Nota actualizada en prueba automatizada',
      params12m: PRESETS_12M.cambio1,
      plan24m: REFERENCE_PLANS_24M.propioA
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.scenario.name, 'Plan Propio Actualizado ($4.000 sin Pack)');
    assert.ok(Math.abs(updateRes.data.scenario.result24m.cajaMes24 - 95566.23926854489) < 1e-4);
    console.log(`[OK] Escenario ID=${savedId} actualizado correctamente en SQLite`);

    // 8. Eliminar escenarios de prueba (tanto el actualizado como el inviable)
    const del1 = await reqJson(srv2.baseUrl, 'DELETE', `/api/scenarios/${savedId}`);
    assert.equal(del1.status, 200);
    const checkGone = await reqJson(srv2.baseUrl, 'GET', `/api/scenarios/${savedId}`);
    assert.equal(checkGone.status, 404);

    const del2 = await reqJson(srv2.baseUrl, 'DELETE', `/api/scenarios/${inviableId}`);
    assert.equal(del2.status, 200);
    console.log(`[OK] Escenarios propios ID=${savedId} e ID=${inviableId} eliminados correctamente de SQLite`);
  } finally {
    await srv2.close();
    closeDb();
  }
} finally {
  try {
    await srv1.close();
  } catch {
    // ya cerrado
  }
  closeDb();
}

console.log('=== TODAS LAS VERIFICACIONES DE BACKEND Y SQLITE PASARON EXITOSAMENTE ===');

