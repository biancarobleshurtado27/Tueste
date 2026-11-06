import { DecisionBrief } from './components/DecisionBrief.jsx';
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

const DRAFT_KEY = 'tueste.workbench.v1';
function readDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') || {}; }
  catch { return {}; }
}
const initialDraft = readDraft();

function ReferralInvite() {
  const [tried, setTried] = useState(() => localStorage.getItem('tueste.referral.tried') === 'yes');
  const [notice, setNotice] = useState('');
  const referralUrl = new URL(window.location.pathname, window.location.origin);
  referralUrl.searchParams.set('tab', 'referidos');
  referralUrl.searchParams.set('ref', 'demo-camila');
  const message = `Te invito a probar Tueste: recibí una muestra de café de 100 g con tu primera compra. ${referralUrl.href} (demostración simulada)`;
  const confirmTried = () => { setTried(true); localStorage.setItem('tueste.referral.tried', 'yes'); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(referralUrl.href); setNotice('Enlace copiado. Es una invitación de demostración local.'); }
    catch { setNotice('No se pudo copiar automáticamente. Seleccioná el enlace y copialo manualmente.'); }
  };
  return <section className="referral-page" aria-labelledby="referral-title">
    <div className="referral-heading"><span className="notebook-kicker">PARTE 2 / REGALA UNA PRIMERA TAZA</span><span className="referral-demo">Demostración simulada · paso 1</span></div>
    <div className="referral-layout">
      <div className="referral-story"><h1 id="referral-title">El buen café<br /><em>se comparte.</em></h1><p>Si Tueste ya es parte de tus mañanas, invitá a alguien a descubrirlo. Tu amigo recibe una muestra de 100 g con su primera compra y vos ganás $5 para tu próximo pedido.</p><div className="referral-stamp">340 g de origen.<br />Una nueva historia en cada taza.</div><p className="control-note">Cliente de ejemplo: Camila · simulado. No se han realizado compras ni emitido recompensas reales.</p></div>
      <div className="referral-invite">
        {!tried ? <><span className="decision-label">PRIMERO, DISFRUTALO VOS</span><h2>¿Ya recibiste y probaste tu café?</h2><p>La invitación llega después de la experiencia. En esta demostración podés confirmar la entrega y la prueba para continuar.</p><button className="btn btn-olive" onClick={confirmTried}>Sí, ya lo recibí y lo probé · simulado</button></> : <><span className="decision-label">TU INVITACIÓN ESTÁ LISTA</span><h2>Una primera taza, de tu parte.</h2><div className="referral-message">{message}</div><a className="btn btn-olive referral-share" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">Preparar mensaje en WhatsApp ↗</a><button className="btn" onClick={copy}>Copiar mi enlace</button><label htmlFor="referral-link">Enlace personal · simulado</label><input id="referral-link" readOnly value={referralUrl.href} onFocus={e => e.target.select()} /><p className="control-note">WhatsApp abre el mensaje; vos decidís si enviarlo. Este enlace usa la dirección local: para probarlo en otro dispositivo hace falta publicar o compartir el servidor.</p><p className="control-note">La página de compra del amigo se construirá en el siguiente paso. Este enlace abre por ahora la demostración de referidos.</p></>}
        <div role="status" aria-live="polite">{notice}</div>
      </div>
    </div>
    <div className="referral-rewards"><article><span>01 / TU AMIGO</span><h3>Una muestra de 100 g</h3><p>Incluida en su primera compra. Sin envío adicional para el regalo.</p></article><article><span>02 / PARA VOS</span><h3>$5 para volver</h3><p>Al completar la compra elegible de un amigo nuevo. No se acredita por compartir.</p></article><article><span>03 / TRES AMIGOS</span><h3>Una bolsa de 340 g</h3><p>Un premio por cada ciclo de tres amigos compradores distintos, dentro de tu próximo pedido.</p></article></div>
    <details className="notebook-details"><summary>Condiciones de esta propuesta</summary><p>Si un amigo inicia una suscripción pagada, recibís además una muestra de 100 g en tu próximo pedido. Una compra se cuenta una sola vez; no cuentan autorreferidos. Los regalos viajan dentro de pedidos y el saldo se usa en un próximo pedido. Las recompensas y el seguimiento se implementarán en la siguiente etapa.</p><p>Costo máximo conservador por referido que dispara todos los premios: $1,60 + $5 + $5,44 + $1,60 = $13,64. Tope del caso: $25. Condiciones propuestas para demostración.</p></details>
    <button className="btn btn-text" onClick={() => { if (window.confirm('¿Reiniciar únicamente esta demostración de invitación?')) { localStorage.removeItem('tueste.referral.tried'); setTried(false); setNotice(''); } }}>Reiniciar esta demostración</button>
  </section>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t === 'calculadora' || t === 'tablero' || t === 'simulador24m' || t === 'todas' || t === 'referidos') {
        return t;
      }
    }
    return ['calculadora','tablero','simulador24m','todas','referidos'].includes(initialDraft.activeTab) ? initialDraft.activeTab : 'tablero';
  }); // 'calculadora' | 'tablero' | 'simulador24m' | 'todas'

  const [showScenariosPanel, setShowScenariosPanel] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('panel=open')) {
      return true;
    }
    return false;
  });

  const [activePresetKey, setActivePresetKey] = useState(initialDraft.activePresetKey === undefined ? 'actual' : initialDraft.activePresetKey);
  const [lastPresetKey, setLastPresetKey] = useState(initialDraft.lastPresetKey || 'actual');
  const [params12m, setParams12m] = useState(() => ({ ...stripPresetMeta(PRESETS_12M.actual), ...initialDraft.params12m }));
  const [plan24m, setPlan24m] = useState(() => ({ ...defaultPlan24m(), ...initialDraft.plan24m }));

  // Estado de guardado y conexión
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [activeSavedId, setActiveSavedId] = useState(null);
  const [saveFormName, setSaveFormName] = useState(initialDraft.saveFormName || '');
  const [saveFormNote, setSaveFormNote] = useState(initialDraft.saveFormNote || '');
  const [operationState, setOperationState] = useState({
    status: 'idle', // 'idle' | 'loading' | 'saving' | 'success' | 'error'
    message: '',
    details: []
  });

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ activeTab, activePresetKey, lastPresetKey, params12m, plan24m, saveFormName, saveFormNote }));
    } catch { /* La aplicación sigue calculando si el navegador bloquea el almacenamiento. */ }
  }, [activeTab, activePresetKey, lastPresetKey, params12m, plan24m, saveFormName, saveFormNote]);

  // Cálculo instantáneo en vivo
  const liveRes12m = computeScenario(params12m);
  const liveSim24m = simulate24Months({
    ...plan24m,
    id: 'propioB',
    name: 'Plan 4: Propio B (Editable — Meta + Política Pack/Envío)',
    shortName: 'Propio B (Editable)'
  });

  const activeSavedObj = savedScenarios.find(sc => sc.id === activeSavedId) || null;

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
    setLastPresetKey(presetKey);
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
    setLastPresetKey('actual');
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
      message: `Guardando cambios en "${trimmedName}"...`,
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
        message: `Cambios guardados en "${updated.name}".`,
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
      message: `Escenario "${sc.name}" cargado en el cuaderno.`,
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
      {/* 1. ENCABEZADO COMPACTO EDITORIAL */}
      <header className="roaster-header">
        <div className="roaster-header-inner">
          <div className="roaster-brand">
            <span className="roaster-wordmark">TUESTE</span>
            <span className="roaster-descriptor">Origen y balance</span>
          </div>

          <nav className="roaster-nav" aria-label="Secciones principales">
            <button
              id="navTabCalculadora"
              type="button"
              className={`roaster-nav-btn ${activeTab === 'calculadora' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculadora')}
            >
              Calculadora
            </button>
            <button
              id="navTabTablero"
              type="button"
              className={`roaster-nav-btn ${activeTab === 'tablero' ? 'active' : ''}`}
              onClick={() => setActiveTab('tablero')}
            >
              Tablero
            </button>
            <button
              id="navTabSimulador24m"
              type="button"
              className={`roaster-nav-btn ${activeTab === 'simulador24m' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulador24m')}
            >
              Caja a 24 meses
            </button>
            <button type="button" className={`roaster-nav-btn ${activeTab === 'referidos' ? 'active' : ''}`} onClick={() => setActiveTab('referidos')}>Referidos</button>
          </nav>

          <div className="roaster-actions">
            <span className={`save-status-discrete ${backendStatus}`} id="headerSaveStatus">
              <span className="save-status-dot" />
              {backendStatus === 'online' && 'Guardado disponible'}
              {backendStatus === 'offline' && 'Guardado no disponible'}
              {backendStatus === 'checking' && 'Comprobando...'}
            </span>
            <button
              id="btnToggleMisEscenarios"
              type="button"
              className="btn"
              aria-expanded={showScenariosPanel}
              onClick={() => setShowScenariosPanel(prev => !prev)}
            >
              Mis escenarios ({savedScenarios.length})
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Aviso visible si se pierde la conexión para guardar */}
        {backendStatus === 'offline' && !showScenariosPanel && (
          <div className="status-banner error" role="alert" id="offlineWarningBanner">
            <div>
              <strong>Aviso:</strong> El guardado no está disponible en este momento. La calculadora, el tablero y el simulador siguen funcionando con normalidad, pero <strong>no se pueden guardar cambios</strong> hasta reconectar.
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => refreshSavedScenarios(true)}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Panel lateral desplegable de Mis escenarios */}
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

        {(activeTab === 'tablero' || activeTab === 'todas') && <DecisionBrief onExplore={() => document.getElementById('seccion-tablero')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />}

        {activeTab === 'referidos' && <ReferralInvite />}
        {/* Sección 1: Calculadora */}
        {(activeTab === 'calculadora' || activeTab === 'todas') && (
          <CalculadoraSection
            params12m={params12m}
            liveRes={liveRes12m}
            activePresetKey={activePresetKey}
            lastPresetKey={lastPresetKey}
            activeSavedName={activeSavedObj ? activeSavedObj.name : null}
            onSelectPreset={handleSelectPreset12m}
            onRestore={handleRestoreDefaults}
            onChangeParam={handleChangeParam12m}
          />
        )}

        {/* Sección 2: Tablero */}
        {(activeTab === 'tablero' || activeTab === 'todas') && (
          <TableroSection
            params12m={params12m}
            liveRes={liveRes12m}
            activePresetKey={activePresetKey}
            lastPresetKey={lastPresetKey}
            activeSavedName={activeSavedObj ? activeSavedObj.name : null}
            onSelectPreset={handleSelectPreset12m}
            onRestore={handleRestoreDefaults}
            onChangeParam={handleChangeParam12m}
          />
        )}

        {/* Sección 3: Caja a 24 meses */}
        {(activeTab === 'simulador24m' || activeTab === 'todas') && (
          <Simulador24MSection
            plan24m={plan24m}
            liveSim24m={liveSim24m}
            savedScenarios={savedScenarios}
            onChangePlan24m={setPlan24m}
            onResetPlan24m={() => setPlan24m(defaultPlan24m())}
          />
        )}

        {/* Sección secundaria al pie: Fuentes, supuestos y verificación */}
        <details className="notebook-details" id="seccion-informacion-tecnica">
          <summary>Fuentes del caso, supuestos y verificación técnica</summary>
          <div className="info-columns">
            <div className="info-box">
              <h4>Fuentes del caso Tueste y reglas de negocio</h4>
              <ul>
                <li>
                  <strong>Datos históricos verificados:</strong> bolsa de 340 g a $17 (pedido típico de 2 bolsas = $34), café tostado $5,44/bolsa, empaque $1,20 (2 bolsas) / $1,40 (3 bolsas), envío $4,50, pasarela 4,5%, suscripción mensual $30,60 (-10%) con permanencia del 91%/mes, y curva de clientes nuevos en Meta: (0,0), ($4k, 100), ($8k, 165), ($12k, 210), ($16k, 235), ($20k, 250).
                </li>
                <li>
                  <strong>Supuestos sujetos a validación comercial:</strong> el Pack degustación de 3 bolsas ($48) y el cobro de $4,50 de envío en pedidos sueltos bajo $45 son propuestas comerciales cuyos beneficios no están garantizados sin una prueba piloto.
                </li>
              </ul>
            </div>
            <div className="info-box">
              <h4>Información técnica del sistema</h4>
              <ul>
                <li>
                  <strong>Cálculo unificado:</strong> las tres vistas y el guardado local comparten el mismo motor matemático sin redondeos intermedios.
                </li>
                <li>
                  <strong>Persistencia local:</strong> los escenarios creados en "Mis escenarios" se almacenan localmente en base de datos SQLite para consulta y comparación sin requerir servicios externos.
                </li>
              </ul>
            </div>
          </div>
        </details>
      </main>

      <footer className="footer-note">
        TUESTE · Cuaderno de decisiones para crecer · Análisis de publicidad, contribución por cliente y caja de la empresa.
      </footer>
    </div>
  );
}
