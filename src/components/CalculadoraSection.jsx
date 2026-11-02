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
import {
  PresetBar12M,
  Controls12MPanel,
  ResultsHeaderBand12M,
  TermHelp
} from './Controls12MPanel.jsx';

export function CalculadoraSection({
  params12m,
  liveRes,
  activePresetKey,
  lastPresetKey,
  activeSavedName,
  onSelectPreset,
  onRestore,
  onChangeParam
}) {
  return (
    <section className="notebook-section" id="seccion-calculadora">
      <div className="notebook-header">
        <div>
          <span className="notebook-kicker">Cuaderno de cuentas · Economía por cliente</span>
          <h2 className="notebook-title">Calculadora de contribución y recuperación (12 meses)</h2>
          <p className="notebook-subtitle">
            Revisa cuánto dinero limpio deja cada pedido después de café, empaque, envío y pasarela, cuánto cuesta adquirir un cliente nuevo y en qué mes se recupera esa inversión.
          </p>
        </div>
      </div>

      <PresetBar12M
        params12m={params12m}
        activePresetKey={activePresetKey}
        lastPresetKey={lastPresetKey}
        activeSavedName={activeSavedName}
        onSelectPreset={onSelectPreset}
        onRestore={onRestore}
      />

      <div className="workspace-grid">
        <Controls12MPanel
          params12m={params12m}
          liveRes={liveRes}
          onChangeParam={onChangeParam}
        />

        <div className="results-column">
          <ResultsHeaderBand12M liveRes={liveRes} idPrefix="calc" />

          {/* Indicadores secundarios en filas compactas */}
          <div className="secondary-ledger">
            <div className="secondary-ledger-title">
              Indicadores de pedido y eficiencia publicitaria (por cliente)
            </div>
            <div className="ledger-rows">
              <div className="ledger-row">
                <span className="ledger-key">Contribución 1er pedido suelto</span>
                <span className="ledger-val">
                  {fmtUSD(liveRes.contribSueltoM1, 2)} ({fmtPct(liveRes.pctContribSueltoM1, 1)})
                </span>
              </div>
              <div className="ledger-row">
                <span className="ledger-key">Contribución mensual suscripción</span>
                <span className="ledger-val">
                  {fmtUSD(liveRes.contribSusc, 3)} ({fmtPct(liveRes.pctContribSusc, 1)})
                </span>
              </div>
              <div className="ledger-row">
                <span className="ledger-key">
                  ROAS de equilibrio en 1er pedido <TermHelp term="ROAS" />
                </span>
                <span className="ledger-val">
                  {fmtRoas(liveRes.roasEqPondM1, 'No alcanzable')}
                </span>
              </div>
              <div className="ledger-row">
                <span className="ledger-key">ROAS real del 1er pedido (clientes nuevos)</span>
                <span className="ledger-val">
                  {liveRes.roas1erPedido !== null
                    ? fmtRoas(liveRes.roas1erPedido, 'No aplica')
                    : 'No aplica'}
                </span>
              </div>
              <div className="ledger-row">
                <span className="ledger-key">Costo por cliente extra del tramo</span>
                <span className="ledger-val">
                  {liveRes.margTramo.val !== null ? fmtUSD(liveRes.margTramo.val, 2) : 'No aplica'}
                </span>
              </div>
              <div className="ledger-row">
                <span className="ledger-key">Costo incremental frente a $8.000</span>
                <span className="ledger-val">
                  {liveRes.cacIncremental !== null ? fmtUSD(liveRes.cacIncremental, 2) : 'No aplica'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de desglose de cada pedido */}
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.02rem',
                marginBottom: '0.5rem',
                color: 'var(--ink)'
              }}
            >
              Desglose de cada pedido: de lo cobrado a la contribución neta
            </h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Concepto por pedido</th>
                    <th className="num">1er pedido suelto (Mes 1)</th>
                    <th className="num">Recompra suelta (M2–M12)</th>
                    <th className="num">Suscripción mensual (-10%)</th>
                    <th className="num">Pack 3 bolsas ($48)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Cobrado al cliente ($)</strong></td>
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
                    <td>Comisión de pasarela ({fmtNum(PASARELA_RATE * 100, 1)}%)</td>
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
                    <td>Café tostado y empaque ($)</td>
                    <td className="num">
                      {params12m.polPack
                        ? `Mezcla (${fmtNum(100 - params12m.adopcionPack, 0)}% 2B / ${fmtNum(
                            params12m.adopcionPack,
                            0
                          )}% Pack)`
                        : `-${fmtUSD(liveRes.cafe2B + EMPAQUE_2B, 2)}`}
                    </td>
                    <td className="num">-{fmtUSD(liveRes.cafe2B + EMPAQUE_2B, 2)}</td>
                    <td className="num">-{fmtUSD(liveRes.cafe2B + EMPAQUE_2B, 2)}</td>
                    <td className="num">-{fmtUSD(3 * params12m.costoCafe + EMPAQUE_3B, 2)}</td>
                  </tr>
                  <tr>
                    <td>Envío pagado por Tueste ($)</td>
                    <td className="num">-{fmtUSD(params12m.costoEnvio, 2)}</td>
                    <td className="num">-{fmtUSD(params12m.costoEnvio, 2)}</td>
                    <td className="num">-{fmtUSD(params12m.costoEnvio, 2)}</td>
                    <td className="num">-{fmtUSD(params12m.costoEnvio, 2)}</td>
                  </tr>
                  <tr className={liveRes.contribSueltoM1 < 0 ? 'row-violation' : ''}>
                    <td><strong>Contribución limpia por pedido ($)</strong></td>
                    <td className="num"><strong>{fmtUSD(liveRes.contribSueltoM1, 4)}</strong></td>
                    <td className="num"><strong>{fmtUSD(liveRes.contribSueltoRecompra, 4)}</strong></td>
                    <td className="num"><strong>{fmtUSD(liveRes.contribSusc, 4)}</strong></td>
                    <td className="num"><strong>{fmtUSD(liveRes.contribPack, 4)}</strong></td>
                  </tr>
                  <tr>
                    <td>Margen sobre cobro (%) · ROAS de equilibrio</td>
                    <td className="num">
                      {fmtPct(liveRes.pctContribSueltoM1, 2)} ({fmtRoas(liveRes.roasEqSueltoM1)})
                    </td>
                    <td className="num">—</td>
                    <td className="num">
                      {fmtPct(liveRes.pctContribSusc, 2)} ({fmtRoas(liveRes.roasEqSusc)})
                    </td>
                    <td className="num">{fmtPct(liveRes.contribPack / PRECIO_PACK_3B, 2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Desplegable: Ver la cuenta mes a mes (Mes 0 a Mes 12) */}
          <details className="notebook-details">
            <summary>Ver la cuenta: curva acumulada por cliente nuevo (Mes 0 a Mes 12)</summary>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th className="num">Actividad suelto (85%)</th>
                    <th className="num">Actividad suscriptor (15%)</th>
                    <th className="num">Aporte del mes ($/cliente)</th>
                    <th className="num">Saldo acumulado ($/cliente)</th>
                    <th>Estado</th>
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
                          {m === 0 ? '0,00' : fmtNum(liveRes.actSuelto[m - 1], 3)}
                        </td>
                        <td className="num">
                          {m === 0 ? '0,00' : fmtNum(liveRes.actSusc[m - 1], 4)}
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
                            <span className="status-tag danger">[—] Desembolso inicial (-CAC)</span>
                          ) : isPaybackMonth ? (
                            <span className="status-tag ok">[OK] Mes de recuperación (cruza $0)</span>
                          ) : neg ? (
                            <span className="status-tag warn">[!] Aún por recuperar</span>
                          ) : (
                            <span className="status-tag ok">[OK] Adquisición recuperada</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>

          {/* Nota de supuestos y fuentes */}
          <div className="info-columns">
            <div className="info-box">
              <h4>Datos del caso frente a supuestos comerciales</h4>
              <ul>
                <li>
                  <strong>Datos originales del caso:</strong> bolsa a $17 (pedido típico de 2 bolsas = $34), café $5,44/bolsa, empaque $1,20, envío $4,50, pasarela 4,5%, suscripción $30,60/mes, 85% compradores sueltos y 15% suscriptores, permanencia 91% mensual y 3 pedidos sueltos al año.
                </li>
                <li>
                  <strong>Supuesto del Pack ($48) y envío ($4,50 bajo $45):</strong> el beneficio del Pack y del cobro de envío <strong>no está garantizado</strong>; asume {fmtNum(params12m.adopcionPack, 0)}% de adopción inicial sin caída en conversión y debe comprobarse en un piloto antes de escalar presupuesto.
                </li>
              </ul>
            </div>

            <div className="info-box">
              <h4>Verificación manual de las cuentas</h4>
              <ul>
                <li>
                  <strong>Costo por cliente actual ($8.000):</strong>{' '}
                  <code>($8.000 + $1.000) / 165 = $54,5455 por cliente</code>.
                </li>
                <li>
                  <strong>Cobros esperados de un suscriptor en 12 meses:</strong>{' '}
                  <code>SUM(0,91^i, i=0..11) = 7,52805 pagos</code>.
                </li>
                <li>
                  <strong>Contribución en 12 meses actual:</strong>{' '}
                  <code>0,85 × (3 × $15,89) + 0,15 × (7,52805 × $12,643) = $54,7961</code> (recupera en el <strong>Mes 12</strong>; con $4.000 en Meta el costo baja a <strong>$50,00</strong> y recupera en el <strong>Mes 11</strong>).
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
