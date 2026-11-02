import React, { useState } from 'react';
import { PRESETS_12M, REFERENCE_PLANS_24M, computeScenario, simulate24Months, fmtUSD } from '../../shared/tuesteModel.js';

export function DecisionBrief({ onExplore }) {
  const [loss, setLoss] = useState(20);
  const [repeatLoss, setRepeatLoss] = useState(10);
  const base = computeScenario(PRESETS_12M.actual);
  const agency = computeScenario(PRESETS_12M.agencia);
  const cashBase = simulate24Months(REFERENCE_PLANS_24M.base8k);
  const cashLean = simulate24Months(REFERENCE_PLANS_24M.propioA);
  const stressed = computeScenario({ ...PRESETS_12M.combinado, pedidosSuelto: 1 + 2 * (1 - repeatLoss / 100) });
  const remaining = 100 * (1 - loss / 100);
  const stressedCac = 5000 / remaining;
  const ratio = stressed.ltvPond / stressedCac;
  return <section className="decision-brief" aria-labelledby="decision-title">
    <div className="decision-intro">
      <span className="notebook-kicker">LA DECISIÓN / CASO TUESTE</span>
      <h1 id="decision-title">Menos impulso.<br /><em>Más criterio para crecer.</em></h1>
      <p>No firmar la propuesta actual de la agencia. Reducir inicialmente Meta a $4.000 al mes y probar el pack y el envío antes de extenderlos.</p>
      <button className="btn btn-olive" onClick={onExplore}>Explorar la decisión en el tablero →</button>
    </div>
    <div className="decision-evidence">
      <div><span>Costo por cliente · hoy</span><strong>{fmtUSD(base.cacReal, 2)}</strong><small>Contribución a 12 meses: {fmtUSD(base.ltvPond, 2)}. Casi no queda margen después de adquirirlo.</small></div>
      <div><span>Costo por cliente · agencia</span><strong>{fmtUSD(agency.cacReal, 2)}</strong><small>Con descuento, su contribución anual baja a {fmtUSD(agency.ltvPond, 2)}.</small></div>
      <div><span>Más caja con Meta a $4.000</span><strong>+{fmtUSD(cashLean.cajaMes24 - cashBase.cajaMes24, 0)}</strong><small>Al mes 24 frente a $8.000 mensuales, sin pack. Proyección del caso, no dinero garantizado.</small></div>
    </div>
    <details className="decision-method">
      <summary>La propuesta, sus riesgos y cómo defenderla</summary>
      <div className="decision-columns">
        <article><span className="decision-label">01 / RESPALDADO POR EL HISTORIAL</span><h3>Reducir para proteger la caja</h3><p>Con $4.000 se adquieren 100 clientes de Meta. El CAC con agencia baja a $50 y se recupera en el mes 11. Es una recomendación inicial entre los planes comparados, no una optimización global.</p></article>
        <article><span className="decision-label">02 / EXPERIMENTO COMERCIAL</span><h3>Selección de origen</h3><p>Concepto propuesto: tres bolsas, tres historias. Pack de $48 con envío incluido. Comunicar procedencia, frescura y descubrimiento; la selección de orígenes debe confirmarse antes de anunciarla.</p><p>Probar con un grupo de clientes y comparar conversión, contribución inicial y primeras recompras. Un piloto de 60 días no verifica un LTV anual.</p></article>
      </div>
      <div className="commercial-stress">
        <span className="decision-label">03 / ¿Y SI COMPRAN MENOS?</span><h3>Poner la propuesta a prueba</h3>
        <p>Sensibilidad del plan de $4.000 más pack y envío. Mantiene el gasto de $5.000 incluida agencia y supone 20% de adopción del pack solo en el primer pedido. Los porcentajes siguientes son supuestos exploratorios.</p>
        <label htmlFor="stress-acquisition">Menos clientes nuevos de Meta: <strong>{loss}%</strong></label>
        <input id="stress-acquisition" type="range" min="0" max="80" step="5" value={loss} onChange={e => setLoss(Number(e.target.value))} />
        <label htmlFor="stress-repeat">Menos recompras sueltas por cliente: <strong>{repeatLoss}%</strong></label>
        <input id="stress-repeat" type="range" min="0" max="100" step="5" value={repeatLoss} onChange={e => setRepeatLoss(Number(e.target.value))} />
        <div className="stress-results" aria-live="polite"><div><span>Clientes Meta</span><strong>{remaining.toFixed(0)}</strong></div><div><span>CAC real</span><strong>{fmtUSD(stressedCac, 2)}</strong></div><div><span>Contribución 12 meses</span><strong>{fmtUSD(stressed.ltvPond, 2)}</strong></div><div><span>LTV:CAC</span><strong>{ratio.toFixed(2)}×</strong></div></div>
        <p className={ratio < 1 ? 'stress-loss' : 'stress-note'}>{ratio < 1 ? 'No cubre la adquisición en 12 meses: no extender esta política bajo estos supuestos.' : 'Cubre la adquisición a 12 meses bajo estos supuestos; todavía debe cubrir gastos fijos y sostener la caja.'}</p>
        <small>Solo analiza adquisición de Meta por cliente; no modifica el historial original, los clientes orgánicos ni el simulador de caja. Mantiene la mezcla 85/15 y la cancelación de 9%. No modela el momento exacto de las recompras ni calcula payback.</small>
      </div>
      <article className="presentation-route"><h3>Una historia en cuatro pasos</h3><p>Actual: casi empatamos CAC y LTV. Agencia: adquirir cuesta más y el descuento reduce la contribución. Menor inversión: mejora la adquisición. Caja a 24 meses: comprobar el piso de $5.000 antes de crecer.</p></article>
    </details>
  </section>;
}
