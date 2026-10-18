#!/usr/bin/env node
/**
 * npm run build              → build all apps
 * npm run build -- size-pdf  → build one app
 * npm run dev -- print-pdf   → dev one app (required)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const mode = process.argv[2] || 'build'; // build | dev
const target = process.argv[3]; // app folder name or package name

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
      const pkg = JSON.parse(fs.readFileSync(path.join(appsDir, a, 'package.json'), 'utf8'));
      return pkg.name === name || pkg.name === `@${name}` || pkg.name.endsWith(`/${name}`);
    } catch {
      return false;
    }
  });
  return byPkg || null;
}

function runInApp(app, script) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ ${script}: apps/${app}`);
    const child = spawn('npm', ['run', script, '-w', `@${app}`], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
    });
    // fallback: package name may be @figma-plugins/x still - read actual name
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${app} ${script} failed (${code})`));
    });
  });
}

async function runInAppByPath(app, script) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ ${script}: apps/${app}`);
    const child = spawn('npm', ['run', script], {
      cwd: path.join(appsDir, app),
      stdio: 'inherit',
      shell: true,
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
  console.error('dev requires a single app: npm run dev -- <app-name>');
  console.error(`Available: ${apps.join(', ')}`);
  process.exit(1);
}

for (const app of list) {
  await runInAppByPath(app, mode === 'dev' ? 'dev' : 'build');
}
console.log(`\n✓ ${mode} finished (${list.join(', ')})`);
