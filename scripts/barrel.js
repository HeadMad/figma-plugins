#!/usr/bin/env node
/**
 * Generates index.js barrel re-exports for atomic folder containers.
 *
 * Usage:
 *   node scripts/barrel.js [dir ...]
 *   node scripts/barrel.js --watch [dir ...]
 *
 * Default dirs (relative to cwd): src/code/actions
 * Each subfolder with index.js is exported as: export { default as Name } from './Name/index.js'
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2).filter((a) => a !== '--watch');
const isWatch = process.argv.includes('--watch');
const WATCHED_DIRS = args.length
  ? args
  : ['src/code/actions'];

/**
 * @param {string} baseDir
 * @param {string} currentDir
 * @param {string[]} exportLines
 */
function scanDirectory(baseDir, currentDir, exportLines) {
  if (!fs.existsSync(currentDir)) return;
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const indexPath = path.join(fullPath, 'index.js');
      if (fs.existsSync(indexPath)) {
        const name = path.basename(fullPath);
        let relativePath = path.relative(baseDir, indexPath).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
        exportLines.push(`export { default as ${name} } from '${relativePath}';`);
      } else {
        scanDirectory(baseDir, fullPath, exportLines);
      }
    } else if (
      stat.isFile() &&
      file !== 'index.js' &&
      file.endsWith('.js') &&
      !file.includes('__')
    ) {
      const name = path.basename(file, '.js');
      let relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
      exportLines.push(`export { default as ${name} } from '${relativePath}';`);
    }
  }
}

/**
 * @param {string} dir
 */
function generateBarrel(dir) {
  const absolutePath = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`[Barrel] skip (missing): ${dir}`);
    return;
  }
  const exportLines = [];
  scanDirectory(absolutePath, absolutePath, exportLines);
  exportLines.sort();
  const fileContent = exportLines.join('\n') + (exportLines.length ? '\n' : '');
  const indexPath = path.join(absolutePath, 'index.js');
  const prev = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf-8') : null;
  if (prev !== fileContent) {
    fs.writeFileSync(indexPath, fileContent, 'utf-8');
    console.log(`[Barrel] ${dir}/index.js (${exportLines.length})`);
  }
}

function buildAll() {
  WATCHED_DIRS.forEach(generateBarrel);
}

buildAll();

if (isWatch) {
  console.log('[Barrel] watching:', WATCHED_DIRS.join(', '));
  for (const dir of WATCHED_DIRS) {
    const absolutePath = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(absolutePath)) continue;
    fs.watch(absolutePath, { recursive: true }, (_, filename) => {
      if (filename && !filename.endsWith('index.js')) {
        setTimeout(() => generateBarrel(dir), 100);
      }
    });
  }
}
