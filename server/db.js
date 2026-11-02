import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
  MODEL_VERSION,
  computeScenario,
  simulate24Months
} from '../shared/tuesteModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PROJECT_ROOT = path.resolve(__dirname, '..');

export const DEFAULT_DB_PATH = path.join(PROJECT_ROOT, 'data', 'tueste.sqlite');

export function getDbPath() {
  return process.env.TUESTE_DB_PATH
    ? path.resolve(process.env.TUESTE_DB_PATH)
    : DEFAULT_DB_PATH;
}

let dbInstance = null;
let currentDbPath = null;

export function getDb() {
  const targetPath = getDbPath();
  if (dbInstance && currentDbPath === targetPath) {
    return dbInstance;
  }
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore close error
    }
  }
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  dbInstance = new DatabaseSync(targetPath);
  currentDbPath = targetPath;

  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      params12m_json TEXT NOT NULL,
      plan24m_json TEXT NOT NULL,
      model_version TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  return dbInstance;
}

export function closeDb() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
    currentDbPath = null;
  }
}

export function hydrateScenarioRow(row) {
  if (!row) return null;
  const params12m = JSON.parse(row.params12m_json);
  const plan24m = JSON.parse(row.plan24m_json);

  // Recalcular siempre en el servidor usando el módulo compartido (nunca confiar en el cliente)
  const result12m = computeScenario(params12m);
  const result24m = simulate24Months({
    ...plan24m,
    id: `saved_${row.id}`,
    name: row.name,
    shortName: row.name
  });

  return {
    id: row.id,
    name: row.name,
    note: row.note,
    readonly: false,
    modelVersion: row.model_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    params12m,
    plan24m,
    result12m,
    result24m,
    planViable24m: result24m.valid,
    motivosInvalidez24m: result24m.motivosInvalidez
  };
}

export function listSavedScenarios() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, name, note, params12m_json, plan24m_json, model_version, created_at, updated_at
    FROM scenarios
    ORDER BY updated_at DESC, id DESC
  `);
  const rows = stmt.all();
  return rows.map(hydrateScenarioRow);
}

export function getSavedScenarioById(id) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, name, note, params12m_json, plan24m_json, model_version, created_at, updated_at
    FROM scenarios
    WHERE id = ?
  `);
  const row = stmt.get(Number(id));
  return hydrateScenarioRow(row);
}

export function insertSavedScenario({ name, note, params12m, plan24m }) {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO scenarios (name, note, params12m_json, plan24m_json, model_version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    name.trim(),
    (note || '').trim(),
    JSON.stringify(params12m),
    JSON.stringify(plan24m),
    MODEL_VERSION,
    now,
    now
  );
  return getSavedScenarioById(Number(info.lastInsertRowid));
}

export function updateSavedScenario(id, { name, note, params12m, plan24m }) {
  const db = getDb();
  const existing = getSavedScenarioById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE scenarios
    SET name = ?, note = ?, params12m_json = ?, plan24m_json = ?, model_version = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(
    name.trim(),
    (note || '').trim(),
    JSON.stringify(params12m),
    JSON.stringify(plan24m),
    MODEL_VERSION,
    now,
    Number(id)
  );
  return getSavedScenarioById(Number(id));
}

export function deleteSavedScenario(id) {
  const db = getDb();
  const existing = getSavedScenarioById(id);
  if (!existing) return false;

  const stmt = db.prepare(`DELETE FROM scenarios WHERE id = ?`);
  const info = stmt.run(Number(id));
  return info.changes > 0;
}

