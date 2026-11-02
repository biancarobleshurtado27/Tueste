import React from 'react';
import { fmtUSD, fmtNum } from '../../shared/tuesteModel.js';

export function PresetBar12M({ activePresetKey, onSelectPreset, onRestore }) {
  const buttons = [
    { key: 'actual', label: 'Actual ($8.000)' },
    { key: 'agencia', label: 'Agencia ($16.000 + 30% BF)' },
    { key: 'cambio1', label: 'Cambio 1 ($4.000)' },
    { key: 'cambio2', label: 'Cambio 2 (Pack $48 + Envío)' },
    { key: 'combinado', label: 'Combinado ($4.000 + Pack/Envío)' }
  ];

  return (
    <div className="preset-bar">
      <span className="preset-label">Escenarios originales de referencia:</span>
      {buttons.map(b => (
        <button
          key={b.key}
          type="button"
          className={`btn ${activePresetKey === b.key ? 'active' : ''}`}
          onClick={() => onSelectPreset(b.key)}
        >
          {b.label}
        </button>
      ))}
      <button
        type="button"
        className="btn btn-restore"
        onClick={onRestore}
      >
        ↺ Restaurar datos del caso
      </button>
    </div>
  );
}

export function Controls12MPanel({ params12m, liveRes, onChangeParam }) {
  const handleNum = (key, rawVal) => {
    const parsed = rawVal === '' ? 0 : Number(rawVal);
    onChangeParam(key, parsed);
  };

  return (
    <aside className="controls-panel">
      <h3>Controles del Escenario (12 Meses)</h3>

      {/* 1. Inversión Meta */}
      <div className="control-group">
        <div className="control-header">
          <label htmlFor="ctrlInversion">1. Inversión mensual en Meta ($ USD)</label>
          <span>{fmtUSD(params12m.inversion, 0)}</span>
        </div>
        <div className="control-inputs">
          <input
            id="ctrlInversionRng"
            type="range"
            min="0"
            max="20000"
            step="500"
            value={params12m.inversion}
            onChange={e => handleNum('inversion', e.target.value)}
          />
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
        <div className="control-hint">
          Rango histórico válido: $0 a $20.000 (interpolación lineal por tramos, Pág. 5).
        </div>
      </div>

      {/* 2. Precio por bolsa */}
      <div className="control-group">
        <div className="control-header">
          <label htmlFor="ctrlPrecioBolsa">2. Precio por bolsa ($ USD)</label>
          <span>{fmtUSD(params12m.precioBolsa, 2)}</span>
        </div>
        <div className="control-inputs">
          <input
            id="ctrlPrecioBolsaRng"
            type="range"
            min="10"
            max="30"
            step="0.5"
            value={params12m.precioBolsa}
            onChange={e => handleNum('precioBolsa', e.target.value)}
          />
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
        <div className="control-hint">
          Pedido típico: 2 bolsas ({fmtUSD(liveRes.precio2B, 2)}). Suscripción 2 bolsas (-10%): {fmtUSD(liveRes.cobroSusc, 2)} (Pág. 3).
        </div>
      </div>

      {/* 3. Costo del café por bolsa */}
      <div className="control-group">
        <div className="control-header">
          <label htmlFor="ctrlCostoCafe">3. Costo del café por bolsa ($ USD)</label>
          <span>{fmtUSD(params12m.costoCafe, 2)}</span>
        </div>
        <div className="control-inputs">
          <input
            id="ctrlCostoCafeRng"
            type="range"
            min="2"
            max="12"
            step="0.08"
            value={params12m.costoCafe}
            onChange={e => handleNum('costoCafe', e.target.value)}
          />
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
        <div className="control-hint">
          2 bolsas = {fmtUSD(liveRes.cafe2B, 2)}. No baja cuando se otorgan descuentos promocionales (Pág. 3).
        </div>
      </div>

      {/* 4. Costo del envío */}
      <div className="control-group">
        <div className="control-header">
          <label htmlFor="ctrlCostoEnvio">4. Costo del envío pagado por Tueste ($ USD)</label>
          <span>{fmtUSD(params12m.costoEnvio, 2)}</span>
        </div>
        <div className="control-inputs">
          <input
            id="ctrlCostoEnvioRng"
            type="range"
            min="0"
            max="12"
            step="0.25"
            value={params12m.costoEnvio}
            onChange={e => handleNum('costoEnvio', e.target.value)}
          />
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
        <div className="control-hint">
          Más $1,20 de empaque en pedidos de 2 bolsas ($1,40 en Pack de 3) y 4,5% de pasarela (Pág. 3).
        </div>
      </div>

      {/* 5. Porcentaje de suscriptores */}
      <div className="control-group">
        <div className="control-header">
          <label htmlFor="ctrlPctSusc">5. Porcentaje de suscriptores (%)</label>
          <span>{fmtNum(params12m.pctSusc, 1)}%</span>
        </div>
        <div className="control-inputs">
          <input
            id="ctrlPctSuscRng"
            type="range"
            min="0"
            max="100"
            step="1"
            value={params12m.pctSusc}
            onChange={e => handleNum('pctSusc', e.target.value)}
          />
          <input
            id="ctrlPctSusc"
            type="number"
            min="0"
            max="100"
            step="1"
            value={params12m.pctSusc}
            onChange={e => handleNum('pctSusc', e.target.value)}
          />
        </div>
        <div className="control-hint">
          Compradores de pedido suelto: {fmtNum(100 - params12m.pctSusc, 1)}% de los clientes nuevos (Pág. 5).
        </div>
      </div>

      {/* 6. Cancelación mensual suscriptores */}
      <div className="control-group">
        <div className="control-header">
          <label htmlFor="ctrlChurn">6. Cancelación mensual suscriptores (%)</label>
          <span>{fmtNum(params12m.churn, 1)}%</span>
        </div>
        <div className="control-inputs">
          <input
            id="ctrlChurnRng"
            type="range"
            min="0"
            max="100"
            step="1"
            value={params12m.churn}
            onChange={e => handleNum('churn', e.target.value)}
          />
          <input
            id="ctrlChurn"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={params12m.churn}
            onChange={e => handleNum('churn', e.target.value)}
          />
        </div>
        <div className="control-hint">
          Permanencia mensual: {fmtNum(100 - params12m.churn, 1)}% ({fmtNum(liveRes.sumActSusc, 2)} pagos esperados en 12M, Pág. 5).
        </div>
      </div>

      {/* 7. Pedidos comprador suelto en 12M */}
      <div className="control-group">
        <div className="control-header">
          <label htmlFor="ctrlPedidosSuelto">7. Pedidos comprador suelto en 12M (pedidos)</label>
          <span>{fmtNum(params12m.pedidosSuelto, 2)}</span>
        </div>
        <div className="control-inputs">
          <input
            id="ctrlPedidosSueltoRng"
            type="range"
            min="1"
            max="8"
            step="0.1"
            value={params12m.pedidosSuelto}
            onChange={e => handleNum('pedidosSuelto', e.target.value)}
          />
          <input
            id="ctrlPedidosSuelto"
            type="number"
            min="1"
            max="12"
            step="0.1"
            value={params12m.pedidosSuelto}
            onChange={e => handleNum('pedidosSuelto', e.target.value)}
          />
        </div>
        <div className="control-hint">
          Mínimo 1 pedido (Mes 1 = 1,00 fijo; escala proporcionalmente meses 2 a 12, Pág. 5).
        </div>
      </div>

      {/* 8. Fee de agencia */}
      <div className="control-group">
        <div className="control-header">
          <label htmlFor="ctrlFeeAgencia">8. Fee mensual de agencia ($ USD)</label>
          <span>{fmtUSD(params12m.feeAgencia, 0)}</span>
        </div>
        <div className="control-inputs">
          <input
            id="ctrlFeeAgenciaRng"
            type="range"
            min="0"
            max="3000"
            step="100"
            value={params12m.feeAgencia}
            onChange={e => handleNum('feeAgencia', e.target.value)}
          />
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
        <div className="control-hint">
          Se cobra únicamente si la inversión en Meta es mayor a $0 (Pág. 5).
        </div>
      </div>

      {/* 9. Descuento del primer pedido suelto */}
      <div className="control-group">
        <div className="control-header">
          <label htmlFor="ctrlDescuentoBF">9. Descuento 1er pedido suelto (%)</label>
          <span>{fmtNum(params12m.descuentoBF, 1)}%</span>
        </div>
        <div className="control-inputs">
          <input
            id="ctrlDescuentoBFRng"
            type="range"
            min="0"
            max="60"
            step="5"
            value={params12m.descuentoBF}
            onChange={e => handleNum('descuentoBF', e.target.value)}
          />
          <input
            id="ctrlDescuentoBF"
            type="number"
            min="0"
            max="100"
            step="1"
            value={params12m.descuentoBF}
            onChange={e => handleNum('descuentoBF', e.target.value)}
          />
        </div>
        <div className="control-hint">
          Aplica únicamente al primer pedido de compradores sueltos en el Mes 1 (Pág. 7).
        </div>
      </div>

      {/* 10. Política de Pack $48 y Envío */}
      <div className="pack-box">
        <label className="checkbox-row">
          <input
            id="ctrlPolPack"
            type="checkbox"
            checked={params12m.polPack}
            onChange={e => onChangeParam('polPack', e.target.checked)}
          />
          <span>
            Activar Pack 3 bolsas ($48) y cobrar envío ($4,50) en pedidos sueltos menores a $45
          </span>
        </label>
        <div className="control-group" style={{ marginTop: '0.7rem', marginBottom: 0 }}>
          <div className="control-header">
            <label htmlFor="ctrlAdopcionPack">Adopción del Pack en 1er pedido suelto (%)</label>
            <span>{fmtNum(params12m.adopcionPack, 1)}%</span>
          </div>
          <div className="control-inputs">
            <input
              id="ctrlAdopcionPackRng"
              type="range"
              min="0"
              max="100"
              step="5"
              value={params12m.adopcionPack}
              onChange={e => handleNum('adopcionPack', e.target.value)}
            />
            <input
              id="ctrlAdopcionPack"
              type="number"
              min="0"
              max="100"
              step="1"
              value={params12m.adopcionPack}
              onChange={e => handleNum('adopcionPack', e.target.value)}
            />
          </div>
          <div className="control-hint">
            Regla de envío: cobra $4,50 únicamente si el subtotal de productos del pedido suelto (después del descuento y antes del envío) es inferior a $45; desde $45 el envío es gratis. Suscripciones mantienen envío gratis (Pág. 6).
          </div>
        </div>
      </div>
    </aside>
  );
}

