#!/usr/bin/env node
/**
 * pnpm build                 → build all apps
 * pnpm build -- size-pdf     → build one app
 * pnpm dev -- size-pdf       → dev one app
 *
 * pnpm may inject a literal "--" before the app name; it is ignored.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// argv: [node, script, mode?, ...rest]
// Examples:
//   node scripts/run-apps.js build
//   node scripts/run-apps.js build size-pdf
//   node scripts/run-apps.js build -- size-pdf
const rawArgs = process.argv.slice(2).filter((a) => a !== '--');
const mode = rawArgs[0] === 'dev' || rawArgs[0] === 'build' ? rawArgs[0] : 'build';
const target =
  rawArgs[0] === 'dev' || rawArgs[0] === 'build' ? rawArgs[1] : rawArgs[0];

const appsDir = path.join(root, 'apps');
const apps = fs
  .readdirSync(appsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

function resolveApp(name) {
  if (!name) return null;
  if (apps.includes(name)) return name;
  const byPkg = apps.find((a) => {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(appsDir, a, 'package.json'), 'utf8')
      );
      return (
        pkg.name === name ||
        pkg.name === `@app/${name}` ||
        pkg.name.endsWith(`/${name}`)
      );
    } catch {
      return false;
    }
  });
  return byPkg || null;
}

function runInApp(app, script) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ ${script}: apps/${app}`);
    const isWin = process.platform === 'win32';
    const child = spawn(isWin ? 'pnpm.cmd' : 'pnpm', ['run', script], {
      cwd: path.join(appsDir, app),
      stdio: 'inherit',
      shell: isWin,
      env: process.env,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${app} ${script} failed (${code})`));
    });
  });
}

const list = target ? [resolveApp(target)].filter(Boolean) : apps;
if (target && !list.length) {
  console.error(`Unknown app "${target}". Available: ${apps.join(', ')}`);
  process.exit(1);
}
if (mode === 'dev' && list.length !== 1) {
  console.error('dev requires a single app: pnpm dev -- <app-name>');
  console.error(`Available: ${apps.join(', ')}`);
  process.exit(1);
}

for (const app of list) {
  await runInApp(app, mode === 'dev' ? 'dev' : 'build');
}
console.log(`\n✓ ${mode} finished (${list.join(', ')})`);
