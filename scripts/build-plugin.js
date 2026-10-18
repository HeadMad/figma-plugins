#!/usr/bin/env node
/**
 * Universal Figma plugin build for apps/<name>.
 *
 * From an app directory:
 *   node ../../scripts/build-plugin.js
 *   node ../../scripts/build-plugin.js --watch
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootScripts = __dirname;
const cwd = process.cwd();
const isWatch = process.argv.includes('--watch');
const isWin = process.platform === 'win32';

function findViteBin() {
  const binNames = isWin ? ['vite.cmd', 'vite.exe', 'vite'] : ['vite'];
  const searchDirs = [
    path.join(cwd, 'node_modules', '.bin'),
    path.join(cwd, '..', '..', 'node_modules', '.bin'),
    path.join(rootScripts, '..', 'node_modules', '.bin'),
  ];
  for (const dir of searchDirs) {
    for (const name of binNames) {
      const full = path.join(dir, name);
      if (fs.existsSync(full)) return full;
    }
  }
  return null;
}

function run(cmd, args, { useShell = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: useShell,
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });
}

async function runVite(configFile, watch) {
  const viteBin = findViteBin();
  const args = ['build', '--config', configFile, ...(watch ? ['--watch'] : [])];
  if (viteBin) {
    // .cmd on Windows needs shell
    await run(viteBin, args, { useShell: isWin && viteBin.endsWith('.cmd') });
    return;
  }
  // last resort: pnpm exec (no npx/npm)
  await run(isWin ? 'pnpm.cmd' : 'pnpm', ['exec', 'vite', ...args], {
    useShell: isWin,
  });
}

function clearDist() {
  const dist = path.join(cwd, 'dist');
  if (fs.existsSync(dist)) {
    fs.rmSync(dist, { recursive: true, force: true });
    console.log('[build] cleared dist/');
  }
}

async function barrel() {
  const actionsDir = path.join(cwd, 'src/code/actions');
  if (!fs.existsSync(actionsDir)) return;
  await run(process.execPath, [path.join(rootScripts, 'barrel.js'), 'src/code/actions']);
}

async function buildOnce() {
  clearDist();
  await barrel();
  await runVite('vite.config.code.js', false);
  await runVite('vite.config.ui.js', false);
  console.log('[build] done');
}

async function buildWatch() {
  clearDist();
  await barrel();

  spawn(process.execPath, [path.join(rootScripts, 'barrel.js'), '--watch', 'src/code/actions'], {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  // fire-and-forget watch builds
  runVite('vite.config.code.js', true);
  runVite('vite.config.ui.js', true);
}

if (isWatch) {
  await buildWatch();
} else {
  await buildOnce();
}
