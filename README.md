# Agent Skills

Personal agent skills I use in development workflows.

These are plain skill folders. Each skill has a `SKILL.md` entrypoint and may include focused references, scripts, assets, or product-specific metadata. The skill instructions are written to be usable across agent harnesses instead of depending on one tool.

## 🧰 Skills

| Skill | Purpose |
| --- | --- |
| `loop` | Implement, review, fix, and repeat until no actionable review issues remain. |
| `ultraplan` | Ask detailed planning questions, recommend answers, and produce a precise implementation plan before work starts. |
| `motion` | Design, audit, specify, or implement product UI motion with accessibility and performance in mind. |

## 📁 Structure

```text
skills/
  <skill-name>/
    SKILL.md
    agents/
      openai.yaml
    references/
    scripts/
    assets/
```

Only `SKILL.md` is required. The other folders appear when they are useful for that skill.

## 🚀 Using A Skill

Copy a skill folder from `skills/` into the skill directory used by your agent harness, or point your agent at the folder directly if your harness supports that.

For example:

```text
skills/loop
skills/ultraplan
skills/motion
```

## ⚡ Install With skills.sh

The [skills.sh](https://www.skills.sh/) CLI can install skills from GitHub repos, URLs, or local paths.

From this checkout:

```bash
npx skills add .
```

After this repo is published, replace `OWNER/REPO` with the GitHub repo name:

```bash
# List available skills without installing
npx skills add OWNER/REPO --list

# Install one skill
npx skills add OWNER/REPO --skill loop

# Install multiple skills
npx skills add OWNER/REPO --skill loop --skill ultraplan

# Install all skills from the repo
npx skills add OWNER/REPO --skill '*'
```

Useful options:

- `-g, --global`: install globally instead of into the current project.
- `-a, --agent <name>`: install for a specific agent, such as `codex` or `claude-code`.
- `--copy`: copy files instead of symlinking them.
- `-y, --yes`: skip prompts.
- `--all`: install all skills to all supported agents without prompts.

Example:

```bash
npx skills add OWNER/REPO --skill motion -a codex -g
```

## 🧭 Skill Conventions

- Skill folder names are lowercase with hyphens.
- `SKILL.md` frontmatter contains only `name` and `description`.
- `description` explains both what the skill does and when it should trigger.
- Long or detailed guidance goes in `references/` and is linked from `SKILL.md`.
- Scripts and assets are included only when the skill actually uses them.
- Individual skill folders do not have their own README files.

## 📄 License

[MIT](LICENSE)
