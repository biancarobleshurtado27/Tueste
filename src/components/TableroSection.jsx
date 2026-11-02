import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import {
  META_HISTORY,
  PRESETS_12M,
  computeScenario,
  fmtUSD,
  fmtNum,
  fmtPct,
  fmtRoas
} from '../../shared/tuesteModel.js';
import { PresetBar12M, Controls12MPanel } from './Controls12MPanel.jsx';

export function TableroSection({
  params12m,
  liveRes,
  activePresetKey,
  onSelectPreset,
  onRestore,
  onChangeParam
}) {
  const refCurva = useRef(null);
  const refLtvCac = useRef(null);
  const refHistorial = useRef(null);
  const refTrampa = useRef(null);

  const refScenarios = {
    actual: computeScenario(PRESETS_12M.actual),
    agencia: computeScenario(PRESETS_12M.agencia),
    cambio1: computeScenario(PRESETS_12M.cambio1),
    cambio2: computeScenario(PRESETS_12M.cambio2),
    combinado: computeScenario(PRESETS_12M.combinado)
  };

  useEffect(() => {
    const instances = [];

    // 1. Gráfico Curva Acumulada (Mes 0 a 12)
    if (refCurva.current) {
      const labelsMeses = Array.from({ length: 13 }, (_, i) => `Mes ${i}`);
      const lineaCero = Array(13).fill(0);
      instances.push(
        new Chart(refCurva.current.getContext('2d'), {
          type: 'line',
          data: {
            labels: labelsMeses,
            datasets: [
              {
                label: 'Tu Escenario en Vivo',
                data: liveRes.curvaAcumulada,
                borderColor: '#C85A32',
                backgroundColor: 'rgba(200, 90, 50, 0.12)',
                borderWidth: 3.5,
                pointRadius: 4,
                tension: 0.15
              },
              {
                label: 'Actual ($8.000)',
                data: refScenarios.actual.curvaAcumulada,
                borderColor: '#3B2318',
                borderWidth: 2,
                borderDash: [4, 3],
                pointRadius: 2.5,
                tension: 0.15
              },
              {
                label: 'Agencia ($16.000 + 30% BF)',
                data: refScenarios.agencia.curvaAcumulada,
                borderColor: '#B8332A',
                borderWidth: 2,
                pointRadius: 2.5,
                tension: 0.15
              },
              {
                label: 'Combinado ($4k + Pack/Envío)',
                data: refScenarios.combinado.curvaAcumulada,
                borderColor: '#2E6F40',
                borderWidth: 2,
                pointRadius: 2.5,
                tension: 0.15
              },
              {
                label: 'Línea Cero (Equilibrio CAC)',
                data: lineaCero,
                borderColor: '#666666',
                borderWidth: 1.5,
                borderDash: [6, 4],
                pointRadius: 0,
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
              tooltip: {
                callbacks: {
                  label: ctx => `${ctx.dataset.label}: ${fmtUSD(ctx.parsed.y, 2)}`
                }
              }
            },
            scales: {
              y: {
                title: { display: true, text: 'Acumulado Neto por Cliente ($)' },
                ticks: { callback: v => '$' + v }
              }
            }
          }
        })
      );
    }

    // 2. Gráfico LTV frente a CAC con límites dinámicos
    if (refLtvCac.current) {
      const allScenariosForBounds = [
        refScenarios.actual,
        refScenarios.agencia,
        refScenarios.cambio1,
        refScenarios.cambio2,
        refScenarios.combinado
      ];
      if (liveRes.cacReal !== null) {
        allScenariosForBounds.push(liveRes);
      }

      const maxPointCac = Math.max(...allScenariosForBounds.map(s => s.cacReal || 0), 75);
      const maxPointLtv = Math.max(...allScenariosForBounds.map(s => s.ltvPond || 0), 100);
      const minPointLtv = Math.min(0, ...allScenariosForBounds.map(s => s.ltvPond || 0));

      const maxCacAxis = Math.ceil(maxPointCac * 1.15);
      const maxYAxis = Math.ceil(Math.max(maxPointLtv * 1.15, maxCacAxis * 3.05));
      const minYAxis = minPointLtv < 0 ? Math.floor(minPointLtv * 1.15) : 0;

      instances.push(
        new Chart(refLtvCac.current.getContext('2d'), {
          type: 'scatter',
          data: {
            datasets: [
              {
                label: 'Tu Escenario en Vivo',
                data: liveRes.cacReal !== null ? [{ x: liveRes.cacReal, y: liveRes.ltvPond }] : [],
                backgroundColor: '#C85A32',
                borderColor: '#24150E',
                borderWidth: 2,
                pointRadius: 9
              },
              {
                label: 'Actual ($8k)',
                data: [{ x: refScenarios.actual.cacReal, y: refScenarios.actual.ltvPond }],
                backgroundColor: '#3B2318',
                pointRadius: 6
              },
              {
                label: 'Agencia ($16k + BF)',
                data: [{ x: refScenarios.agencia.cacReal, y: refScenarios.agencia.ltvPond }],
                backgroundColor: '#B8332A',
                pointRadius: 6
              },
              {
                label: 'Cambio 1 ($4k)',
                data: [{ x: refScenarios.cambio1.cacReal, y: refScenarios.cambio1.ltvPond }],
                backgroundColor: '#D9822B',
                pointRadius: 6
              },
              {
                label: 'Cambio 2 ($8k + Pack)',
                data: [{ x: refScenarios.cambio2.cacReal, y: refScenarios.cambio2.ltvPond }],
                backgroundColor: '#7D5642',
                pointRadius: 6
              },
              {
                label: 'Combinado ($4k + Pack)',
                data: [{ x: refScenarios.combinado.cacReal, y: refScenarios.combinado.ltvPond }],
                backgroundColor: '#2E6F40',
                pointRadius: 6
              },
              {
                label: 'Umbral LTV = 1×CAC (Mínimo)',
                type: 'line',
                data: [{ x: 0, y: 0 }, { x: maxCacAxis, y: maxCacAxis }],
                borderColor: '#B8332A',
                borderWidth: 1.8,
                borderDash: [5, 4],
                pointRadius: 0,
                fill: false
              },
              {
                label: 'Umbral LTV = 3×CAC (Verde)',
                type: 'line',
                data: [{ x: 0, y: 0 }, { x: maxCacAxis, y: maxCacAxis * 3 }],
                borderColor: '#2E6F40',
                borderWidth: 1.8,
                borderDash: [5, 4],
                pointRadius: 0,
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
              tooltip: {
                callbacks: {
                  label: ctx => `${ctx.dataset.label}: CAC ${fmtUSD(ctx.parsed.x, 2)} | LTV ${fmtUSD(ctx.parsed.y, 2)}`
                }
              }
            },
            scales: {
              x: {
                min: 0,
                max: maxCacAxis,
                title: { display: true, text: 'CAC Real por Cliente ($)' },
                ticks: { callback: v => '$' + v }
              },
              y: {
                min: minYAxis,
                max: maxYAxis,
                title: { display: true, text: 'LTV Contribución 12M ($)' },
                ticks: { callback: v => '$' + v }
              }
            }
          }
        })
      );
    }

    // 3. Gráfico Historial de Clientes Nuevos y CAC Marginal por Tramo
    if (refHistorial.current) {
      const labelsHist = ['$0', '$4.000', '$8.000', '$12.000', '$16.000', '$20.000'];
      const dataClientesHist = META_HISTORY.map(p => p.clientes);
      const dataCacMargHist = [null, 40.0, 4000 / 65, 4000 / 45, 4000 / 25, 4000 / 15];

      instances.push(
        new Chart(refHistorial.current.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labelsHist,
            datasets: [
              {
                type: 'line',
                label: 'Clientes Nuevos de Meta (Curva Histórica)',
                data: dataClientesHist,
                borderColor: '#3B2318',
                backgroundColor: '#3B2318',
                borderWidth: 3,
                pointRadius: 5,
                yAxisID: 'yClientes'
              },
              {
                type: 'bar',
                label: 'CAC Marginal del Tramo ($/cliente extra)',
                data: dataCacMargHist,
                backgroundColor: 'rgba(200, 90, 50, 0.75)',
                borderColor: '#A64420',
                borderWidth: 1,
                yAxisID: 'yCacMarg'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            },
            scales: {
              yClientes: {
                type: 'linear',
                position: 'left',
                min: 0,
                max: 280,
                title: { display: true, text: 'Clientes Nuevos Reales' }
              },
              yCacMarg: {
                type: 'linear',
                position: 'right',
                min: 0,
                max: 300,
                grid: { drawOnChartArea: false },
                title: { display: true, text: 'CAC Marginal ($)' },
                ticks: { callback: v => '$' + v }
              }
            }
          }
        })
      );
    }

    // 4. Gráfico La Trampa: ROAS Meta 3,0 vs ROAS Equilibrio y ROAS 1er Pedido (usa null cuando no aplica)
    if (refTrampa.current) {
      const valRoasMeta = 3.0;
      const valRoasEq = liveRes.roasEqPondM1;
      const valRoas1er = liveRes.roas1erPedido;
      const maxRoasForScale = Math.max(3.6, (valRoasEq || 0) * 1.15, (valRoas1er || 0) * 1.15);

      instances.push(
        new Chart(refTrampa.current.getContext('2d'), {
          type: 'bar',
          data: {
            labels: [
              'ROAS Reportado por Meta (Sept.)',
              valRoasEq !== null ? 'ROAS de Equilibrio Ponderado (Break-even)' : 'ROAS de Equilibrio (No alcanzable)',
              valRoas1er !== null ? 'ROAS Real del 1er Pedido (Adquisición)' : 'ROAS Real del 1er Pedido (No aplica)'
            ],
            datasets: [
              {
                label: 'ROAS (Veces sobre inversión publicitaria)',
                data: [valRoasMeta, valRoasEq, valRoas1er],
                backgroundColor: ['#7D5642', '#D9822B', '#B8332A'],
                borderColor: ['#3B2318', '#A65B12', '#7A1C16'],
                borderWidth: 1.5,
                borderRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx =>
                    ctx.parsed.y === null
                      ? 'No aplicable / No alcanzable'
                      : `${fmtNum(ctx.parsed.y, 2)}x`
                }
              }
            },
            scales: {
              y: {
                min: 0,
                max: maxRoasForScale,
                title: { display: true, text: 'ROAS (x)' },
                ticks: { callback: v => fmtNum(v, 1) + 'x' }
              }
            }
          }
        })
      );
    }

    return () => {
      instances.forEach(inst => inst.destroy());
    };
  }, [liveRes]);

  // Semáforo LTV:CAC
  let semClass = 'neutral';
  let semTitulo = 'Semáforo LTV:CAC — NO APLICA (Inversión $0 en Meta Ads)';
  let semDesc =
    'Sin inversión en Meta Ads no hay clientes adquiridos por pauta ni CAC aplicable. Nota: el negocio aún debe cubrir $6.500/mes de costos fijos.';

  if (liveRes.ltvCac !== null) {
    if (liveRes.ltvCac < 1.0) {
      semClass = 'red';
      semTitulo = `Semáforo LTV:CAC — ROJO (${fmtNum(liveRes.ltvCac, 2)}x < 1,0x): Destruye valor en 12 meses`;
      semDesc = `Cada cliente cuesta ${fmtUSD(liveRes.cacReal, 2)} y solo genera ${fmtUSD(liveRes.ltvPond, 2)} de contribución en 12 meses (${fmtUSD(liveRes.netoPorCliente, 2)}/cliente). No recupera el CAC en 12 meses.`;
    } else if (liveRes.ltvCac < 3.0) {
      semClass = 'yellow';
      semTitulo = `Semáforo LTV:CAC — AMARILLO (${fmtNum(liveRes.ltvCac, 2)}x: entre 1,0x y menos de 3,0x)`;
      semDesc = `Recupera el CAC en el ${liveRes.paybackLabel} (${fmtUSD(liveRes.netoPorCliente, 2)} netos por cliente a 12M). Recuerda: este semáforo no garantiza caja suficiente ni beneficio después de costos fijos ($6.500/mes).`;
    } else {
      semClass = 'green';
      semTitulo = `Semáforo LTV:CAC — VERDE (${fmtNum(liveRes.ltvCac, 2)}x >= 3,0x): Adquisición saludable`;
      semDesc = `Supera el umbral de 3,0x y recupera en el ${liveRes.paybackLabel}. Aun así, verifica siempre la liquidez mensual porque el ratio LTV:CAC no descuenta costos fijos de la empresa.`;
    }
  }

  // Filas de la tabla comparativa
  const comparisonCols = [
    refScenarios.actual,
    refScenarios.agencia,
    refScenarios.cambio1,
    refScenarios.cambio2,
    refScenarios.combinado,
    liveRes
  ];

  const rowsSpec = [
    { label: 'Inversión mensual en Meta Ads ($)', fn: s => fmtUSD(s.inv, 0) },
    { label: 'Fee mensual de agencia ($)', fn: s => fmtUSD(s.feeEfectivo, 0) },
    { label: 'Clientes nuevos reales de Meta', fn: s => fmtNum(s.clientesNuevos, 1) },
    {
      label: 'Contribución 1er pedido — Suelto ($ / %)',
      fn: s => `${fmtUSD(s.contribSueltoM1, 2)} (${fmtPct(s.pctContribSueltoM1, 1)})`
    },
    {
      label: 'Contribución mensual — Suscripción ($ / %)',
      fn: s => `${fmtUSD(s.contribSusc, 3)} (${fmtPct(s.pctContribSusc, 1)})`
    },
    {
      label: 'ROAS de equilibrio — Suelto / Suscripción',
      fn: s => `${fmtRoas(s.roasEqSueltoM1)} / ${fmtRoas(s.roasEqSusc)}`
    },
    { label: 'ROAS de equilibrio ponderado (1er pedido)', fn: s => fmtRoas(s.roasEqPondM1) },
    {
      label: 'ROAS real del 1er pedido (Adquisición)',
      fn: s => (s.roas1erPedido !== null ? fmtRoas(s.roas1erPedido, 'No aplica') : 'No aplica')
    },
    { label: 'CAC de anuncios ($)', fn: s => (s.cacAnuncios !== null ? fmtUSD(s.cacAnuncios, 2) : 'No aplica') },
    { label: 'CAC real (con agencia) ($)', fn: s => (s.cacReal !== null ? fmtUSD(s.cacReal, 2) : 'No aplica') },
    {
      label: 'CAC marginal del tramo histórico ($)',
      fn: s => (s.margTramo.val !== null ? fmtUSD(s.margTramo.val, 2) : 'No aplica')
    },
    {
      label: 'CAC incremental vs. base $8.000 ($)',
      fn: s => (s.cacIncremental !== null ? fmtUSD(s.cacIncremental, 2) : 'No aplica')
    },
    { label: 'LTV Contribución 12M — Suelto ($)', fn: s => fmtUSD(s.ltvSuelto, 2) },
    { label: 'LTV Contribución 12M — Suscriptor ($)', fn: s => fmtUSD(s.ltvSusc, 2) },
    { label: 'LTV Contribución 12M — Ponderado ($)', fn: s => fmtUSD(s.ltvPond, 4) },
    { label: 'Ratio LTV:CAC (con CAC real)', fn: s => (s.ltvCac !== null ? `${fmtNum(s.ltvCac, 2)}x` : 'No aplica') },
    { label: 'Payback (Mes discreto de recuperación)', fn: s => s.paybackLabel },
    {
      label: 'Contribución neta cohorte a 12M (LTV - CAC) ($)',
      fn: s => (s.netoPorCliente !== null ? fmtUSD(s.netoCohorte, 2) : 'No aplica')
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }} id="seccion-tablero">
      {/* 2.1 Diagnóstico */}
      <section className="section-block">
        <div className="section-header">
          <div>
            <span className="section-step">Sección 2 · Diagnóstico del Caso</span>
            <h2 className="section-title">¿Los anuncios venden o dejan dinero?</h2>
            <p className="section-subtitle">
              En septiembre, Meta Ads reportó un ROAS de 3,0x ($24.000 en compras sobre $8.000 invertidos), pero Tueste cerró el mes con <strong>$3.200 menos en el banco</strong> que en agosto. Estas son las claves para entender el problema (Págs. 2 a 5 del PDF).
            </p>
          </div>
        </div>

        <div className="diag-grid">
          <div className="diag-card alert">
            <h3>1. La trampa de atribución de Meta</h3>
            <div className="big-num">706 vs. 165</div>
            <p>
              Meta se adjudicó <strong>706 compras ($24.000)</strong> porque incluye campañas de retargeting que alcanzan a visitantes recientes de la web (<em>RTG_Visitantes_30d</em>) y a compradores anteriores (<em>RTG_Compradores_180d</em>), además de atribución por vista de 1 día sin clic. En realidad, por Meta llegaron solo <strong>165 clientes nuevos</strong> (Pág. 4).
            </p>
          </div>

          <div className="diag-card">
            <h3>2. Ventas no son contribución</h3>
            <div className="big-num">$15,89 / $34</div>
            <p>
              De un pedido suelto de 2 bolsas (<strong>$34,00</strong>), Tueste paga $10,88 de café, $4,50 de envío, $1,20 de empaque y $1,53 de pasarela (4,5%). Quedan <strong>$15,89 de contribución (46,74%)</strong>. En suscripción ($30,60) quedan <strong>$12,643 (41,32%)</strong> (Pág. 3).
            </p>
          </div>

          <div className="diag-card">
            <h3>3. El primer pedido no paga el CAC</h3>
            <div className="big-num">$15,40 vs. $54,55</div>
            <p>
              Con $8.000 en Meta + $1.000 de agencia para 165 clientes nuevos, el <strong>CAC real es $54,55</strong>. En su primer mes un cliente promedio deja <strong>$15,40 de contribución</strong>: cada cliente nuevo abre un hueco inicial de caja de <strong>-$39,14</strong> que tarda <strong>12 meses</strong> en empatarse.
            </p>
          </div>

          <div className="diag-card danger">
            <h3>4. Por qué duplicar a $16.000 + 30% BF falla</h3>
            <div className="big-num">-$25,82 / cliente</div>
            <p>
              Subir de $8.000 a $16.000 solo trae <strong>70 clientes extra</strong> (de 165 a 235: cada cliente adicional cuesta <strong>$114,29</strong> en anuncios) y el 30% de descuento baja la contribución del 1er pedido suelto a <strong>$6,149</strong>. El LTV ($46,52) queda debajo del CAC real ($72,34).
            </p>
          </div>
        </div>
      </section>

      {/* 2.2 Laboratorio y Gráficos */}
      <section className="section-block">
        <div className="section-header">
          <div>
            <span className="section-step">Sección 2 · Tablero Interactivo de Decisiones (Nivel 2)</span>
            <h2 className="section-title">Laboratorio de Adquisición, Precios y Retención</h2>
            <p className="section-subtitle">
              Experimenta con los controles o selecciona un escenario de referencia. Todos los indicadores y los 4 gráficos se actualizan al instante.
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
            <div className={`semaforo-banner ${semClass}`} id="tableroSemaforoBanner">
              <div className="semaforo-indicator">
                <div className="semaforo-dot" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.02rem' }}>{semTitulo}</div>
                  <div style={{ fontSize: '0.84rem' }}>{semDesc}</div>
                </div>
              </div>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-label">Contribución 1er Pedido Suelto</div>
                <div className="kpi-val">{fmtUSD(liveRes.contribSueltoM1, 2)}</div>
                <div className="kpi-sub">
                  {fmtPct(liveRes.pctContribSueltoM1, 2)} del cobro ({fmtUSD(liveRes.cobroSueltoM1, 2)})
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">Contribución Suscripción (Mes)</div>
                <div className="kpi-val">{fmtUSD(liveRes.contribSusc, 3)}</div>
                <div className="kpi-sub">
                  {fmtPct(liveRes.pctContribSusc, 2)} del cobro ({fmtUSD(liveRes.cobroSusc, 2)})
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">ROAS de Equilibrio (Break-even)</div>
                <div className="kpi-val">{fmtRoas(liveRes.roasEqPondM1, 'No alcanzable')}</div>
                <div className="kpi-sub">
                  Suelto: {fmtRoas(liveRes.roasEqSueltoM1, 'No alcanzable')} · Suscr.:{' '}
                  {fmtRoas(liveRes.roasEqSusc, 'No alcanzable')}
                </div>
              </div>

              <div className="kpi-card highlight">
                <div className="kpi-label">CAC Real (con Agencia)</div>
                <div className="kpi-val">
                  {liveRes.cacReal !== null ? fmtUSD(liveRes.cacReal, 2) : 'No aplica'}
                </div>
                <div className="kpi-sub">
                  {liveRes.cacAnuncios !== null
                    ? `CAC Anuncios: ${fmtUSD(liveRes.cacAnuncios, 2)} · ${fmtNum(liveRes.clientesNuevos, 1)} clientes`
                    : 'Sin inversión ni clientes de Meta'}
                </div>
              </div>

              <div className="kpi-card highlight">
                <div className="kpi-label">LTV Contribución (12 Meses)</div>
                <div className="kpi-val">{fmtUSD(liveRes.ltvPond, 2)}</div>
                <div className="kpi-sub">
                  Suelto: {fmtUSD(liveRes.ltvSuelto, 2)} · Suscr.: {fmtUSD(liveRes.ltvSusc, 2)}
                </div>
              </div>

              <div
                className={`kpi-card ${
                  liveRes.netoPorCliente !== null && liveRes.netoPorCliente < 0
                    ? 'loss'
                    : liveRes.ltvCac !== null && liveRes.ltvCac >= 3.0
                    ? 'gain'
                    : 'highlight'
                }`}
              >
                <div className="kpi-label">Ratio LTV:CAC y Payback</div>
                <div className="kpi-val">
                  {liveRes.ltvCac !== null
                    ? `${fmtNum(liveRes.ltvCac, 2)}x · ${liveRes.paybackLabel}`
                    : 'No aplica · No aplica'}
                </div>
                <div className="kpi-sub">
                  {liveRes.netoPorCliente !== null
                    ? `Neto 12M: ${fmtUSD(liveRes.netoPorCliente, 2)}/cli (${fmtUSD(liveRes.netoCohorte, 2)} cohorte)`
                    : 'Sin cohorte adquirida por Meta'}
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">ROAS Real del 1er Pedido</div>
                <div className="kpi-val">
                  {liveRes.roas1erPedido !== null
                    ? fmtRoas(liveRes.roas1erPedido, 'No aplica')
                    : 'No aplica'}
                </div>
                <div className="kpi-sub">
                  Ingreso 1er pedido: {fmtUSD(liveRes.ingresoPondM1, 2)}/cliente
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">CAC Marginal del Tramo Histórico</div>
                <div className="kpi-val">
                  {liveRes.margTramo.val !== null ? fmtUSD(liveRes.margTramo.val, 2) : 'No aplica'}
                </div>
                <div className="kpi-sub">{liveRes.margTramo.label}</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-label">CAC Incremental vs. Base ($8.000)</div>
                <div className="kpi-val">
                  {liveRes.cacIncremental !== null ? fmtUSD(liveRes.cacIncremental, 2) : 'No aplica'}
                </div>
                <div className="kpi-sub">{liveRes.cacIncrementalLabel}</div>
              </div>
            </div>

            {/* Los 4 Gráficos */}
            <div className="charts-grid">
              <div className="chart-card">
                <h4>1. Curva de Caja Acumulada de un Cliente (Mes 0 a Mes 12)</h4>
                <p className="chart-caption">
                  El Mes 0 muestra exclusivamente el desembolso de adquisición (-CAC real). El Payback ocurre en el primer mes donde la curva cruza la línea cero.
                </p>
                <div className="canvas-wrap">
                  <canvas ref={refCurva} />
                </div>
              </div>

              <div className="chart-card">
                <h4>2. LTV a 12 Meses frente a CAC Real (Umbrales 1:1 y 3:1)</h4>
                <p className="chart-caption">
                  Debajo de la línea roja (LTV = CAC) se pierde dinero en 12 meses. Entre la línea roja y la verde (LTV = 3×CAC) es zona amarilla.
                </p>
                <div className="canvas-wrap">
                  <canvas ref={refLtvCac} />
                </div>
              </div>

              <div className="chart-card">
                <h4>3. Clientes Nuevos según Inversión y CAC Marginal por Tramo</h4>
                <p className="chart-caption">
                  Rendimientos decrecientes del historial (Pág. 5): cada tramo de $4.000 trae menos clientes adicionales y dispara el CAC marginal.
                </p>
                <div className="canvas-wrap">
                  <canvas ref={refHistorial} />
                </div>
              </div>

              <div className="chart-card">
                <h4>4. La Trampa a la Vista: ROAS Meta (3,0x) vs. ROAS 1er Pedido y Break-even</h4>
                <p className="chart-caption">
                  El ROAS de Meta (3,0x) incluye campañas de retargeting a visitantes (<em>RTG_Visitantes_30d</em>) y compradores anteriores (<em>RTG_Compradores_180d</em>), mientras que el ROAS del 1er pedido cuenta solo la primera compra de clientes nuevos.
                </p>
                {(liveRes.roasEqPondM1 === null || liveRes.roas1erPedido === null) && (
                  <div
                    style={{
                      background: 'var(--amber-soft)',
                      border: '1px solid var(--amber)',
                      color: '#6B3D08',
                      padding: '0.5rem 0.7rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    {liveRes.roasEqPondM1 === null && (
                      <div>
                        • ROAS de Equilibrio Ponderado = "No alcanzable" (valor nulo, no es 0x): la contribución ponderada del 1er pedido es ≤ $0.
                      </div>
                    )}
                    {liveRes.roas1erPedido === null && (
                      <div>
                        • ROAS Real del 1er Pedido = "No aplica" (valor nulo, no es 0x): la inversión en Meta Ads es $0.
                      </div>
                    )}
                  </div>
                )}
                <div className="canvas-wrap">
                  <canvas ref={refTrampa} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.3 Tabla Comparativa de Escenarios */}
      <section className="section-block">
        <div className="section-header">
          <div>
            <span className="section-step">Comparación Lado a Lado</span>
            <h2 className="section-title">Escenarios Fijos de Referencia vs. Tu Escenario de Trabajo</h2>
            <p className="section-subtitle">
              Los 5 escenarios originales permanecen fijos con los datos del caso para comparar contra tu escenario activo en la última columna.
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Indicador / Métrica</th>
                <th className="num">Actual ($8.000)</th>
                <th className="num">Agencia ($16.000 + 30% BF)</th>
                <th className="num">Cambio 1 Solo (Meta $4.000)</th>
                <th className="num">Cambio 2 Solo (Pack + Envío, $8k)</th>
                <th className="num">Combinado ($4k + Pack/Envío)</th>
                <th className="num live-col">Tu Escenario en Vivo</th>
              </tr>
            </thead>
            <tbody>
              {rowsSpec.map((r, i) => (
                <tr key={i}>
                  <td>
                    <strong>{r.label}</strong>
                  </td>
                  {comparisonCols.map((sc, idx) => (
                    <td key={idx} className={idx === 5 ? 'num live-col' : 'num'}>
                      {r.fn(sc)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
