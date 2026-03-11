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

- **Always get human approval:** You must always get explicit approval from the
  user before running `git commit`. Never commit code autonomously without
  asking first.
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
3. **Update Version:** Bump the `version` field in `package.json`.
4. **Generate Changelog:** Prepend a new release section to `CHANGELOG.md`.
   Summarize the technical and business impact of the changes, categorize them
   logically, and link to the referenced issues.
5. **Format:** Ensure `package.json` and `CHANGELOG.md` are formatted properly
   (`npx prettier --write .`).
6. **Terminate:** Exit successfully so the pipeline can commit the files, tag
   the release, and publish to NPM.
