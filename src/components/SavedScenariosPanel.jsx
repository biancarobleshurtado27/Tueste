import React, { useState } from 'react';
import { PRESETS_12M, fmtUSD, fmtNum } from '../../shared/tuesteModel.js';

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
  operationState
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const isBusy = operationState.status === 'saving' || operationState.status === 'loading';
  const isOffline = backendStatus === 'offline';

  const formatDate = iso => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <section className="section-block" id="persistencia-sqlite">
      <div className="section-header">
        <div>
          <span className="section-step">Gestión de Escenarios · SQLite Local</span>
          <h2 className="section-title">Guardar, Cargar, Duplicar y Comparar Escenarios</h2>
          <p className="section-subtitle">
            Los escenarios originales del caso están protegidos como referencias de solo lectura. Tus escenarios propios se validan y recalculan en el backend Node.js + Express y se almacenan en SQLite local (<code>data/tueste.sqlite</code>).
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className={`server-pill ${backendStatus}`}>
            {backendStatus === 'online' && '● Backend y SQLite Conectados'}
            {backendStatus === 'offline' && '▲ Backend no disponible (Modo Cálculo Local)'}
            {backendStatus === 'checking' && '◌ Comprobando servidor...'}
          </span>
          <button
            type="button"
            className="btn"
            onClick={onRetryConnection}
            disabled={isBusy}
          >
            ↻ Comprobar conexión
          </button>
        </div>
      </div>

      {/* Aviso persistente si el backend no está disponible */}
      {isOffline && (
        <div className="status-banner error" role="alert" id="offlineWarningBanner">
          <div>
            <strong>Aviso de conexión:</strong> El servidor backend no está disponible en este momento. Puedes seguir calculando y simulando en las 3 secciones sin perder tus datos de entrada, pero <strong>no se pueden guardar, actualizar ni eliminar escenarios en SQLite</strong> hasta reconectar el servidor.
          </div>
          <button type="button" className="btn" onClick={onRetryConnection}>
            Reintentar conexión
          </button>
        </div>
      )}

      {/* Estado visible de guardado, carga o error */}
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
            {operationState.status === 'loading' && '⏳ Cargando datos desde SQLite... '}
            {operationState.status === 'saving' && '💾 Guardando y recalculando escenario en el servidor... '}
            {operationState.status === 'success' && '✅ '}
            {operationState.status === 'error' && '⚠️ '}
            <span>{operationState.message}</span>
            {operationState.details && operationState.details.length > 0 && (
              <ul style={{ marginTop: '0.35rem', paddingLeft: '1.2rem', fontSize: '0.8rem' }}>
                {operationState.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="saved-panel-grid">
        {/* Formulario para Guardar o Actualizar Escenario */}
        <div className="controls-panel">
          <h3>
            {activeSavedId
              ? `Guardar o Actualizar Escenario (ID #${activeSavedId})`
              : 'Guardar Configuración Actual en SQLite'}
          </h3>
          <div className="control-group">
            <div className="control-header">
              <label htmlFor="inputScenarioName">Nombre del escenario *</label>
            </div>
            <input
              id="inputScenarioName"
              type="text"
              maxLength={120}
              placeholder="Ej. Propuesta Diego $4.000 + Pack"
              value={saveFormName}
              onChange={e => onChangeName(e.target.value)}
            />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label htmlFor="inputScenarioNote">Nota o justificación (opcional)</label>
            </div>
            <textarea
              id="inputScenarioNote"
              rows={3}
              maxLength={1000}
              placeholder="Ej. Mantiene piso >= $5.000 y evalúa Pack $48 en piloto de 60 días."
              value={saveFormNote}
              onChange={e => onChangeNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <button
              id="btnSaveNewScenario"
              type="button"
              className="btn btn-primary"
              disabled={isBusy}
              onClick={onSaveNew}
            >
              {operationState.status === 'saving'
                ? 'Guardando...'
                : '💾 Guardar como nuevo escenario'}
            </button>

            {activeSavedId && (
              <button
                id="btnUpdateActiveScenario"
                type="button"
                className="btn"
                disabled={isBusy}
                onClick={onUpdateActive}
              >
                ✎ Sobrescribir escenario seleccionado (#{activeSavedId})
              </button>
            )}
          </div>

          <div className="control-hint" style={{ marginTop: '0.65rem' }}>
            Se guardan tanto las entradas de la Calculadora/Tablero (12M) como el calendario de 24 meses del Simulador, junto con la versión del modelo y las marcas de fecha. Si un plan de 24M incumple el piso de caja ($5.000), se permite guardar y se etiqueta como <strong>Plan Inviable</strong>.
          </div>
        </div>

        {/* Lista de Escenarios Guardados y Referencias Originales */}
        <div>
          <h3 style={{ fontSize: '0.98rem', marginBottom: '0.55rem', color: 'var(--coffee-900)' }}>
            Escenarios Propios Guardados en SQLite ({savedScenarios.length})
          </h3>
          <div className="table-responsive" style={{ marginBottom: '1.1rem' }}>
            <table id="tablaEscenariosGuardados">
              <thead>
                <tr>
                  <th>Nombre y Nota</th>
                  <th>Actualizado</th>
                  <th className="num">CAC Real / LTV 12M</th>
                  <th className="num">Payback 12M</th>
                  <th className="num">Caja Final M24</th>
                  <th>Viabilidad 24M</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {savedScenarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--coffee-500)', padding: '1rem' }}>
                      No hay escenarios propios guardados aún. Usa el formulario de la izquierda para guardar tu primer escenario en SQLite.
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
                          <strong>
                            #{sc.id} · {sc.name}
                          </strong>
                          {sc.note && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--coffee-700)', marginTop: '0.15rem' }}>
                              {sc.note}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
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
                          <span className={viable ? 'badge-ok' : 'badge-danger'}>
                            {viable ? 'Plan Viable' : 'Plan Inviable'}
                          </span>
                          {!viable && r24?.motivosInvalidez?.length > 0 && (
                            <div style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>
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
                                Confirmar eliminar
                              </button>
                              <button
                                type="button"
                                className="btn"
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

          <details style={{ background: 'var(--bg-cream)', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: 'var(--coffee-800)' }}>
              Escenarios Originales de Referencia (Solo Lectura — Protegidos contra sobrescritura)
            </summary>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.65rem' }}>
              {Object.values(PRESETS_12M).map(p => (
                <button
                  key={p.key}
                  type="button"
                  className="btn"
                  onClick={() => onLoadReferencePreset(p.key)}
                >
                  🔒 Cargar referencia: {p.name}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

