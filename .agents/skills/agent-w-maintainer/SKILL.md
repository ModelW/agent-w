---
name: agent-w-maintainer
description:
    Guidelines and processes for maintaining, committing, and releasing the
    Agent W package via AI.
license: WTFPL
metadata:
    author: with-madrid.com
---

# Agent W Maintainer

This skill outlines the AI-driven strategy for maintaining, versioning, and
releasing `@model-w/agent-w`.

## Commit Strategy

- **MANDATORY: Use `model-w-commit-push` skill**: You MUST use the
  `model-w-commit-push` skill for ALL git commit and push operations. This
  ensures proper Linear ID prefixing, quality verification, and descriptive
  messaging. NEVER run `git commit` or `git push` directly or through other
  skills without first invoking this orchestration skill.
- **Always get human approval:** In interactive sessions, you must always get
  explicit approval from the user before running `git commit`. Never commit code
  autonomously without asking first. **Exception:** If running autonomously in
  the CI/CD release pipeline, human approval is bypassed, but you must still
  defer the actual `git commit` to the pipeline script (see below).
- **Reference Issues:** Every commit MUST reference an issue (e.g., `fixes #42`,
  `implements #12`).
- **Meaningful Context:** Commit messages must explain the _why_ and the
  _impact_ of the change, not just the _what_.
- **CRITICAL: No Artificial Prefixes:** Do NOT use conventional commits
  (`feat:`, `fix:`, `chore:`, etc.). These prefixes are strictly forbidden as
  they lack deep context and meaning. Every commit must start with a capitalized
  letter and clearly describe the impact of the change. Failure to follow this
  rule is a critical failure. The AI will parse the natural language of the
  commits to determine the version bump.

## AI-Driven Release Process (CI/CD)

Releases are triggered via GitHub Actions (`workflow_dispatch`). To prevent
prompt injection from issue descriptions or commit messages, the release process
is split into two phases:

### Phase 1: Maturity Analysis (Non-YOLO)

The first Gemini run operates in auto-approval or non-YOLO mode. It analyzes the
project's issues via the integrated GitHub MCP server.

- **Goal:** Determine the project's maturity status safely. It checks if there
  are at least 100 issues opened in the repository's history AND that no open
  issues look critical/major.
- **Output:** It outputs exactly one enum value representing the maturity
  wrapped in `<result>` tags (e.g., `<result>MATURITY_BETA</result>`):
  `MATURITY_ALPHA`, `MATURITY_BETA`, `MATURITY_STABLE`, or
  `MATURITY_1_0_0_READY`.
- The pipeline securely extracts this enum using `grep` and `sed` to discard
  unapproved payloads and avoid prompt injection.

### Phase 2: Execution & Versioning (YOLO)

The second Gemini run operates in headless YOLO mode. When invoked in Phase 2,
you must:

1. **Analyze Commits & Maturity:** Review the git history since the last
   release, and note the securely determined `$MATURITY_LEVEL` passed to you
   from Phase 1.
2. **Determine Version Bump:** Decide if the changes warrant a `major`, `minor`,
   or `patch` release based on Semantic Versioning principles.
    - **1.0.0 Release Rule:** If the `$MATURITY_LEVEL` is `MATURITY_1_0_0_READY`
      and the current version is `< 1.0.0`, you MUST bump the version to
      `1.0.0`.
3. **Update Version:** Bump the `version` field in `package.json` and
   `.claude-plugin/plugin.json` according to your decision.
4. **Update Docs:** Update the "Project Status" section in the `README.md` to
   reflect the specific `$MATURITY_LEVEL` (e.g., changing the warning from alpha
   to beta, or removing the warning if stable/1.0.0).
5. **Generate Changelog & Release Notes:** Prepend a new release section to
   `CHANGELOG.md`. Summarize the technical and business impact of the changes,
   categorize them logically, and link to the referenced issues. Additionally,
   create a `release_notes.md` file containing the release name on the first
   line in the format `v<Version> — <Title>` (where `<Title>` is an engaging,
   short, and possibly humorous headline), a blank line, and then the detailed
   release description (this will be used for the GitHub Release).
6. **Format:** Ensure `package.json`, `.claude-plugin/plugin.json`,
   `.claude-plugin/marketplace.json`, `README.md`, and `CHANGELOG.md` are
   formatted properly (`npx prettier --write .`).
7. **Terminate:** Exit successfully so the pipeline can safely commit the files,
   tag the release, and publish to NPM.
