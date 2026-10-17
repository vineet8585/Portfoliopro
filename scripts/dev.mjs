import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageManager = process.env.PNPM_EXECUTABLE || 'pnpm';
const previewPort = process.env.PREVIEW_PORT || process.env.PORT || '3000';
const apiPort = process.env.API_PORT || '8081';
const processes = [
  spawn(packageManager, ['--filter', 'portfoliopro-frontend', 'start'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: previewPort },
    stdio: 'inherit',
  }),
  spawn('./mvnw', ['-B', 'spring-boot:run', '-Dspring-boot.run.fork=false'], {
    cwd: resolve(projectRoot, 'backend'),
    env: { ...process.env, PORT: apiPort, SPRING_PROFILES_ACTIVE: process.env.SPRING_PROFILES_ACTIVE || 'local' },
    stdio: 'inherit',
  }),
];

let shuttingDown = false;
function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) {
    if (child.exitCode === null && !child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(exitCode), 800).unref();
}

for (const child of processes) {
  child.on('error', (error) => {
    console.error('Failed to start a PortfolioPro development process:', error.message);
    shutdown(1);
  });
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`PortfolioPro development process exited (${signal ?? code ?? 'unknown'}).`);
      shutdown(code ?? 1);
    }
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
