import React from 'react';
import {
  PASARELA_RATE,
  EMPAQUE_2B,
  EMPAQUE_3B,
  PRECIO_PACK_3B,
  fmtUSD,
  fmtNum,
  fmtPct,
  fmtRoas
} from '../../shared/tuesteModel.js';
import { PresetBar12M, Controls12MPanel } from './Controls12MPanel.jsx';

export function CalculadoraSection({
  params12m,
  liveRes,
  activePresetKey,
  onSelectPreset,
  onRestore,
  onChangeParam
}) {
  const isLoss = liveRes.netoPorCliente !== null && liveRes.netoPorCliente < 0;
  const isStrongGain = liveRes.ltvCac !== null && liveRes.ltvCac >= 3.0;

  return (
    <section className="section-block" id="seccion-calculadora">
      <div className="section-header">
        <div>
          <span className="section-step">Sección 1 · Calculadora de Economía Unitaria (Nivel 1)</span>
          <h2 className="section-title">Calculadora de Contribución, CAC, LTV y Payback</h2>
          <p className="section-subtitle">
            Edita cualquier supuesto para recalcular mediante el módulo compartido (<code>shared/tuesteModel.js</code>) la contribución por pedido, el costo real de adquisición (CAC), el valor de vida a 12 meses (LTV) y la curva mensual de recuperación del Mes 0 al Mes 12.
          </p>
        </div>
      </div>

      <PresetBar12M
        activePresetKey={activePresetKey}
        onSelectPreset={onSelectPreset}
        onRestore={onRestore}
      />

      <div className="lab-layout">
        <Controls12MPanel
          params12m={params12m}
          liveRes={liveRes}
          onChangeParam={onChangeParam}
        />

        <div className="live-results">
          {/* Resumen Principal de la Calculadora */}
          <div className="kpi-grid">
            <div className="kpi-card highlight">
              <div className="kpi-label">CAC Real por Cliente Nuevo</div>
              <div className="kpi-val" id="calcKpiCacReal">
                {liveRes.cacReal !== null ? fmtUSD(liveRes.cacReal, 4) : 'No aplica'}
              </div>
              <div className="kpi-sub">
                {liveRes.cacAnuncios !== null
                  ? `Anuncios: ${fmtUSD(liveRes.cacAnuncios, 2)} · ${fmtNum(liveRes.clientesNuevos, 1)} clientes`
                  : 'Sin inversión en Meta Ads ($0)'}
              </div>
            </div>

            <div className="kpi-card highlight">
              <div className="kpi-label">LTV Contribución Ponderado (12M)</div>
              <div className="kpi-val" id="calcKpiLtvPond">
                {fmtUSD(liveRes.ltvPond, 4)}
              </div>
              <div className="kpi-sub">
                Suelto (85%): {fmtUSD(liveRes.ltvSuelto, 2)} · Suscr. (15%): {fmtUSD(liveRes.ltvSusc, 2)}
              </div>
            </div>

            <div className={`kpi-card ${isLoss ? 'loss' : isStrongGain ? 'gain' : 'highlight'}`}>
              <div className="kpi-label">Payback y Ratio LTV:CAC</div>
              <div className="kpi-val" id="calcKpiPayback">
                {liveRes.paybackLabel}
              </div>
              <div className="kpi-sub">
                Ratio LTV:CAC: {liveRes.ltvCac !== null ? `${fmtNum(liveRes.ltvCac, 2)}x` : 'No aplica'}
              </div>
            </div>

            <div className={`kpi-card ${isLoss ? 'loss' : 'highlight'}`}>
              <div className="kpi-label">Contribución Neta a 12M (LTV − CAC)</div>
              <div
                className="kpi-val"
                id="calcKpiNetoCliente"
                style={{ color: isLoss ? 'var(--red)' : 'var(--coffee-900)' }}
              >
                {liveRes.netoPorCliente !== null ? fmtUSD(liveRes.netoPorCliente, 2) : 'No aplica'}
              </div>
              <div className="kpi-sub">
                Cohorte completa: {liveRes.netoPorCliente !== null ? fmtUSD(liveRes.netoCohorte, 2) : 'No aplica'}
              </div>
            </div>
          </div>

          {/* Desglose de Economía Unitaria por Tipo de Pedido */}
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Concepto Unitario (Fórmula sin redondeos intermedios)</th>
                  <th className="num">1er Pedido Suelto (Mes 1)</th>
                  <th className="num">Recompra Suelta (M2–M12)</th>
                  <th className="num">Suscripción Mensual (-10%)</th>
                  <th className="num">Pack 3 Bolsas ($48)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Importe cobrado al cliente ($)</strong></td>
                  <td className="num">{fmtUSD(liveRes.cobroSueltoM1, 2)}</td>
                  <td className="num">
                    {fmtUSD(
                      params12m.polPack && liveRes.precio2B < 45
                        ? liveRes.precio2B + 4.5
                        : liveRes.precio2B,
                      2
                    )}
                  </td>
                  <td className="num">{fmtUSD(liveRes.cobroSusc, 2)}</td>
                  <td className="num">{fmtUSD(PRECIO_PACK_3B, 2)}</td>
                </tr>
                <tr>
                  <td>Comisión pasarela de pagos ({fmtNum(PASARELA_RATE * 100, 1)}% sobre cobro)</td>
                  <td className="num">-{fmtUSD(liveRes.cobroSueltoM1 * PASARELA_RATE, 3)}</td>
                  <td className="num">
                    -{fmtUSD(
                      (params12m.polPack && liveRes.precio2B < 45
                        ? liveRes.precio2B + 4.5
                        : liveRes.precio2B) * PASARELA_RATE,
                      3
                    )}
                  </td>
                  <td className="num">-{fmtUSD(liveRes.cobroSusc * PASARELA_RATE, 3)}</td>
                  <td className="num">-{fmtUSD(PRECIO_PACK_3B * PASARELA_RATE, 3)}</td>
                </tr>
                <tr>
                  <td>Costo del café tostado + empaque ($)</td>
                  <td className="num">
                    {params12m.polPack
                      ? `Ponderado (${fmtNum(100 - params12m.adopcionPack, 0)}% 2B / ${fmtNum(params12m.adopcionPack, 0)}% Pack)`
                      : `-${fmtUSD(liveRes.cafe2B + EMPAQUE_2B, 2)}`}
                  </td>
                  <td className="num">-{fmtUSD(liveRes.cafe2B + EMPAQUE_2B, 2)}</td>
                  <td className="num">-{fmtUSD(liveRes.cafe2B + EMPAQUE_2B, 2)}</td>
                  <td className="num">-{fmtUSD(3 * params12m.costoCafe + EMPAQUE_3B, 2)}</td>
                </tr>
                <tr>
                  <td>Costo de envío pagado por Tueste ($)</td>
                  <td className="num">-{fmtUSD(params12m.costoEnvio, 2)}</td>
                  <td className="num">-{fmtUSD(params12m.costoEnvio, 2)}</td>
                  <td className="num">-{fmtUSD(params12m.costoEnvio, 2)}</td>
                  <td className="num">-{fmtUSD(params12m.costoEnvio, 2)}</td>
                </tr>
                <tr className={liveRes.contribSueltoM1 < 0 ? 'row-violation' : ''}>
                  <td><strong>Contribución Unitaria Neta ($)</strong></td>
                  <td className="num"><strong>{fmtUSD(liveRes.contribSueltoM1, 4)}</strong></td>
                  <td className="num"><strong>{fmtUSD(liveRes.contribSueltoRecompra, 4)}</strong></td>
                  <td className="num"><strong>{fmtUSD(liveRes.contribSusc, 4)}</strong></td>
                  <td className="num"><strong>{fmtUSD(liveRes.contribPack, 4)}</strong></td>
                </tr>
                <tr>
                  <td>Margen de Contribución (%) / ROAS de Equilibrio</td>
                  <td className="num">
                    {fmtPct(liveRes.pctContribSueltoM1, 2)} ({fmtRoas(liveRes.roasEqSueltoM1)})
                  </td>
                  <td className="num">—</td>
                  <td className="num">
                    {fmtPct(liveRes.pctContribSusc, 2)} ({fmtRoas(liveRes.roasEqSusc)})
                  </td>
                  <td className="num">
                    {fmtPct(liveRes.contribPack / PRECIO_PACK_3B, 2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tabla de Curva de Contribución Acumulada (Mes 0 a Mes 12) */}
          <div>
            <h3 style={{ fontSize: '0.98rem', marginBottom: '0.55rem', color: 'var(--coffee-900)' }}>
              Curva de Contribución Acumulada por Cliente Nuevo (Mes 0 a Mes 12)
            </h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th className="num">Actividad Suelto (85%)</th>
                    <th className="num">Actividad Suscriptor (15%)</th>
                    <th className="num">Contribución del Mes ($)</th>
                    <th className="num">Contribución Acumulada Neta ($)</th>
                    <th>Estado de Recuperación</th>
                  </tr>
                </thead>
                <tbody>
                  {liveRes.curvaAcumulada.map((acum, m) => {
                    const isPaybackMonth = liveRes.payback === m && m > 0;
                    const neg = acum < -1e-9;
                    return (
                      <tr
                        key={m}
                        className={isPaybackMonth ? 'row-winner' : neg && m === 12 ? 'row-violation' : ''}
                      >
                        <td>
                          <strong>{m === 0 ? 'Mes 0 (Adquisición)' : `Mes ${m}`}</strong>
                        </td>
                        <td className="num">
                          {m === 0 ? '0,00 (Sin compras)' : fmtNum(liveRes.actSuelto[m - 1], 3)}
                        </td>
                        <td className="num">
                          {m === 0 ? '0,00 (Sin compras)' : fmtNum(liveRes.actSusc[m - 1], 4)}
                        </td>
                        <td className="num">
                          {m === 0
                            ? liveRes.cacReal !== null
                              ? fmtUSD(-liveRes.cacReal, 4)
                              : '$0,00'
                            : fmtUSD(liveRes.curvaMensual[m], 4)}
                        </td>
                        <td
                          className="num"
                          style={{
                            fontWeight: 700,
                            color: neg ? 'var(--red)' : 'var(--green)'
                          }}
                        >
                          {fmtUSD(acum, 4)}
                        </td>
                        <td>
                          {m === 0 ? (
                            <span className="badge-danger">Desembolso inicial (-CAC)</span>
                          ) : isPaybackMonth ? (
                            <span className="badge-ok">★ Mes de Payback (Cruza $0)</span>
                          ) : neg ? (
                            <span className="badge-warn">Aún bajo cero</span>
                          ) : (
                            <span className="badge-ok">CAC recuperado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verificación Manual Explícita del Nivel 1 */}
          <div className="info-box" style={{ borderLeft: '5px solid var(--terracotta)' }}>
            <h4>Verificación Manual de Referencia (Nivel 1)</h4>
            <ul>
              <li>
                <strong>CAC real actual verificado manualmente:</strong>{' '}
                <code>($8.000 + $1.000) / 165 = $54,54545 por cliente nuevo</code>.
              </li>
              <li>
                <strong>Suma de actividad esperada del suscriptor (Meses 1 a 12):</strong>{' '}
                <code>SUM(0,91^i, i=0..11) = 7,528050139848837 pagos</code>.
              </li>
              <li>
                <strong>LTV promedio ponderado actual (Meses 1 a 12):</strong>{' '}
                <code>0,85 × (3 × $15,89) + 0,15 × (7,52805014 × $12,643) = $54,7960706877</code> (recupera en el <strong>Mes 12</strong>; con Meta en <code>$4.000</code> el CAC baja a <code>$50,00</code> y recupera en el <strong>Mes 11</strong>).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
