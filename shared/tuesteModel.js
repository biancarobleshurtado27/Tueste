// ============================================================================
// MÓDULO COMPARTIDO: MOTOR MATEMÁTICO Y VALIDACIÓN DEL CASO TUESTE
// Compartido entre Frontend (React + Vite) y Backend (Node.js + Express)
// Sin redondeos intermedios. Reproduce exactamente los Niveles 1, 2 y 3.
// ============================================================================

export const MODEL_VERSION = '1.0.0';

// Constantes originales del Caso A - Tueste (PDF págs. 3 a 7 y 10)
export const BASE_SUELTO_CURVE = Object.freeze([
  1.00, 0.15, 0.20, 0.20, 0.20, 0.20, 0.20, 0.15, 0.15, 0.15, 0.20, 0.20
]);

export const META_HISTORY = Object.freeze([
  { inv: 0,     clientes: 0   },
  { inv: 4000,  clientes: 100 },
  { inv: 8000,  clientes: 165 },
  { inv: 12000, clientes: 210 },
  { inv: 16000, clientes: 235 },
  { inv: 20000, clientes: 250 }
]);

export const PASARELA_RATE = 0.045;
export const EMPAQUE_2B = 1.20;
export const EMPAQUE_3B = 1.40;
export const PRECIO_PACK_3B = 48.00;
export const ENVIO_COBRADO_2B = 4.50;
export const UMBRAL_ENVIO_GRATIS = 45.00;

// Constantes del Simulador de Caja de 24 Meses (Nivel 3 - PDF pág. 10)
export const CAJA_INICIAL_24M = 35000.0;
export const PISO_CAJA_24M = 5000.0;
export const COSTOS_FIJOS_24M = 6500.0;
export const FEE_AGENCIA_24M = 1000.0;
export const CLIENTES_ORGANICOS_24M = 47.0;
export const MIX_SUELTO_24M = 0.85;
export const MIX_SUSC_24M = 0.15;
export const PERMANENCIA_SUSC_24M = 0.91;
export const COSTO_TOSTADORA_24M = 14000.0;

// Escenarios originales de referencia de 12 meses (Inmutables / Solo lectura)
export const PRESETS_12M = Object.freeze({
  actual: Object.freeze({
    key: 'actual',
    name: 'Actual ($8.000)',
    description: 'Situación actual de septiembre: $8.000 en Meta + $1.000 agencia, sin cambios comerciales.',
    readonly: true,
    inversion: 8000,
    precioBolsa: 17.00,
    costoCafe: 5.44,
    costoEnvio: 4.50,
    pctSusc: 15.0,
    churn: 9.0,
    pedidosSuelto: 3.0,
    feeAgencia: 1000,
    descuentoBF: 0.0,
    polPack: false,
    adopcionPack: 20.0
  }),
  agencia: Object.freeze({
    key: 'agencia',
    name: 'Agencia ($16.000 + 30% BF)',
    description: 'Propuesta de la agencia para Black Friday: duplicar Meta a $16.000 con 30% de descuento en 1er pedido suelto.',
    readonly: true,
    inversion: 16000,
    precioBolsa: 17.00,
    costoCafe: 5.44,
    costoEnvio: 4.50,
    pctSusc: 15.0,
    churn: 9.0,
    pedidosSuelto: 3.0,
    feeAgencia: 1000,
    descuentoBF: 30.0,
    polPack: false,
    adopcionPack: 20.0
  }),
  cambio1: Object.freeze({
    key: 'cambio1',
    name: 'Cambio 1 Solo (Meta $4.000)',
    description: 'Reducir presupuesto en Meta a $4.000/mes manteniendo precios y condiciones originales.',
    readonly: true,
    inversion: 4000,
    precioBolsa: 17.00,
    costoCafe: 5.44,
    costoEnvio: 4.50,
    pctSusc: 15.0,
    churn: 9.0,
    pedidosSuelto: 3.0,
    feeAgencia: 1000,
    descuentoBF: 0.0,
    polPack: false,
    adopcionPack: 20.0
  }),
  cambio2: Object.freeze({
    key: 'cambio2',
    name: 'Cambio 2 Solo (Pack $48 + Envío, Meta $8.000)',
    description: 'Mantener Meta en $8.000/mes activando Pack de 3 bolsas ($48) y cobro de envío ($4,50 bajo $45).',
    readonly: true,
    inversion: 8000,
    precioBolsa: 17.00,
    costoCafe: 5.44,
    costoEnvio: 4.50,
    pctSusc: 15.0,
    churn: 9.0,
    pedidosSuelto: 3.0,
    feeAgencia: 1000,
    descuentoBF: 0.0,
    polPack: true,
    adopcionPack: 20.0
  }),
  combinado: Object.freeze({
    key: 'combinado',
    name: 'Propuesta Combinada ($4.000 + Pack y Envío)',
    description: 'Reducir Meta a $4.000/mes y activar Pack de 3 bolsas ($48) + cobro de envío ($4,50 bajo $45).',
    readonly: true,
    inversion: 4000,
    precioBolsa: 17.00,
    costoCafe: 5.44,
    costoEnvio: 4.50,
    pctSusc: 15.0,
    churn: 9.0,
    pedidosSuelto: 3.0,
    feeAgencia: 1000,
    descuentoBF: 0.0,
    polPack: true,
    adopcionPack: 20.0
  })
});

// Planes originales de referencia de 24 meses (Inmutables / Solo lectura)
export const REFERENCE_PLANS_24M = Object.freeze({
  base8k: Object.freeze({
    id: 'base8k',
    name: 'Plan 1: Base Actual ($8.000 fijos, condiciones originales)',
    shortName: 'Base ($8.000)',
    readonly: true,
    investments: Object.freeze(Array(24).fill(8000)),
    descBF: 0.0,
    bfMode: 'all_cohorts',
    polPack: false,
    mesActPack: 1,
    packScope: 'all_orders',
    adopPack: 20.0,
    buyTostadora: false,
    mesTostadora: 12
  }),
  agenciaAll: Object.freeze({
    id: 'agenciaAll',
    name: 'Plan 2a: Agencia ($16.000 fijos + 30% BF en 1er pedido de cada cohorte)',
    shortName: 'Agencia ($16k + BF 24M)',
    readonly: true,
    investments: Object.freeze(Array(24).fill(16000)),
    descBF: 30.0,
    bfMode: 'all_cohorts',
    polPack: false,
    mesActPack: 1,
    packScope: 'all_orders',
    adopPack: 20.0,
    buyTostadora: false,
    mesTostadora: 12
  }),
  agenciaM1: Object.freeze({
    id: 'agenciaM1',
    name: 'Plan 2b: Agencia Variante ($16.000 fijos + 30% BF solo en Mes 1)',
    shortName: 'Agencia Var. (BF solo M1)',
    readonly: true,
    investments: Object.freeze(Array(24).fill(16000)),
    descBF: 30.0,
    bfMode: 'month1_only',
    polPack: false,
    mesActPack: 1,
    packScope: 'all_orders',
    adopPack: 20.0,
    buyTostadora: false,
    mesTostadora: 12
  }),
  propioA: Object.freeze({
    id: 'propioA',
    name: 'Plan 3: Propio A ($4.000 fijos, condiciones originales)',
    shortName: 'Propio A ($4.000)',
    readonly: true,
    investments: Object.freeze(Array(24).fill(4000)),
    descBF: 0.0,
    bfMode: 'all_cohorts',
    polPack: false,
    mesActPack: 1,
    packScope: 'all_orders',
    adopPack: 20.0,
    buyTostadora: false,
    mesTostadora: 12
  }),
  propioB: Object.freeze({
    id: 'propioB',
    name: 'Plan 4: Propio B ($4.000 fijos + Política Pack $48 y Envío)',
    shortName: 'Propio B ($4k + Pack)',
    readonly: true,
    investments: Object.freeze(Array(24).fill(4000)),
    descBF: 0.0,
    bfMode: 'all_cohorts',
    polPack: true,
    mesActPack: 1,
    packScope: 'all_orders',
    adopPack: 20.0,
    buyTostadora: false,
    mesTostadora: 12
  })
});

// ============================================================================
// FORMATEADORES DE PRESENTACIÓN (SIN AFECTAR PRECISIÓN INTERNA)
// ============================================================================
export function fmtNum(val, dec = 2) {
  if (val === null || val === undefined || Number.isNaN(val)) return 'No aplica';
  return Number(val).toLocaleString('es-ES', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  });
}

export function fmtUSD(val, dec = 2) {
  if (val === null || val === undefined || Number.isNaN(val)) return 'No aplica';
  const sign = val < 0 ? '-' : '';
  return `${sign}$${fmtNum(Math.abs(val), dec)}`;
}

export function fmtPct(val, dec = 2) {
  if (val === null || val === undefined || Number.isNaN(val)) return 'No aplica';
  return `${fmtNum(val * 100, dec)}%`;
}

export function fmtRoas(val, emptyLabel = 'No alcanzable') {
  if (val === null || val === undefined || Number.isNaN(val)) return emptyLabel;
  return `${fmtNum(val, 2)}x`;
}

// ============================================================================
// INTERPOLACIÓN Y CÁLCULO DE ESCENARIOS DE 12 MESES (NIVELES 1 Y 2)
// ============================================================================
export function interpolateClientes(invInput) {
  const inv = Math.max(0, Math.min(20000, Number(invInput) || 0));
  if (inv <= 0) return 0;
  for (let i = 1; i < META_HISTORY.length; i++) {
    const p0 = META_HISTORY[i - 1];
    const p1 = META_HISTORY[i];
    if (inv <= p1.inv) {
      return p0.clientes + ((inv - p0.inv) * (p1.clientes - p0.clientes)) / (p1.inv - p0.inv);
    }
  }
  return META_HISTORY[META_HISTORY.length - 1].clientes;
}

export function getMarginalTramoInfo(invInput) {
  const inv = Math.max(0, Math.min(20000, Number(invInput) || 0));
  if (inv <= 0) {
    return { val: null, label: 'No aplica (Inversión $0)' };
  }
  for (let i = 1; i < META_HISTORY.length; i++) {
    const p0 = META_HISTORY[i - 1];
    const p1 = META_HISTORY[i];
    if (inv <= p1.inv) {
      const deltaInv = p1.inv - p0.inv;
      const deltaCli = p1.clientes - p0.clientes;
      return {
        val: deltaInv / deltaCli,
        label: `Tramo $${p0.inv.toLocaleString('es-ES')} a $${p1.inv.toLocaleString('es-ES')} ($${deltaInv.toLocaleString('es-ES')} / ${deltaCli})`
      };
    }
  }
  return { val: null, label: 'No aplica' };
}

export function computeScenario(params) {
  const inv = Math.max(0, Math.min(20000, Number(params.inversion) || 0));
  const precioBolsa = Math.max(0, Number(params.precioBolsa) || 0);
  const costoCafe = Math.max(0, Number(params.costoCafe) || 0);
  const costoEnvio = Math.max(0, Number(params.costoEnvio) || 0);
  const mixSusc = Math.max(0, Math.min(100, Number(params.pctSusc) || 0)) / 100.0;
  const mixSuelto = 1.0 - mixSusc;
  const churn = Math.max(0, Math.min(100, Number(params.churn) || 0)) / 100.0;
  const permanencia = 1.0 - churn;
  const pedidosSuelto = Math.max(1.0, Number(params.pedidosSuelto) || 1.0);
  const feeUnit = Math.max(0, Number(params.feeAgencia) || 0);
  const descBF = Math.max(0, Math.min(100, Number(params.descuentoBF) || 0)) / 100.0;
  const polPack = Boolean(params.polPack);
  const adopPack = Math.max(0, Math.min(100, Number(params.adopcionPack) || 0)) / 100.0;

  // Costos y precios base para 2 bolsas y 3 bolsas
  const precio2B = 2.0 * precioBolsa;
  const cafe2B = 2.0 * costoCafe;
  const cafe3B = 3.0 * costoCafe;

  // Pedido suelto normal (sin política de cobro de envío)
  const cobroSueltoBase = precio2B;
  const contribSueltoBase = cobroSueltoBase * (1.0 - PASARELA_RATE) - cafe2B - EMPAQUE_2B - costoEnvio;

  // Regla de política de envío para pedidos sueltos:
  // Cobra $4,50 únicamente si el subtotal de productos (después del descuento y antes del envío) es < $45; desde $45 el envío es gratis.
  const subtotal2BRecompra = precio2B;
  const envioCobradoRecompra = subtotal2BRecompra < UMBRAL_ENVIO_GRATIS ? ENVIO_COBRADO_2B : 0.0;
  const cobroSueltoConEnvio = subtotal2BRecompra + envioCobradoRecompra;
  const contribSueltoConEnvio = cobroSueltoConEnvio * (1.0 - PASARELA_RATE) - cafe2B - EMPAQUE_2B - costoEnvio;

  // Pack de 3 bolsas a $48 (subtotal $48 >= $45, por lo que tiene envío gratis para el cliente)
  const subtotalPack = PRECIO_PACK_3B;
  const envioCobradoPack = subtotalPack < UMBRAL_ENVIO_GRATIS ? ENVIO_COBRADO_2B : 0.0;
  const cobroPack = subtotalPack + envioCobradoPack;
  const contribPack = cobroPack * (1.0 - PASARELA_RATE) - cafe3B - EMPAQUE_3B - costoEnvio;

  // Primer pedido suelto (Mes 1) y recompras sueltas (Meses 2 a 12)
  const subtotal2BM1 = precio2B * (1.0 - descBF);
  let cobroSueltoM1, contribSueltoM1, cobroSueltoRecompra, contribSueltoRecompra;
  if (!polPack) {
    cobroSueltoM1 = subtotal2BM1;
    contribSueltoM1 = cobroSueltoM1 * (1.0 - PASARELA_RATE) - cafe2B - EMPAQUE_2B - costoEnvio;
    cobroSueltoRecompra = cobroSueltoBase;
    contribSueltoRecompra = contribSueltoBase;
  } else {
    const envioCobrado2BM1 = subtotal2BM1 < UMBRAL_ENVIO_GRATIS ? ENVIO_COBRADO_2B : 0.0;
    const cobro2BM1 = subtotal2BM1 + envioCobrado2BM1;
    const contrib2BM1 = cobro2BM1 * (1.0 - PASARELA_RATE) - cafe2B - EMPAQUE_2B - costoEnvio;
    cobroSueltoM1 = (1.0 - adopPack) * cobro2BM1 + adopPack * cobroPack;
    contribSueltoM1 = (1.0 - adopPack) * contrib2BM1 + adopPack * contribPack;
    cobroSueltoRecompra = cobroSueltoConEnvio;
    contribSueltoRecompra = contribSueltoConEnvio;
  }

  const pctContribSueltoM1 = cobroSueltoM1 > 0 ? (contribSueltoM1 / cobroSueltoM1) : 0;
  const roasEqSueltoM1 = contribSueltoM1 > 0 ? (cobroSueltoM1 / contribSueltoM1) : null;

  // Suscripción mensual (2 bolsas con 10% de descuento sobre precio de lista de 2 bolsas)
  const cobroSusc = precio2B * 0.90;
  const contribSusc = cobroSusc * (1.0 - PASARELA_RATE) - cafe2B - EMPAQUE_2B - costoEnvio;
  const pctContribSusc = cobroSusc > 0 ? (contribSusc / cobroSusc) : 0;
  const roasEqSusc = contribSusc > 0 ? (cobroSusc / contribSusc) : null;

  // Ponderados del 1er pedido (Mes 1)
  const ingresoPondM1 = mixSuelto * cobroSueltoM1 + mixSusc * cobroSusc;
  const contribPondM1 = mixSuelto * contribSueltoM1 + mixSusc * contribSusc;
  const roasEqPondM1 = contribPondM1 > 0 ? (ingresoPondM1 / contribPondM1) : null;

  // Clientes nuevos y CAC
  const clientesNuevos = interpolateClientes(inv);
  const feeEfectivo = inv > 0 ? feeUnit : 0.0;
  const gastoTotalAdq = inv + feeEfectivo;
  const cacAnuncios = (inv > 0 && clientesNuevos > 0) ? (inv / clientesNuevos) : null;
  const cacReal = (inv > 0 && clientesNuevos > 0) ? (gastoTotalAdq / clientesNuevos) : null;
  const roas1erPedido = (inv > 0 && clientesNuevos > 0) ? ((clientesNuevos * ingresoPondM1) / inv) : null;

  // Curva de actividad de meses 1 a 12
  // Escala proporcionalmente meses 2 a 12 conservando Mes 1 = 1.00
  const scaleRecompras = (pedidosSuelto - 1.0) / 2.0;
  const actSuelto = BASE_SUELTO_CURVE.map((val, idx) => idx === 0 ? 1.0 : val * scaleRecompras);
  const actSusc = [];
  for (let m = 1; m <= 12; m++) {
    actSusc.push(m === 1 ? 1.0 : Math.pow(permanencia, m - 1));
  }
  const sumActSuelto = actSuelto.reduce((a, b) => a + b, 0);
  const sumActSusc = actSusc.reduce((a, b) => a + b, 0);

  // LTV de contribución a 12 meses (suma exacta de meses 1 a 12)
  const ltvSuelto = actSuelto[0] * contribSueltoM1 + (sumActSuelto - actSuelto[0]) * contribSueltoRecompra;
  const ltvSusc = sumActSusc * contribSusc;
  const ltvPond = mixSuelto * ltvSuelto + mixSusc * ltvSusc;

  const ltvCac = (cacReal !== null && cacReal > 0) ? (ltvPond / cacReal) : null;

  // Curva acumulada de Mes 0 a Mes 12 (Mes 0 = -CAC real, sin compras)
  const curvaMensual = [0.0];
  const curvaAcumulada = [cacReal !== null ? -cacReal : 0.0];
  let acum = curvaAcumulada[0];
  let payback = null;

  for (let m = 1; m <= 12; m++) {
    const cSueltoMes = (m === 1) ? contribSueltoM1 : contribSueltoRecompra;
    const contribMes = mixSuelto * actSuelto[m - 1] * cSueltoMes + mixSusc * actSusc[m - 1] * contribSusc;
    curvaMensual.push(contribMes);
    acum += contribMes;
    curvaAcumulada.push(acum);
    if (cacReal !== null && payback === null && acum >= 0) {
      payback = m;
    }
  }

  let paybackLabel;
  if (cacReal === null) {
    paybackLabel = 'No aplica';
  } else if (payback === null) {
    paybackLabel = 'No recupera en 12 meses';
  } else {
    paybackLabel = `Mes ${payback}`;
  }

  // CAC marginal del tramo histórico y CAC incremental vs $8.000 base
  const margTramo = getMarginalTramoInfo(inv);
  let cacIncremental = null;
  let cacIncrementalLabel = 'No aplica (igual a base $8.000 o inv. $0)';
  if (inv > 0 && inv !== 8000 && clientesNuevos !== 165) {
    cacIncremental = (inv - 8000.0) / (clientesNuevos - 165.0);
    const dInv = Math.abs(inv - 8000);
    const dCli = Math.abs(clientesNuevos - 165);
    cacIncrementalLabel = `De $8.000 a $${inv.toLocaleString('es-ES')} ($${dInv.toLocaleString('es-ES')} / ${fmtNum(dCli, 1)} clientes)`;
  }

  const netoPorCliente = cacReal !== null ? (ltvPond - cacReal) : null;
  const netoCohorte = netoPorCliente !== null ? (clientesNuevos * netoPorCliente) : 0.0;

  return {
    inv,
    precio2B,
    cobroSusc,
    cafe2B,
    clientesNuevos,
    feeEfectivo,
    gastoTotalAdq,
    cobroSueltoM1,
    contribSueltoM1,
    pctContribSueltoM1,
    roasEqSueltoM1,
    contribSusc,
    pctContribSusc,
    roasEqSusc,
    ingresoPondM1,
    contribPondM1,
    roasEqPondM1,
    cacAnuncios,
    cacReal,
    roas1erPedido,
    sumActSuelto,
    sumActSusc,
    actSuelto,
    actSusc,
    ltvSuelto,
    ltvSusc,
    ltvPond,
    ltvCac,
    payback,
    paybackLabel,
    curvaMensual,
    curvaAcumulada,
    margTramo,
    cacIncremental,
    cacIncrementalLabel,
    netoPorCliente,
    netoCohorte,
    contribPack,
    contribSueltoConEnvio,
    contribSueltoRecompra
  };
}

// ============================================================================
// SIMULADOR DE CAJA DE 24 MESES (NIVEL 3)
// ============================================================================
export function getActividadSueltoPorEdad(edad) {
  if (edad >= 1 && edad <= 12) return BASE_SUELTO_CURVE[edad - 1];
  if (edad >= 13 && edad <= 24) return 0.10;
  return 0.0;
}

export function simulate24Months(config) {
  const investments = (config.investments || []).map(v => Number(v) || 0);
  const descBF = Number(config.descBF) || 0.0;
  const bfMode = config.bfMode || 'all_cohorts'; // 'all_cohorts' | 'month1_only'
  const polPack = Boolean(config.polPack);
  const mesActPack = Number(config.mesActPack) || 1;
  const packScope = config.packScope || 'all_orders'; // 'all_orders' | 'new_cohorts_only'
  const adopPack = Math.max(0, Math.min(100, Number(config.adopPack ?? 20))) / 100.0;
  const buyTostadora = Boolean(config.buyTostadora);
  const mesTostadora = Number(config.mesTostadora) || 12;

  const precio2B = 34.00;
  const cafe2B = 10.88;
  const cafe3B = 16.32;
  const contribSueltoBase = precio2B * (1.0 - PASARELA_RATE) - cafe2B - EMPAQUE_2B - 4.50; // $15,89
  const contribSuscUnit = (precio2B * 0.90) * (1.0 - PASARELA_RATE) - cafe2B - EMPAQUE_2B - 4.50; // $12,643
  const contribPackUnit = PRECIO_PACK_3B * (1.0 - PASARELA_RATE) - cafe3B - EMPAQUE_3B - 4.50; // $23,62

  const avgInv1_12 = investments.slice(0, 12).reduce((a, b) => a + b, 0) / 12.0;
  const minInv13_24 = Math.min(...investments.slice(12, 24));

  let cajaActual = CAJA_INICIAL_24M;
  const cohorts = [];
  const rows = [];
  const serieCajaConMes0 = [CAJA_INICIAL_24M];

  const mesesViolRango = [];
  const mesesViolPiso = [];
  const mesesViolNegativa = [];
  const mesesViolRegla13 = [];

  for (let t = 1; t <= 24; t++) {
    const rawInv = investments[t - 1];
    const violRango = rawInv < 0 || rawInv > 20000;
    if (violRango) mesesViolRango.push(t);
    const inv = Math.max(0, Math.min(20000, rawInv));

    const cliMeta = interpolateClientes(inv);
    const cliOrg = CLIENTES_ORGANICOS_24M;
    const cliTot = cliMeta + cliOrg;

    cohorts.push({
      c: t,
      nTot: cliTot,
      nSuelto: MIX_SUELTO_24M * cliTot,
      nSusc: MIX_SUSC_24M * cliTot
    });

    const contribExist = 9000.0 * Math.pow(0.97, t - 1);

    let contribNuevas = 0.0;
    let suscActivosModelados = 0.0;

    for (let idx = 0; idx < cohorts.length; idx++) {
      const coh = cohorts[idx];
      const c = coh.c;
      const edad = t - c + 1;

      let aplicaPolPack = false;
      if (polPack && t >= mesActPack) {
        aplicaPolPack = (packScope === 'all_orders') ? true : (c >= mesActPack);
      }

      let aplicaBF = false;
      if (edad === 1 && descBF > 0) {
        aplicaBF = (bfMode === 'all_cohorts') || (bfMode === 'month1_only' && c === 1);
      }

      const descRate = aplicaBF ? (descBF / 100.0) : 0.0;
      const subtotal2B = precio2B * (1.0 - descRate);

      let contribSueltoUnit;
      if (edad === 1) {
        if (!aplicaPolPack) {
          contribSueltoUnit = subtotal2B * (1.0 - PASARELA_RATE) - cafe2B - EMPAQUE_2B - 4.50;
        } else {
          const envioCobrado = subtotal2B < UMBRAL_ENVIO_GRATIS ? ENVIO_COBRADO_2B : 0.0;
          const contrib2BConRegla = (subtotal2B + envioCobrado) * (1.0 - PASARELA_RATE) - cafe2B - EMPAQUE_2B - 4.50;
          contribSueltoUnit = (1.0 - adopPack) * contrib2BConRegla + adopPack * contribPackUnit;
        }
      } else {
        if (!aplicaPolPack) {
          contribSueltoUnit = contribSueltoBase;
        } else {
          const envioCobradoRec = precio2B < UMBRAL_ENVIO_GRATIS ? ENVIO_COBRADO_2B : 0.0;
          contribSueltoUnit = (precio2B + envioCobradoRec) * (1.0 - PASARELA_RATE) - cafe2B - EMPAQUE_2B - 4.50;
        }
      }

      const pedidosSueltosCoh = coh.nSuelto * getActividadSueltoPorEdad(edad);
      const suscActivosCoh = coh.nSusc * Math.pow(PERMANENCIA_SUSC_24M, edad - 1);

      suscActivosModelados += suscActivosCoh;
      contribNuevas += pedidosSueltosCoh * contribSueltoUnit + suscActivosCoh * contribSuscUnit;
    }

    const feeAgencia = inv > 0 ? FEE_AGENCIA_24M : 0.0;
    const gastoTostadora = (buyTostadora && t === mesTostadora) ? COSTO_TOSTADORA_24M : 0.0;
    const salidas = inv + feeAgencia + COSTOS_FIJOS_24M + gastoTostadora;

    const cajaAnterior = cajaActual;
    cajaActual = cajaAnterior + contribExist + contribNuevas - salidas;
    serieCajaConMes0.push(cajaActual);

    const violPiso = cajaActual < PISO_CAJA_24M - 1e-9;
    const violNeg = cajaActual < -1e-9;
    const violRegla13 = (t >= 13) && (inv + 1e-9 < avgInv1_12);

    if (violPiso) mesesViolPiso.push(t);
    if (violNeg) mesesViolNegativa.push(t);
    if (violRegla13) mesesViolRegla13.push(t);

    const alertasMes = [];
    if (violRango) alertasMes.push('Inversión fuera de $0–$20.000');
    if (violNeg) alertasMes.push('Caja negativa (no financiable sin capital extra)');
    else if (violPiso) alertasMes.push('Bajo piso de $5.000');
    if (violRegla13) alertasMes.push(`Inv. < prom. M1–12 (${fmtUSD(avgInv1_12, 0)})`);
    if (gastoTostadora > 0) alertasMes.push('Incluye compra 2ª tostadora (-$14.000)');

    rows.push({
      t,
      inv,
      cliMeta,
      cliOrg,
      cliTot,
      suscActivosModelados,
      contribExist,
      contribNuevas,
      feeAgencia,
      gastoTostadora,
      salidas,
      cajaFinal: cajaActual,
      violRango,
      violPiso,
      violNeg,
      violRegla13,
      alertaTexto: alertasMes.length > 0 ? alertasMes.join(' · ') : 'OK (Cumple reglas)'
    });
  }

  let minCaja = rows[0].cajaFinal;
  let mesMinCaja = 1;
  rows.forEach(r => {
    if (r.cajaFinal < minCaja) {
      minCaja = r.cajaFinal;
      mesMinCaja = r.t;
    }
  });

  const motivosInvalidez = [];
  if (mesesViolRango.length > 0) {
    motivosInvalidez.push(`Inversión fuera de $0–$20.000 (meses: ${mesesViolRango.join(', ')})`);
  }
  if (mesesViolPiso.length > 0) {
    motivosInvalidez.push(`Caja final < $5.000 en ${mesesViolPiso.length} mes(es) (desde Mes ${mesesViolPiso[0]})`);
  }
  if (mesesViolNegativa.length > 0) {
    motivosInvalidez.push(`Caja negativa desde el Mes ${mesesViolNegativa[0]} (no financiable sin dinero adicional)`);
  }
  if (mesesViolRegla13.length > 0) {
    motivosInvalidez.push(`Inversión en mes(es) ${mesesViolRegla13.join(', ')} menor al promedio M1–12 (${fmtUSD(avgInv1_12, 0)})`);
  }

  const valid = mesesViolRango.length === 0 && mesesViolPiso.length === 0 && mesesViolRegla13.length === 0;

  return {
    id: config.id || 'custom24m',
    name: config.name || 'Plan Personalizado 24M',
    shortName: config.shortName || config.name || 'Personalizado',
    rows,
    serieCajaConMes0,
    cajaInicialMes0: CAJA_INICIAL_24M,
    avgInv1_12,
    minInv13_24,
    cajaMes1: rows[0].cajaFinal,
    minCaja,
    mesMinCaja,
    cajaMes24: rows[23].cajaFinal,
    suscMes24: rows[23].suscActivosModelados,
    valid,
    financiable: mesesViolNegativa.length === 0,
    motivosInvalidez,
    motivosResumen: valid ? 'VÁLIDO (Cumple todas las reglas)' : `INVÁLIDO: ${motivosInvalidez.join('; ')}`,
    config: {
      ...config,
      investments,
      descBF,
      bfMode,
      polPack,
      mesActPack,
      packScope,
      adopPack: adopPack * 100.0,
      buyTostadora,
      mesTostadora
    }
  };
}

// ============================================================================
// VALIDACIÓN ESTRICTA DE ENTRADAS (PARA BACKEND Y FRONTEND)
// Distingue entre:
//   1. Entradas inválidas (no finitas, inversiones fuera de $0-$20.000,
//      porcentajes fuera de 0-100%, o planes sin exactamente 24 meses) -> Error 400
//   2. Planes calculables que incumplen el piso de caja ($5.000) o la regla
//      del mes 13 -> Se permiten calcular y guardar como planes inviables (valid: false)
// ============================================================================
function parseFiniteNumber(val) {
  if (typeof val === 'boolean' || val === null || val === undefined || Array.isArray(val) || typeof val === 'object') {
    return NaN;
  }
  if (typeof val === 'string' && val.trim() === '') {
    return NaN;
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : NaN;
}

export function validateParams12M(rawParams) {
  const errors = [];
  if (!rawParams || typeof rawParams !== 'object' || Array.isArray(rawParams)) {
    return { ok: false, errors: ['Los parámetros de 12 meses deben ser un objeto válido.'] };
  }

  const rules = [
    { key: 'inversion', label: 'Inversión mensual en Meta', min: 0, max: 20000 },
    { key: 'precioBolsa', label: 'Precio por bolsa', min: 0.01, max: 500 },
    { key: 'costoCafe', label: 'Costo del café por bolsa', min: 0, max: 500 },
    { key: 'costoEnvio', label: 'Costo del envío', min: 0, max: 500 },
    { key: 'pctSusc', label: 'Porcentaje de suscriptores', min: 0, max: 100 },
    { key: 'churn', label: 'Cancelación mensual de suscriptores', min: 0, max: 100 },
    { key: 'pedidosSuelto', label: 'Pedidos del comprador suelto en 12M', min: 1, max: 100 },
    { key: 'feeAgencia', label: 'Fee mensual de agencia', min: 0, max: 100000 },
    { key: 'descuentoBF', label: 'Descuento del 1er pedido suelto', min: 0, max: 100 },
    { key: 'adopcionPack', label: 'Porcentaje de adopción del Pack', min: 0, max: 100 }
  ];

  const normalized = {};
  for (const r of rules) {
    const val = parseFiniteNumber(rawParams[r.key]);
    if (!Number.isFinite(val)) {
      errors.push(`${r.label} (${r.key}) debe ser un número finito.`);
    } else if (val < r.min || val > r.max) {
      errors.push(`${r.label} (${r.key}) debe estar entre ${r.min} y ${r.max}. Recibido: ${val}.`);
    } else {
      normalized[r.key] = val;
    }
  }

  if (typeof rawParams.polPack !== 'boolean') {
    errors.push('El indicador polPack debe ser un valor booleano (true/false).');
  } else {
    normalized.polPack = rawParams.polPack;
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, data: normalized };
}

export function validatePlan24M(rawPlan) {
  const errors = [];
  if (!rawPlan || typeof rawPlan !== 'object' || Array.isArray(rawPlan)) {
    return { ok: false, errors: ['El plan de 24 meses debe ser un objeto válido.'] };
  }

  if (!Array.isArray(rawPlan.investments) || rawPlan.investments.length !== 24) {
    errors.push('El plan de 24 meses debe contener un arreglo "investments" con exactamente 24 meses.');
  } else {
    for (let i = 0; i < 24; i++) {
      const v = parseFiniteNumber(rawPlan.investments[i]);
      if (!Number.isFinite(v)) {
        errors.push(`La inversión del mes ${i + 1} debe ser un número finito.`);
      } else if (v < 0 || v > 20000) {
        errors.push(`La inversión del mes ${i + 1} debe estar entre $0 y $20.000. Recibido: ${v}.`);
      }
    }
  }

  const descBF = rawPlan.descBF === undefined ? 0.0 : parseFiniteNumber(rawPlan.descBF);
  if (!Number.isFinite(descBF) || descBF < 0 || descBF > 100) {
    errors.push('El descuento promocional (descBF) debe ser un número finito entre 0% y 100%.');
  }

  const adopPack = rawPlan.adopPack === undefined ? 20.0 : parseFiniteNumber(rawPlan.adopPack);
  if (!Number.isFinite(adopPack) || adopPack < 0 || adopPack > 100) {
    errors.push('La adopción del Pack (adopPack) debe ser un número finito entre 0% y 100%.');
  }

  const mesActPack = rawPlan.mesActPack === undefined ? 1 : parseFiniteNumber(rawPlan.mesActPack);
  if (!Number.isInteger(mesActPack) || mesActPack < 1 || mesActPack > 24) {
    errors.push('El mes de activación del Pack (mesActPack) debe ser un entero entre 1 y 24.');
  }

  const mesTostadora = rawPlan.mesTostadora === undefined ? 12 : parseFiniteNumber(rawPlan.mesTostadora);
  if (!Number.isInteger(mesTostadora) || mesTostadora < 1 || mesTostadora > 24) {
    errors.push('El mes de compra de la tostadora (mesTostadora) debe ser un entero entre 1 y 24.');
  }

  const bfMode = rawPlan.bfMode === undefined ? 'all_cohorts' : rawPlan.bfMode;
  if (bfMode !== 'all_cohorts' && bfMode !== 'month1_only') {
    errors.push('El modo de promoción (bfMode) debe ser "all_cohorts" o "month1_only".');
  }

  const packScope = rawPlan.packScope === undefined ? 'all_orders' : rawPlan.packScope;
  if (packScope !== 'all_orders' && packScope !== 'new_cohorts_only') {
    errors.push('El alcance del Pack (packScope) debe ser "all_orders" o "new_cohorts_only".');
  }

  if (rawPlan.polPack !== undefined && typeof rawPlan.polPack !== 'boolean') {
    errors.push('El indicador polPack del plan 24M debe ser booleano.');
  }

  if (rawPlan.buyTostadora !== undefined && typeof rawPlan.buyTostadora !== 'boolean') {
    errors.push('El indicador buyTostadora del plan 24M debe ser booleano.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      investments: rawPlan.investments.map(v => Number(v)),
      descBF,
      bfMode,
      polPack: Boolean(rawPlan.polPack),
      mesActPack,
      packScope,
      adopPack,
      buyTostadora: Boolean(rawPlan.buyTostadora),
      mesTostadora
    }
  };
}

export function buildAllReferenceResults() {
  const ref12m = {};
  for (const [k, preset] of Object.entries(PRESETS_12M)) {
    ref12m[k] = {
      preset,
      result: computeScenario(preset)
    };
  }
  const ref24m = {};
  for (const [k, plan] of Object.entries(REFERENCE_PLANS_24M)) {
    ref24m[k] = simulate24Months(plan);
  }
  return { ref12m, ref24m };
}

