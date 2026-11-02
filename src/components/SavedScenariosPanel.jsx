import React, { useState, useEffect } from 'react';
import { PRESETS_12M, fmtUSD } from '../../shared/tuesteModel.js';

export function SavedScenariosPanel({
  backendStatus,
  savedScenarios,
  activeSavedId,
  saveFormName,
  saveFormNote,
  onChangeName,
  onChangeNote,
  onSaveNew,
  onUpdateActive,
  onLoadSaved,
  onDuplicateSaved,
  onDeleteSaved,
  onLoadReferencePreset,
  onRetryConnection,
  operationState,
  onClosePanel
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const isBusy = operationState.status === 'saving' || operationState.status === 'loading';
  const isOffline = backendStatus === 'offline';

  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'Escape' && onClosePanel) {
        onClosePanel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClosePanel]);

  const formatDate = iso => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div
      className="drawer-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget && onClosePanel) onClosePanel();
      }}
    >
      <aside
        className="drawer-panel"
        id="panel-mis-escenarios"
        role="dialog"
        aria-modal="true"
        aria-label="Mis escenarios"
      >
        <div className="notebook-header" style={{ marginBottom: 0 }}>
          <div>
            <span className="notebook-kicker">Archivo del cuaderno</span>
            <h2 className="notebook-title">Mis escenarios</h2>
            <p className="notebook-subtitle">
              Guarda combinaciones de presupuesto, precios y recompra con un nombre y una nota para retomarlas después.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className={`save-status-discrete ${backendStatus}`}>
              <span className="save-status-dot" />
              {backendStatus === 'online' && 'Guardado disponible'}
              {backendStatus === 'offline' && 'Guardado no disponible'}
              {backendStatus === 'checking' && 'Comprobando...'}
            </span>
            <button
              type="button"
              className="btn btn-text"
              onClick={onRetryConnection}
              disabled={isBusy}
            >
              Reintentar
            </button>
            {onClosePanel && (
              <button
                type="button"
                className="btn"
                onClick={onClosePanel}
              >
                Cerrar panel
              </button>
            )}
          </div>
        </div>

        {/* Aviso si el servidor no está disponible */}
        {isOffline && (
          <div className="status-banner error" role="alert" id="offlineWarningBanner">
            <div>
              <strong>Aviso:</strong> El guardado no está disponible en este momento. La calculadora, el tablero y el simulador siguen funcionando sin perder tus entradas, pero <strong>no se pueden guardar cambios</strong> hasta reconectar.
            </div>
            <button type="button" className="btn" onClick={onRetryConnection}>
              Reintentar
            </button>
          </div>
        )}

        {/* Estado de operación */}
        {operationState.status !== 'idle' && (
          <div
            id="operationStatusBanner"
            className={`status-banner ${
              operationState.status === 'error'
                ? 'error'
                : operationState.status === 'success'
                ? 'success'
                : 'info'
            }`}
            role="status"
          >
            <div>
              {operationState.status === 'loading' && '[Cargando] '}
              {operationState.status === 'saving' && '[Guardando] '}
              {operationState.status === 'success' && '[OK] '}
              {operationState.status === 'error' && '[!] '}
              <span>{operationState.message}</span>
              {operationState.details && operationState.details.length > 0 && (
                <ul style={{ marginTop: '0.35rem', paddingLeft: '1.2rem', fontSize: '0.79rem' }}>
                  {operationState.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="saved-panel-grid">
          {/* Formulario para Guardar escenario o Guardar cambios */}
          <div className="assumptions-panel">
            <div className="assumptions-panel-header">
              <h3>Guardar escenario</h3>
            </div>

            <div className="control-item">
              <div className="control-row-top">
                <label htmlFor="inputScenarioName">Nombre del escenario *</label>
              </div>
              <input
                id="inputScenarioName"
                type="text"
                maxLength={120}
                placeholder="Ej. Plan prudente $4.000 + Pack"
                value={saveFormName}
                onChange={e => onChangeName(e.target.value)}
              />
            </div>

            <div className="control-item">
              <div className="control-row-top">
                <label htmlFor="inputScenarioNote">Nota para la reunión (opcional)</label>
              </div>
              <textarea
                id="inputScenarioNote"
                rows={3}
                maxLength={1000}
                placeholder="Ej. Respeta el piso de $5.000 y evalúa el Pack en prueba de 60 días."
                value={saveFormNote}
                onChange={e => onChangeNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                id="btnSaveNewScenario"
                type="button"
                className="btn btn-terracotta"
                disabled={isBusy}
                onClick={onSaveNew}
              >
                {operationState.status === 'saving'
                  ? 'Guardando...'
                  : 'Guardar como nuevo escenario'}
              </button>

              {activeSavedId && (
                <button
                  id="btnUpdateActiveScenario"
                  type="button"
                  className="btn btn-olive"
                  disabled={isBusy}
                  onClick={onUpdateActive}
                >
                  Guardar cambios en escenario activo
                </button>
              )}
            </div>

            <div className="control-note" style={{ marginTop: '0.65rem' }}>
              Conserva tanto los supuestos de 12 meses como el calendario de 24 meses. Si un plan incumple el piso de $5.000, se guarda con la indicación de plan inviable.
            </div>
          </div>

          {/* Lista de escenarios guardados */}
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1rem',
                marginBottom: '0.55rem',
                color: 'var(--ink)'
              }}
            >
              Escenarios guardados ({savedScenarios.length})
            </h3>
            <div className="table-responsive" style={{ marginBottom: '1rem' }}>
              <table id="tablaEscenariosGuardados">
                <thead>
                  <tr>
                    <th>Nombre y nota</th>
                    <th>Fecha</th>
                    <th className="num">Costo / Contribución 12M</th>
                    <th className="num">Recuperación</th>
                    <th className="num">Caja al mes 24</th>
                    <th>¿Cumple reglas?</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {savedScenarios.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '1rem' }}>
                        Aún no hay escenarios guardados. Escribe un nombre a la izquierda y pulsa "Guardar como nuevo escenario".
                      </td>
                    </tr>
                  ) : (
                    savedScenarios.map(sc => {
                      const isSelected = activeSavedId === sc.id;
                      const r12 = sc.result12m;
                      const r24 = sc.result24m;
                      const viable = sc.planViable24m ?? r24?.valid;
                      return (
                        <tr
                          key={sc.id}
                          className={!viable ? 'row-violation' : isSelected ? 'row-winner' : ''}
                        >
                          <td>
                            <strong>{sc.name}</strong>
                            {sc.note && (
                              <div style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)', marginTop: '0.15rem' }}>
                                {sc.note}
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                            {formatDate(sc.updatedAt)}
                          </td>
                          <td className="num">
                            {r12?.cacReal !== null ? fmtUSD(r12?.cacReal, 2) : 'N/A'} / {fmtUSD(r12?.ltvPond, 2)}
                          </td>
                          <td className="num">{r12?.paybackLabel}</td>
                          <td className="num">
                            <strong>{fmtUSD(r24?.cajaMes24, 2)}</strong>
                          </td>
                          <td>
                            <span className={`status-tag ${viable ? 'ok' : 'danger'}`}>
                              {viable ? '[OK] Cumple' : '[!] Incumple'}
                            </span>
                            {!viable && r24?.motivosInvalidez?.length > 0 && (
                              <div style={{ fontSize: '0.71rem', marginTop: '0.2rem' }}>
                                {r24.motivosInvalidez[0]}
                              </div>
                            )}
                          </td>
                          <td>
                            {confirmDeleteId === sc.id ? (
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  onClick={() => {
                                    setConfirmDeleteId(null);
                                    onDeleteSaved(sc.id);
                                  }}
                                  disabled={isBusy}
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-text"
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => onLoadSaved(sc)}
                                  disabled={isBusy}
                                >
                                  Cargar
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => onDuplicateSaved(sc)}
                                  disabled={isBusy}
                                >
                                  Duplicar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger"
                                  onClick={() => setConfirmDeleteId(sc.id)}
                                  disabled={isBusy}
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <details className="notebook-details">
              <summary>Escenarios originales del caso (solo lectura)</summary>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {Object.values(PRESETS_12M).map(p => (
                  <button
                    key={p.key}
                    type="button"
                    className="btn"
                    onClick={() => onLoadReferencePreset(p.key)}
                  >
                    Cargar: {p.name}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>
      </aside>
    </div>
  );
}
