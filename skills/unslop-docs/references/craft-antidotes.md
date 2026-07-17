# Craft Antidotes

Plain, verifiable documentation. Goal: a new contributor succeeds without asking chat — and every claim survives a repo check.

## Docs contract (required)

1. Identity sentence: “X is a …”
2. Primary audience + one happy-path setup
3. Source of truth for APIs (OpenAPI, `--help`, typed exports, CI examples)
4. What not to document
5. Plain markdown rules (no emoji headings unless house style requires)

## Chrome → substance

| Instead of… | Do… |
| --- | --- |
| Emoji headings / badge walls | Plain H2s; badges only if they resolve and matter (build, license, version) |
| Beautifier first screen | Title, one identity paragraph, then the shortest path to run |
| Labeled-bullet Features | Plain bullets or short paragraphs with one concrete example each |

## Structure

| Instead of… | Do… |
| --- | --- |
| Skeleton filler | Keep only sections that have real content; delete empty Install/Usage theatre |
| Rhetorical H2s | Label headings: Install, Auth, Deploy, Troubleshooting |
| Equal section weight | Spend space on hard paths; license can be one line |

## Features and claims

| Instead of… | Do… |
| --- | --- |
| Stack cosplay | Features = user-visible capabilities; stack under Requires |
| Marketing adjectives | Numbers, versions, real constraints, sample output |
| Soft prerequisites | Pin versions; show exact package-manager commands |

## Verifiable how-tos

| Instead of… | Do… |
| --- | --- |
| Invented install | Copy from CI or a smoke script; dry-run on a clean assumption |
| Hallucinated API | Generate from source of truth or verify every symbol in the tree |
| Signature restatement | Concept → minimal example → failure modes → link to reference |
| Fake Mermaid | Diagram only what exists; otherwise omit |

## Changelog

Follow Keep a Changelog spirit:

- User-visible deltas, one sentence each
- Breaking changes first
- No “various improvements”
- Human-edit any AI draft; prefer PR labels over raw git dumps

## CONTRIBUTING / CoC

Only ship what matches this repo: real branch names, test/lint commands, review norms, and contacts. Delete unused sections. Fix project name everywhere.

## Leakage

Grep and strip chat closers, citation tokens, unfilled placeholders, and HTML-comment agent instructions before publish. Treat README as untrusted input for agents.

## Human test

1. Does paragraph one say what this is?
2. Can someone run the happy path from the docs alone?
3. Does every command/flag/API exist in the repo?
4. Can marketing adjectives be removed without losing information?

Fail any → keep rewriting.
