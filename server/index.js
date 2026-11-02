import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Si el entorno tiene activo Node < 22.5 (sin node:sqlite nativo), reejecutar automáticamente con Node 22 o 24 instalado localmente
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 5)) {
  const candidates = [
    'C:\\Users\\NVGWf\\AppData\\Local\\Author Software\\nvm\\installs\\v22.23.2\\node.exe',
    'C:\\Users\\NVGWf\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe'
  ];
  const modernNode = candidates.find(p => fs.existsSync(p));
  if (modernNode) {
    const child = spawn(modernNode, [fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
      stdio: 'inherit',
      env: process.env
    });
    child.on('exit', code => process.exit(code ?? 0));
  } else {
    console.error('Se requiere Node.js >= 22.5 para el módulo nativo node:sqlite.');
    process.exit(1);
  }
} else {
  const { createApp } = await import('./app.js');
  const { getDbPath } = await import('./db.js');

  const PORT = Number(process.env.PORT) || 3001;
  const HOST = '127.0.0.1';

  const app = createApp();

  app.listen(PORT, HOST, () => {
    console.log(`[Tueste Backend] Servidor Express escuchando en http://${HOST}:${PORT}`);
    console.log(`[Tueste Backend] Base de datos SQLite local: ${getDbPath()}`);
  });
}
