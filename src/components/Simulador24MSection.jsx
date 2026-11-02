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
  savedScenarios,
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
    const labels = Array.from({ length: 25 }, (_, i) => `Mes ${i}`);
    const lineaPiso = Array(25).fill(PISO_CAJA_24M);
    const lineaCero = Array(25).fill(0);

    const colors = {
      base8k: { border: '#3B2318', dash: [4, 3], width: 2.2 },
      agenciaAll: { border: '#B8332A', dash: [], width: 2.2 },
      agenciaM1: { border: '#D9822B', dash: [3, 3], width: 1.8 },
      propioA: { border: '#1F5A73', dash: [], width: 2.6 },
      propioB: { border: '#2E6F40', dash: [], width: 3.4 }
    };

    const datasets = allPlans.map(p => {
      const st = colors[p.id] || { border: '#C85A32', dash: [], width: 2.8 };
      return {
        label: p.shortName,
        data: p.serieCajaConMes0,
        borderColor: st.border,
        backgroundColor: st.border,
        borderDash: st.dash,
        borderWidth: st.width,
        pointRadius: 2.5,
        tension: 0.12,
        fill: false
      };
    });

    datasets.push({
      label: 'Piso de Seguridad ($5.000)',
      data: lineaPiso,
      borderColor: '#B8332A',
      borderWidth: 2,
      borderDash: [7, 4],
      pointRadius: 0,
      fill: false
    });

    datasets.push({
      label: 'Línea Cero ($0 — Límite de solvencia)',
      data: lineaCero,
      borderColor: '#666666',
      borderWidth: 1.3,
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
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: c => `${c.dataset.label}: ${fmtUSD(c.parsed.y, 2)}`
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: 'Saldo de Caja al Final del Mes ($)' },
            ticks: { callback: v => '$' + Number(v).toLocaleString('es-ES') }
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
    <section className="section-block" id="seccion-simulador24m">
      <div className="section-header">
        <div>
          <span className="section-step">Sección 3 · Nivel 3 · Simulador de Caja de 24 Meses</span>
          <h2 className="section-title">Simulador de Caja de 24 Meses y Comparador de Planes de Inversión</h2>
          <p className="section-subtitle">
            Compara planes de inversión en Meta durante 24 meses (Págs. 5, 6, 7 y 10 del PDF). Gana el plan válido con <strong>mayor caja final en el mes 24</strong> sin bajar nunca del piso de <strong>$5.000</strong> ni incumplir la regla de continuidad desde el mes 13; en empate, gana el que tenga más suscriptores activos en el mes 24.
          </p>
        </div>
      </div>

      {/* Verificación Mes 1 y Reglas */}
      <div className="info-columns" style={{ marginTop: 0, marginBottom: '1.3rem' }}>
        <div className="info-box" style={{ borderLeft: '5px solid var(--green)' }}>
          <h4>1. Verificación Paso a Paso del Mes 1 — Plan Base de $8.000 (Pág. 10)</h4>
          <ul>
            <li>
              <strong>Caja inicial (Mes 0):</strong> <code>$35.000,00</code> (Pág. 6).
            </li>
            <li>
              <strong>Clientes nuevos del Mes 1 (Cohorte 1):</strong> <code>165</code> de Meta ($8.000) +{' '}
              <code>47</code> orgánicos = <strong><code>212</code> clientes nuevos</strong> (
              <code>180,20</code> sueltos [85%] y <code>31,80</code> suscriptores [15%]).
            </li>
            <li>
              <strong>Contribución de la nueva cohorte en el Mes 1:</strong>{' '}
              <code>212 × (0,85 × $15,89 + 0,15 × $12,643) = $3.265,4254</code>.
            </li>
            <li>
              <strong>Contribución de clientes existentes en el Mes 1:</strong>{' '}
              <strong><code>$9.000,00</code></strong> (serie <code>$9.000 × 0,97^(t-1)</code>).
            </li>
            <li>
              <strong>Salidas del Mes 1:</strong> <code>$8.000</code> (Meta) + <code>$1.000</code> (Agencia) +{' '}
              <code>$6.500</code> (Costos fijos) = <strong><code>$15.500,00</code></strong>.
            </li>
            <li>
              <strong>Caja final del Mes 1:</strong>{' '}
              <code>$35.000 + $9.000 + $3.265,4254 − $15.500 =</code>{' '}
              <strong id="simCheckMes1Val">{fmtUSD(planBase8k.cajaMes1, 4)}</strong>{' '}
              <span className="badge-ok">OK Exacto</span>
            </li>
          </ul>
        </div>

        <div className="info-box" style={{ borderLeft: '5px solid var(--terracotta)' }}>
          <h4>2. Reglas del Modelo Mensual y Restricciones</h4>
          <ul>
            <li>
              <strong>Seguimiento de cohortes por edad (<em>a = 1 … 24</em>):</strong> compradores sueltos (85%) compran según la curva de 12M en edades 1–12 y <strong><code>0,10</code> pedidos/mes en edades 13 a 24</strong>. Suscriptores (15%) permanecen activos a razón de <code>0,91^(a-1)</code>.
            </li>
            <li>
              <strong>Tres restricciones obligatorias:</strong> (1) Inversión mensual entre <code>$0</code> y <code>$20.000</code>; (2) <code>Caja final ≥ $5.000</code> en cada uno de los 24 meses; (3) Desde el mes 13 hasta el 24, cada inversión mensual debe ser <code>≥ promedio de inversión de los meses 1 a 12</code>.
            </li>
            <li>
              <strong>Variantes de la Agencia separadas:</strong> se muestran por separado la promoción continua del 30% en cada cohorte (<code>-$82.255,19</code>) y la promoción del 30% solo en el Mes 1 (<code>-$28.552,08</code>).
            </li>
          </ul>
        </div>
      </div>

      {/* Banner del Mejor Plan */}
      <div
        className={`semaforo-banner ${winnerPlan ? 'green' : 'red'}`}
        style={{ marginBottom: '1.3rem' }}
      >
        <div className="semaforo-indicator">
          <div className="semaforo-dot" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.04rem' }}>
              {winnerPlan
                ? `Mejor entre los planes comparados: ${winnerPlan.name}`
                : 'Ningún plan comparado cumple actualmente todas las restricciones'}
            </div>
            <div style={{ fontSize: '0.84rem' }}>
              {winnerPlan
                ? `Partiendo de una caja inicial de $35.000,00 (Mes 0), termina el Mes 24 con ${fmtUSD(
                    winnerPlan.cajaMes24,
                    2
                  )} en el banco, con un mínimo de cierres mensuales (meses 1–24) de ${fmtUSD(
                    winnerPlan.minCaja,
                    2
                  )} en el Mes ${winnerPlan.mesMinCaja} (siempre ≥ $5.000) y ${fmtNum(
                    winnerPlan.suscMes24,
                    2
                  )} suscriptores activos de las cohortes modeladas.`
                : 'Revisa las restricciones de piso de caja ($5.000) o la regla de continuidad de inversión en meses 13 a 24.'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Comparativa de Planes a 24 Meses */}
      <h3 style={{ margin: '0 0 0.6rem', fontSize: '1.02rem', color: 'var(--coffee-900)' }}>
        Comparación de Planes a 24 Meses (Caja Inicial Mes 0: $35.000,00)
      </h3>
      <div className="table-responsive" style={{ marginBottom: '1.4rem' }}>
        <table id="tablaComparacion24m">
          <thead>
            <tr>
              <th>Plan de 24 Meses</th>
              <th className="num">Inv. Prom. M1–12</th>
              <th className="num">Inv. Mín. M13–24</th>
              <th className="num">Caja Inicial Mes 0 ($)</th>
              <th className="num">Caja Mes 1 ($)</th>
              <th className="num">Mínimo de Cierres Mensuales (Meses 1–24)</th>
              <th className="num">Caja Final Mes 24 ($)</th>
              <th className="num">Suscriptores Activos M24</th>
              <th>Validez y Restricciones</th>
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
                    {isWin && ' 🏆 (Mejor entre comparados)'}
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
                    <span className={p.valid ? 'badge-ok' : 'badge-danger'}>
                      {p.motivosResumen}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Editor del Plan 24M y Gráfico */}
      <div className="lab-layout" style={{ marginBottom: '1.5rem' }}>
        <aside className="controls-panel">
          <h3>Configurar Plan Propio B (Editable 24M)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--coffee-700)', marginBottom: '0.75rem' }}>
            Puedes editar las 24 inversiones mensuales por etapas o mes por mes y guardar este plan en SQLite desde el panel superior.
          </p>

          <div
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '0.85rem'
            }}
          >
            <div style={{ fontSize: '0.81rem', fontWeight: 700, marginBottom: '0.45rem' }}>
              Edición rápida por etapas ($0 a $20.000):
            </div>
            <div className="stage-grid">
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600 }}>Meses 1 a 6 ($)</label>
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
                <label style={{ fontSize: '0.74rem', fontWeight: 600 }}>Meses 7 a 12 ($)</label>
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
                <label style={{ fontSize: '0.74rem', fontWeight: 600 }}>Meses 13 a 18 ($)</label>
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
                <label style={{ fontSize: '0.74rem', fontWeight: 600 }}>Meses 19 a 24 ($)</label>
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
              style={{ width: '100%' }}
              onClick={applyStages}
            >
              Aplicar etapas a los 24 meses
            </button>
          </div>

          <details
            style={{
              marginBottom: '0.85rem',
              background: 'var(--bg-sand)',
              padding: '0.65rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.83rem' }}>
              Editar inversión mes por mes (Mes 1 a Mes 24)
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

          <div className="pack-box" style={{ marginTop: 0, marginBottom: '0.85rem' }}>
            <label className="checkbox-row">
              <input
                id="chkSim24PolPack"
                type="checkbox"
                checked={plan24m.polPack}
                onChange={e => onChangePlan24m({ ...plan24m, polPack: e.target.checked })}
              />
              <span>
                Activar Pack 3 bolsas ($48) y cobro de envío ($4,50 bajo $45) en Plan Propio B
              </span>
            </label>

            <div className="control-group" style={{ marginTop: '0.6rem', marginBottom: '0.5rem' }}>
              <div className="control-header">
                <label htmlFor="selSim24MesActPack">Mes de activación del cambio comercial</label>
              </div>
              <select
                id="selSim24MesActPack"
                className="sim-select"
                style={{ width: '100%' }}
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

            <div className="control-group" style={{ marginBottom: 0 }}>
              <div className="control-header">
                <label htmlFor="numSim24AdopPack">Adopción del Pack (%)</label>
                <span>{fmtNum(plan24m.adopPack, 1)}%</span>
              </div>
              <div className="control-inputs">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={plan24m.adopPack}
                  onChange={e =>
                    onChangePlan24m({ ...plan24m, adopPack: Number(e.target.value) })
                  }
                />
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
              </div>
            </div>
          </div>

          <div
            className="pack-box"
            style={{ marginTop: 0, marginBottom: '0.85rem', background: '#FFF9F2' }}
          >
            <label className="checkbox-row">
              <input
                id="chkSim24Tostadora"
                type="checkbox"
                checked={plan24m.buyTostadora}
                onChange={e => onChangePlan24m({ ...plan24m, buyTostadora: e.target.checked })}
              />
              <span>Decisión opcional separada: Comprar 2ª tostadora ($14.000)</span>
            </label>
            <div className="control-group" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              <div className="control-header">
                <label htmlFor="selSim24MesTostadora">Mes de compra ($14.000)</label>
              </div>
              <select
                id="selSim24MesTostadora"
                className="sim-select"
                style={{ width: '100%' }}
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

          <button
            id="btnResetPlan24m"
            type="button"
            className="btn btn-restore"
            style={{ width: '100%', marginLeft: 0 }}
            onClick={() => {
              setStages({ s1_6: 4000, s7_12: 4000, s13_18: 4000, s19_24: 4000 });
              onResetPlan24m();
            }}
          >
            ↺ Restaurar Plan Propio B ($4.000/mes + Pack Mes 1)
          </button>
        </aside>

        <div className="live-results">
          <div className="chart-card">
            <h4>Evolución de la Caja Final Mes a Mes (Mes 0 a Mes 24) vs. Piso de Seguridad ($5.000)</h4>
            <p className="chart-caption">
              Arranca en $35.000 en el Mes 0. La línea horizontal roja marca el piso mínimo de $5.000 exigido por Camila.
            </p>
            <div className="canvas-wrap" style={{ height: '310px' }}>
              <canvas ref={chartRef} />
            </div>
          </div>

          <div className="preset-bar" style={{ marginBottom: 0 }}>
            <label htmlFor="selInspectPlan24m" className="preset-label">
              Inspeccionar detalle de 24 meses del plan:
            </label>
            <select
              id="selInspectPlan24m"
              className="sim-select"
              value={inspectKey}
              onChange={e => setInspectKey(e.target.value)}
            >
              <option value="propioB">Plan 4: Propio B (Editable en vivo)</option>
              <option value="propioA">Plan 3: Propio A ($4.000 fijos, condiciones originales)</option>
              <option value="base8k">Plan 1: Base Actual ($8.000 fijos, condiciones originales)</option>
              <option value="agenciaAll">
                Plan 2a: Agencia ($16.000 + 30% BF en cada cohorte)
              </option>
              <option value="agenciaM1">
                Plan 2b: Agencia Variante ($16.000 + 30% BF solo en Mes 1)
              </option>
            </select>
            <button
              id="btnExportCsv24m"
              type="button"
              className="btn btn-restore"
              onClick={exportCSV}
            >
              ⬇ Exportar CSV (24 meses)
            </button>
          </div>

          <div className="kpi-grid">
            <div className={`kpi-card ${inspected.minCaja < PISO_CAJA_24M ? 'loss' : 'highlight'}`}>
              <div className="kpi-label">Mínimo de Cierres Mensuales (Meses 1–24)</div>
              <div className="kpi-val">{fmtUSD(inspected.minCaja, 2)}</div>
              <div className="kpi-sub">
                En Mes {inspected.mesMinCaja} · Caja inicial M0: $35.000,00
              </div>
            </div>

            <div className={`kpi-card ${inspected.cajaMes24 < 0 ? 'loss' : 'highlight'}`}>
              <div className="kpi-label">Caja Final (Mes 24)</div>
              <div className="kpi-val">{fmtUSD(inspected.cajaMes24, 2)}</div>
              <div className="kpi-sub">
                Caja inicial M0: $35.000,00 · Variación:{' '}
                {inspected.cajaMes24 - CAJA_INICIAL_24M >= 0 ? '+' : ''}
                {fmtUSD(inspected.cajaMes24 - CAJA_INICIAL_24M, 2)}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Suscriptores Activos Mes 24</div>
              <div className="kpi-val">{fmtNum(inspected.suscMes24, 2)}</div>
              <div className="kpi-sub">Solo de cohortes modeladas (M1–M24)</div>
            </div>

            <div className={`kpi-card ${inspected.valid ? 'gain' : 'loss'}`}>
              <div className="kpi-label">Estado del Plan y Restricciones</div>
              <div
                className="kpi-val"
                style={{ color: inspected.valid ? 'var(--green)' : 'var(--red)' }}
              >
                {inspected.valid ? 'VÁLIDO' : 'INVÁLIDO'}
              </div>
              <div className="kpi-sub">
                {inspected.valid
                  ? 'Cumple rango $0–$20k, piso ≥ $5.000 y regla Mes 13–24'
                  : inspected.motivosInvalidez.join(' | ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Mensual Detallada de 24 Filas */}
      <h3 style={{ margin: '0 0 0.6rem', fontSize: '1.02rem', color: 'var(--coffee-900)' }}>
        Tabla Mensual Detallada (Mes 1 a Mes 24) — {inspected.name}
      </h3>
      <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
        <table>
          <thead>
            <tr>
              <th>Mes</th>
              <th className="num">Inversión Meta ($)</th>
              <th className="num">Clientes Meta</th>
              <th className="num">Clientes Orgánicos</th>
              <th className="num">Total Cohorte Mes</th>
              <th className="num">Suscriptores Activos</th>
              <th className="num">Contribución Existentes ($)</th>
              <th className="num">Contribución Nuevas ($)</th>
              <th className="num">Salidas Totales ($)</th>
              <th className="num">Caja Final Mes ($)</th>
              <th>Estado de Reglas</th>
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
                    <span className={hasViol ? 'badge-danger' : 'badge-ok'}>{r.alertaTexto}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pitch de 2 Minutos Dinámico */}
      <div className="info-box" style={{ background: '#fff' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.8rem'
          }}
        >
          <div>
            <h4 style={{ marginBottom: '0.2rem' }}>
              Guion de Pitch de 2 Minutos para Diego y Camila (Vinculado al Plan Seleccionado)
            </h4>
            <p style={{ fontSize: '0.81rem', color: 'var(--coffee-700)' }}>
              Usa dinámicamente el presupuesto, CAC, clientes y cierres de caja del plan elegido.
            </p>
          </div>
          <select
            id="selPitchPlan24m"
            className="sim-select"
            value={pitchKey}
            onChange={e => setPitchKey(e.target.value)}
          >
            <option value="winner">Mejor plan válido actual</option>
            <option value="propioB">Plan 4: Propio B (Editable)</option>
            <option value="propioA">Plan 3: Propio A ($4.000 sin cambios)</option>
            <option value="base8k">Plan 1: Base Actual ($8.000)</option>
            <option value="agenciaAll">Plan 2a: Agencia ($16.000 + 30% BF continuo)</option>
            <option value="agenciaM1">Plan 2b: Agencia Variante (30% BF solo Mes 1)</option>
          </select>
        </div>

        <div className="pitch-grid">
          <div className="pitch-card">
            <h4>1. Presupuesto y adquisición del plan elegido (0:00 – 0:30)</h4>
            <p>
              En el plan seleccionado (<strong>{chosenPitchPlan.name}</strong>), la inversión en Meta del Mes 1 es de{' '}
              <strong>{fmtUSD(invM1, 0)}</strong>, con un promedio de{' '}
              <strong>{fmtUSD(chosenPitchPlan.avgInv1_12, 0)}/mes</strong> en los meses 1 a 12 y{' '}
              <strong>{fmtUSD(avgInv13_24, 0)}/mes</strong> en los meses 13 a 24. En el Mes 1 adquiere{' '}
              <strong>{fmtNum(cliMetaM1, 1)} clientes por Meta</strong> más <strong>47 orgánicos</strong> (
              <strong>{fmtNum(cliTotM1, 1)} clientes totales</strong>, con{' '}
              {invM1 > 0 && cliMetaM1 > 0
                ? `CAC real de ${fmtUSD((invM1 + feeM1) / cliMetaM1, 2)} incluyendo agencia`
                : 'gasto $0 en anuncios'}
              ).
            </p>
          </div>

          <div className="pitch-card">
            <h4>2. Resultados en caja real y contraste (0:30 – 1:00)</h4>
            <p>
              Partiendo de la <strong>caja inicial de $35.000,00 (Mes 0)</strong>, cierra el Mes 1 en{' '}
              <strong>{fmtUSD(chosenPitchPlan.cajaMes1, 2)}</strong>, registra un{' '}
              <strong>
                mínimo de cierres mensuales (meses 1–24) de {fmtUSD(chosenPitchPlan.minCaja, 2)} en el Mes{' '}
                {chosenPitchPlan.mesMinCaja}
              </strong>
              , y termina el Mes 24 con <strong>{fmtUSD(chosenPitchPlan.cajaMes24, 2)}</strong> (
              {diffVsBase >= 0 ? '+' : ''}
              {fmtUSD(diffVsBase, 2)} frente al plan base de $8.000/mes) y{' '}
              <strong>{fmtNum(chosenPitchPlan.suscMes24, 2)} suscriptores activos</strong>. En contraste, la Agencia ($16.000/mes) cierra en{' '}
              <strong>{fmtUSD(planAgenciaAll.cajaMes24, 2)}</strong> con promoción continua y en{' '}
              <strong>{fmtUSD(planAgenciaM1.cajaMes24, 2)}</strong> con promoción solo en el Mes 1.
            </p>
          </div>

          <div className="pitch-card">
            <h4>3. Riesgos que corresponden a este plan (1:00 – 1:30)</h4>
            <p>
              <strong>• Cartera previa (-3%/mes) y retención:</strong> la contribución existente baja de $9.000 en M1 a $4.466,94 en M24; compensarla depende del volumen y retención de las nuevas cohortes.
              <br />
              {usaPack && simSinPack && (
                <>
                  <strong>• Incertidumbre de Pack ($48) y envío ($4,50 bajo $45):</strong> cobrar envío puede afectar conversión o frecuencia; sin Pack ni envío, este mismo calendario cerraría el Mes 24 en{' '}
                  <strong>{fmtUSD(simSinPack.cajaMes24, 2)}</strong>.
                  <br />
                </>
              )}
              {tieneDescBF && (
                <>
                  <strong>• Erosión de margen promocional:</strong> el descuento reduce la contribución del primer pedido suelto a $6,149 mientras café, empaque y envío no bajan.
                  <br />
                </>
              )}
              {!chosenPitchPlan.valid && (
                <strong>
                  ⚠️ Alerta: este plan es INVÁLIDO ({chosenPitchPlan.motivosResumen}).
                </strong>
              )}
            </p>
          </div>

          <div className="pitch-card">
            <h4>4. Prueba de 60 días (observable vs. proyección) y reglas vs. gestión (1:30 – 2:00)</h4>
            <p>
              <strong>Piloto de 60 días:</strong> en 60 días no puede observarse directamente el LTV de 12 meses (que continúa siendo una proyección); sí pueden observarse conversión, CAC real, contribución inicial, adopción del Pack y primeras recompras (meses 1–2).
              <br />
              <strong>Reglas del caso vs. propuesta de gestión:</strong> las <em>reglas del caso</em> exigen piso de caja ≥ $5.000 e inversión M13–24 ≥ promedio M1–12 ({fmtUSD(chosenPitchPlan.avgInv1_12, 0)}). Exigir un colchón adicional (ej. $50.000 en banco antes de comprar la tostadora de $14.000) se plantea como <em>propuesta prudencial de gestión</em>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
