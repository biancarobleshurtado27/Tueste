import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

// Verificar si el proceso actual de Node soporta el módulo nativo node:sqlite (Node.js >= 22.5.0)
let hasNativeSqlite = false;
try {
  await import('node:sqlite');
  hasNativeSqlite = true;
} catch {
  hasNativeSqlite = false;
}

if (!hasNativeSqlite) {
  // Búsqueda genérica sin rutas personales fijas por si el sistema tiene varias versiones en NVM o caché
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const candidates = [
    process.env.NODE_SQLITE_BIN,
    path.join(home, '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'bin', 'node.exe'),
    path.join(localAppData, 'Author Software', 'nvm', 'installs', 'v22.23.2', 'node.exe')
  ].filter(Boolean);

  const modernNode = candidates.find(p => fs.existsSync(p));
  if (modernNode) {
    const child = spawn(modernNode, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
      stdio: 'inherit',
      env: process.env
    });
    child.on('exit', code => process.exit(code ?? 0));
  } else {
    console.error(
      `[Tueste Backend] Se requiere Node.js >= 22.5.0 (actual: ${process.version}) porque el proyecto utiliza el módulo nativo 'node:sqlite'.`
    );
    process.exit(1);
  }
} else {
  const { createApp } = await import('./app.js');
  const { getDbPath, closeDb } = await import('./db.js');

  const PORT = Number(process.env.PORT) || 3001;
  const HOST = '127.0.0.1';

  const app = createApp();
  let server = null;

  // Endpoint interno local (127.0.0.1) para liberar limpiamente el puerto si se inicia una nueva instancia
  app.post('/api/_takeover', (req, res) => {
    res.json({ ok: true, msg: 'Liberando puerto 3001 para la nueva instancia...' });
    setTimeout(() => {
      closeDb();
      if (server) {
        server.close(() => process.exit(0));
      } else {
        process.exit(0);
      }
    }, 50);
  });

  function startListening(retry = false) {
    server = http.createServer(app);

    server.on('error', async err => {
      if (err.code === 'EADDRINUSE' && !retry) {
        try {
          await fetch(`http://${HOST}:${PORT}/api/_takeover`, { method: 'POST' });
          setTimeout(() => startListening(true), 250);
          return;
        } catch {
          console.error(`[Tueste Backend] El puerto ${PORT} ya está en uso por otro proceso.`);
          process.exit(1);
        }
      }
      console.error('[Tueste Backend] Error al iniciar servidor:', err.message);
      process.exit(1);
    });

    server.listen(PORT, HOST, () => {
      console.log(`[Tueste Backend] Servidor Express escuchando en http://${HOST}:${PORT}`);
      console.log(`[Tueste Backend] Base de datos SQLite local: ${getDbPath()}`);
    });
  }

  startListening(false);
}
