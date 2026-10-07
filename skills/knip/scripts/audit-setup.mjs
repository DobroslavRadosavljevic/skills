#!/usr/bin/env node
// Static audit of a repository's Knip setup against the enforced standard.
// No dependencies, does not run Knip, does not change files.
//
// Usage:
//   node audit-setup.mjs [repoRoot] [--json]
//
// Exit code: 1 when any "error" finding exists, else 0.
// Pair it with a real run: `knip` and `knip --production` (see SKILL.md).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const root = resolve(args.find(a => !a.startsWith('--')) ?? process.cwd());

const findings = [];
const add = (severity, id, message, fix) => findings.push({ severity, id, message, fix });

const read = file => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);

// Strip // and /* */ comments plus trailing commas outside strings (JSONC).
const parseJsonc = text => {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inString) {
      out += c;
      if (c === '\\') out += text[++i] ?? '';
      else if (c === '"') inString = false;
    } else if (c === '"') {
      inString = true;
      out += c;
    } else if (c === '/' && n === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      out += '\n';
    } else if (c === '/' && n === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i++;
    } else out += c;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
};

// --- package.json -----------------------------------------------------------
const pkgText = read(join(root, 'package.json'));
if (!pkgText) {
  console.error(`No package.json in ${root}. Run the audit from the repository root.`);
  process.exit(1);
}
const pkg = JSON.parse(pkgText);
const scripts = pkg.scripts ?? {};

const knipRange = pkg.devDependencies?.knip ?? pkg.dependencies?.knip;
if (!knipRange) {
  add('error', 'knip-not-installed', 'knip is not in root devDependencies.', 'Install it: `bun add -d knip` (or the repo package manager).');
} else {
  if (pkg.dependencies?.knip) {
    add('error', 'knip-in-dependencies', 'knip is in dependencies, not devDependencies.', 'Move knip to devDependencies.');
  }
  const major = String(knipRange).match(/(\d+)/)?.[1];
  if (major && Number(major) < 6) {
    add('error', 'knip-outdated-major', `knip range "${knipRange}" is below major 6.`, 'Upgrade to knip 6 and follow references/migration.md.');
  }
  if (/^(\*|latest|x)$/i.test(String(knipRange).trim())) {
    add('warn', 'knip-unpinned', `knip range "${knipRange}" floats across majors.`, 'Use a caret range on the current major, for example "^6.40.0".');
  }
}
if (!pkg.devDependencies?.typescript && !pkg.dependencies?.typescript && existsSync(join(root, 'tsconfig.json'))) {
  add('info', 'typescript-missing', 'tsconfig.json exists but typescript is not a root dependency.', 'Knip reads tsconfig paths; keep typescript installed so editors and the typescript plugin agree.');
}

// --- config file ------------------------------------------------------------
const CONFIG_FILES = [
  'knip.json', 'knip.jsonc', '.knip.json', '.knip.jsonc',
  'knip.ts', 'knip.js', 'knip.config.ts', 'knip.config.js',
];
const configFiles = CONFIG_FILES.filter(f => existsSync(join(root, f)));
if (pkg.knip) configFiles.push('package.json#knip');

if (configFiles.length === 0) {
  add('error', 'no-config', 'No Knip config file found.', 'Create knip.json with "$schema" and explicit entry/project (assets/knip.json).');
} else if (configFiles.length > 1) {
  add('error', 'multiple-configs', `Several Knip configs found: ${configFiles.join(', ')}. Knip merges package.json#knip with the file and ignores the rest.`, 'Keep exactly one config file.');
}

let config;
const configFile = configFiles[0];
if (configFile === 'package.json#knip') {
  config = pkg.knip;
  add('warn', 'config-in-package-json', 'Config lives in package.json#knip (no $schema validation, no comments).', 'Move it to knip.json with "$schema".');
} else if (configFile && /\.jsonc?$/.test(configFile)) {
  try {
    config = parseJsonc(read(join(root, configFile)));
  } catch (error) {
    add('error', 'config-parse', `${configFile} does not parse: ${error.message}`, 'Fix the JSON syntax.');
  }
} else if (configFile) {
  const text = read(join(root, configFile));
  if (!/KnipConfig|defineConfig/.test(text)) {
    add('warn', 'ts-config-untyped', `${configFile} is not typed.`, "Use `import type { KnipConfig } from 'knip'` or `defineConfig` from 'knip/config'.");
  }
  add('info', 'ts-config-static-only', `${configFile} is code; this audit checks JSON configs only.`, 'Rely on `knip --treat-config-hints-as-errors` to validate it.');
}

const asList = v => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const CORE_TYPES = ['files', 'dependencies', 'devDependencies', 'unlisted', 'binaries', 'unresolved', 'exports', 'types', 'duplicates'];
const BROAD_GLOB = /^(\*\*(\/\*+)?|\*|(src|lib|app|apps|packages)\/\*\*(\/\*+)?|\*\*\/\*\.(ts|tsx|js|jsx))$/;
const REMOVED_KEYS = ['classMembers'];

const checkScope = (scope, where) => {
  if (!scope || typeof scope !== 'object') return;
  for (const key of ['ignore', 'ignoreFiles']) {
    for (const p of asList(scope[key])) {
      if (BROAD_GLOB.test(p)) add('error', 'broad-ignore', `${where}.${key} has catch-all pattern "${p}".`, 'Remove it. Fix the real cause (entry/project, plugin config) instead of hiding issues.');
    }
  }
  if (asList(scope.ignore).length > 0) {
    add('warn', 'ignore-used', `${where}.ignore hides every issue type for ${asList(scope.ignore).length} pattern(s).`, 'Prefer project negation (!pattern), ignoreFiles, or ignoreIssues scoped to one issue type. Keep `ignore` for generated or vendored code only, with a comment.');
  }
  for (const key of ['ignoreDependencies', 'ignoreBinaries', 'ignoreUnresolved', 'ignoreMembers']) {
    const list = asList(scope[key]);
    if (list.some(p => p === '.*' || p === '.+' || p === '*')) add('error', 'catch-all-regex', `${where}.${key} has a catch-all entry.`, 'List exact names only.');
    if (list.length > 8) add('warn', 'long-ignore-list', `${where}.${key} has ${list.length} entries.`, 'Re-check each one; most are plugin gaps or real issues. Configuration hints flag the stale ones.');
  }
  for (const [pattern, types] of Object.entries(scope.ignoreIssues ?? {})) {
    if (BROAD_GLOB.test(pattern)) add('error', 'broad-ignore-issues', `${where}.ignoreIssues["${pattern}"] covers most of the code base.`, 'Scope ignoreIssues to generated or framework-owned files.');
    for (const t of asList(types)) if (['files', 'dependencies', 'unlisted', 'unresolved'].includes(t)) add('warn', 'ignore-issues-core', `${where}.ignoreIssues["${pattern}"] suppresses "${t}".`, 'Confirm this is not hiding real problems.');
  }
  const patterns = [...asList(scope.entry), ...asList(scope.project)].filter(p => !p.startsWith('!'));
  if (patterns.length > 0 && !patterns.some(p => p.endsWith('!'))) {
    add('warn', 'no-production-markers', `${where} sets entry/project without any "!" production marker.`, 'Mark shipped code with a trailing "!" (e.g. "src/**/*.ts!"); without one, --production silently skips unused files and exports.');
  }
  if (scope.entry !== undefined && asList(scope.entry).length === 0) add('warn', 'empty-entry', `${where}.entry is empty.`, 'Remove it or add real entry files.');
};

if (config && typeof config === 'object') {
  const schema = config.$schema;
  if (!schema && configFile !== 'package.json#knip') {
    add('warn', 'no-schema', 'Config has no "$schema".', 'Add "$schema": "https://unpkg.com/knip@6/schema.json" (or schema-jsonc.json for .jsonc).');
  } else if (schema && !/knip@6\//.test(schema)) {
    add('warn', 'schema-version', `"$schema" is "${schema}".`, 'Pin it to the installed major: https://unpkg.com/knip@6/schema.json.');
  }
  for (const key of REMOVED_KEYS) {
    if ([...asList(config.include), ...asList(config.exclude)].includes(key)) add('error', 'removed-issue-type', `"${key}" in include/exclude makes Knip 6 exit 2 (Invalid issue type).`, 'Remove it (see references/migration.md).');
    if (key in (config.rules ?? {})) add('warn', 'removed-rule', `rules.${key} is ignored by Knip 6 (prints a warning).`, 'Remove it.');
    const inIgnoreIssues = [config, ...Object.values(config.workspaces ?? {})].some(scope => Object.values(scope?.ignoreIssues ?? {}).some(types => asList(types).includes(key)));
    if (inIgnoreIssues) add('error', 'removed-issue-type', `"${key}" in ignoreIssues is not a Knip 6 issue type.`, 'Remove it.');
  }
  for (const [type, value] of Object.entries(config.rules ?? {})) {
    if (value === 'off' && CORE_TYPES.includes(type)) add('warn', 'core-rule-off', `rules.${type} is "off".`, 'Turn it back on or document why in the PR. Use "warn" only during adoption.');
    if (value === 'warn' && CORE_TYPES.includes(type)) add('info', 'core-rule-warn', `rules.${type} is "warn" (does not fail CI).`, 'Promote to "error" once the backlog is clear.');
  }
  for (const t of asList(config.exclude)) {
    if (CORE_TYPES.includes(t)) add('warn', 'core-excluded', `exclude contains core issue type "${t}".`, 'Remove it after fixing the backlog.');
  }
  checkScope(config, 'config');
  for (const [name, ws] of Object.entries(config.workspaces ?? {})) checkScope(ws, `workspaces["${name}"]`);
  if (config.treatConfigHintsAsErrors !== true) {
    add('info', 'hints-not-errors', 'treatConfigHintsAsErrors is not true.', 'Set it (or pass --treat-config-hints-as-errors in CI) so stale config fails the build.');
  }
  const isMonorepo = Boolean(pkg.workspaces) || existsSync(join(root, 'pnpm-workspace.yaml'));
  if (isMonorepo && !config.workspaces) {
    add('info', 'monorepo-no-workspaces', 'Monorepo detected but config has no "workspaces" key.', 'Fine while defaults work. Add per-workspace entry/project when hints ask for it; root-level entry/project only apply to the root workspace.');
  }
}

// --- scripts ----------------------------------------------------------------
const scriptEntries = Object.entries(scripts);
const knipScripts = scriptEntries.filter(([, cmd]) => /\bknip\b/.test(cmd));
if (knipScripts.length === 0) {
  add('error', 'no-knip-script', 'No package.json script runs knip.', 'Add "knip": "knip" and "knip:production": "knip --production".');
} else {
  if (!knipScripts.some(([, cmd]) => /--production\b|\s-p\b/.test(cmd))) {
    add('warn', 'no-production-script', 'No script runs knip in production mode.', 'Add "knip:production": "knip --production" (add --strict for libraries).');
  }
  for (const [name, cmd] of knipScripts) {
    if (/--no-exit-code/.test(cmd)) add('error', 'no-exit-code', `Script "${name}" uses --no-exit-code.`, 'Remove it; Knip must fail on issues.');
    const max = cmd.match(/--max-issues[ =](\d+)/)?.[1];
    if (max && Number(max) > 0) add('warn', 'max-issues', `Script "${name}" allows ${max} issues.`, 'Lower to 0 once the backlog is fixed.');
    if (/--no-config-hints/.test(cmd)) add('warn', 'hints-suppressed', `Script "${name}" hides configuration hints.`, 'Remove --no-config-hints; hints point at stale config.');
    const removedFlag = cmd.match(/--(include-libs|isolate-workspaces|experimental-tags)\b/)?.[1];
    if (removedFlag) add('error', 'removed-flag', `Script "${name}" uses --${removedFlag}, removed in Knip 6 (exit 1).`, removedFlag === 'experimental-tags' ? 'Use --tags.' : 'Delete the flag; the behavior is always on.');
    if (/--(exclude|include)(?=[\s=]|$)/.test(cmd)) add('info', 'script-filters', `Script "${name}" filters issue types on the CLI.`, 'Prefer `rules` / `include` / `exclude` in the config so editors and CI agree.');
  }
}

// --- CI ---------------------------------------------------------------------
const ciFiles = [];
const wfDir = join(root, '.github', 'workflows');
if (existsSync(wfDir)) for (const f of readdirSync(wfDir)) if (/\.ya?ml$/.test(f)) ciFiles.push(join(wfDir, f));
for (const f of ['.gitlab-ci.yml', 'azure-pipelines.yml', 'bitbucket-pipelines.yml', '.circleci/config.yml', 'turbo.json']) {
  if (existsSync(join(root, f))) ciFiles.push(join(root, f));
}
const knipScriptNames = knipScripts.map(([name]) => name);
const ciRunsKnip = ciFiles.some(file => {
  const text = read(file) ?? '';
  if (/--no-exit-code/.test(text) && /knip/.test(text)) add('error', 'ci-no-exit-code', `${relative(root, file)} runs knip with --no-exit-code.`, 'Remove it.');
  return /\bknip\b/.test(text) || knipScriptNames.some(n => new RegExp(`run\\s+${n.replace(':', '\\:')}\\b`).test(text));
});
if (ciFiles.length === 0) {
  add('warn', 'no-ci', 'No CI config found.', 'Run knip in CI on every pull request (references/ci-and-tooling.md).');
} else if (!ciRunsKnip) {
  add('error', 'ci-missing-knip', 'CI does not run knip.', 'Add a CI step that runs the knip and knip:production scripts.');
}

// --- leftovers from replaced tools ------------------------------------------
for (const legacy of ['depcheck', 'ts-prune', 'unimported', 'ts-unused-exports']) {
  if (pkg.devDependencies?.[legacy] || pkg.dependencies?.[legacy]) {
    add('warn', 'legacy-tool', `${legacy} is installed next to Knip.`, `Remove ${legacy}; Knip covers it.`);
  }
}
for (const legacyFile of ['.depcheckrc', '.depcheckrc.json', '.depcheckrc.yml', '.unimportedrc.json']) {
  if (existsSync(join(root, legacyFile))) add('warn', 'legacy-config', `${legacyFile} still exists.`, 'Delete it after moving rules to Knip.');
}

// --- cache dir in .gitignore --------------------------------------------------
const gitignore = read(join(root, '.gitignore')) ?? '';
if (scriptEntries.some(([, c]) => /knip.*--cache/.test(c)) && !/node_modules/.test(gitignore)) {
  add('warn', 'cache-not-ignored', '--cache writes to node_modules/.cache/knip but node_modules is not git-ignored.', 'Ignore node_modules or set --cache-location to an ignored path.');
}

report();

function report() {
  const order = { error: 0, warn: 1, info: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  const errors = findings.filter(f => f.severity === 'error').length;
  if (asJson) {
    console.log(JSON.stringify({ root, configFile: configFile ?? null, findings }, null, 2));
  } else {
    console.log(`Knip setup audit: ${root}`);
    console.log(`Config: ${configFile ?? 'none'}\n`);
    if (findings.length === 0) console.log('No findings. Now run `knip` and `knip --production` to verify.');
    for (const f of findings) {
      console.log(`[${f.severity.toUpperCase()}] ${f.id}: ${f.message}\n  fix: ${f.fix}`);
    }
    const warns = findings.filter(f => f.severity === 'warn').length;
    console.log(`\n${errors} error(s), ${warns} warning(s), ${findings.length - errors - warns} info.`);
  }
  process.exit(errors > 0 ? 1 : 0);
}
