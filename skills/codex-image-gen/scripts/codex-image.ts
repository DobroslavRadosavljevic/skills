#!/usr/bin/env bun
/**
 * Generates or edits images through the Codex CLI built-in image tool and copies the results to
 * a path you choose.
 *
 * Why: a plain `codex exec` run loads the full user config (MCP servers, plugins, skills), costs
 * 100k+ input tokens, and the model often fails to copy the image out of `$CODEX_HOME`. This
 * script runs a lean, read-only, ephemeral session, tells the model to only call the image tool,
 * and then copies the files itself from `$CODEX_HOME/generated_images/<thread_id>/`.
 *
 * Usage:
 *   bun codex-image.ts --out <file.png> [--prompt "<text>" | prompt on stdin]
 *                      [--image <file>]… [--transparent] [--n <count>]
 *                      [--timeout <seconds>] [--full-config] [--force]
 *
 * Model: always gpt-6-luna at low effort. The text model only writes the tool call; a separate image model draws the picture, so
 * a bigger model costs more and does not make better images.
 *
 * Output: one JSON object on stdout with `files`, `threadId`, `model`, `usage`, and `seconds`.
 * Exit code 1 on any failure, with the reason on stderr.
 */
import { copyFile, mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    prompt: { type: "string" },
    out: { type: "string" },
    image: { type: "string", multiple: true, default: [] },
    transparent: { type: "boolean", default: false },
    n: { type: "string", default: "1" },
    timeout: { type: "string", default: "300" },
    "full-config": { type: "boolean", default: false },
    force: { type: "boolean", default: false },
  },
});

const fail = (message: string): never => {
  console.error(`codex-image: ${message}`);
  process.exit(1);
};

const MODEL = "gpt-6-luna";
const EFFORT = "low";

const prompt = (values.prompt ?? (process.stdin.isTTY ? "" : await Bun.stdin.text())).trim();
if (!prompt) fail("missing prompt (use --prompt or pipe it on stdin)");
if (!values.out) fail("missing --out <file.png>");

const count = Number(values.n);
if (!Number.isInteger(count) || count < 1 || count > 8) fail("--n must be an integer from 1 to 8");

const out = resolve(values.out!);
const targets =
  count === 1
    ? [out]
    : Array.from({ length: count }, (_, i) => {
        const ext = extname(out) || ".png";
        return join(dirname(out), `${basename(out, ext)}-${i + 1}${ext}`);
      });
if (!values.force) {
  for (const target of targets) {
    if (await Bun.file(target).exists()) fail(`${target} exists (pass --force to overwrite)`);
  }
}

const images = values.image.map((path) => resolve(path));
for (const image of images) {
  if (!(await Bun.file(image).exists())) fail(`input image not found: ${image}`);
}

// The model copies paths into the tool call by hand and mistypes long ones, so inputs are
// staged under short relative names in a scratch working directory.
const workdir = await mkdtemp(join(tmpdir(), "codex-image-"));
const inputs: string[] = [];
for (const [i, image] of images.entries()) {
  const name = `input-${i + 1}${extname(image) || ".png"}`;
  await copyFile(image, join(workdir, name));
  inputs.push(name);
}

const instructions = [
  `Call the image generation tool exactly ${count} time${count === 1 ? "" : "s"}, then stop.`,
  "Pass the prompt below to the tool verbatim. Do not rewrite, shorten, or expand it.",
  ...(values.transparent ? ["Set transparent_background to true."] : []),
  ...(inputs.length
    ? [`Input images, attached in this order: ${inputs.join(", ")}. Pass exactly these as referenced_image_paths.`]
    : []),
  "Do not run shell commands, read files, or write files. Do not reply with any text.",
  "",
  "PROMPT:",
  prompt,
].join("\n");

const codexHome = process.env.CODEX_HOME ?? join(homedir(), ".codex");
await mkdir(dirname(out), { recursive: true });

const args = [
  "exec",
  "--json",
  "--ephemeral",
  "--skip-git-repo-check",
  "--sandbox",
  "read-only",
  "--cd",
  workdir,
  "--model",
  MODEL,
  "-c",
  `model_reasoning_effort="${EFFORT}"`,
  ...(values["full-config"] ? [] : ["--ignore-user-config", "--ignore-rules"]),
  // `-i` takes several values, so the prompt goes on stdin, never after it.
  ...inputs.flatMap((name) => ["--image", join(workdir, name)]),
  "-",
];

const started = Date.now();
const child = Bun.spawn(["codex", ...args], {
  stdin: new Blob([instructions]),
  stdout: "pipe",
  stderr: "pipe",
});
const timer = setTimeout(() => child.kill(), Number(values.timeout) * 1000);
const [stdout, stderr, exitCode] = await Promise.all([
  new Response(child.stdout).text(),
  new Response(child.stderr).text(),
  child.exited,
]);
clearTimeout(timer);
await rm(workdir, { recursive: true, force: true });

let threadId: string | undefined;
let usage: unknown;
for (const line of stdout.split("\n")) {
  if (!line.startsWith("{")) continue;
  const event = JSON.parse(line);
  if (event.type === "thread.started") threadId = event.thread_id;
  if (event.type === "turn.completed") usage = event.usage;
  if (event.type === "turn.failed" || event.type === "error") {
    fail(`codex reported ${event.type}: ${JSON.stringify(event.error ?? event)}`);
  }
}
if (!threadId) fail(`codex exited ${exitCode} without a thread id:\n${stderr.slice(-2000)}`);

const imageDir = join(codexHome, "generated_images", threadId!);
const generated = await readdir(imageDir).catch(() => [] as string[]);
const files = (
  await Promise.all(
    generated.map(async (name) => ({
      path: join(imageDir, name),
      mtime: (await stat(join(imageDir, name))).mtimeMs,
    })),
  )
).sort((a, b) => a.mtime - b.mtime);

if (files.length === 0) {
  const errors = stderr
    .split("\n")
    .filter((line) => /error/i.test(line))
    .join("\n");
  fail(`no image was generated (exit ${exitCode}).\n${errors || stderr.slice(-2000)}`);
}

const written: string[] = [];
for (const [i, file] of files.slice(0, targets.length).entries()) {
  await copyFile(file.path, targets[i]!);
  written.push(targets[i]!);
}

console.log(
  JSON.stringify(
    {
      files: written,
      missing: Math.max(0, targets.length - files.length),
      threadId,
      source: imageDir,
      model: MODEL,
      effort: EFFORT,
      usage,
      seconds: Math.round((Date.now() - started) / 1000),
    },
    null,
    2,
  ),
);
