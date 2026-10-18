#!/usr/bin/env node
/**
 * Universal Figma plugin build for apps/<name>.
 *
 * Run from an app directory (cwd = apps/size-pdf):
 *   node ../../scripts/build-plugin.js
 *   node ../../scripts/build-plugin.js --watch
 *
 * Expects:
 *   vite.config.code.js
 *   vite.config.ui.js
 * Optional:
 *   src/code/actions → barrel before build
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootScripts = __dirname;
const cwd = process.cwd();
const isWatch = process.argv.includes('--watch');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || cwd,
      stdio: 'inherit',
      shell: true,
      ...opts,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
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
  await run('node', [path.join(rootScripts, 'barrel.js'), 'src/code/actions']);
}

async function buildOnce() {
  clearDist();
  await barrel();
  await run('npx', ['vite', 'build', '--config', 'vite.config.code.js']);
  await run('npx', ['vite', 'build', '--config', 'vite.config.ui.js']);
  console.log('[build] done');
}

async function buildWatch() {
  clearDist();
  await barrel();
  // parallel watchers
  const barrelWatch = spawn(
    'node',
    [path.join(rootScripts, 'barrel.js'), '--watch', 'src/code/actions'],
    { cwd, stdio: 'inherit', shell: true }
  );
  const codeWatch = spawn('npx', ['vite', 'build', '--config', 'vite.config.code.js', '--watch'], {
    cwd,
    stdio: 'inherit',
    shell: true,
  });
  const uiWatch = spawn('npx', ['vite', 'build', '--config', 'vite.config.ui.js', '--watch'], {
    cwd,
    stdio: 'inherit',
    shell: true,
  });

  const stop = () => {
    barrelWatch.kill();
    codeWatch.kill();
    uiWatch.kill();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (isWatch) {
  await buildWatch();
} else {
  await buildOnce();
}
