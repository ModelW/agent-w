---
name: model-w-commit-push
description:
    MANDATORY. MUST be used for ALL git commit and push operations. Orchestrates
    Model W git workflows with Linear ID support.
license: WTFPL
metadata:
    author: with-madrid.com
---

# Model W Commit & Push

This skill handles independent git operations (commit or push) using specialized
sub-agents. It ensures code hygiene before committing and automatically handles
Linear Issue ID prefixing.

## CRITICAL: Immediate Instruction Only

You MUST only trigger these scenarios if the **IMMEDIATELY PREVIOUS**
instruction from the user was an explicit request to perform that specific
action.

- **Do NOT** commit or push based on an instruction from earlier in the
  conversation.
- **Do NOT** assume a prior instruction to "keep committing" or "push when done"
  applies to the current state.
- Every operation requires a **FRESH and IMMEDIATE** manual command from the
  user (e.g., "commit this now" or "push these changes").

## Scenario A: Commit

Triggered ONLY when the user's **IMMEDIATE PREVIOUS** instruction is to
**commit** their work.

### 1. Preparation

- **Extract Linear ID**: Check the current git branch. If it follows the pattern
  `*/[issue-id]-*` (e.g., `feature/log-73-something`), extract the ID (e.g.,
  `LOG-73`).
- **Linear Context**: If a Linear ID is found AND Linear MCP tools are
  available, use those tools to look up the issue details (title, description)
  for deeper context.
- **Hygiene Check**: Search for and load project-specific quality skills (e.g.,
  `model-w-qa-*` or `model-w-hygiene` created by the bootstrap skill). Run the
  quality checks defined in those skills. **All checks must pass before
  proceeding.**
- **Documentation Check**: Before committing, verify that documentation is
  up-to-date for the changes being committed. This follows the lightweight
  mode of the `model-w-docs-update` skill:
  1. Check `git diff --staged` and `git diff` for modified/added code files.
  2. For each modified code file, verify that all significant code units
     (functions, classes, components, non-trivial selectors) have inline
     documentation (docstrings/JSDoc/block comments). New code units MUST have
     documentation. Modified code units MUST have their documentation updated
     if the behavior changed.
  3. Docstrings must follow project conventions: Numpy-style for Python, JSDoc
     for JS/TS, block comments for CSS. They must explain **why** the code
     exists, not just restate the signature.
  4. If a `doc/` folder exists with project-level documentation and the changes
     are significant (new feature, architectural change, config change), flag
     that project docs may need updating. Warn the user but do not block the
     commit -- suggest running `model-w-docs-update` as a follow-up.
  5. **Missing inline docs on new code units MUST block the commit.** Add the
     documentation before proceeding.

### 2. Orchestration

Invoke the `model-w-commit` agent.

> **Prompt**: "Perform a git commit.
>
> - **Linear ID**: [EXTRACTED_ID or NONE]
> - **Justification**: [Summary of user requests during this session]
> - **Work Done**: [Explanation of the changes implemented]
>
> Draft a high-quality commit message and execute the commit."

## Scenario B: Push

Triggered ONLY when the user's **IMMEDIATE PREVIOUS** instruction is to **push**
their committed changes.

### Orchestration

Invoke the `model-w-push` agent.

> **Prompt**: "Push the current branch to the remote repository. Ensure the
> operation is successful."

## Constraints

- Commit and push are **independent**. Do not push automatically after a commit
  unless specifically asked.
- Always use the sub-agents for the actual git operations.
