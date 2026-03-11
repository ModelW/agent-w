---
name: agent-w-maintainer
description:
    Guidelines and processes for maintaining, committing, and releasing the
    Agent W package via AI.
---

# Agent W Maintainer

This skill outlines the AI-driven strategy for maintaining, versioning, and
releasing `@model-w/agent-w`.

## Commit Strategy

- **Always get human approval:** In interactive sessions, you must always get
  explicit approval from the user before running `git commit`. Never commit code
  autonomously without asking first. **Exception:** If running autonomously in
  the CI/CD release pipeline, human approval is bypassed, but you must still
  defer the actual `git commit` to the pipeline script (see below).
- **Reference Issues:** Every commit MUST reference an issue (e.g., `fixes #42`,
  `implements #12`).
- **Meaningful Context:** Commit messages must explain the _why_ and the
  _impact_ of the change, not just the _what_.
- **No Artificial Prefixes:** Do not use conventional commits (`feat:`, `fix:`,
  `chore:`). They lack deep context and meaning. The AI will parse the natural
  language of the commits to determine the version bump.

## AI-Driven Release Process (CI/CD)

Releases are triggered via GitHub Actions (`workflow_dispatch`). When triggered,
Gemini CLI runs in headless mode to perform the release.

When invoked in the CI pipeline to perform a release, you must:

1. **Analyze Commits:** Review the git history since the last release.
2. **Determine Version Bump:** Decide if the changes warrant a `major`, `minor`,
   or `patch` release based on Semantic Versioning principles.
    - **1.0.0 Release Criteria:** The project is currently in `0.0.x` alpha. You
      may only bump the version to `1.0.0` if you can verify that at least 100
      issues have been opened in the repository's history, AND no issues that
      look important remain unclosed. Use your `run_shell_command` tool to run
      GitHub CLI commands (e.g., `gh issue list --state all --limit 1000`) to
      verify these conditions. If these conditions are met, you may proceed with
      a major bump to `1.0.0`.3. **Update Version:** Bump the `version` field in
      `package.json`.
3. **Generate Changelog & Update Docs:** Prepend a new release section to
   `CHANGELOG.md`. Summarize the technical and business impact of the changes,
   categorize them logically, and link to the referenced issues. As you observe
   adoption growing and feedback stabilizing over time, autonomously update the
   "Project Status" section in the `README.md` to reflect its maturation (e.g.,
   from "early alpha" to "beta" or "stable").
4. **Format:** Ensure `package.json` and `CHANGELOG.md` are formatted properly
   (`npx prettier --write .`).
5. **Terminate:** Exit successfully so the pipeline can commit the files, tag
   the release, and publish to NPM.
