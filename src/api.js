// ============================================================================
// CLIENTE API PARA COMUNICACIÓN CON EL BACKEND EXPRESS + SQLITE
// ============================================================================

const DIRECT_BACKEND_URL = 'http://127.0.0.1:3001';

async function fetchWithFallback(path, options = {}) {
  // Intentar primero la ruta relativa (/api/...) servida por el proxy de Vite;
  // si falla o devuelve HTML, intentar directamente contra http://127.0.0.1:3001
  const candidates = [path, `${DIRECT_BACKEND_URL}${path}`];
  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {})
        }
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Respuesta no es JSON');
      }
      const data = await res.json();
      return { status: res.status, ok: res.ok, data };
    } catch (err) {
      lastError = err;
    }
  }

  const offlineError = new Error(
    'El servidor backend no está disponible. Puedes seguir calculando en vivo en las 3 secciones, pero no se pueden guardar cambios en SQLite hasta reconectar.'
  );
  offlineError.isOffline = true;
  offlineError.cause = lastError;
  throw offlineError;
}

export async function apiCheckHealth() {
  return fetchWithFallback('/api/health', { method: 'GET' });
}

export async function apiListScenarios() {
  return fetchWithFallback('/api/scenarios', { method: 'GET' });
}

export async function apiGetScenario(id) {
  return fetchWithFallback(`/api/scenarios/${encodeURIComponent(id)}`, { method: 'GET' });
}

export async function apiCreateScenario(payload) {
  return fetchWithFallback('/api/scenarios', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function apiUpdateScenario(id, payload) {
  return fetchWithFallback(`/api/scenarios/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function apiDeleteScenario(id) {
  return fetchWithFallback(`/api/scenarios/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export async function apiCalculateScenario(payload) {
  return fetchWithFallback('/api/calculate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

