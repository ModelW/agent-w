---
name: commit-and-push
description: Guidelines for committing and pushing changes to the repository.
license: WTFPL
metadata:
    author: with-madrid.com
---

# Commit and Push Strategy

This skill defines the strict rules for version control operations within this
project.

## 1. MANDATORY ORCHESTRATION

**CRITICAL: You MUST use the `model-w-commit-push` skill for ALL git commit and
push operations.**

Do NOT use the raw `git` command or any other skill to perform commits or
pushes. The `model-w-commit-push` skill is the ONLY authorized way to handle
version control, as it ensures:

- Linear Issue ID prefixing based on branch names.
- Mandatory quality verification (hygiene) before commits.
- High-quality, context-aware commit messages via specialized sub-agents.
- Separation of concerns between committing and pushing.

## 2. Explicit Consent

**Committing and pushing are distinct operations and must be handled
separately.**

- **Commit**: You may only run `git commit` when explicitly and immediately
  asked to "commit" (e.g., "commit this").
- **Push**: You may only run `git push` when explicitly and immediately asked to
  "push".
- **CRITICAL**: If the user asks you to "commit", you must **NOT** push the
  changes unless they also explicitly asked to "push" (e.g., "commit and push").
- **NO AUTONOMY**: Even if you have been asked to commit once, every subsequent
  set of changes requires a **NEW** and **EXPLICIT** manual instruction to
  commit. Do not assume that a prior instruction to "keep committing" or "commit
  your work" applies to future changes. Only commit in reaction to IMMEDIATE
  instructions from the user.

Automatic or proactive version control operations are strictly prohibited.

## 2. Commit Message Format

When you are asked to commit, you must follow this exact format for the commit
message:

### Title (Subject Line)

A short, descriptive title that highlights the **business or functional value**
of the changes.

### Description (Body)

A short paragraph (separated by a blank line from the title) explaining **what**
was changed and **why** it was necessary.

### Example:

```text
Enable native Claude Code plugin support

Created the required plugin manifests and established a symlink-based skill
discovery mechanism. This allows Claude Code users to use Model W skills
out-of-the-box without manual configuration.
```
