import React, { useState, useEffect, useCallback } from 'react';
import {
  PRESETS_12M,
  REFERENCE_PLANS_24M,
  computeScenario,
  simulate24Months
} from '../shared/tuesteModel.js';
import {
  apiCheckHealth,
  apiListScenarios,
  apiCreateScenario,
  apiUpdateScenario,
  apiDeleteScenario
} from './api.js';
import { SavedScenariosPanel } from './components/SavedScenariosPanel.jsx';
import { CalculadoraSection } from './components/CalculadoraSection.jsx';
import { TableroSection } from './components/TableroSection.jsx';
import { Simulador24MSection } from './components/Simulador24MSection.jsx';

function stripPresetMeta(preset) {
  return {
    inversion: preset.inversion,
    precioBolsa: preset.precioBolsa,
    costoCafe: preset.costoCafe,
    costoEnvio: preset.costoEnvio,
    pctSusc: preset.pctSusc,
    churn: preset.churn,
    pedidosSuelto: preset.pedidosSuelto,
    feeAgencia: preset.feeAgencia,
    descuentoBF: preset.descuentoBF,
    polPack: preset.polPack,
    adopcionPack: preset.adopcionPack
  };
}

function defaultPlan24m() {
  return {
    id: 'propioB',
    name: 'Plan 4: Propio B (Editable — Meta + Política Pack/Envío)',
    shortName: 'Propio B (Editable)',
    investments: [...REFERENCE_PLANS_24M.propioB.investments],
    descBF: 0.0,
    bfMode: 'all_cohorts',
    polPack: true,
    mesActPack: 1,
    packScope: 'all_orders',
    adopPack: 20.0,
    buyTostadora: false,
    mesTostadora: 12
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('tab=todas')) {
      return 'todas';
    }
    return 'calculadora';
  }); // 'calculadora' | 'tablero' | 'simulador24m' | 'todas'

  const [showScenariosPanel, setShowScenariosPanel] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('panel=open')) {
      return true;
    }
    return false;
  });

  const [activePresetKey, setActivePresetKey] = useState('actual');
  const [params12m, setParams12m] = useState(() => stripPresetMeta(PRESETS_12M.actual));
  const [plan24m, setPlan24m] = useState(() => defaultPlan24m());

  // Estado de guardado y conexión
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [activeSavedId, setActiveSavedId] = useState(null);
  const [saveFormName, setSaveFormName] = useState('');
  const [saveFormNote, setSaveFormNote] = useState('');
  const [operationState, setOperationState] = useState({
    status: 'idle', // 'idle' | 'loading' | 'saving' | 'success' | 'error'
    message: '',
    details: []
  });

  // Cálculo instantáneo en vivo
  const liveRes12m = computeScenario(params12m);
  const liveSim24m = simulate24Months({
    ...plan24m,
    id: 'propioB',
    name: 'Plan 4: Propio B (Editable — Meta + Política Pack/Envío)',
    shortName: 'Propio B (Editable)'
  });

  const refreshSavedScenarios = useCallback(async (showSuccessBanner = false) => {
    setBackendStatus('checking');
    try {
      await apiCheckHealth();
      const res = await apiListScenarios();
      if (res.ok && res.data.ok) {
        setSavedScenarios(res.data.scenarios || []);
        setBackendStatus('online');
        if (showSuccessBanner) {
          setOperationState({
            status: 'success',
            message: 'Guardado disponible nuevamente.',
            details: []
          });
        }
      } else {
        setBackendStatus('offline');
      }
    } catch (err) {
      setBackendStatus('offline');
      if (showSuccessBanner) {
        setOperationState({
          status: 'error',
          message: err.message || 'Guardado no disponible en este momento.',
          details: []
        });
      }
    }
  }, []);

  useEffect(() => {
    refreshSavedScenarios(false);
  }, [refreshSavedScenarios]);

  const handleSelectPreset12m = presetKey => {
    const p = PRESETS_12M[presetKey];
    if (!p) return;
    setActivePresetKey(presetKey);
    setActiveSavedId(null);
    setParams12m(stripPresetMeta(p));

    setPlan24m(prev => ({
      ...prev,
      investments: Array(24).fill(p.inversion),
      descBF: p.descuentoBF,
      polPack: p.polPack,
      adopPack: p.adopcionPack
    }));
  };

  const handleRestoreDefaults = () => {
    setActivePresetKey('actual');
    setActiveSavedId(null);
    setParams12m(stripPresetMeta(PRESETS_12M.actual));
    setPlan24m(defaultPlan24m());
    setOperationState({
      status: 'info',
      message: 'Se han restaurado los datos originales del caso Tueste.',
      details: []
    });
  };

  const handleChangeParam12m = (key, value) => {
    setActivePresetKey(null);
    setParams12m(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveNewScenario = async () => {
    const trimmedName = saveFormName.trim();
    if (!trimmedName) {
      setOperationState({
        status: 'error',
        message: 'Ingresa un nombre para guardar el escenario.',
        details: []
      });
      return;
    }

    setOperationState({
      status: 'saving',
      message: `Guardando "${trimmedName}"...`,
      details: []
    });

    try {
      const res = await apiCreateScenario({
        name: trimmedName,
        note: saveFormNote.trim(),
        params12m,
        plan24m
      });

      if (!res.ok || !res.data.ok) {
        setOperationState({
          status: 'error',
          message: res.data?.error || 'No se pudo guardar el escenario.',
          details: res.data?.details || []
        });
        return;
      }

      const created = res.data.scenario;
      setBackendStatus('online');
      setActiveSavedId(created.id);
      const listRes = await apiListScenarios();
      if (listRes.ok && listRes.data.ok) {
        setSavedScenarios(listRes.data.scenarios || []);
      }

      const viableMsg = created.planViable24m
        ? 'Plan de 24 meses viable.'
        : `Guardado como plan de 24 meses inviable (${created.motivosInvalidez24m?.join('; ')}).`;

      setOperationState({
        status: 'success',
        message: `Escenario "${created.name}" guardado correctamente. ${viableMsg}`,
        details: []
      });
    } catch (err) {
      setBackendStatus('offline');
      setOperationState({
        status: 'error',
        message:
          err.message ||
          'No se pueden guardar cambios en este momento. Tus datos siguen intactos en pantalla.',
        details: []
      });
    }
  };

  const handleUpdateActiveScenario = async () => {
    if (!activeSavedId) return;
    const trimmedName = saveFormName.trim();
    if (!trimmedName) {
      setOperationState({
        status: 'error',
        message: 'El nombre del escenario no puede estar vacío.',
        details: []
      });
      return;
    }

    setOperationState({
      status: 'saving',
      message: `Actualizando "${trimmedName}"...`,
      details: []
    });

    try {
      const res = await apiUpdateScenario(activeSavedId, {
        name: trimmedName,
        note: saveFormNote.trim(),
        params12m,
        plan24m
      });

      if (!res.ok || !res.data.ok) {
        setOperationState({
          status: 'error',
          message: res.data?.error || 'No se pudo actualizar el escenario.',
          details: res.data?.details || []
        });
        return;
      }

      const updated = res.data.scenario;
      setBackendStatus('online');
      const listRes = await apiListScenarios();
      if (listRes.ok && listRes.data.ok) {
        setSavedScenarios(listRes.data.scenarios || []);
      }

      setOperationState({
        status: 'success',
        message: `Escenario "${updated.name}" actualizado correctamente.`,
        details: []
      });
    } catch (err) {
      setBackendStatus('offline');
      setOperationState({
        status: 'error',
        message:
          err.message ||
          'No se pueden guardar cambios en este momento. Tus datos siguen intactos en pantalla.',
        details: []
      });
    }
  };

  const handleLoadSavedScenario = sc => {
    if (!sc) return;
    setActivePresetKey(null);
    setActiveSavedId(sc.id);
    setSaveFormName(sc.name);
    setSaveFormNote(sc.note || '');
    if (sc.params12m) {
      setParams12m(stripPresetMeta(sc.params12m));
    }
    if (sc.plan24m) {
      setPlan24m({
        ...defaultPlan24m(),
        ...sc.plan24m,
        investments: [...sc.plan24m.investments]
      });
    }
    setOperationState({
      status: 'success',
      message: `Escenario "${sc.name}" cargado en pantalla.`,
      details: []
    });
  };

  const handleDuplicateSavedScenario = async sc => {
    if (!sc) return;
    setOperationState({
      status: 'saving',
      message: `Duplicando "${sc.name}"...`,
      details: []
    });

    try {
      const res = await apiCreateScenario({
        name: `${sc.name} (Copia)`,
        note: sc.note || '',
        params12m: sc.params12m,
        plan24m: sc.plan24m
      });

      if (!res.ok || !res.data.ok) {
        setOperationState({
          status: 'error',
          message: res.data?.error || 'No se pudo duplicar el escenario.',
          details: res.data?.details || []
        });
        return;
      }

      setBackendStatus('online');
      const listRes = await apiListScenarios();
      if (listRes.ok && listRes.data.ok) {
        setSavedScenarios(listRes.data.scenarios || []);
      }
      setOperationState({
        status: 'success',
        message: `Escenario duplicado como "${res.data.scenario.name}".`,
        details: []
      });
    } catch (err) {
      setBackendStatus('offline');
      setOperationState({
        status: 'error',
        message: err.message || 'No se pueden guardar cambios en este momento.',
        details: []
      });
    }
  };

  const handleDeleteSavedScenario = async id => {
    setOperationState({
      status: 'saving',
      message: 'Eliminando escenario...',
      details: []
    });

    try {
      const res = await apiDeleteScenario(id);
      if (!res.ok || !res.data.ok) {
        setOperationState({
          status: 'error',
          message: res.data?.error || 'No se pudo eliminar el escenario.',
          details: res.data?.details || []
        });
        return;
      }

      if (activeSavedId === id) {
        setActiveSavedId(null);
      }
      setBackendStatus('online');
      const listRes = await apiListScenarios();
      if (listRes.ok && listRes.data.ok) {
        setSavedScenarios(listRes.data.scenarios || []);
      }
      setOperationState({
        status: 'success',
        message: 'Escenario eliminado correctamente.',
        details: []
      });
    } catch (err) {
      setBackendStatus('offline');
      setOperationState({
        status: 'error',
        message: err.message || 'No se pueden guardar cambios en este momento.',
        details: []
      });
    }
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-badge">TUESTE</span>
            <div>
              <h1>Decisiones de Marketing, Precios y Flujo de Caja</h1>
              <p>
                Caso A · Café de especialidad DTC — Rentabilidad de anuncios, valor de vida del cliente (12 meses) y caja real (24 meses)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span className={`server-pill ${backendStatus}`} id="headerSaveStatus">
              {backendStatus === 'online' && '● Guardado disponible'}
              {backendStatus === 'offline' && '▲ Guardado no disponible'}
              {backendStatus === 'checking' && '◌ Comprobando...'}
            </span>
            <button
              id="btnToggleMisEscenarios"
              type="button"
              className="btn btn-primary"
              onClick={() => setShowScenariosPanel(prev => !prev)}
            >
              {showScenariosPanel
                ? '▲ Ocultar Mis escenarios'
                : `📁 Mis escenarios (${savedScenarios.length}) · Guardar escenario`}
            </button>
          </div>
        </div>
      </header>

      <nav className="nav-bar" aria-label="Secciones principales">
        <div className="nav-inner">
          <div className="nav-tabs">
            <button
              id="navTabCalculadora"
              type="button"
              className={`nav-tab-btn ${activeTab === 'calculadora' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculadora')}
            >
              1. Calculadora
            </button>
            <button
              id="navTabTablero"
              type="button"
              className={`nav-tab-btn ${activeTab === 'tablero' ? 'active' : ''}`}
              onClick={() => setActiveTab('tablero')}
            >
              2. Tablero de decisiones
            </button>
            <button
              id="navTabSimulador24m"
              type="button"
              className={`nav-tab-btn ${activeTab === 'simulador24m' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulador24m')}
            >
              3. Simulador de caja de 24 meses
            </button>
            <button
              id="navTabTodas"
              type="button"
              className={`nav-tab-btn ${activeTab === 'todas' ? 'active' : ''}`}
              onClick={() => setActiveTab('todas')}
            >
              Ver las 3 secciones juntas
            </button>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--coffee-700)', fontWeight: 600 }}>
            Meta de Diego: decidir con números claros si conviene duplicar o ajustar la inversión en anuncios
          </span>
        </div>
      </nav>

      <main className="container">
        {/* Si el servidor está desconectado y el panel está cerrado, mostrar el aviso visible sin tapar la pantalla */}
        {backendStatus === 'offline' && !showScenariosPanel && (
          <div className="status-banner error" role="alert" id="offlineWarningBanner" style={{ marginBottom: 0 }}>
            <div>
              <strong>Aviso:</strong> El guardado no está disponible en este momento. La calculadora, el tablero y el simulador siguen funcionando con normalidad, pero <strong>no se pueden guardar cambios</strong> hasta reconectar.
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => refreshSavedScenarios(true)}
            >
              Reintentar conexión
            </button>
          </div>
        )}

        {/* Panel desplegable de Mis escenarios (se abre al pulsar el botón "Mis escenarios · Guardar escenario") */}
        {showScenariosPanel && (
          <SavedScenariosPanel
            backendStatus={backendStatus}
            savedScenarios={savedScenarios}
            activeSavedId={activeSavedId}
            saveFormName={saveFormName}
            saveFormNote={saveFormNote}
            onChangeName={setSaveFormName}
            onChangeNote={setSaveFormNote}
            onSaveNew={handleSaveNewScenario}
            onUpdateActive={handleUpdateActiveScenario}
            onLoadSaved={handleLoadSavedScenario}
            onDuplicateSaved={handleDuplicateSavedScenario}
            onDeleteSaved={handleDeleteSavedScenario}
            onLoadReferencePreset={handleSelectPreset12m}
            onRetryConnection={() => refreshSavedScenarios(true)}
            operationState={operationState}
            onClosePanel={() => setShowScenariosPanel(false)}
          />
        )}

        {/* Sección 1: Calculadora (se muestra primero sus resultados y controles) */}
        {(activeTab === 'calculadora' || activeTab === 'todas') && (
          <CalculadoraSection
            params12m={params12m}
            liveRes={liveRes12m}
            activePresetKey={activePresetKey}
            onSelectPreset={handleSelectPreset12m}
            onRestore={handleRestoreDefaults}
            onChangeParam={handleChangeParam12m}
          />
        )}

        {/* Sección 2: Tablero de decisiones */}
        {(activeTab === 'tablero' || activeTab === 'todas') && (
          <TableroSection
            params12m={params12m}
            liveRes={liveRes12m}
            activePresetKey={activePresetKey}
            onSelectPreset={handleSelectPreset12m}
            onRestore={handleRestoreDefaults}
            onChangeParam={handleChangeParam12m}
          />
        )}

        {/* Sección 3: Simulador de caja de 24 meses */}
        {(activeTab === 'simulador24m' || activeTab === 'todas') && (
          <Simulador24MSection
            plan24m={plan24m}
            liveSim24m={liveSim24m}
            savedScenarios={savedScenarios}
            onChangePlan24m={setPlan24m}
            onResetPlan24m={() => setPlan24m(defaultPlan24m())}
          />
        )}

        {/* Sección secundaria: Información técnica */}
        <details
          className="section-block"
          id="seccion-informacion-tecnica"
          style={{ padding: '1rem 1.4rem', background: 'var(--bg-cream)' }}
        >
          <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.92rem', color: 'var(--coffee-800)' }}>
            Información técnica del sistema
          </summary>
          <div className="info-columns" style={{ marginTop: '0.8rem' }}>
            <div className="info-box" style={{ background: '#fff' }}>
              <h4>Arquitectura y Módulo Compartido</h4>
              <ul>
                <li>
                  <strong>Interfaz (Frontend):</strong> React 18 con Vite y gráficos interactivos mediante Chart.js.
                </li>
                <li>
                  <strong>Servidor (Backend):</strong> Node.js con Express (ejecución local en <code>127.0.0.1:3001</code>).
                </li>
                <li>
                  <strong>Módulo matemático único:</strong> <code>shared/tuesteModel.js</code> compartido por el navegador y el servidor para garantizar resultados idénticos sin redondeos intermedios.
                </li>
              </ul>
            </div>
            <div className="info-box" style={{ background: '#fff' }}>
              <h4>Almacenamiento y Respaldos</h4>
              <ul>
                <li>
                  <strong>Base de datos local:</strong> archivo SQLite en <code>data/tueste.sqlite</code> gestionado con consultas parametrizadas (<code>node:sqlite</code>, requiere Node.js ≥ 22.5.0).
                </li>
                <li>
                  <strong>Respaldos conservados:</strong> tablero estático original en <code>Tueste_Tablero.html</code> y modelo financiero en Excel <code>Tueste_Nivel1_Sistema_Decisiones.xlsx</code>.
                </li>
              </ul>
            </div>
          </div>
        </details>
      </main>

      <footer className="footer-note">
        Caso A - Tueste · Herramienta de análisis de marketing, contribución y flujo de caja para toma de decisiones.
      </footer>
    </div>
  );
}
