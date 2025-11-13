const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const exts = ['.tsx', '.ts', '.js', '.jsx'];
const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', 'public']);

function walk(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (ignoreDirs.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...walk(full));
    else if (exts.includes(path.extname(e.name))) results.push(full);
  }
  return results;
}

function read(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch(e) { return ''; }
}

function extractImports(source) {
  const imports = new Set();
  // import ... from '...'
  const importRe = /import\s+(?:[^'";]+)\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRe.exec(source))) imports.add(m[1]);
  // import('...') dynamic
  const dynRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynRe.exec(source))) imports.add(m[1]);
  // require('...')
  const reqRe = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = reqRe.exec(source))) imports.add(m[1]);
  // type-only imports: import type { } from '...'
  const importTypeRe = /import\s+type\s+[^'";]+from\s+['"]([^'"]+)['"]/g;
  while ((m = importTypeRe.exec(source))) imports.add(m[1]);
  return Array.from(imports);
}

function resolveSpecifier(fromFile, spec) {
  if (!spec.startsWith('.')) return null; // external package or absolute - ignore
  const base = path.resolve(path.dirname(fromFile), spec);
  // try variants
  const candidates = [];
  for (const e of exts) candidates.push(base + e);
  for (const e of exts) candidates.push(path.join(base, 'index' + e));
  for (const c of candidates) if (fs.existsSync(c)) return path.normalize(c);
  return null;
}

const files = walk(ROOT);
const graphIn = new Map();
const graphOut = new Map();
for (const f of files) { graphIn.set(f, new Set()); graphOut.set(f, new Set()); }

for (const f of files) {
  const src = read(f);
  const imps = extractImports(src);
  for (const s of imps) {
    const resolved = resolveSpecifier(f, s);
    if (resolved && graphIn.has(resolved)) {
      graphIn.get(resolved).add(f);
      graphOut.get(f).add(resolved);
    }
  }
}

// Also mark references from index.html (script tags, importmap)
const indexHtml = path.join(ROOT, 'index.html');
if (fs.existsSync(indexHtml)) {
  const h = read(indexHtml);
  for (const f of files) {
    const rel = '/' + path.relative(ROOT, f).replace(/\\/g, '/');
    if (h.includes(rel) || h.includes(path.basename(f))) {
      // treat as referenced from html
      graphIn.get(f).add(indexHtml);
    }
  }
}

// Also mark files referenced in package.json scripts
const pkgJson = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgJson)) {
  const pkg = read(pkgJson);
  for (const f of files) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    if (pkg.includes(rel) || pkg.includes(path.basename(f))) {
      graphIn.get(f).add(pkgJson);
    }
  }
}

// Build orphan list: files with zero incoming edges (excluding the index.html and config files)
const entryCandidates = ['index.tsx','index.jsx','App.tsx','App.jsx','server/index.js','vite.config.ts','vite.config.js','sw.tsx'];
const orphans = [];
for (const [f, inSet] of graphIn.entries()) {
  if (inSet.size === 0) {
    const bn = path.basename(f);
    if (entryCandidates.includes(bn) || entryCandidates.includes(path.relative(ROOT, f).replace(/\\/g,'/'))) {
      // skip known entry points
      continue;
    }
    orphans.push({ file: path.relative(ROOT, f).replace(/\\/g, '/'), imports: Array.from(graphOut.get(f) || []) });
  }
}

console.log(JSON.stringify({ orphans, totalFiles: files.length }, null, 2));
