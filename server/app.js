import express from 'express';
import {
  MODEL_VERSION,
  PRESETS_12M,
  REFERENCE_PLANS_24M,
  computeScenario,
  simulate24Months,
  validateParams12M,
  validatePlan24M,
  buildAllReferenceResults
} from '../shared/tuesteModel.js';
import {
  getDbPath,
  getDb,
  listSavedScenarios,
  getSavedScenarioById,
  insertSavedScenario,
  updateSavedScenario,
  deleteSavedScenario
} from './db.js';

const READONLY_KEYS = new Set([
  ...Object.keys(PRESETS_12M),
  ...Object.keys(REFERENCE_PLANS_24M)
]);

export function createApp() {
  const app = express();

  // Inicializar base de datos al crear la aplicación
  getDb();

  // CORS local para comunicación entre Vite (puerto 5173) y Express (puerto 3001) en 127.0.0.1 / localhost
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  app.use(express.json({ limit: '256kb' }));

  // Manejo de JSON malformado
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        ok: false,
        error: 'El cuerpo de la petición no es un JSON válido (revisa que no contenga NaN o Infinity sin formato).'
      });
    }
    next(err);
  });

  // 1. Comprobar que el servidor está disponible
  app.get('/api/health', (req, res) => {
    try {
      const db = getDb();
      const countRow = db.prepare('SELECT COUNT(*) AS total FROM scenarios').get();
      res.json({
        ok: true,
        status: 'online',
        modelVersion: MODEL_VERSION,
        dbPath: getDbPath(),
        savedCount: Number(countRow?.total ?? 0),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        status: 'error',
        error: error.message
      });
    }
  });

  // 2. Consultar escenarios guardados y referencias originales de solo lectura
  app.get('/api/scenarios', (req, res) => {
    try {
      const scenarios = listSavedScenarios();
      const references = buildAllReferenceResults();
      res.json({
        ok: true,
        modelVersion: MODEL_VERSION,
        scenarios,
        references
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al consultar los escenarios guardados.',
        details: [error.message]
      });
    }
  });

  // 3. Obtener un escenario por ID (propio en SQLite o referencia original de solo lectura)
  app.get('/api/scenarios/:id', (req, res) => {
    try {
      const rawId = String(req.params.id || '').trim();

      if (PRESETS_12M[rawId]) {
        const preset = PRESETS_12M[rawId];
        const plan24m = {
          investments: Array(24).fill(preset.inversion),
          descBF: preset.descuentoBF,
          bfMode: 'all_cohorts',
          polPack: preset.polPack,
          mesActPack: 1,
          packScope: 'all_orders',
          adopPack: preset.adopcionPack,
          buyTostadora: false,
          mesTostadora: 12
        };
        const result12m = computeScenario(preset);
        const result24m = simulate24Months({ ...plan24m, id: rawId, name: preset.name });
        return res.json({
          ok: true,
          scenario: {
            id: rawId,
            name: preset.name,
            note: preset.description,
            readonly: true,
            modelVersion: MODEL_VERSION,
            params12m: preset,
            plan24m,
            result12m,
            result24m,
            planViable24m: result24m.valid,
            motivosInvalidez24m: result24m.motivosInvalidez
          }
        });
      }

      const idNum = Number(rawId);
      if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({
          ok: false,
          error: 'El identificador del escenario no es válido.'
        });
      }

      const scenario = getSavedScenarioById(idNum);
      if (!scenario) {
        return res.status(404).json({
          ok: false,
          error: `No se encontró el escenario con ID ${idNum}.`
        });
      }

      res.json({ ok: true, scenario });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al obtener el escenario.',
        details: [error.message]
      });
    }
  });

  // Función auxiliar para validar y normalizar el cuerpo de creación / actualización
  function validateScenarioPayload(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { ok: false, errors: ['El cuerpo de la petición debe ser un objeto JSON válido.'] };
    }

    const errors = [];
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      errors.push('El nombre del escenario (name) es obligatorio.');
    } else if (name.length > 120) {
      errors.push('El nombre del escenario no puede exceder 120 caracteres.');
    }

    const note = body.note === undefined || body.note === null ? '' : String(body.note).trim();
    if (note.length > 1000) {
      errors.push('La nota del escenario no puede exceder 1000 caracteres.');
    }

    if ( body.params12m === undefined && body.plan24m === undefined ) {
      errors.push('Debe enviar al menos params12m (12 meses) o plan24m (24 meses).');
      return { ok: false, errors };
    }

    let validated12m = null;
    if (body.params12m !== undefined) {
      const check12 = validateParams12M(body.params12m);
      if (!check12.ok) {
        errors.push(...check12.errors);
      } else {
        validated12m = check12.data;
      }
    }

    let validated24m = null;
    if (body.plan24m !== undefined) {
      const check24 = validatePlan24M(body.plan24m);
      if (!check24.ok) {
        errors.push(...check24.errors);
      } else {
        validated24m = check24.data;
      }
    }

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    // Completar el bloque faltante de forma consistente si solo se envió uno de los dos
    if (!validated12m && validated24m) {
      validated12m = {
        ...PRESETS_12M.actual,
        inversion: validated24m.investments[0],
        descuentoBF: validated24m.descBF,
        polPack: validated24m.polPack,
        adopcionPack: validated24m.adopPack
      };
      delete validated12m.key;
      delete validated12m.name;
      delete validated12m.description;
      delete validated12m.readonly;
    }

    if (!validated24m && validated12m) {
      validated24m = {
        investments: Array(24).fill(validated12m.inversion),
        descBF: validated12m.descuentoBF,
        bfMode: 'all_cohorts',
        polPack: validated12m.polPack,
        mesActPack: 1,
        packScope: 'all_orders',
        adopPack: validated12m.adopcionPack,
        buyTostadora: false,
        mesTostadora: 12
      };
    }

    return {
      ok: true,
      data: {
        name,
        note,
        params12m: validated12m,
        plan24m: validated24m
      }
    };
  }

  // 4. Crear un escenario propio en SQLite
  app.post('/api/scenarios', (req, res) => {
    try {
      const validation = validateScenarioPayload(req.body);
      if (!validation.ok) {
        return res.status(400).json({
          ok: false,
          error: 'Datos de entrada inválidos. Revisa los rangos y que el plan tenga 24 meses.',
          details: validation.errors
        });
      }

      const created = insertSavedScenario(validation.data);
      res.status(201).json({
        ok: true,
        scenario: created
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al guardar el escenario en SQLite.',
        details: [error.message]
      });
    }
  });

  // 5. Actualizar un escenario propio en SQLite (impide sobrescribir referencias originales)
  app.put('/api/scenarios/:id', (req, res) => {
    try {
      const rawId = String(req.params.id || '').trim();
      if (READONLY_KEYS.has(rawId)) {
        return res.status(403).json({
          ok: false,
          error: 'Los escenarios originales de referencia son de solo lectura y no pueden sobrescribirse.'
        });
      }

      const idNum = Number(rawId);
      if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({
          ok: false,
          error: 'El identificador del escenario no es válido.'
        });
      }

      const validation = validateScenarioPayload(req.body);
      if (!validation.ok) {
        return res.status(400).json({
          ok: false,
          error: 'Datos de entrada inválidos. Revisa los rangos y que el plan tenga 24 meses.',
          details: validation.errors
        });
      }

      const updated = updateSavedScenario(idNum, validation.data);
      if (!updated) {
        return res.status(404).json({
          ok: false,
          error: `No se encontró el escenario con ID ${idNum}.`
        });
      }

      res.json({
        ok: true,
        scenario: updated
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al actualizar el escenario en SQLite.',
        details: [error.message]
      });
    }
  });

  // 6. Eliminar un escenario propio de SQLite (impide eliminar referencias originales)
  app.delete('/api/scenarios/:id', (req, res) => {
    try {
      const rawId = String(req.params.id || '').trim();
      if (READONLY_KEYS.has(rawId)) {
        return res.status(403).json({
          ok: false,
          error: 'Los escenarios originales de referencia son de solo lectura y no pueden eliminarse.'
        });
      }

      const idNum = Number(rawId);
      if (!Number.isInteger(idNum) || idNum <= 0) {
        return res.status(400).json({
          ok: false,
          error: 'El identificador del escenario no es válido.'
        });
      }

      const deleted = deleteSavedScenario(idNum);
      if (!deleted) {
        return res.status(404).json({
          ok: false,
          error: `No se encontró el escenario con ID ${idNum}.`
        });
      }

      res.json({
        ok: true,
        deletedId: idNum
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al eliminar el escenario.',
        details: [error.message]
      });
    }
  });

  // 7. Calcular un escenario mediante el módulo compartido (sin guardarlo)
  // No confía en resultados enviados por el cliente: valida entradas y recalcula.
  app.post('/api/calculate', (req, res) => {
    try {
      const body = req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({
          ok: false,
          error: 'El cuerpo de la petición debe ser un objeto JSON válido.'
        });
      }

      const errors = [];
      let result12m = null;
      let result24m = null;

      if (body.params12m === undefined && body.plan24m === undefined) {
        return res.status(400).json({
          ok: false,
          error: 'Debe enviar params12m y/o plan24m para calcular.'
        });
      }

      if (body.params12m !== undefined) {
        const check12 = validateParams12M(body.params12m);
        if (!check12.ok) {
          errors.push(...check12.errors);
        } else {
          result12m = computeScenario(check12.data);
        }
      }

      if (body.plan24m !== undefined) {
        const check24 = validatePlan24M(body.plan24m);
        if (!check24.ok) {
          errors.push(...check24.errors);
        } else {
          result24m = simulate24Months({
            ...check24.data,
            id: body.plan24m.id || 'calc24m',
            name: body.plan24m.name || 'Plan Calculado'
          });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          ok: false,
          error: 'Datos de entrada inválidos.',
          details: errors
        });
      }

      res.json({
        ok: true,
        modelVersion: MODEL_VERSION,
        result12m,
        result24m,
        planViable24m: result24m ? result24m.valid : null,
        motivosInvalidez24m: result24m ? result24m.motivosInvalidez : null
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: 'Error al calcular el escenario.',
        details: [error.message]
      });
    }
  });

  return app;
}

