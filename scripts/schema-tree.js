#!/usr/bin/env node
/**
 * Collects schema docs and/or full directory trees.
 *
 * Usage:
 *   npm run schema-tree
 *   npm run schema-tree -- --scan packages/ui/components
 *   npm run schema-tree -- --scan apps --include *
 *   npm run schema-tree -- --scan packages --include * --exclude node_modules schema-tree.json -empty-path
 *   npm run schema-tree -- --scan packages/code --md --flat
 *   npm run schema-tree -- --scan . --just-flat --out=docs/files.json
 *
 * Flags:
 *   --scan <path>           Root directory to walk (default: .)
 *   --include <patterns…>   What to put in the tree. Default: only files that have a sibling *.schema.json
 *                           Use * for everything. Patterns: exact name, glob with *, or suffix like *.svelte
 *   --exclude <patterns…>   Skip matching files/dirs. Special:
 *                           -empty-file  skip 0-byte files
 *                           -empty-path  prune directories that end up with no children
 *   --out=<path> | --out <path>   Output JSON path (default: <scan>/schema-tree.json)
 *   --md                    Also write <out>.md
 *   --flat                  Append a flat list of entries
 *   --just-flat             Only emit the flat list (no nested tree)
 */
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);

/** @type {string} */
let scanArg = '.';
/** @type {string[]} */
let includePatterns = [];
/** @type {string[]} */
let excludePatterns = [];
/** @type {string|null} */
let outArg = null;
let writeMd = false;
let wantFlat = false;
let justFlat = false;

/**
 * Collect variadic pattern args after a flag until next --flag.
 * @param {number} startIndex index of first pattern (after the flag)
 */
function takePatterns(startIndex) {
  const list = [];
  let i = startIndex;
  while (i < argv.length && !argv[i].startsWith('--')) {
    list.push(argv[i]);
    i++;
  }
  return { list, next: i };
}

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];

  if (a === '--md') {
    writeMd = true;
    continue;
  }
  if (a === '--flat') {
    wantFlat = true;
    continue;
  }
  if (a === '--just-flat') {
    justFlat = true;
    wantFlat = true;
    continue;
  }
  if (a.startsWith('--out=')) {
    outArg = a.slice('--out='.length);
    continue;
  }
  if (a === '--out') {
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      outArg = next;
      i++;
    }
    continue;
  }
  if (a.startsWith('--scan=')) {
    scanArg = a.slice('--scan='.length);
    continue;
  }
  if (a === '--scan') {
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      scanArg = next;
      i++;
    }
    continue;
  }
  if (a === '--include') {
    const { list, next } = takePatterns(i + 1);
    includePatterns.push(...list);
    i = next - 1;
    continue;
  }
  if (a.startsWith('--include=')) {
    includePatterns.push(a.slice('--include='.length));
    continue;
  }
  if (a === '--exclude') {
    const { list, next } = takePatterns(i + 1);
    excludePatterns.push(...list);
    i = next - 1;
    continue;
  }
  if (a.startsWith('--exclude=')) {
    excludePatterns.push(a.slice('--exclude='.length));
    continue;
  }
  // Backward-compat: positional path as scan root
  if (!a.startsWith('--') && scanArg === '.') {
    scanArg = a;
  }
}

const SPECIAL_EXCLUDE = new Set(['-empty-file', '-empty-path']);
const excludeEmptyFile = excludePatterns.includes('-empty-file');
const excludeEmptyPath = excludePatterns.includes('-empty-path');
const nameExcludePatterns = excludePatterns.filter((p) => !SPECIAL_EXCLUDE.has(p));

// Default include: only schema-backed sources (handled specially)
const includeAll =
  includePatterns.length > 0 && includePatterns.some((p) => p === '*');
const includeOnlySchemas = includePatterns.length === 0;
const includeGlobs = includePatterns.filter((p) => p !== '*');

const rootDir = path.resolve(process.cwd(), scanArg);
const outPath = outArg
  ? path.resolve(process.cwd(), outArg)
  : path.join(rootDir, 'schema-tree.json');

const SKIP_DIR_ALWAYS = new Set(['.git', '.svelte-kit', 'coverage']);

/**
 * Glob-ish match: * → one or more chars (including empty via replacing).
 * Exact name if no *.
 * @param {string} name
 * @param {string} pattern
 */
function matchName(name, pattern) {
  if (pattern === '*') return true;
  if (!pattern.includes('*')) return name === pattern;
  // Escape regex specials except *
  const reBody = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${reBody}$`, 'i').test(name);
}

/**
 * @param {string} name
 * @param {string[]} patterns
 */
function matchesAny(name, patterns) {
  return patterns.some((p) => matchName(name, p));
}

/**
 * Resolve source file for a *.schema.json (sibling with same stem).
 * @param {string} schemaAbs
 * @returns {string|null} absolute path to source or null
 */
function resolveSourceForSchema(schemaAbs) {
  const dir = path.dirname(schemaAbs);
  const base = path.basename(schemaAbs, '.schema.json'); // e.g. FieldInput or menuItem
  const candidates = fs.readdirSync(dir).filter((n) => {
    if (n.endsWith('.schema.json')) return false;
    const stem = n.includes('.') ? n.slice(0, n.lastIndexOf('.')) : n;
    return stem === base || n === base;
  });
  // Prefer code-like extensions
  const order = ['.js', '.svelte', '.css', '.ts', '.mjs', '.cjs'];
  candidates.sort((a, b) => {
    const ea = path.extname(a);
    const eb = path.extname(b);
    const ia = order.indexOf(ea);
    const ib = order.indexOf(eb);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return candidates.length ? path.join(dir, candidates[0]) : null;
}

/**
 * @param {string} abs
 * @returns {object|null}
 */
function loadSchema(abs) {
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf-8'));
  } catch (err) {
    return { error: `Invalid JSON: ${err.message}` };
  }
}

/**
 * Walk filesystem.
 * @returns {{ dirs: Map<string, string[]>, files: object[] }}
 */
function collect() {
  /** @type {object[]} */
  const files = [];

  /**
   * @param {string} dir
   * @param {string} relBase
   * @returns {boolean} true if directory has kept content
   */
  function walk(dir, relBase = '') {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return false;
    }

    let kept = false;

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const abs = path.join(dir, entry.name);
      const rel = path.join(relBase, entry.name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (SKIP_DIR_ALWAYS.has(entry.name)) continue;
        if (matchesAny(entry.name, nameExcludePatterns)) continue;

        const childKept = walk(abs, rel);
        if (childKept) kept = true;
        else if (!excludeEmptyPath) {
          // empty dir still recorded as folder-only node later via path presence
          files.push({ kind: 'dir', path: rel, name: entry.name });
          kept = true;
        }
        continue;
      }

      if (!entry.isFile()) continue;
      if (matchesAny(entry.name, nameExcludePatterns)) continue;

      let size = 0;
      try {
        size = fs.statSync(abs).size;
      } catch {
        continue;
      }
      if (excludeEmptyFile && size === 0) continue;

      const isSchema = entry.name.endsWith('.schema.json');

      if (includeOnlySchemas) {
        // Only emit source files that have a schema (never the schema file itself as file)
        if (!isSchema) continue;
        const schema = loadSchema(abs);
        const sourceAbs = resolveSourceForSchema(abs);
        const sourceName =
          (schema && schema.file) ||
          (sourceAbs ? path.basename(sourceAbs) : null);
        const sourceRel = sourceAbs
          ? path.join(relBase, sourceName || path.basename(sourceAbs)).replace(/\\/g, '/')
          : path.join(relBase, sourceName || path.basename(rel.replace(/\.schema\.json$/i, ''))).replace(/\\/g, '/');

        files.push({
          kind: 'schema',
          path: sourceRel,
          file: sourceName || path.basename(sourceRel),
          schemaPath: rel,
          title: schema.title || path.basename(entry.name, '.schema.json'),
          description: schema.description || '',
          type: schema.type || null,
          schema,
        });
        kept = true;
        continue;
      }

      // --include mode
      if (!includeAll) {
        if (!matchesAny(entry.name, includeGlobs)) continue;
      }

      // Skip emitting schema files as plain files when their source is also present —
      // attach schema onto source instead.
      if (isSchema) {
        // If include patterns explicitly ask for *.schema.json, still attach to source
        const sourceAbs = resolveSourceForSchema(abs);
        const schema = loadSchema(abs);
        const sourceName = sourceAbs ? path.basename(sourceAbs) : entry.name;
        const sourceRel = sourceAbs
          ? path.join(relBase, path.basename(sourceAbs)).replace(/\\/g, '/')
          : rel;

        files.push({
          kind: 'schema',
          path: sourceRel,
          file: sourceName,
          schemaPath: rel,
          title: schema.title || path.basename(entry.name, '.schema.json'),
          description: schema.description || '',
          type: schema.type || null,
          schema,
        });
        kept = true;
        continue;
      }

      // Plain file — may also have a sibling schema
      const stem = entry.name.includes('.')
        ? entry.name.slice(0, entry.name.lastIndexOf('.'))
        : entry.name;
      const schemaSibling = path.join(dir, `${stem}.schema.json`);
      let schema = null;
      let schemaPath = null;
      if (fs.existsSync(schemaSibling)) {
        schema = loadSchema(schemaSibling);
        schemaPath = path.join(relBase, `${stem}.schema.json`).replace(/\\/g, '/');
      }

      if (schema) {
        files.push({
          kind: 'schema',
          path: rel,
          file: entry.name,
          schemaPath,
          title: schema.title || stem,
          description: schema.description || '',
          type: schema.type || null,
          schema,
        });
      } else {
        files.push({
          kind: 'file',
          path: rel,
          file: entry.name,
        });
      }
      kept = true;
    }

    return kept;
  }

  walk(rootDir);
  return files;
}

/**
 * @param {object[]} items
 */
function toTree(items) {
  const root = { name: path.basename(rootDir) || '.', children: {} };

  for (const item of items) {
    const parts = item.path.split('/').filter(Boolean);
    let node = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;

      if (!node.children[part]) {
        node.children[part] = isLeaf && item.kind !== 'dir'
          ? null // leaf placeholder
          : { name: part, children: {} };
      }

      if (isLeaf) {
        if (item.kind === 'dir') {
          if (!node.children[part]) {
            node.children[part] = { name: part, children: {} };
          }
        } else if (item.kind === 'schema') {
          node.children[part] = {
            file: item.file,
            title: item.title,
            description: item.description,
            type: item.type,
            schema: item.schema,
          };
        } else {
          node.children[part] = { file: item.file };
        }
      } else {
        if (!node.children[part] || node.children[part].file) {
          // was a file leaf; promote shouldn't happen for dirs
          node.children[part] = { name: part, children: {} };
        }
        node = node.children[part];
      }
    }
  }

  function serialize(n) {
    if (n.file !== undefined && !n.children) {
      // leaf file / schema
      const leaf = { file: n.file };
      if (n.title !== undefined) leaf.title = n.title;
      if (n.description !== undefined) leaf.description = n.description;
      if (n.type !== undefined) leaf.type = n.type;
      if (n.schema !== undefined) leaf.schema = n.schema;
      return leaf;
    }
    const out = { name: n.name };
    const keys = Object.keys(n.children || {}).sort();
    if (keys.length) {
      out.children = keys.map((k) => {
        const child = n.children[k];
        if (child && child.file !== undefined && !child.children) {
          const leaf = { file: child.file };
          if (child.title !== undefined) leaf.title = child.title;
          if (child.description !== undefined) leaf.description = child.description;
          if (child.type !== undefined) leaf.type = child.type;
          if (child.schema !== undefined) leaf.schema = child.schema;
          return leaf;
        }
        return serialize(child);
      });
    }
    return out;
  }

  return serialize(root);
}

/**
 * @param {object[]} items
 */
function toFlat(items) {
  return items
    .filter((i) => i.kind !== 'dir')
    .map((item) => {
      if (item.kind === 'schema') {
        return {
          path: item.path,
          file: item.file,
          title: item.title,
          description: item.description,
          type: item.type,
        };
      }
      return { path: item.path, file: item.file };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * @param {object} tree
 * @param {number} depth
 */
function treeToMarkdown(tree, depth = 0) {
  const lines = [];
  const indent = '  '.repeat(depth);

  if (depth === 0) {
    lines.push(`# Schema tree: \`${path.relative(process.cwd(), rootDir) || '.'}\``);
    lines.push('');
  }

  if (tree.file) {
    const label = tree.title
      ? `\`${tree.file}\` — **${tree.title}**${tree.type ? ` (${tree.type})` : ''}`
      : `\`${tree.file}\``;
    lines.push(`${indent}- ${label}`);
    if (tree.description) lines.push(`${indent}  ${tree.description}`);
    return lines;
  }

  if (depth > 0 && tree.name) {
    lines.push(`${indent}- **${tree.name}/**`);
  }

  if (tree.children) {
    for (const child of tree.children) {
      lines.push(...treeToMarkdown(child, depth + (depth === 0 && !tree.file ? 0 : 1)));
    }
  }

  return lines;
}

if (!fs.existsSync(rootDir)) {
  console.error(`[schema-tree] path not found: ${rootDir}`);
  process.exit(1);
}

const items = collect();
const tree = justFlat ? null : toTree(items);
const flat = wantFlat || justFlat ? toFlat(items) : undefined;

const payload = {
  generatedAt: new Date().toISOString(),
  root: path.relative(process.cwd(), rootDir) || '.',
  scan: path.relative(process.cwd(), rootDir) || '.',
  include: includeOnlySchemas ? ['(schema-backed sources)'] : includePatterns,
  exclude: excludePatterns,
  count: items.filter((i) => i.kind !== 'dir').length,
  ...(justFlat ? {} : { tree }),
  ...(flat ? { flat } : {}),
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
console.log(
  `[schema-tree] ${payload.count} entries → ${path.relative(process.cwd(), outPath)}`
);

if (writeMd) {
  const mdPath = outPath.endsWith('.json')
    ? outPath.replace(/\.json$/i, '.md')
    : outPath + '.md';
  let md;
  if (justFlat && flat) {
    md =
      `# Flat schema list: \`${payload.root}\`\n\n` +
      flat
        .map((e) =>
          e.title
            ? `- \`${e.path}\` — **${e.title}**: ${e.description || ''}`
            : `- \`${e.path}\``
        )
        .join('\n') +
      '\n';
  } else {
    md = treeToMarkdown(tree).join('\n') + '\n';
  }
  fs.writeFileSync(mdPath, md, 'utf-8');
  console.log(`[schema-tree] markdown → ${path.relative(process.cwd(), mdPath)}`);
}
