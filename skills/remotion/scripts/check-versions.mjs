#!/usr/bin/env node
// Checks that every `remotion` and `@remotion/*` dependency uses the same exact version.
// Usage: bun scripts/check-versions.mjs [project-dir ...]   (default: current directory)
// Exit code 1 when a problem is found. No dependencies; runs with Bun or Node >= 18.

import {existsSync, readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';

const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const EXACT = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
// Published but intentionally versioned separately or internal; never part of the aligned set.
const IGNORED = new Set(['@remotion/compositor-win32-x64-msvc']);

const isRemotionPackage = (name) => (name === 'remotion' || name.startsWith('@remotion/')) && !IGNORED.has(name);

const readJson = (file) => {
	try {
		return JSON.parse(readFileSync(file, 'utf8'));
	} catch {
		return null;
	}
};

const installedVersion = (projectDir, name) => {
	const pkg = readJson(path.join(projectDir, 'node_modules', name, 'package.json'));
	return pkg?.version ?? null;
};

// Nested copies of `remotion` break React context ("No video config found").
const findNestedRemotionCopies = (projectDir) => {
	const scopeDir = path.join(projectDir, 'node_modules', '@remotion');
	if (!existsSync(scopeDir)) return [];
	const copies = [];
	for (const entry of readdirSync(scopeDir)) {
		const nested = path.join(scopeDir, entry, 'node_modules', 'remotion', 'package.json');
		const pkg = existsSync(nested) ? readJson(nested) : null;
		if (pkg) copies.push({owner: `@remotion/${entry}`, version: pkg.version});
	}
	return copies;
};

const checkProject = (projectDir) => {
	const manifestPath = path.join(projectDir, 'package.json');
	const manifest = readJson(manifestPath);
	if (!manifest) {
		return {projectDir, problems: [`No readable package.json at ${manifestPath}`], declared: []};
	}

	const declared = [];
	for (const field of DEP_FIELDS) {
		for (const [name, range] of Object.entries(manifest[field] ?? {})) {
			if (isRemotionPackage(name)) declared.push({name, range: String(range), field});
		}
	}

	const problems = [];
	if (declared.length === 0) {
		return {projectDir, problems, declared};
	}

	for (const dep of declared) {
		if (dep.field === 'peerDependencies') continue; // libraries may use "*" as a peer range
		if (dep.range.startsWith('workspace:') || dep.range.startsWith('catalog:')) continue;
		if (!EXACT.test(dep.range)) {
			problems.push(`${dep.name} uses range "${dep.range}" in ${dep.field}; pin an exact version (remove ^ or ~).`);
		}
	}

	const exactVersions = new Set(
		declared.filter((d) => d.field !== 'peerDependencies' && EXACT.test(d.range)).map((d) => d.range),
	);
	if (exactVersions.size > 1) {
		problems.push(`Declared versions differ: ${[...exactVersions].join(', ')}. Use one version for all Remotion packages.`);
	}

	const installed = new Map();
	for (const dep of declared) {
		const version = installedVersion(projectDir, dep.name);
		if (version) installed.set(dep.name, version);
	}
	const installedVersions = new Set(installed.values());
	if (installedVersions.size > 1) {
		const detail = [...installed.entries()].map(([n, v]) => `${n}@${v}`).join(', ');
		problems.push(`Installed versions differ: ${detail}. Reinstall after aligning versions.`);
	}

	for (const copy of findNestedRemotionCopies(projectDir)) {
		problems.push(`Nested copy remotion@${copy.version} under ${copy.owner}; align versions so only one copy exists.`);
	}

	return {projectDir, problems, declared, installed};
};

const dirs = process.argv.slice(2);
const targets = dirs.length > 0 ? dirs : [process.cwd()];
let failed = false;

for (const target of targets) {
	const result = checkProject(path.resolve(target));
	console.log(`\n${result.projectDir}`);
	if (result.declared.length === 0 && result.problems.length === 0) {
		console.log('  No remotion or @remotion/* dependencies found.');
		continue;
	}
	for (const dep of result.declared) {
		const inst = result.installed?.get(dep.name);
		console.log(`  ${dep.name.padEnd(36)} ${dep.range.padEnd(14)} ${dep.field}${inst ? `  (installed ${inst})` : ''}`);
	}
	if (result.problems.length === 0) {
		console.log('  OK: all Remotion packages are aligned.');
	} else {
		failed = true;
		for (const problem of result.problems) console.log(`  PROBLEM: ${problem}`);
		if (result.declared.length > 0) {
			console.log('  Fix: bunx remotion upgrade (or set every Remotion package to one exact version), then reinstall.');
		}
	}
}

process.exit(failed ? 1 : 0);
