#!/usr/bin/env node
// List Knip plugin defaults (enablers, config, entry, production entry) from the
// Knip version installed in a project, and mark which plugins its package.json
// dependencies enable. Reads Knip internals by file path, so output always
// matches the installed version instead of a docs snapshot.
//
// Usage:
//   node list-plugins.mjs [projectDir] [--all] [--plugin <name>]... [--json]
//
//   projectDir   Directory with package.json (default: cwd). Knip is resolved
//                from the nearest node_modules/knip at or above this directory.
//   --all        Print every plugin, not only the ones enabled by dependencies.
//   --plugin     Print only the named plugin(s). Repeatable.
//   --json       Print JSON instead of a markdown table.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const flags = { all: false, json: false, plugins: [] };
let projectDir = process.cwd();
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--all') flags.all = true;
  else if (arg === '--json') flags.json = true;
  else if (arg === '--plugin') flags.plugins.push(args[++i]);
  else if (arg === '-h' || arg === '--help') {
    console.log('Usage: node list-plugins.mjs [projectDir] [--all] [--plugin <name>]... [--json]');
    process.exit(0);
  } else projectDir = resolve(arg);
}

const findKnip = start => {
  let dir = start;
  while (true) {
    const candidate = join(dir, 'node_modules', 'knip');
    if (existsSync(join(candidate, 'dist', 'plugins', 'index.js'))) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
};

const knipDir = findKnip(projectDir);
if (!knipDir) {
  console.error(`No node_modules/knip found at or above ${projectDir}. Install knip as a devDependency first.`);
  process.exit(1);
}

const knipVersion = JSON.parse(readFileSync(join(knipDir, 'package.json'), 'utf8')).version;
const { Plugins } = await import(pathToFileURL(join(knipDir, 'dist', 'plugins', 'index.js')).href);

const readManifest = dir => {
  const file = join(dir, 'package.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
};
const depsOf = pkg =>
  Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies });

// Root devDependencies also enable plugins, so merge the install root manifest.
const manifest = readManifest(projectDir);
const installRoot = dirname(dirname(knipDir));
const deps = new Set([...depsOf(manifest), ...depsOf(readManifest(installRoot))]);

const show = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'function') return '(computed at runtime)';
  if (Array.isArray(value)) return value.map(v => (v instanceof RegExp ? `/${v.source}/` : String(v))).join(', ');
  return String(value);
};

// Ask each plugin's own isEnabled() with the real manifest. Some plugins
// also look at files or scripts, so this matches what Knip itself decides.
const enabledBy = async plugin => {
  // Plugins without isEnabled() only parse CLI args when their binary runs in a script.
  if (typeof plugin.isEnabled !== 'function') return 'args-only';
  try {
    const on = await plugin.isEnabled({ cwd: projectDir, manifest, dependencies: deps, config: {} });
    if (!on) return 'no';
    const hits = Array.isArray(plugin.enablers)
      ? [...deps].filter(d => plugin.enablers.some(e => (e instanceof RegExp ? e.test(d) : e === d)))
      : [];
    return hits.length > 0 ? `yes (${hits.join(', ')})` : 'yes';
  } catch {
    return 'unknown (verify with knip --debug)';
  }
};

const rows = [];
for (const [name, plugin] of Object.entries(Plugins)) {
  if (flags.plugins.length > 0 && !flags.plugins.includes(name)) continue;
  const enabled = await enabledBy(plugin);
  if (!flags.all && flags.plugins.length === 0 && (enabled === 'no' || enabled === 'args-only')) continue;
  rows.push({
    name,
    title: plugin.title,
    enabled,
    enablers: show(plugin.enablers),
    config: show(plugin.config),
    entry: show(plugin.entry),
    production: show(plugin.production),
    project: show(plugin.project),
  });
}

if (flags.json) {
  console.log(JSON.stringify({ knipVersion, projectDir, plugins: rows }, null, 2));
} else {
  const cell = text => String(text).replaceAll('|', '\\|');
  console.log(`Knip ${knipVersion} — ${rows.length} plugin(s) — ${projectDir}\n`);
  console.log('| Plugin | Enabled here | Enablers | Config files | Entry (non-production) | Production entry |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const r of rows) {
    console.log(
      `| \`${r.name}\` | ${cell(r.enabled)} | ${cell(r.enablers)} | ${cell(r.config)} | ${cell(r.entry)} | ${cell(r.production)} |`,
    );
  }
  if (!flags.all && flags.plugins.length === 0) {
    console.log('\nShows plugins whose isEnabled() returns true for this package.json. Confirm the full set per workspace with `knip --debug`.');
  }
}
