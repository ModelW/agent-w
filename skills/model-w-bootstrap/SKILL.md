---
name: model-w-bootstrap
description: Bootstrap or update the project's own Model W management skills.
license: WTFPL
metadata:
    author: with-madrid.com
---

# Model W Meta Bootstrap

This skill bootstraps a suite of specialized local skills in the
`.agents/skills/` directory. Each generated skill must include the relevant
parts of the **Model W Philosophy** to ensure consistent decision-making.

## The Model W Philosophy (Include in ALL skills)

- **Uniform DX**: Django and SvelteKit are the standard. Monorepo structure with
  components in first-level directories.
- **Quarterly Releases**: Versions (e.g., `2026.01`) impose strict "preset"
  packages for Python and Node.
- **Docker Alignment**: Base Docker images match the release number.
- **Convention over Configuration**: `snow.yml` defines the architecture and
  deployment for Kerfufoo.
- **Local First**: Prioritize local dev (no Docker) using local
  PostgreSQL/Redis.
- **Quality**: All checks (lint, format, tests) must pass after every change.

## Generated Skill Templates

### 1. `model-w-project-structure`

- **Content**: Map components to directories using `snow.yml`. Identify core
  frameworks.
- **Specific Instructions**:
    - Explain the role of each first-level directory.
    - Reference environment variables from `snow.yml`.
    - Identify task management: Django projects typically use either **Celery**
      or **Procrastinate**. Identify which one is in use and explain how to
      start its workers/schedulers.
    - **Philosophy**: Uniform DX and monorepo structure.

### 2. `model-w-deps-<component>`

- **Content**: Manage dependencies for a specific component.
- **Specific Instructions**:
    - Identify the manager: Python (`uv` or `poetry`), Node (`npm` or `pnpm`).
    - Explain how to run commands (e.g., `poetry run ./manage.py`).
    - **Updating to Latest**: Provide a clear procedure to update to the newest
      allowable versions. **CRITICAL**: Standard `update` commands (like
      `poetry update` or `npm update`) are often insufficient as they respect
      existing semver constraints in the manifest.
    - **The "\*" Strategy**: Instruct the agent to conceptually treat all
      dependencies as `*` during a Model W update. In practice, this means:
        1.  Relaxing/removing version constraints in `pyproject.toml` or
            `package.json` for all non-preset packages.
        2.  Running the install/update command to let the solver pick the latest
            compatible versions.
        3.  The Model W preset versions must remain strictly pinned as per the
            new release.
    - **Philosophy**: Quarterly release versioning and "preset" packages.

### 3. `model-w-qa-<component>`

- **Content**: Linting, formatting, and testing.
- **Specific Instructions**:
    - **Lint/Format**: Check `Makefile` or config files. Usually `prettier` for
      JS/Svelte; `ruff` or `black` + `isort` for Python.
    - **Smoke Tests**: Include `python manage.py check` for Django and
      equivalent for SvelteKit.
    - **Tests**: Look for `bdd/`, `pytest`, `vitest`. If tests fail despite
      correct execution, note they may be unmaintained.

### 4. `model-w-update` (Global)

- **Content**: The full "Model W Update" procedure.
- **Specific Instructions**:
    - **Delegation**: This skill must NOT repeat the low-level dependency
      commands. Instead, it must instruct the agent to use the
      component-specific `model-w-deps-<component>` skills to perform the actual
      updates.
    - **Presets**: Locate and update Model W preset versions in
      `pyproject.toml`, `package.json`, and `Dockerfile`.
    - **Package Updates**: Follow the delegation rule above. Ensure the agent
      understands that after updating presets, it must trigger the "Latest
      Allowable" update logic in each component.
    - **Model W Safety**: The versions of Python, Node, and other key components
      offered by Model W are guaranteed to be safe and stable. If an issue
      arises during the upgrade, it is most likely a project-specific issue that
      MUST be addressed.
    - **Risk Management**: If (and only if) there is a major upgrade
      incompatibility that cannot be resolved autonomously (common with Wagtail,
      Svelte, or Oscar), limit the update to the last compatible version and
      leave a big bold note in the `CHANGELOG.md` with a ⚠️ warning sign.
    - **Verification**: Run smoke tests, then automated tests, then verify
      Docker builds.
    - **Documentation**: Append/create `CHANGELOG.md`. Describe impactful
      changes. Use a blockquote with ⚠️ for held-back versions.

## Best Practices for Generating Skills

When creating the local skills, follow these rules to ensure they are
high-quality and actionable:

1. **Strict Frontmatter**: Always include name, description, and author in the
   YAML frontmatter. Use the `.agents/skills/<slug>/SKILL.md` path. Example:
    ```yaml
    ---
    name: model-w-project-structure
    description: Map of components and architecture for this project
    metadata:
        author: Model W Bootstrap
    ---
    ```
2. **Actionable Commands**: Provide exact, copy-pasteable shell commands inside
   backticks. Be explicit about the working directory (e.g., "Run this from the
   `/api` directory").
3. **Structured Context**: Use clear Markdown headers (`#`, `##`) to organize
   the skill. Avoid long walls of text.
4. **No Preamble**: The skill should get straight to the facts and instructions.
   Do not add "In this skill we will..." type of intros.
5. **Absolute vs Relative**: When referring to files, use relative paths from
   the repository root (e.g., `api/manage.py`) but remind the user that tools
   like `read` or `edit` usually require absolute paths which you must construct
   dynamically.
6. **Verification Steps**: For every action (installing, testing, updating),
   include a "How to verify" section with a command to check success.
7. **Philosophy Integration**: Do not just copy-paste the philosophy as a static
   block. Integrate it into the instructions (e.g., "Because Model W prioritizes
   **Local First**, this command assumes a local PostgreSQL instance is
   running").
8. **Test Before Delivery**: After creating the skills, you must **test every
   command** you documented. If a command fails or requires adjustment, update
   the skill immediately. For long-running commands (like starting a server or a
   worker), ensure you use a short timeout so they die quickly and don't hang
   indefinitely. Do NOT run them in the background.

## Frontmatter Requirements for All Skills

Every generated skill MUST start with this exact block (updated for the specific
skill):

```yaml
---
name: <skill-slug>
description: <concise-description>
metadata:
    author: Model W Bootstrap
---
```

## Investigation Steps

1. **Locate `snow.yml`** to understand the monorepo architecture.
2. **Detect managers** via `pyproject.toml`, `poetry.lock`, `uv.lock`,
   `package.json`, `pnpm-lock.yaml`, etc.
3. **Identify task management** by searching for `celery` or `procrastinate` in
   dependencies and configuration.
4. **Inspect `Makefile`** for developer shortcuts.
5. **Identify Model W version** in the `FROM` clause of `Dockerfile` or preset
   package versions.
6. **Manage `.claude` in `.gitignore`.** Check if any files in the `.claude/`
   directory are already tracked by git (e.g., `git ls-files .claude`). If no
   pre-existing `.claude` files were committed, ensure `.claude/` is added to
   the `.gitignore` file to prevent session data or temporary symlinks from
   being committed.
