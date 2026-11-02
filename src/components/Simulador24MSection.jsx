import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import {
  CAJA_INICIAL_24M,
  PISO_CAJA_24M,
  REFERENCE_PLANS_24M,
  simulate24Months,
  fmtUSD,
  fmtNum
} from '../../shared/tuesteModel.js';

export function Simulador24MSection({
  plan24m,
  liveSim24m,
  onChangePlan24m,
  onResetPlan24m
}) {
  const [stages, setStages] = useState({
    s1_6: 4000,
    s7_12: 4000,
    s13_18: 4000,
    s19_24: 4000
  });
  const [inspectKey, setInspectKey] = useState('propioB');
  const [pitchKey, setPitchKey] = useState('winner');
  const chartRef = useRef(null);

  const planBase8k = simulate24Months(REFERENCE_PLANS_24M.base8k);
  const planAgenciaAll = simulate24Months(REFERENCE_PLANS_24M.agenciaAll);
  const planAgenciaM1 = simulate24Months(REFERENCE_PLANS_24M.agenciaM1);
  const planPropioA = simulate24Months(REFERENCE_PLANS_24M.propioA);

  const allPlans = [
    planBase8k,
    planAgenciaAll,
    planAgenciaM1,
    planPropioA,
    liveSim24m
  ];

  const plansMap = {
    base8k: planBase8k,
    agenciaAll: planAgenciaAll,
    agenciaM1: planAgenciaM1,
    propioA: planPropioA,
    propioB: liveSim24m
  };

  // Ordenar planes válidos por Mayor Caja Final Mes 24 y, en empate, Suscriptores Activos Mes 24
  const validPlans = allPlans.filter(p => p.valid);
  validPlans.sort((a, b) => {
    if (Math.abs(b.cajaMes24 - a.cajaMes24) > 1e-6) return b.cajaMes24 - a.cajaMes24;
    return b.suscMes24 - a.suscMes24;
  });
  const winnerPlan = validPlans.length > 0 ? validPlans[0] : null;

  const inspected = plansMap[inspectKey] || liveSim24m;
  const chosenPitchPlan =
    pitchKey === 'winner' ? winnerPlan || planPropioA : plansMap[pitchKey] || liveSim24m;

  useEffect(() => {
    if (!chartRef.current) return;
    const labels = Array.from({ length: 25 }, (_, i) => `M${i}`);
    const lineaPiso = Array(25).fill(PISO_CAJA_24M);
    const lineaCero = Array(25).fill(0);
    const gridColor = '#E6E0D4';
    const tickColor = '#575046';

    const styleMap = {
      propioB: { label: 'Plan activo (editable)', border: '#B65C3A', dash: [], width: 3.2, radius: 3 },
      propioA: { label: 'Menor inv. ($4k sin Pack)', border: '#566148', dash: [], width: 2.3, radius: 2 },
      base8k: { label: 'Actual ($8k)', border: '#29251F', dash: [4, 3], width: 2, radius: 2 },
      agenciaM1: { label: 'Agencia (30% BF solo M1)', border: '#8C5A1B', dash: [3, 3], width: 1.6, radius: 1.5 },
      agenciaAll: { label: 'Agencia (30% BF continuo)', border: '#9E2F28', dash: [], width: 1.8, radius: 1.5 }
    };

    const orderedForChart = [liveSim24m, planPropioA, planBase8k, planAgenciaM1, planAgenciaAll];

    const datasets = orderedForChart.map(p => {
      const st = styleMap[p.id] || { label: p.shortName, border: '#B65C3A', dash: [], width: 2.5, radius: 2 };
      return {
        label: st.label,
        data: p.serieCajaConMes0,
        borderColor: st.border,
        backgroundColor: st.border,
        borderDash: st.dash,
        borderWidth: st.width,
        pointRadius: st.radius,
        tension: 0.1,
        fill: false
      };
    });

    datasets.push({
      label: 'Piso mínimo ($5.000)',
      data: lineaPiso,
      borderColor: '#9E2F28',
      borderWidth: 1.8,
      borderDash: [7, 4],
      pointRadius: 0,
      fill: false
    });

    datasets.push({
      label: 'Línea cero ($0)',
      data: lineaCero,
      borderColor: '#29251F',
      borderWidth: 1.4,
      borderDash: [3, 3],
      pointRadius: 0,
      fill: false
    });

    const inst = new Chart(chartRef.current.getContext('2d'), {
      type: 'line',
      data: { labels, datasets },
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
              label: c => `${c.dataset.label}: ${fmtUSD(c.parsed.y, 2)} en caja de la empresa`
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
              text: 'Saldo en caja de la empresa ($)',
              color: tickColor,
              font: { size: 11, weight: '600' }
            },
            ticks: { color: tickColor, callback: v => '$' + Number(v).toLocaleString('es-ES') }
          }
        }
      }
    });

    return () => inst.destroy();
  }, [liveSim24m]);

  const applyStages = () => {
    const s1 = Math.max(0, Math.min(20000, Number(stages.s1_6) || 0));
    const s2 = Math.max(0, Math.min(20000, Number(stages.s7_12) || 0));
    const s3 = Math.max(0, Math.min(20000, Number(stages.s13_18) || 0));
    const s4 = Math.max(0, Math.min(20000, Number(stages.s19_24) || 0));
    const nextInvs = Array.from({ length: 24 }, (_, idx) => {
      const m = idx + 1;
      if (m <= 6) return s1;
      if (m <= 12) return s2;
      if (m <= 18) return s3;
      return s4;
    });
    onChangePlan24m({ ...plan24m, investments: nextInvs });
  };

  const handleMonthChange = (idx, rawVal) => {
    const val = rawVal === '' ? 0 : Number(rawVal);
    const nextInvs = [...plan24m.investments];
    nextInvs[idx] = val;
    onChangePlan24m({ ...plan24m, investments: nextInvs });
  };

  const exportCSV = () => {
    const headers = [
      'Mes',
      'Inversion_Meta_USD',
      'Clientes_Meta',
      'Clientes_Organicos',
      'Total_Cohorte_Mes',
      'Suscriptores_Activos_Cohortes',
      'Contribucion_Existentes_USD',
      'Contribucion_Nuevas_Cohortes_USD',
      'Salidas_Totales_USD',
      'Caja_Final_Mes_USD',
      'Estado_Reglas'
    ];
    const lines = [headers.join(',')];
    inspected.rows.forEach(r => {
      lines.push(
        [
          r.t,
          r.inv.toFixed(2),
          r.cliMeta.toFixed(4),
          r.cliOrg.toFixed(0),
          r.cliTot.toFixed(4),
          r.suscActivosModelados.toFixed(4),
          r.contribExist.toFixed(4),
          r.contribNuevas.toFixed(4),
          r.salidas.toFixed(2),
          r.cajaFinal.toFixed(4),
          `"${r.alertaTexto}"`
        ].join(',')
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tueste_Simulador24M_${inspected.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Respaldo sin Pack del plan activo para mostrar el supuesto comercial al lado del resultado
  const liveSinPack = simulate24Months({
    ...plan24m,
    id: 'liveSinPack',
    polPack: false
  });

  // Datos dinámicos para el Pitch de 2 minutos
  const invM1 = chosenPitchPlan.rows[0].inv;
  const cliMetaM1 = chosenPitchPlan.rows[0].cliMeta;
  const cliTotM1 = chosenPitchPlan.rows[0].cliTot;
  const feeM1 = chosenPitchPlan.rows[0].feeAgencia;
  const avgInv13_24 = chosenPitchPlan.rows.slice(12, 24).reduce((s, r) => s + r.inv, 0) / 12.0;
  const diffVsBase = chosenPitchPlan.cajaMes24 - planBase8k.cajaMes24;
  const usaPack = Boolean(chosenPitchPlan.config?.polPack);
  const tieneDescBF = Boolean(chosenPitchPlan.config?.descBF > 0);
  let simSinPack = null;
  if (usaPack) {
    simSinPack = simulate24Months({
      ...chosenPitchPlan.config,
      id: 'respaldoSinPack',
      polPack: false
    });
  }

  return (
    <section className="notebook-section" id="seccion-simulador24m">
      <div className="notebook-header">
        <div>
          <span className="notebook-kicker">Liquidez y solvencia · Caja de la empresa (24 meses)</span>
          <h2 className="notebook-title">Simulador de caja a 24 meses</h2>
          <p className="notebook-subtitle">
            Parte con una <strong>caja inicial de $35.000,00 (Mes 0)</strong>, suma la contribución de clientes anteriores ($9.000 en M1 con caída de 3% mensual) y de las nuevas cohortes (Meta + 47 orgánicos/mes), y descuenta costos fijos ($6.500/mes), agencia y pauta. Ningún mes puede cerrar debajo de <strong>$5.000</strong>.
          </p>
        </div>
      </div>

      <div className="workspace-grid" style={{ marginBottom: '1.6rem' }}>
        {/* PANEL IZQUIERDO: CONFIGURACIÓN DEL PLAN DE 24 MESES */}
        <aside className="assumptions-panel" aria-label="Configuración del plan de 24 meses">
          <div className="assumptions-panel-header">
            <h3>Tu plan editable (24M)</h3>
            <button
              id="btnResetPlan24m"
              type="button"
              className="btn btn-text"
              onClick={() => {
                setStages({ s1_6: 4000, s7_12: 4000, s13_18: 4000, s19_24: 4000 });
                onResetPlan24m();
              }}
            >
              Volver al caso original
            </button>
          </div>

          <div className="control-section-group">
            <div className="control-section-title">Presupuesto por etapas (Meta $)</div>
            <div className="stage-grid">
              <div>
                <label htmlFor="inputStage1_6" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Meses 1 a 6 ($)
                </label>
                <input
                  id="inputStage1_6"
                  type="number"
                  min="0"
                  max="20000"
                  step="500"
                  value={stages.s1_6}
                  onChange={e => setStages({ ...stages, s1_6: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="inputStage7_12" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Meses 7 a 12 ($)
                </label>
                <input
                  id="inputStage7_12"
                  type="number"
                  min="0"
                  max="20000"
                  step="500"
                  value={stages.s7_12}
                  onChange={e => setStages({ ...stages, s7_12: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="inputStage13_18" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Meses 13 a 18 ($)
                </label>
                <input
                  id="inputStage13_18"
                  type="number"
                  min="0"
                  max="20000"
                  step="500"
                  value={stages.s13_18}
                  onChange={e => setStages({ ...stages, s13_18: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="inputStage19_24" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Meses 19 a 24 ($)
                </label>
                <input
                  id="inputStage19_24"
                  type="number"
                  min="0"
                  max="20000"
                  step="500"
                  value={stages.s19_24}
                  onChange={e => setStages({ ...stages, s19_24: e.target.value })}
                />
              </div>
            </div>
            <button
              id="btnApplyStages24m"
              type="button"
              className="btn"
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onClick={applyStages}
            >
              Aplicar etapas a los 24 meses
            </button>

            <details className="notebook-details" style={{ padding: '0.55rem 0.75rem' }}>
              <summary style={{ fontSize: '0.79rem' }}>
                Ajustar inversión mes por mes (M1 a M24)
              </summary>
              <div className="month-grid-24">
                {plan24m.investments.map((invVal, idx) => (
                  <div className="month-cell" key={idx}>
                    <label htmlFor={`inv24m_m${idx + 1}`}>Mes {idx + 1} ($)</label>
                    <input
                      id={`inv24m_m${idx + 1}`}
                      type="number"
                      min="0"
                      max="20000"
                      step="250"
                      value={invVal}
                      onChange={e => handleMonthChange(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </details>
          </div>

          <div className="control-section-group">
            <div className="control-section-title">Supuesto comercial (Pack y envío)</div>
            <div className="pack-toggle-box" style={{ marginTop: 0 }}>
              <label className="checkbox-label">
                <input
                  id="chkSim24PolPack"
                  type="checkbox"
                  checked={plan24m.polPack}
                  onChange={e => onChangePlan24m({ ...plan24m, polPack: e.target.checked })}
                />
                <span>
                  Probar Pack 3 bolsas ($48) y cobrar envío ($4,50) bajo $45
                </span>
              </label>

              <div className="control-item" style={{ marginTop: '0.55rem' }}>
                <div className="control-row-top">
                  <label htmlFor="selSim24MesActPack">Mes de inicio de la prueba</label>
                </div>
                <select
                  id="selSim24MesActPack"
                  className="sim-select"
                  value={plan24m.mesActPack}
                  onChange={e =>
                    onChangePlan24m({ ...plan24m, mesActPack: Number(e.target.value) })
                  }
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      Mes {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-item" style={{ marginTop: '0.55rem' }}>
                <div className="control-row-top">
                  <label htmlFor="numSim24AdopPack">Adopción del Pack</label>
                  <div className="input-with-unit">
                    <input
                      id="numSim24AdopPack"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={plan24m.adopPack}
                      onChange={e =>
                        onChangePlan24m({ ...plan24m, adopPack: Number(e.target.value) })
                      }
                    />
                    <span className="input-unit-suffix">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  aria-label="Deslizador de adopción del Pack en simulador"
                  min="0"
                  max="100"
                  step="5"
                  value={plan24m.adopPack}
                  onChange={e =>
                    onChangePlan24m({ ...plan24m, adopPack: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>

          <div className="control-section-group">
            <div className="control-section-title">Inversión de capital opcional</div>
            <div className="pack-toggle-box" style={{ marginTop: 0 }}>
              <label className="checkbox-label">
                <input
                  id="chkSim24Tostadora"
                  type="checkbox"
                  checked={plan24m.buyTostadora}
                  onChange={e => onChangePlan24m({ ...plan24m, buyTostadora: e.target.checked })}
                />
                <span>Comprar 2ª tostadora ($14.000)</span>
              </label>
              <div className="control-item" style={{ marginTop: '0.5rem' }}>
                <div className="control-row-top">
                  <label htmlFor="selSim24MesTostadora">Mes del desembolso ($14.000)</label>
                </div>
                <select
                  id="selSim24MesTostadora"
                  className="sim-select"
                  value={plan24m.mesTostadora}
                  onChange={e =>
                    onChangePlan24m({ ...plan24m, mesTostadora: Number(e.target.value) })
                  }
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      Mes {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* COLUMNA DERECHA: CIFRA PROTAGONISTA, SUPUESTO VISIBLE Y GRÁFICO DOMINANTE */}
        <div className="results-column">
          {/* Conclusión corta + Banda protagonista de 3 cifras */}
          <div className={`verdict-banner ${liveSim24m.valid ? 'green' : 'red'}`}>
            <div className="verdict-kicker">Resultado de tu plan editable · Caja de la empresa</div>
            <div className="verdict-headline">
              {liveSim24m.valid
                ? winnerPlan && winnerPlan.id === liveSim24m.id
                  ? 'Mejor entre los planes comparados: cumple todas las reglas de liquidez'
                  : 'Plan válido: respeta el piso de $5.000 y la continuidad de inversión'
                : `[!] Plan inviable: ${liveSim24m.motivosInvalidez.join(' · ')}`}
            </div>
            <div className="verdict-summary">
              Caja inicial (Mes 0): <strong>$35.000,00</strong> · Cierre del Mes 1:{' '}
              <strong>{fmtUSD(liveSim24m.cajaMes1, 2)}</strong> · Suscriptores activos al Mes 24:{' '}
              <strong>{fmtNum(liveSim24m.suscMes24, 2)}</strong>.
            </div>
          </div>

          <div className="metrics-band-3" role="region" aria-label="Cifras principales de caja a 24 meses">
            <div className="band-cell">
              <div>
                <div className="band-label-row">
                  <span className="band-label">Caja al mes 24</span>
                </div>
                <div
                  className={`band-value tabular ${
                    liveSim24m.cajaMes24 < PISO_CAJA_24M ? 'loss' : 'gain'
                  }`}
                >
                  {fmtUSD(liveSim24m.cajaMes24, 2)}
                </div>
              </div>
              <div className="band-sub tabular">
                Caja inicial M0: $35.000,00 · Variación neta:{' '}
                {liveSim24m.cajaMes24 - CAJA_INICIAL_24M >= 0 ? '+' : ''}
                {fmtUSD(liveSim24m.cajaMes24 - CAJA_INICIAL_24M, 2)}
              </div>
            </div>

            <div className="band-cell">
              <div>
                <div className="band-label-row">
                  <span className="band-label">Menor saldo mensual</span>
                </div>
                <div
                  className={`band-value tabular ${
                    liveSim24m.minCaja < PISO_CAJA_24M ? 'loss' : ''
                  }`}
                >
                  {fmtUSD(liveSim24m.minCaja, 2)}
                </div>
              </div>
              <div className="band-sub tabular">
                Mínimo de cierres mensuales, meses 1–24 (ocurre en el Mes {liveSim24m.mesMinCaja}; piso exigido: $5.000)
              </div>
            </div>

            <div className="band-cell">
              <div>
                <div className="band-label-row">
                  <span className="band-label">¿Cumple las reglas?</span>
                </div>
                <div className={`band-value ${liveSim24m.valid ? 'gain' : 'loss'}`}>
                  {liveSim24m.valid ? '[OK] Sí cumple' : '[!] No cumple'}
                </div>
              </div>
              <div className="band-sub">
                {liveSim24m.valid
                  ? 'Rango $0–$20k, saldo mensual ≥ $5.000 y pauta M13–24 ≥ promedio M1–12'
                  : liveSim24m.motivosInvalidez.join(' | ')}
              </div>
            </div>
          </div>

          {/* Supuestos comerciales del Pack visibles cerca del resultado */}
          <div className="sim-commercial-callout">
            <strong>Supuestos comerciales cerca del resultado:</strong>{' '}
            {plan24m.polPack ? (
              <>
                Tu plan activo incluye el supuesto comercial del <strong>Pack de 3 bolsas ($48, adopción {fmtNum(plan24m.adopPack, 0)}%) y envío de $4,50 en pedidos sueltos menores a $45</strong> desde el Mes {plan24m.mesActPack}.{' '}
                <strong>Este beneficio no está garantizado:</strong> si ese cambio comercial no se aplicara o no mejorara el margen, este mismo calendario de inversión cerraría el Mes 24 con{' '}
                <strong>{fmtUSD(liveSinPack.cajaMes24, 2)}</strong> (menor saldo mensual de{' '}
                <strong>{fmtUSD(liveSinPack.minCaja, 2)}</strong> en el Mes {liveSinPack.mesMinCaja}).
              </>
            ) : (
              <>
                Tu plan activo se evalúa únicamente con las <strong>condiciones comerciales originales verificadas del caso</strong> (bolsa a $17, envío absorbido por Tueste, sin depender del Pack de $48).
              </>
            )}
          </div>

          {/* Gráfico de caja dominante */}
          <div className="chart-frame">
            <div className="chart-frame-header">
              <h4>Evolución del saldo en banco mes a mes (Mes 0 a Mes 24)</h4>
              <span className="chart-scope-tag">Caja de la empresa</span>
            </div>
            <p className="chart-caption">
              Todos los planes parten de $35.000 en el Mes 0. La línea punteada roja en $5.000 marca el piso mínimo de seguridad exigido por Camila.
            </p>
            <div className="canvas-wrap" style={{ height: '350px' }}>
              <canvas ref={chartRef} />
            </div>
          </div>
        </div>
      </div>

      {/* COMPARACIÓN DE PLANES DEBAJO DEL GRÁFICO */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '0.5rem',
            marginBottom: '0.6rem'
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.08rem', color: 'var(--ink)' }}>
            Comparación de planes a 24 meses (caja inicial Mes 0: $35.000,00)
          </h3>
          {winnerPlan && (
            <span className="status-tag ok">
              [OK] Mejor entre los planes comparados: {winnerPlan.shortName} ({fmtUSD(winnerPlan.cajaMes24, 2)})
            </span>
          )}
        </div>

        <div className="table-responsive">
          <table id="tablaComparacion24m">
            <thead>
              <tr>
                <th>Plan comparado</th>
                <th className="num">Pauta prom. M1–12</th>
                <th className="num">Pauta mín. M13–24</th>
                <th className="num">Caja inicial M0</th>
                <th className="num">Caja Mes 1</th>
                <th className="num">Menor saldo mensual (mínimo de cierres mensuales, meses 1–24)</th>
                <th className="num">Caja al mes 24</th>
                <th className="num">Suscriptores M24</th>
                <th>¿Cumple las reglas?</th>
              </tr>
            </thead>
            <tbody>
              {allPlans.map(p => {
                const isWin = winnerPlan && p.id === winnerPlan.id;
                return (
                  <tr
                    key={p.id}
                    className={isWin ? 'row-winner' : !p.valid ? 'row-violation' : ''}
                  >
                    <td>
                      <strong>{p.name}</strong>
                      {isWin && (
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)' }}>
                          [Mejor entre los planes comparados]
                        </div>
                      )}
                    </td>
                    <td className="num">{fmtUSD(p.avgInv1_12, 0)}</td>
                    <td className="num">{fmtUSD(p.minInv13_24, 0)}</td>
                    <td className="num">{fmtUSD(CAJA_INICIAL_24M, 2)}</td>
                    <td className="num">{fmtUSD(p.cajaMes1, 2)}</td>
                    <td className="num">
                      {fmtUSD(p.minCaja, 2)} (Mes {p.mesMinCaja})
                    </td>
                    <td className="num">
                      <strong>{fmtUSD(p.cajaMes24, 2)}</strong>
                    </td>
                    <td className="num">{fmtNum(p.suscMes24, 2)}</td>
                    <td>
                      <span className={`status-tag ${p.valid ? 'ok' : 'danger'}`}>
                        {p.valid ? `[OK] ${p.motivosResumen}` : `[!] ${p.motivosResumen}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLA MENSUAL DESPLEGABLE (24 FILAS + EXPORTACIÓN CSV) */}
      <details className="notebook-details" style={{ marginBottom: '1.1rem' }}>
        <summary>
          Ver la cuenta: tabla mensual detallada de 24 meses ({inspected.shortName}) y exportar CSV
        </summary>
        <div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginBottom: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <label htmlFor="selInspectPlan24m" style={{ fontSize: '0.83rem', fontWeight: 700 }}>
                Plan mostrado en la tabla:
              </label>
              <select
                id="selInspectPlan24m"
                className="sim-select"
                style={{ width: 'auto' }}
                value={inspectKey}
                onChange={e => setInspectKey(e.target.value)}
              >
                <option value="propioB">Plan 4: Propio B (Editable en vivo)</option>
                <option value="propioA">Plan 3: Propio A ($4.000 fijos, condiciones originales)</option>
                <option value="base8k">Plan 1: Base Actual ($8.000 fijos, condiciones originales)</option>
                <option value="agenciaAll">Plan 2a: Agencia ($16.000 + 30% BF en cada cohorte)</option>
                <option value="agenciaM1">Plan 2b: Agencia Variante ($16.000 + 30% BF solo en Mes 1)</option>
              </select>
            </div>

            <button
              id="btnExportCsv24m"
              type="button"
              className="btn"
              onClick={exportCSV}
            >
              Exportar CSV (24 meses)
            </button>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th className="num">Inversión Meta ($)</th>
                  <th className="num">Clientes Meta</th>
                  <th className="num">Clientes orgánicos</th>
                  <th className="num">Total cohorte</th>
                  <th className="num">Suscriptores activos</th>
                  <th className="num">Aporte existentes ($)</th>
                  <th className="num">Aporte nuevas ($)</th>
                  <th className="num">Salidas totales ($)</th>
                  <th className="num">Caja al cierre ($)</th>
                  <th>¿Cumple las reglas?</th>
                </tr>
              </thead>
              <tbody>
                {inspected.rows.map(r => {
                  const hasViol = r.violRango || r.violPiso || r.violRegla13;
                  return (
                    <tr key={r.t} className={hasViol ? 'row-violation' : ''}>
                      <td>
                        <strong>Mes {r.t}</strong>
                      </td>
                      <td className="num">{fmtUSD(r.inv, 0)}</td>
                      <td className="num">{fmtNum(r.cliMeta, 2)}</td>
                      <td className="num">{fmtNum(r.cliOrg, 0)}</td>
                      <td className="num">{fmtNum(r.cliTot, 2)}</td>
                      <td className="num">{fmtNum(r.suscActivosModelados, 2)}</td>
                      <td className="num">{fmtUSD(r.contribExist, 2)}</td>
                      <td className="num">{fmtUSD(r.contribNuevas, 2)}</td>
                      <td className="num">{fmtUSD(r.salidas, 2)}</td>
                      <td className="num">
                        <strong>{fmtUSD(r.cajaFinal, 2)}</strong>
                      </td>
                      <td>
                        <span className={`status-tag ${hasViol ? 'danger' : 'ok'}`}>
                          {hasViol ? `[!] ${r.alertaTexto}` : `[OK] ${r.alertaTexto}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      {/* DESPLEGABLE: VERIFICACIÓN DEL MES 1 Y ARGUMENTARIO PARA DIEGO Y CAMILA */}
      <details className="notebook-details" open>
        <summary>
          Comprobación del Mes 1 ($31.765,4254) y síntesis para conversar con Camila
        </summary>
        <div>
          <div className="info-columns" style={{ marginBottom: '1rem' }}>
            <div className="info-box">
              <h4>Comprobación paso a paso del Mes 1 (Plan actual de $8.000)</h4>
              <ul>
                <li>
                  <strong>Caja inicial (Mes 0):</strong> <code>$35.000,00</code>.
                </li>
                <li>
                  <strong>Cohorte 1:</strong> <code>165</code> clientes de Meta + <code>47</code> orgánicos ={' '}
                  <strong>212 clientes nuevos</strong> (180,20 sueltos y 31,80 suscriptores).
                </li>
                <li>
                  <strong>Contribución de la Cohorte 1 en el Mes 1:</strong>{' '}
                  <code>212 × (0,85 × $15,89 + 0,15 × $12,643) = $3.265,4254</code>.
                </li>
                <li>
                  <strong>Contribución de clientes anteriores (Mes 1):</strong> <code>$9.000,00</code>.
                </li>
                <li>
                  <strong>Salidas del Mes 1:</strong> <code>$8.000</code> (Meta) + <code>$1.000</code> (agencia) +{' '}
                  <code>$6.500</code> (costos fijos) = <code>$15.500,00</code>.
                </li>
                <li>
                  <strong>Saldo final Mes 1:</strong>{' '}
                  <strong id="simCheckMes1Val">{fmtUSD(planBase8k.cajaMes1, 4)}</strong>.
                </li>
              </ul>
            </div>

            <div className="info-box">
              <h4>Reglas del simulador y variantes de la agencia</h4>
              <ul>
                <li>
                  <strong>Tres reglas obligatorias:</strong> (1) pauta entre $0 y $20.000/mes; (2) cierre de caja mensual ≥ $5.000 en los 24 meses; (3) en cada mes del año 2 (meses 13 a 24), la inversión debe ser ≥ promedio invertido en los meses 1 a 12.
                </li>
                <li>
                  <strong>Promoción de la agencia separada:</strong> se distingue la promoción continua del 30% en todas las cohortes ({fmtUSD(planAgenciaAll.cajaMes24, 2)}) frente a aplicar el 30% solo en el Mes 1 ({fmtUSD(planAgenciaM1.cajaMes24, 2)}).
                </li>
              </ul>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.6rem'
            }}
          >
            <strong style={{ fontSize: '0.88rem' }}>
              Resumen ejecutivo vinculado al plan seleccionado:
            </strong>
            <select
              id="selPitchPlan24m"
              className="sim-select"
              style={{ width: 'auto' }}
              value={pitchKey}
              onChange={e => setPitchKey(e.target.value)}
            >
              <option value="winner">Mejor entre los planes comparados</option>
              <option value="propioB">Plan 4: Propio B (Editable)</option>
              <option value="propioA">Plan 3: Propio A ($4.000 sin cambios)</option>
              <option value="base8k">Plan 1: Base Actual ($8.000)</option>
              <option value="agenciaAll">Plan 2a: Agencia ($16.000 + 30% BF continuo)</option>
              <option value="agenciaM1">Plan 2b: Agencia Variante (30% BF solo Mes 1)</option>
            </select>
          </div>

          <div className="pitch-editorial-grid">
            <div className="pitch-block">
              <h4>1. Presupuesto y adquisición del plan elegido</h4>
              <p>
                En <strong>{chosenPitchPlan.name}</strong>, la pauta del Mes 1 es de{' '}
                <strong>{fmtUSD(invM1, 0)}</strong> (promedio de{' '}
                <strong>{fmtUSD(chosenPitchPlan.avgInv1_12, 0)}/mes</strong> en meses 1–12 y{' '}
                <strong>{fmtUSD(avgInv13_24, 0)}/mes</strong> en meses 13–24). En el Mes 1 incorpora{' '}
                <strong>{fmtNum(cliMetaM1, 1)} clientes por Meta</strong> más <strong>47 orgánicos</strong> (
                <strong>{fmtNum(cliTotM1, 1)} clientes totales</strong>, con{' '}
                {invM1 > 0 && cliMetaM1 > 0
                  ? `costo por cliente de ${fmtUSD((invM1 + feeM1) / cliMetaM1, 2)} incluyendo agencia`
                  : 'gasto $0 en anuncios'}
                ).
              </p>
            </div>

            <div className="pitch-block">
              <h4>2. Caja al mes 24 y menor saldo mensual</h4>
              <p>
                Partiendo de la <strong>caja inicial de $35.000,00 (Mes 0)</strong>, cierra el Mes 1 en{' '}
                <strong>{fmtUSD(chosenPitchPlan.cajaMes1, 2)}</strong>, registra un{' '}
                <strong>
                  mínimo de cierres mensuales (meses 1–24) de {fmtUSD(chosenPitchPlan.minCaja, 2)} en el Mes{' '}
                  {chosenPitchPlan.mesMinCaja}
                </strong>{' '}
                y termina el Mes 24 con <strong>{fmtUSD(chosenPitchPlan.cajaMes24, 2)}</strong> (
                {diffVsBase >= 0 ? '+' : ''}
                {fmtUSD(diffVsBase, 2)} frente a mantener $8.000/mes).
              </p>
            </div>

            <div className="pitch-block">
              <h4>3. Riesgos reales del plan</h4>
              <p>
                La contribución de la cartera previa cae 3% cada mes (de $9.000 en M1 a $4.466,94 en M24) y no está garantizado que las nuevas cohortes la compensen si sube la cancelación o se encarece Meta.{' '}
                {usaPack && simSinPack && (
                  <>
                    Además, el aporte del Pack ($48) y envío bajo $45 es un supuesto no garantizado: sin esa mejora comercial, la caja final sería de <strong>{fmtUSD(simSinPack.cajaMes24, 2)}</strong>.
                  </>
                )}
                {tieneDescBF && (
                  <> El descuento promocional reduce el margen inicial y acelera el drenaje de caja.</>
                )}
              </p>
            </div>

            <div className="pitch-block">
              <h4>4. Qué medir en una prueba de 60 días y decisión sobre la tostadora</h4>
              <p>
                En una prueba de 60 días pueden observarse conversión, contribución del primer pedido, costo por cliente (CAC) y primeras recompras; la contribución anual (LTV de 12 meses) sigue siendo una proyección. Respecto a la segunda tostadora ($14.000, dato del caso), como propuesta de gestión propia sugerimos posponerla mientras se valida el flujo de caja.
              </p>
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
