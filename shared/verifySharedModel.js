import assert from 'node:assert/strict';
import {
  PRESETS_12M,
  REFERENCE_PLANS_24M,
  computeScenario,
  simulate24Months,
  validateParams12M,
  validatePlan24M
} from './tuesteModel.js';

function assertClose(actual, expected, tol, label) {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tol,
    `[FALLO] ${label}: esperado ${expected}, obtenido ${actual} (dif=${diff}, tol=${tol})`
  );
  console.log(`[OK] ${label}: ${actual} (esperado ~${expected})`);
}

console.log('=== VERIFICACIÓN DEL MÓDULO COMPARTIDO (shared/tuesteModel.js) ===');

// 1. Escenario actual: CAC $54,5454545; LTV $54,7960706877; payback mes 12
const resActual = computeScenario(PRESETS_12M.actual);
assertClose(resActual.cacReal, 54.54545454545455, 1e-7, 'Escenario Actual - CAC Real ($9.000 / 165)');
assertClose(resActual.ltvPond, 54.79607068771632, 1e-9, 'Escenario Actual - LTV Ponderado 12M');
assert.equal(resActual.payback, 12, 'Escenario Actual - Payback debe ser Mes 12');
console.log(`[OK] Escenario Actual - Payback: Mes ${resActual.payback}`);

// 2. Meta $4.000: CAC $50; payback mes 11
const resCambio1 = computeScenario(PRESETS_12M.cambio1);
assertClose(resCambio1.cacReal, 50.0, 1e-9, 'Meta $4.000 (Cambio 1) - CAC Real ($5.000 / 100)');
assert.equal(resCambio1.payback, 11, 'Meta $4.000 (Cambio 1) - Payback debe ser Mes 11');
console.log(`[OK] Meta $4.000 (Cambio 1) - Payback: Mes ${resCambio1.payback}`);

// 3. Agencia: CAC $72,3404255; LTV $46,5162206877
const resAgencia = computeScenario(PRESETS_12M.agencia);
assertClose(resAgencia.cacReal, 72.34042553191489, 1e-7, 'Agencia ($16.000 + 30% BF) - CAC Real ($17.000 / 235)');
assertClose(resAgencia.ltvPond, 46.51622068771632, 1e-9, 'Agencia ($16.000 + 30% BF) - LTV Ponderado 12M');
assert.equal(resAgencia.payback, null, 'Agencia - No recupera en 12 meses');
console.log(`[OK] Agencia - Payback: ${resAgencia.paybackLabel}`);

// 4. Simulador base $8.000: caja mes 1 $31.765,4254; caja mes 24 ~ $79.596,4527
const simBase8k = simulate24Months(REFERENCE_PLANS_24M.base8k);
assertClose(simBase8k.cajaMes1, 31765.4254, 1e-6, 'Simulador 24M Base $8.000 - Caja Mes 1');
assertClose(simBase8k.cajaMes24, 79596.45269925991, 1e-4, 'Simulador 24M Base $8.000 - Caja Mes 24');
assert.equal(simBase8k.valid, true, 'Simulador 24M Base $8.000 debe ser VÁLIDO');

// 5. Simulador $4.000 sin cambios: caja mes 24 ~ $95.566,2393
const simPropioA = simulate24Months(REFERENCE_PLANS_24M.propioA);
assertClose(simPropioA.cajaMes24, 95566.2393065629, 1e-4, 'Simulador 24M $4.000 sin cambios - Caja Mes 24');
assert.equal(simPropioA.valid, true, 'Simulador 24M $4.000 sin cambios debe ser VÁLIDO');

// 6. Simulador $4.000 con Pack + envío (Propio B) y Agencia 24M (inviable por piso de caja)
const simPropioB = simulate24Months(REFERENCE_PLANS_24M.propioB);
assertClose(simPropioB.cajaMes24, 134058.50807479493, 1e-6, 'Simulador 24M $4.000 con Pack/Envío - Caja Mes 24');
assert.equal(simPropioB.valid, true, 'Simulador 24M Propio B debe ser VÁLIDO');

const simAgenciaAll = simulate24Months(REFERENCE_PLANS_24M.agenciaAll);
assertClose(simAgenciaAll.cajaMes24, -82255.18832956141, 1e-6, 'Simulador 24M Agencia continua - Caja Mes 24');
assert.equal(simAgenciaAll.valid, false, 'Simulador 24M Agencia continua debe ser INVÁLIDO (rompe piso de caja)');

// 7. Pruebas de validación de entradas
assert.equal(validateParams12M({ ...PRESETS_12M.actual, inversion: NaN }).ok, false, 'Rechaza NaN');
assert.equal(validateParams12M({ ...PRESETS_12M.actual, inversion: Infinity }).ok, false, 'Rechaza Infinity');
assert.equal(validateParams12M({ ...PRESETS_12M.actual, inversion: 25000 }).ok, false, 'Rechaza inversión > $20.000');
assert.equal(validateParams12M({ ...PRESETS_12M.actual, inversion: -100 }).ok, false, 'Rechaza inversión < $0');
assert.equal(validateParams12M({ ...PRESETS_12M.actual, pctSusc: 120 }).ok, false, 'Rechaza porcentaje > 100%');
assert.equal(validatePlan24M({ investments: Array(23).fill(4000) }).ok, false, 'Rechaza plan con 23 meses');
assert.equal(validatePlan24M({ investments: Array(24).fill(21000) }).ok, false, 'Rechaza mes > $20.000 en 24M');

// Distinción clave: el plan Agencia ($16.000 + 30% BF) tiene entradas válidas (ok: true),
// pero al simularse incumple el piso de caja (valid: false -> plan inviable).
const valAgencia24 = validatePlan24M(REFERENCE_PLANS_24M.agenciaAll);
assert.equal(valAgencia24.ok, true, 'Plan Agencia 24M tiene entradas válidas de calcular y guardar');
const calcAgencia24 = simulate24Months(valAgencia24.data);
assert.equal(calcAgencia24.valid, false, 'Plan Agencia 24M calculado se marca como plan inviable (valid: false)');

console.log('=== TODAS LAS VERIFICACIONES DEL MÓDULO COMPARTIDO PASARON EXITOSAMENTE ===');

// Parte 2: recompensas nominales, ciclos, identidad simulada y canje.
const referralRules = await import('./tuesteModel.js');
let referralState = { people: [{ id: 'root', name: 'Camila', contact: 'camila@example.test', tried: true }], orders: [], redemptions: [], events: [] };
for (let i=1;i<=6;i++) referralState=referralRules.completeReferralPurchase(referralState,{id:'r'+i,inviterId:'root',name:'Amigo '+i,contact:'amigo'+i+'@example.test',product:i===3?'subscription':'normal',date:'simulado'});
assert.equal(referralRules.referralWallet(referralState,'root').credit,30);
assert.equal(referralRules.referralWallet(referralState,'root').bags,2);
assert.equal(referralRules.referralWallet(referralState,'root').samples,1);
assert.equal(referralState.orders[2].cost,13.64);
assert.ok(referralState.orders.every(o=>o.cost<=25));
for (const contact of ['AMIGO1@example.test','camila@example.test']) assert.throws(()=>referralRules.completeReferralPurchase(referralState,{id:'invalid',inviterId:'root',name:'Otro',contact,product:'normal'}));
assert.throws(()=>referralRules.completeReferralPurchase(referralState,{id:'r1',inviterId:'root',name:'Otro',contact:'nuevo@example.test',product:'normal'}));
assert.throws(()=>referralRules.completeReferralPurchase(referralState,{id:'unready',inviterId:referralState.people[1].id,name:'Otro',contact:'nuevo@example.test',product:'normal'}));
referralState={...referralState,redemptions:[{personId:'root',credit:30,bags:2,samples:1}]};
assert.deepEqual(referralRules.referralWallet(referralState,'root'),{count:6,credit:0,bags:0,samples:0});
console.log('[OK] Parte 2: ciclos de tres, bonus, límite $25, duplicados, autorreferidos, prueba previa y canje.');
