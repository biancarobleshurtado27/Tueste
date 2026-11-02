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
import {
  PresetBar12M,
  Controls12MPanel,
  ResultsHeaderBand12M,
  TermHelp
} from './Controls12MPanel.jsx';

export function TableroSection({
  params12m,
  liveRes,
  activePresetKey,
  lastPresetKey,
  activeSavedName,
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
    const gridColor = '#E6E0D4';
    const tickColor = '#575046';

    // 1. Gráfico Curva Acumulada por cliente (Mes 0 a 12)
    if (refCurva.current) {
      const labelsMeses = Array.from({ length: 13 }, (_, i) => `M${i}`);
      const lineaCero = Array(13).fill(0);
      instances.push(
        new Chart(refCurva.current.getContext('2d'), {
          type: 'line',
          data: {
            labels: labelsMeses,
            datasets: [
              {
                label: 'Activo',
                data: liveRes.curvaAcumulada,
                borderColor: '#B65C3A',
                backgroundColor: 'rgba(182, 92, 58, 0.1)',
                borderWidth: 3,
                pointRadius: 3.5,
                tension: 0.12
              },
              {
                label: 'Actual ($8k)',
                data: refScenarios.actual.curvaAcumulada,
                borderColor: '#29251F',
                borderWidth: 1.8,
                borderDash: [4, 3],
                pointRadius: 2,
                tension: 0.12
              },
              {
                label: 'Agencia ($16k)',
                data: refScenarios.agencia.curvaAcumulada,
                borderColor: '#9E2F28',
                borderWidth: 1.6,
                pointRadius: 2,
                tension: 0.12
              },
              {
                label: 'Combinado ($4k+Pack)',
                data: refScenarios.combinado.curvaAcumulada,
                borderColor: '#566148',
                borderWidth: 1.8,
                pointRadius: 2,
                tension: 0.12
              },
              {
                label: 'Equilibrio ($0)',
                data: lineaCero,
                borderColor: '#29251F',
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
              legend: {
                position: 'bottom',
                labels: { boxWidth: 10, color: tickColor, font: { size: 11 } }
              },
              tooltip: {
                callbacks: {
                  label: ctx => `${ctx.dataset.label}: ${fmtUSD(ctx.parsed.y, 2)} por cliente`
                }
              }
            },
            scales: {
              x: {
                grid: { color: gridColor },
                ticks: { color: tickColor, font: { size: 11 } }
              },
              y: {
                grid: { color: gridColor },
                title: {
                  display: true,
                  text: 'Saldo acumulado por cliente ($)',
                  color: tickColor,
                  font: { size: 11, weight: '600' }
                },
                ticks: { color: tickColor, callback: v => '$' + v }
              }
            }
          }
        })
      );
    }

    // 2. Gráfico Contribución 12M (LTV) frente a Costo por cliente (CAC)
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
                label: 'Activo',
                data: liveRes.cacReal !== null ? [{ x: liveRes.cacReal, y: liveRes.ltvPond }] : [],
                backgroundColor: '#B65C3A',
                borderColor: '#29251F',
                borderWidth: 2,
                pointRadius: 8
              },
              {
                label: 'Actual',
                data: [{ x: refScenarios.actual.cacReal, y: refScenarios.actual.ltvPond }],
                backgroundColor: '#29251F',
                pointRadius: 5.5
              },
              {
                label: 'Agencia',
                data: [{ x: refScenarios.agencia.cacReal, y: refScenarios.agencia.ltvPond }],
                backgroundColor: '#9E2F28',
                pointRadius: 5.5
              },
              {
                label: 'Menor inv.',
                data: [{ x: refScenarios.cambio1.cacReal, y: refScenarios.cambio1.ltvPond }],
                backgroundColor: '#8C5A1B',
                pointRadius: 5.5
              },
              {
                label: 'Pack y envío',
                data: [{ x: refScenarios.cambio2.cacReal, y: refScenarios.cambio2.ltvPond }],
                backgroundColor: '#787065',
                pointRadius: 5.5
              },
              {
                label: 'Combinado',
                data: [{ x: refScenarios.combinado.cacReal, y: refScenarios.combinado.ltvPond }],
                backgroundColor: '#566148',
                pointRadius: 5.5
              },
              {
                label: 'Empate 1:1',
                type: 'line',
                data: [{ x: 0, y: 0 }, { x: maxCacAxis, y: maxCacAxis }],
                borderColor: '#9E2F28',
                borderWidth: 1.5,
                borderDash: [5, 4],
                pointRadius: 0,
                fill: false
              },
              {
                label: 'Ref. 3:1',
                type: 'line',
                data: [{ x: 0, y: 0 }, { x: maxCacAxis, y: maxCacAxis * 3 }],
                borderColor: '#566148',
                borderWidth: 1.5,
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
              legend: {
                position: 'bottom',
                labels: { boxWidth: 10, color: tickColor, font: { size: 11 } }
              },
              tooltip: {
                callbacks: {
                  label: ctx =>
                    `${ctx.dataset.label}: Costo ${fmtUSD(ctx.parsed.x, 2)}/cli | Contribución 12M ${fmtUSD(
                      ctx.parsed.y,
                      2
                    )}/cli`
                }
              }
            },
            scales: {
              x: {
                min: 0,
                max: maxCacAxis,
                grid: { color: gridColor },
                title: {
                  display: true,
                  text: 'Costo por cliente — CAC ($/cliente)',
                  color: tickColor,
                  font: { size: 11, weight: '600' }
                },
                ticks: { color: tickColor, callback: v => '$' + v }
              },
              y: {
                min: minYAxis,
                max: maxYAxis,
                grid: { color: gridColor },
                title: {
                  display: true,
                  text: 'Contribución 12M — LTV ($/cliente)',
                  color: tickColor,
                  font: { size: 11, weight: '600' }
                },
                ticks: { color: tickColor, callback: v => '$' + v }
              }
            }
          }
        })
      );
    }

    // 3. Gráfico Rendimientos decrecientes en Meta (clientes y costo por cliente extra)
    if (refHistorial.current) {
      const labelsHist = ['$0', '$4k', '$8k', '$12k', '$16k', '$20k'];
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
                label: 'Clientes nuevos (total)',
                data: dataClientesHist,
                borderColor: '#29251F',
                backgroundColor: '#29251F',
                borderWidth: 2.5,
                pointRadius: 4,
                yAxisID: 'yClientes'
              },
              {
                type: 'bar',
                label: 'Costo por cliente extra del tramo ($/cliente)',
                data: dataCacMargHist,
                backgroundColor: 'rgba(86, 97, 72, 0.72)',
                borderColor: '#3F4834',
                borderWidth: 1,
                borderRadius: 3,
                yAxisID: 'yCacMarg'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 10, color: tickColor, font: { size: 11 } }
              }
            },
            scales: {
              x: {
                grid: { color: gridColor },
                ticks: { color: tickColor }
              },
              yClientes: {
                type: 'linear',
                position: 'left',
                min: 0,
                max: 280,
                grid: { color: gridColor },
                title: {
                  display: true,
                  text: 'Clientes nuevos al mes',
                  color: tickColor,
                  font: { size: 11, weight: '600' }
                },
                ticks: { color: tickColor }
              },
              yCacMarg: {
                type: 'linear',
                position: 'right',
                min: 0,
                max: 300,
                grid: { drawOnChartArea: false },
                title: {
                  display: true,
                  text: 'Costo marginal ($/cliente)',
                  color: tickColor,
                  font: { size: 11, weight: '600' }
                },
                ticks: { color: tickColor, callback: v => '$' + v }
              }
            }
          }
        })
      );
    }

    // 4. Gráfico ROAS Meta vs Equilibrio y 1er Pedido (usa null cuando no aplica)
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
              'Reportado Meta (3,0x)',
              valRoasEq !== null ? 'Equilibrio 1er pedido' : 'Equilibrio (No alcanzable)',
              valRoas1er !== null ? 'Real 1er pedido nuevo' : 'Real 1er pedido (No aplica)'
            ],
            datasets: [
              {
                label: 'ROAS (veces sobre gasto en anuncios)',
                data: [valRoasMeta, valRoasEq, valRoas1er],
                backgroundColor: ['#787065', '#566148', '#B65C3A'],
                borderColor: ['#29251F', '#3F4834', '#934527'],
                borderWidth: 1,
                borderRadius: 4
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
                      : `${fmtNum(ctx.parsed.y, 2)}x sobre pauta`
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: tickColor, font: { size: 11 } }
              },
              y: {
                min: 0,
                max: maxRoasForScale,
                grid: { color: gridColor },
                title: {
                  display: true,
                  text: 'ROAS por cliente (veces, x)',
                  color: tickColor,
                  font: { size: 11, weight: '600' }
                },
                ticks: { color: tickColor, callback: v => fmtNum(v, 1) + 'x' }
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

  const comparisonCols = [
    refScenarios.actual,
    refScenarios.agencia,
    refScenarios.cambio1,
    refScenarios.cambio2,
    refScenarios.combinado,
    liveRes
  ];

  const rowsSpec = [
    { label: 'Inversión mensual en Meta ($)', fn: s => fmtUSD(s.inv, 0) },
    { label: 'Honorario mensual de agencia ($)', fn: s => fmtUSD(s.feeEfectivo, 0) },
    { label: 'Clientes nuevos reales de Meta', fn: s => fmtNum(s.clientesNuevos, 1) },
    {
      label: 'Contribución 1er pedido suelto ($ / %)',
      fn: s => `${fmtUSD(s.contribSueltoM1, 2)} (${fmtPct(s.pctContribSueltoM1, 1)})`
    },
    {
      label: 'Contribución mensual suscripción ($ / %)',
      fn: s => `${fmtUSD(s.contribSusc, 3)} (${fmtPct(s.pctContribSusc, 1)})`
    },
    { label: 'ROAS de equilibrio en 1er pedido', fn: s => fmtRoas(s.roasEqPondM1) },
    {
      label: 'ROAS real del 1er pedido (clientes nuevos)',
      fn: s => (s.roas1erPedido !== null ? fmtRoas(s.roas1erPedido, 'No aplica') : 'No aplica')
    },
    { label: 'Costo por cliente solo anuncios ($)', fn: s => (s.cacAnuncios !== null ? fmtUSD(s.cacAnuncios, 2) : 'No aplica') },
    { label: 'Costo por cliente con agencia — CAC ($)', fn: s => (s.cacReal !== null ? fmtUSD(s.cacReal, 2) : 'No aplica') },
    {
      label: 'Costo por cliente extra del tramo ($)',
      fn: s => (s.margTramo.val !== null ? fmtUSD(s.margTramo.val, 2) : 'No aplica')
    },
    {
      label: 'Costo incremental frente a $8.000 ($)',
      fn: s => (s.cacIncremental !== null ? fmtUSD(s.cacIncremental, 2) : 'No aplica')
    },
    { label: 'Contribución 12M — Comprador suelto ($)', fn: s => fmtUSD(s.ltvSuelto, 2) },
    { label: 'Contribución 12M — Suscriptor ($)', fn: s => fmtUSD(s.ltvSusc, 2) },
    { label: 'Contribución 12M ponderada — LTV ($)', fn: s => fmtUSD(s.ltvPond, 4) },
    { label: 'Relación LTV:CAC', fn: s => (s.ltvCac !== null ? `${fmtNum(s.ltvCac, 2)}x` : 'No aplica') },
    { label: 'Mes de recuperación', fn: s => s.paybackLabel },
    {
      label: 'Saldo neto a 12M de la cohorte ($)',
      fn: s => (s.netoPorCliente !== null ? fmtUSD(s.netoCohorte, 2) : 'No aplica')
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }} id="seccion-tablero">
      {/* 1. DIAGNÓSTICO EDITORIAL */}
      <section className="notebook-section">
        <div className="notebook-header">
          <div>
            <span className="notebook-kicker">Diagnóstico de septiembre</span>
            <h2 className="notebook-title">¿Los anuncios venden o dejan dinero?</h2>
            <p className="notebook-subtitle">
              En septiembre, el administrador de anuncios mostró un ROAS de 3,0x ($24.000 en ventas sobre $8.000 invertidos), pero Tueste cerró el mes con <strong>$3.200 menos en el banco</strong> que en agosto. Estas son las claves para entender el problema.
            </p>
          </div>
        </div>

        <div className="diag-editorial-list">
          <div className="diag-item">
            <span className="diag-kicker">1. Atribución inflada</span>
            <div className="diag-figure">706 vs. 165</div>
            <p className="diag-text">
              Meta se adjudicó <strong>706 compras ($24.000)</strong> porque incluye campañas de retargeting que alcanzan a visitantes recientes (<em>RTG_Visitantes_30d</em>) y a compradores anteriores (<em>RTG_Compradores_180d</em>), además de ventas por vista de 1 día sin clic. En realidad llegaron <strong>165 clientes nuevos</strong>.
            </p>
          </div>

          <div className="diag-item">
            <span className="diag-kicker">2. Venta no es contribución</span>
            <div className="diag-figure">$15,89 de $34</div>
            <p className="diag-text">
              De un pedido suelto de 2 bolsas ($34,00), Tueste descuenta $10,88 de café, $4,50 de envío, $1,20 de empaque y $1,53 de pasarela (4,5%). Quedan <strong>$15,89 limpios (46,74%)</strong>; en suscripción ($30,60) quedan <strong>$12,643 (41,32%)</strong>.
            </p>
          </div>

          <div className="diag-item">
            <span className="diag-kicker">3. El 1er pedido no paga el CAC</span>
            <div className="diag-figure">$15,40 vs. $54,55</div>
            <p className="diag-text">
              Con $8.000 en Meta más $1.000 de agencia para 165 clientes nuevos, cada cliente cuesta <strong>$54,55</strong>. En su primer mes deja <strong>$15,40</strong>: abre una brecha inicial de <strong>-$39,14 por cliente</strong> que tarda <strong>12 meses</strong> en recuperarse.
            </p>
          </div>

          <div className="diag-item danger">
            <span className="diag-kicker">4. Por qué duplicar a $16.000 + 30% BF falla</span>
            <div className="diag-figure">-$25,82 / cliente</div>
            <p className="diag-text">
              Subir de $8.000 a $16.000 solo suma <strong>70 clientes extra</strong> ($114,29 por cliente adicional en pauta) y el 30% de descuento hunde la contribución del 1er pedido suelto a <strong>$6,15</strong>. En 12 meses aporta $46,52 frente a un costo de $72,34.
            </p>
          </div>
        </div>
      </section>

      {/* 2. LABORATORIO DE DECISIONES */}
      <section className="notebook-section">
        <div className="notebook-header">
          <div>
            <span className="notebook-kicker">Tablero de decisiones · Economía por cliente</span>
            <h2 className="notebook-title">Laboratorio de publicidad, cada pedido y recompra</h2>
            <p className="notebook-subtitle">
              Compara los cinco escenarios del caso o ajusta cualquier supuesto a la izquierda. Las cifras muestran el resultado por cliente adquirido; para evaluar la liquidez total de la empresa revisa la sección Caja a 24 meses.
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
            <ResultsHeaderBand12M liveRes={liveRes} idPrefix="tablero" />

            {/* Indicadores secundarios en filas compactas */}
            <div className="secondary-ledger">
              <div className="secondary-ledger-title">
                Detalle unitario y tramos de inversión (por cliente)
              </div>
              <div className="ledger-rows">
                <div className="ledger-row">
                  <span className="ledger-key">Contribución 1er pedido suelto</span>
                  <span className="ledger-val">
                    {fmtUSD(liveRes.contribSueltoM1, 2)} ({fmtPct(liveRes.pctContribSueltoM1, 1)} de {fmtUSD(liveRes.cobroSueltoM1, 2)})
                  </span>
                </div>
                <div className="ledger-row">
                  <span className="ledger-key">Contribución mensual suscripción</span>
                  <span className="ledger-val">
                    {fmtUSD(liveRes.contribSusc, 3)} ({fmtPct(liveRes.pctContribSusc, 1)} de {fmtUSD(liveRes.cobroSusc, 2)})
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
                    {liveRes.margTramo.val !== null ? fmtUSD(liveRes.margTramo.val, 2) : 'No aplica'}{' '}
                    <span style={{ fontWeight: 400, color: 'var(--ink-muted)' }}>({liveRes.margTramo.label})</span>
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

            {/* Los 4 Gráficos exigidos */}
            <div className="charts-grid">
              <div className="chart-frame">
                <div className="chart-frame-header">
                  <h4>1. Recuperación acumulada mes a mes (M0 a M12)</h4>
                  <span className="chart-scope-tag">Por cliente</span>
                </div>
                <p className="chart-caption">
                  Parte en Mes 0 con el costo de adquisición (-CAC). Cruza la línea de $0 en el mes de recuperación.
                </p>
                <div className="canvas-wrap">
                  <canvas ref={refCurva} />
                </div>
              </div>

              <div className="chart-frame">
                <div className="chart-frame-header">
                  <h4>2. Contribución a 12 meses frente a costo por cliente</h4>
                  <span className="chart-scope-tag">Por cliente</span>
                </div>
                <p className="chart-caption">
                  Debajo de la línea punteada roja (1:1) cada cliente da pérdida en el año.
                </p>
                <div className="canvas-wrap">
                  <canvas ref={refLtvCac} />
                </div>
              </div>

              <div className="chart-frame">
                <div className="chart-frame-header">
                  <h4>3. Clientes nuevos y costo por cliente extra según tramo</h4>
                  <span className="chart-scope-tag">Por cliente</span>
                </div>
                <p className="chart-caption">
                  Cada bloque adicional de $4.000 en Meta aporta menos clientes nuevos y encarece el costo marginal.
                </p>
                <div className="canvas-wrap">
                  <canvas ref={refHistorial} />
                </div>
              </div>

              <div className="chart-frame">
                <div className="chart-frame-header">
                  <h4>4. ROAS de Meta (3,0x) frente a equilibrio y 1er pedido</h4>
                  <span className="chart-scope-tag">Por cliente</span>
                </div>
                <p className="chart-caption">
                  El 3,0x de Meta mezcla visitantes (<em>RTG_Visitantes_30d</em>) y compradores previos (<em>RTG_Compradores_180d</em>).
                </p>
                {(liveRes.roasEqPondM1 === null || liveRes.roas1erPedido === null) && (
                  <div className="status-banner info" style={{ padding: '0.4rem 0.65rem', fontSize: '0.76rem' }}>
                    <div>
                      {liveRes.roasEqPondM1 === null && (
                        <div>[!] ROAS de equilibrio = No alcanzable (valor nulo, no es 0x): la contribución del 1er pedido es menor o igual a $0.</div>
                      )}
                      {liveRes.roas1erPedido === null && (
                        <div>[!] ROAS real del 1er pedido = No aplica (valor nulo, no es 0x): la inversión en Meta es $0.</div>
                      )}
                    </div>
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

      {/* 3. COMPARACIÓN DE ESCENARIOS */}
      <section className="notebook-section">
        <div className="notebook-header">
          <div>
            <span className="notebook-kicker">Comparación lado a lado · Por cliente y cohorte</span>
            <h2 className="notebook-title">Los cinco escenarios del caso frente a tu configuración</h2>
            <p className="notebook-subtitle">
              Compara las cuentas de cada alternativa. Los beneficios de Pack y envío dependen de un supuesto comercial que debe validarse en prueba piloto.
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Indicador</th>
                <th className="num">Actual</th>
                <th className="num">Agencia</th>
                <th className="num">Menor inversión</th>
                <th className="num">Pack y envío</th>
                <th className="num">Combinado</th>
                <th className="num live-col">Escenario activo</th>
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
