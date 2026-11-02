import React, { useState } from 'react';
import { PRESETS_12M, fmtUSD, fmtNum } from '../../shared/tuesteModel.js';

const TERM_DEFINITIONS = {
  CAC: {
    label: '¿Qué es CAC?',
    title: 'Costo por cliente nuevo (CAC real)',
    body: 'Es lo que le cuesta a Tueste traer un cliente que compra por primera vez desde los anuncios. Suma la inversión mensual en Meta más el honorario de la agencia y lo divide únicamente entre los clientes nuevos reales (sin inflarlo con recompras de clientes anteriores).'
  },
  LTV: {
    label: '¿Qué es LTV?',
    title: 'Contribución acumulada en 12 meses (LTV)',
    body: 'Es el dinero que deja un cliente promedio durante su primer año después de pagar el café tostado, el empaque, el envío y la comisión de la pasarela de cobro. No es facturación bruta: mide cuánto aporta realmente cada cliente para recuperar su adquisición y ayudar a pagar los costos fijos.'
  },
  ROAS: {
    label: '¿Qué es ROAS?',
    title: 'Retorno en ventas por cada dólar en anuncios (ROAS)',
    body: 'Divide las ventas atribuidas entre el gasto en anuncios. Cuidado: un ROAS de 3,0x en Meta mezcla ventas a clientes que ya conocían la marca y mide ventas brutas antes de descontar café, empaque, envío y pasarela.'
  }
};

export function TermHelp({ term }) {
  const [open, setOpen] = useState(false);
  const info = TERM_DEFINITIONS[term];
  if (!info) return null;

  const handleKeyDown = e => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <span className="term-help-inline" onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="term-help-btn"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
      >
        {info.label}
      </button>
      {open && (
        <div className="term-help-popover" role="region" aria-label={info.title}>
          <strong>{info.title}:</strong> {info.body}
        </div>
      )}
    </span>
  );
}

const SCENARIO_ITEMS = [
  {
    key: 'actual',
    shortLabel: 'Actual',
    summary:
      'Presupuesto: $8.000/mes en Meta + $1.000 de agencia · Bolsa a $17 (pedido típico de 2 bolsas: $34) · Envío gratis absorbido por Tueste ($4,50) · 15% suscriptores y 85% sueltos.'
  },
  {
    key: 'agencia',
    shortLabel: 'Agencia',
    summary:
      'Presupuesto: $16.000/mes en Meta + $1.000 de agencia · Descuento de 30% en el primer pedido suelto · Mantiene envío gratis absorbido por Tueste.'
  },
  {
    key: 'cambio1',
    shortLabel: 'Menor inversión',
    summary:
      'Presupuesto: $4.000/mes en Meta + $1.000 de agencia · Conserva los precios y envíos actuales para concentrar la pauta en el primer tramo más eficiente (100 clientes nuevos).'
  },
  {
    key: 'cambio2',
    shortLabel: 'Pack y envío',
    summary:
      'Presupuesto: $8.000/mes en Meta + $1.000 de agencia · Prueba comercial: Pack de 3 bolsas a $48 (20% de adopción inicial) y cobro de $4,50 de envío en pedidos sueltos menores a $45.'
  },
  {
    key: 'combinado',
    shortLabel: 'Combinado',
    summary:
      'Presupuesto: $4.000/mes en Meta + $1.000 de agencia · Combina el recorte de pauta a $4.000 con la prueba comercial del Pack de $48 y cobro de envío bajo $45.'
  }
];

export function countDiffsFromPreset(params12m, basePreset = PRESETS_12M.actual) {
  const keys = [
    'inversion',
    'precioBolsa',
    'costoCafe',
    'costoEnvio',
    'pctSusc',
    'churn',
    'pedidosSuelto',
    'feeAgencia',
    'descuentoBF',
    'polPack',
    'adopcionPack'
  ];
  return keys.filter(k => {
    if (typeof basePreset[k] === 'boolean') {
      return Boolean(params12m[k]) !== Boolean(basePreset[k]);
    }
    return Math.abs(Number(params12m[k]) - Number(basePreset[k])) > 1e-6;
  });
}

export function PresetBar12M({
  params12m,
  activePresetKey,
  lastPresetKey = 'actual',
  activeSavedName = null,
  onSelectPreset,
  onRestore
}) {
  const selectedItem =
    SCENARIO_ITEMS.find(item => item.key === (activePresetKey || lastPresetKey)) ||
    SCENARIO_ITEMS[0];
  const diffsFromOrigin = countDiffsFromPreset(params12m, PRESETS_12M.actual);
  const isEditingCopy = !activePresetKey;

  return (
    <div className="scenario-selector-wrap">
      <div className="scenario-selector-top">
        <div className="scenario-pills" role="group" aria-label="Escenarios del caso">
          <span className="scenario-label">Escenario:</span>
          {SCENARIO_ITEMS.map(item => (
            <button
              key={item.key}
              type="button"
              className={`scenario-pill-btn ${activePresetKey === item.key ? 'active' : ''}`}
              aria-pressed={activePresetKey === item.key}
              onClick={() => onSelectPreset(item.key)}
            >
              {item.shortLabel}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-text"
          onClick={onRestore}
        >
          Volver al caso original
        </button>
      </div>

      <div className="scenario-meta-strip">
        <div>
          {activeSavedName ? (
            <span className="scenario-state-tag modified">
              Escenario guardado activo: {activeSavedName}
            </span>
          ) : isEditingCopy ? (
            <span className="scenario-state-tag modified">
              Editando copia con cambios (base: {selectedItem.shortLabel})
            </span>
          ) : (
            <span className="scenario-state-tag preset">
              Escenario activo: {selectedItem.shortLabel}
            </span>
          )}
          <span style={{ marginLeft: '0.6rem' }}>
            {isEditingCopy
              ? `Presupuesto actual: ${fmtUSD(params12m.inversion, 0)}/mes en Meta · Bolsa a ${fmtUSD(
                  params12m.precioBolsa,
                  2
                )} · Descuento 1er pedido: ${fmtNum(params12m.descuentoBF, 0)}% · ${
                  params12m.polPack ? 'Con Pack $48 y envío bajo $45' : 'Envío absorbido por Tueste'
                }.`
              : selectedItem.summary}
          </span>
        </div>

        {diffsFromOrigin.length > 0 && (
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--terracotta-dark)' }}>
            {diffsFromOrigin.length === 1
              ? '1 supuesto modificado respecto al caso original'
              : `${diffsFromOrigin.length} supuestos modificados respecto al caso original`}
          </span>
        )}
      </div>
    </div>
  );
}

export function ResultsHeaderBand12M({ liveRes, idPrefix = 'calc' }) {
  let bannerTone = 'neutral';
  let conclusionTitle = 'Sin inversión en anuncios; revisa la caja frente a costos fijos';
  let conclusionDetail =
    'Con $0 en Meta no hay costo de adquisición publicitaria, pero la empresa aún debe cubrir $6.500 cada mes en costos fijos.';

  if (liveRes.ltvCac !== null) {
    if (liveRes.ltvCac < 1.0 || (liveRes.netoPorCliente !== null && liveRes.netoPorCliente < 0)) {
      bannerTone = 'red';
      conclusionTitle = 'Este plan no recupera lo invertido';
      conclusionDetail = `Cada cliente nuevo cuesta ${fmtUSD(
        liveRes.cacReal,
        2
      )} y solo deja ${fmtUSD(liveRes.ltvPond, 2)} de contribución en 12 meses (${fmtUSD(
        liveRes.netoPorCliente,
        2
      )} por cliente). La adquisición da pérdida antes incluso de pagar los costos fijos.`;
    } else if (liveRes.ltvCac < 1.35 || (liveRes.payback !== null && liveRes.payback >= 10)) {
      bannerTone = 'amber';
      conclusionTitle = 'Apenas recuperamos la adquisición';
      conclusionDetail = `Cada cliente nuevo cuesta ${fmtUSD(
        liveRes.cacReal,
        2
      )} y aporta ${fmtUSD(liveRes.ltvPond, 2)} en 12 meses (margen de ${fmtUSD(
        liveRes.netoPorCliente,
        2
      )} por cliente; recién empata en el ${
        liveRes.paybackLabel
      }). Esta relación por cliente no descuenta los $6.500 mensuales de costos fijos.`;
    } else {
      bannerTone = 'green';
      conclusionTitle = 'Recupera la adquisición; falta revisar la caja';
      conclusionDetail = `Recupera el costo por cliente en el ${
        liveRes.paybackLabel
      } y deja ${fmtUSD(liveRes.netoPorCliente, 2)} netos por cliente al año (relación LTV:CAC de ${fmtNum(
        liveRes.ltvCac,
        2
      )}x). Recuerda: el LTV:CAC mide un cliente aislado y nunca garantiza la rentabilidad ni la liquidez total de la empresa.`;
    }
  }

  const isLoss = liveRes.netoPorCliente !== null && liveRes.netoPorCliente < 0;
  const isGain = liveRes.ltvCac !== null && liveRes.ltvCac >= 1.35;

  return (
    <>
      <div
        className={`verdict-banner ${bannerTone}`}
        id={idPrefix === 'tablero' ? 'tableroSemaforoBanner' : `${idPrefix}VerdictBanner`}
      >
        <div className="verdict-kicker">Diagnóstico de la cohorte a 12 meses (por cliente)</div>
        <div className="verdict-headline">{conclusionTitle}</div>
        <div className="verdict-summary">{conclusionDetail}</div>
      </div>

      <div className="metrics-band-3" role="region" aria-label="Tres cifras principales por cliente">
        <div className="band-cell">
          <div>
            <div className="band-label-row">
              <span className="band-label">Costo por cliente</span>
              <TermHelp term="CAC" />
            </div>
            <div className="band-value tabular" id={idPrefix === 'calc' ? 'calcKpiCacReal' : undefined}>
              {liveRes.cacReal !== null ? fmtUSD(liveRes.cacReal, 2) : 'No aplica'}
            </div>
          </div>
          <div className="band-sub tabular">
            {liveRes.cacReal !== null
              ? `Exacto: ${fmtUSD(liveRes.cacReal, 4)} · Solo anuncios: ${fmtUSD(
                  liveRes.cacAnuncios,
                  2
                )} (${fmtNum(liveRes.clientesNuevos, 1)} clientes nuevos)`
              : 'Sin gasto en Meta Ads ($0)'}
          </div>
        </div>

        <div className="band-cell">
          <div>
            <div className="band-label-row">
              <span className="band-label">Contribución en 12 meses</span>
              <TermHelp term="LTV" />
            </div>
            <div className="band-value tabular" id={idPrefix === 'calc' ? 'calcKpiLtvPond' : undefined}>
              {fmtUSD(liveRes.ltvPond, 2)}
            </div>
          </div>
          <div className="band-sub tabular">
            Exacto: {fmtUSD(liveRes.ltvPond, 4)} · Suelto: {fmtUSD(liveRes.ltvSuelto, 2)} · Suscripción:{' '}
            {fmtUSD(liveRes.ltvSusc, 2)}
          </div>
        </div>

        <div className="band-cell">
          <div>
            <div className="band-label-row">
              <span className="band-label">Mes de recuperación</span>
            </div>
            <div
              className={`band-value tabular ${isLoss ? 'loss' : isGain ? 'gain' : ''}`}
              id={idPrefix === 'calc' ? 'calcKpiPayback' : undefined}
            >
              {liveRes.paybackLabel}
            </div>
          </div>
          <div className="band-sub tabular" id={idPrefix === 'calc' ? 'calcKpiNetoCliente' : undefined}>
            {liveRes.netoPorCliente !== null
              ? `Saldo neto 12M: ${fmtUSD(liveRes.netoPorCliente, 2)}/cliente (${fmtUSD(
                  liveRes.netoCohorte,
                  2
                )} cohorte) · Relación ${fmtNum(liveRes.ltvCac, 2)}x`
              : 'Sin desembolso inicial de adquisición'}
          </div>
        </div>
      </div>
    </>
  );
}

export function Controls12MPanel({ params12m, liveRes, onChangeParam }) {
  const base = PRESETS_12M.actual;
  const diffs = countDiffsFromPreset(params12m, base);

  const isChanged = key => {
    if (typeof base[key] === 'boolean') return Boolean(params12m[key]) !== Boolean(base[key]);
    return Math.abs(Number(params12m[key]) - Number(base[key])) > 1e-6;
  };

  const handleNum = (key, rawVal) => {
    const parsed = rawVal === '' ? 0 : Number(rawVal);
    onChangeParam(key, parsed);
  };

  return (
    <aside className="assumptions-panel" aria-label="Supuestos del escenario">
      <div className="assumptions-panel-header">
        <h3>Supuestos del escenario</h3>
        {diffs.length > 0 && (
          <span className="modified-pill">Con cambios ({diffs.length})</span>
        )}
      </div>

      {/* GRUPO 1: PUBLICIDAD */}
      <div className="control-section-group">
        <div className="control-section-title">Publicidad</div>

        <div className="control-item">
          <div className="control-row-top">
            <label htmlFor="ctrlInversion">
              Inversión mensual en Meta
              {isChanged('inversion') && <span className="control-changed-dot" title="Modificado" />}
            </label>
            <div className="input-with-unit">
              <span className="input-unit-prefix">$</span>
              <input
                id="ctrlInversion"
                type="number"
                min="0"
                max="20000"
                step="100"
                value={params12m.inversion}
                onChange={e => handleNum('inversion', e.target.value)}
              />
            </div>
          </div>
          <input
            id="ctrlInversionRng"
            type="range"
            aria-label="Deslizador de inversión mensual en Meta"
            min="0"
            max="20000"
            step="500"
            value={params12m.inversion}
            onChange={e => handleNum('inversion', e.target.value)}
          />
          <div className="control-note">
            Rango histórico: $0 a $20.000 ({fmtNum(liveRes.clientesNuevos, 1)} clientes nuevos estimados).
          </div>
        </div>

        <div className="control-item">
          <div className="control-row-top">
            <label htmlFor="ctrlFeeAgencia">
              Honorario mensual de agencia
              {isChanged('feeAgencia') && <span className="control-changed-dot" title="Modificado" />}
            </label>
            <div className="input-with-unit">
              <span className="input-unit-prefix">$</span>
              <input
                id="ctrlFeeAgencia"
                type="number"
                min="0"
                max="10000"
                step="100"
                value={params12m.feeAgencia}
                onChange={e => handleNum('feeAgencia', e.target.value)}
              />
            </div>
          </div>
          <input
            id="ctrlFeeAgenciaRng"
            type="range"
            aria-label="Deslizador de honorario mensual de agencia"
            min="0"
            max="3000"
            step="100"
            value={params12m.feeAgencia}
            onChange={e => handleNum('feeAgencia', e.target.value)}
          />
          <div className="control-note">
            Se paga solo si hay pauta activa en Meta (&gt; $0).
          </div>
        </div>
      </div>

      {/* GRUPO 2: CADA PEDIDO */}
      <div className="control-section-group">
        <div className="control-section-title">Cada pedido</div>

        <div className="control-item">
          <div className="control-row-top">
            <label htmlFor="ctrlPrecioBolsa">
              Precio por bolsa
              {isChanged('precioBolsa') && <span className="control-changed-dot" title="Modificado" />}
            </label>
            <div className="input-with-unit">
              <span className="input-unit-prefix">$</span>
              <input
                id="ctrlPrecioBolsa"
                type="number"
                min="5"
                max="50"
                step="0.25"
                value={params12m.precioBolsa}
                onChange={e => handleNum('precioBolsa', e.target.value)}
              />
            </div>
          </div>
          <input
            id="ctrlPrecioBolsaRng"
            type="range"
            aria-label="Deslizador de precio por bolsa"
            min="10"
            max="30"
            step="0.5"
            value={params12m.precioBolsa}
            onChange={e => handleNum('precioBolsa', e.target.value)}
          />
          <div className="control-note">
            Pedido suelto de 2 bolsas: {fmtUSD(liveRes.precio2B, 2)} · Suscripción (-10%): {fmtUSD(liveRes.cobroSusc, 2)}.
          </div>
        </div>

        <div className="control-item">
          <div className="control-row-top">
            <label htmlFor="ctrlCostoCafe">
              Costo del café por bolsa
              {isChanged('costoCafe') && <span className="control-changed-dot" title="Modificado" />}
            </label>
            <div className="input-with-unit">
              <span className="input-unit-prefix">$</span>
              <input
                id="ctrlCostoCafe"
                type="number"
                min="0"
                max="30"
                step="0.01"
                value={params12m.costoCafe}
                onChange={e => handleNum('costoCafe', e.target.value)}
              />
            </div>
          </div>
          <input
            id="ctrlCostoCafeRng"
            type="range"
            aria-label="Deslizador de costo del café por bolsa"
            min="2"
            max="12"
            step="0.08"
            value={params12m.costoCafe}
            onChange={e => handleNum('costoCafe', e.target.value)}
          />
          <div className="control-note">
            2 bolsas = {fmtUSD(liveRes.cafe2B, 2)} de café tostado.
          </div>
        </div>

        <div className="control-item">
          <div className="control-row-top">
            <label htmlFor="ctrlCostoEnvio">
              Costo del envío por pedido
              {isChanged('costoEnvio') && <span className="control-changed-dot" title="Modificado" />}
            </label>
            <div className="input-with-unit">
              <span className="input-unit-prefix">$</span>
              <input
                id="ctrlCostoEnvio"
                type="number"
                min="0"
                max="25"
                step="0.10"
                value={params12m.costoEnvio}
                onChange={e => handleNum('costoEnvio', e.target.value)}
              />
            </div>
          </div>
          <input
            id="ctrlCostoEnvioRng"
            type="range"
            aria-label="Deslizador de costo del envío"
            min="0"
            max="12"
            step="0.25"
            value={params12m.costoEnvio}
            onChange={e => handleNum('costoEnvio', e.target.value)}
          />
          <div className="control-note">
            Más $1,20 de empaque (2 bolsas) y 4,5% de comisión de cobro.
          </div>
        </div>

        <div className="control-item">
          <div className="control-row-top">
            <label htmlFor="ctrlDescuentoBF">
              Descuento en 1er pedido suelto
              {isChanged('descuentoBF') && <span className="control-changed-dot" title="Modificado" />}
            </label>
            <div className="input-with-unit">
              <input
                id="ctrlDescuentoBF"
                type="number"
                min="0"
                max="100"
                step="1"
                value={params12m.descuentoBF}
                onChange={e => handleNum('descuentoBF', e.target.value)}
              />
              <span className="input-unit-suffix">%</span>
            </div>
          </div>
          <input
            id="ctrlDescuentoBFRng"
            type="range"
            aria-label="Deslizador de descuento en primer pedido suelto"
            min="0"
            max="60"
            step="5"
            value={params12m.descuentoBF}
            onChange={e => handleNum('descuentoBF', e.target.value)}
          />
          <div className="control-note">
            Promoción propuesta por la agencia (30% en Black Friday).
          </div>
        </div>

        <div className="pack-toggle-box">
          <label className="checkbox-label">
            <input
              id="ctrlPolPack"
              type="checkbox"
              checked={params12m.polPack}
              onChange={e => onChangeParam('polPack', e.target.checked)}
            />
            <span>
              Probar Pack 3 bolsas ($48) y cobrar envío ($4,50) bajo $45
              {isChanged('polPack') && <span className="control-changed-dot" title="Modificado" />}
            </span>
          </label>

          <div className="control-item" style={{ marginTop: '0.55rem' }}>
            <div className="control-row-top">
              <label htmlFor="ctrlAdopcionPack">
                Adopción del Pack en 1er pedido
                {isChanged('adopcionPack') && <span className="control-changed-dot" title="Modificado" />}
              </label>
              <div className="input-with-unit">
                <input
                  id="ctrlAdopcionPack"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={params12m.adopcionPack}
                  onChange={e => handleNum('adopcionPack', e.target.value)}
                />
                <span className="input-unit-suffix">%</span>
              </div>
            </div>
            <input
              id="ctrlAdopcionPackRng"
              type="range"
              aria-label="Deslizador de adopción del Pack"
              min="0"
              max="100"
              step="5"
              value={params12m.adopcionPack}
              onChange={e => handleNum('adopcionPack', e.target.value)}
            />
            <div className="control-note">
              Supuesto comercial no garantizado. El umbral de $45 se evalúa después del descuento y antes del envío; suscripciones mantienen envío gratis.
            </div>
          </div>
        </div>
      </div>

      {/* GRUPO 3: RECOMPRA */}
      <div className="control-section-group">
        <div className="control-section-title">Recompra</div>

        <div className="control-item">
          <div className="control-row-top">
            <label htmlFor="ctrlPctSusc">
              Porcentaje de suscriptores
              {isChanged('pctSusc') && <span className="control-changed-dot" title="Modificado" />}
            </label>
            <div className="input-with-unit">
              <input
                id="ctrlPctSusc"
                type="number"
                min="0"
                max="100"
                step="1"
                value={params12m.pctSusc}
                onChange={e => handleNum('pctSusc', e.target.value)}
              />
              <span className="input-unit-suffix">%</span>
            </div>
          </div>
          <input
            id="ctrlPctSuscRng"
            type="range"
            aria-label="Deslizador de porcentaje de suscriptores"
            min="0"
            max="100"
            step="1"
            value={params12m.pctSusc}
            onChange={e => handleNum('pctSusc', e.target.value)}
          />
          <div className="control-note">
            Compradores por pedido suelto: {fmtNum(100 - params12m.pctSusc, 0)}% de la cohorte.
          </div>
        </div>

        <div className="control-item">
          <div className="control-row-top">
            <label htmlFor="ctrlChurn">
              Cancelación mensual suscriptores
              {isChanged('churn') && <span className="control-changed-dot" title="Modificado" />}
            </label>
            <div className="input-with-unit">
              <input
                id="ctrlChurn"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={params12m.churn}
                onChange={e => handleNum('churn', e.target.value)}
              />
              <span className="input-unit-suffix">%</span>
            </div>
          </div>
          <input
            id="ctrlChurnRng"
            type="range"
            aria-label="Deslizador de cancelación mensual de suscriptores"
            min="0"
            max="100"
            step="1"
            value={params12m.churn}
            onChange={e => handleNum('churn', e.target.value)}
          />
          <div className="control-note">
            Permanencia: {fmtNum(100 - params12m.churn, 1)}%/mes ({fmtNum(liveRes.sumActSusc, 2)} cobros esperados en 12 meses).
          </div>
        </div>

        <div className="control-item">
          <div className="control-row-top">
            <label htmlFor="ctrlPedidosSuelto">
              Pedidos del comprador suelto (12M)
              {isChanged('pedidosSuelto') && <span className="control-changed-dot" title="Modificado" />}
            </label>
            <div className="input-with-unit">
              <input
                id="ctrlPedidosSuelto"
                type="number"
                min="1"
                max="12"
                step="0.1"
                value={params12m.pedidosSuelto}
                onChange={e => handleNum('pedidosSuelto', e.target.value)}
              />
              <span className="input-unit-suffix">ped.</span>
            </div>
          </div>
          <input
            id="ctrlPedidosSueltoRng"
            type="range"
            aria-label="Deslizador de pedidos del comprador suelto en 12 meses"
            min="1"
            max="8"
            step="0.1"
            value={params12m.pedidosSuelto}
            onChange={e => handleNum('pedidosSuelto', e.target.value)}
          />
          <div className="control-note">
            1 pedido inicial en el Mes 1 más {fmtNum(params12m.pedidosSuelto - 1, 2)} recompras entre los meses 2 y 12.
          </div>
        </div>
      </div>
    </aside>
  );
}
