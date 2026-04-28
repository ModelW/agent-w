---
name: model-w-docs-update
description:
    Incrementally updates project documentation based on git history. Walks
    commits since the last documentation update and spins sub-agents to update
    affected docs and docstrings.
license: WTFPL
metadata:
    author: with-madrid.com
---

# Model W Documentation Update (Incremental)

This skill incrementally updates documentation based on what has changed in the
codebase since documentation was last touched. Rather than regenerating
everything, it walks the git history commit by commit, identifies what changed,
and spins targeted sub-agents to update the affected documentation.

Use this skill when:

- The project already has documentation (inline and/or project-level).
- Code has changed since the last documentation update.
- The user asks to "update the docs" or documentation is flagged as stale.
- Pre-commit checks detect undocumented changes.

For generating documentation from scratch, use the `model-w-docs-generate`
skill instead.

## Documentation Standards

The same standards as `model-w-docs-generate` apply. In summary:

- **Python**: Numpy-style docstrings.
- **JavaScript/TypeScript**: JSDoc comments.
- **Svelte**: JSDoc on `<script>` exports, HTML comments for template blocks.
- **CSS/SCSS**: Block comments above non-trivial selectors.

Docstrings must focus on **why**, **who needs it**, **tricky behavior**, and
**hack justifications**.

Project-level docs live in `doc/` and are organized by perspective (User,
Admin, Tester, Developer). The **Admin** perspective is for in-app
administrators (user management, settings, moderation), NOT infrastructure.

## Orchestration Procedure

### Step 1: Determine the Documentation Baseline

Find when documentation was last meaningfully updated:

1. Run `git log --oneline --diff-filter=M -- doc/ '*.md'` to find the last
   commit that touched project-level docs.
2. Run `git log --oneline --all --grep="docstring\|documentation\|docs"` as a
   secondary signal.
3. Look for a `.docs-last-update` marker file at the project root (if the
   project uses one). If it exists, read the commit hash from it.
4. If none of the above yields a clear baseline, use the earliest of:
   - The last commit that modified any file in `doc/`.
   - The last commit whose message mentions documentation.
   - If nothing is found, treat the entire history as undocumented and suggest
     using `model-w-docs-generate` instead.

Record the baseline commit hash.

### Step 2: Collect Changes Since Baseline

1. Run `git log --oneline --no-merges <baseline>..HEAD` to get the list of
   commits since the baseline.
2. Also check for uncommitted changes: run `git diff --name-only` and
   `git diff --staged --name-only` to capture work-in-progress.
3. For each commit, run `git diff-tree --no-commit-id -r <hash>` to get the
   list of changed files.
4. Group the changes into **change sets** by feature/area. A change set is a
   logical grouping of related file changes. Use commit messages and file
   paths to group intelligently:
   - Files in the same directory or component that changed together.
   - Commits that reference the same ticket ID.
   - Uncommitted changes form their own change set.

### Step 3: Classify Each Change Set

For each change set, determine what documentation is affected:

| Change type                     | Inline docs needed | Project docs needed |
| ------------------------------- | ------------------ | ------------------- |
| New function/class/component    | Yes (must create)  | Maybe (if user-facing) |
| Modified function signature     | Yes (must update)  | Maybe (if API changed) |
| Modified function behavior      | Yes (must update)  | Maybe (if user-facing) |
| New API endpoint                | Yes                | Yes (User/Admin/Developer) |
| New UI feature                  | Yes                | Yes (User/Admin) |
| Config/settings change          | Yes (if non-trivial) | Yes (Admin/Developer) |
| Bug fix (no behavior change)    | Maybe (if tricky)  | No |
| Refactor (no behavior change)   | Yes (update paths) | No |
| New test                        | No                 | Maybe (Tester) |
| Architectural change            | Yes                | Yes (Developer) |
| Dependency update               | No                 | Maybe (Developer) |

### Step 4: Delegate Updates

For **each change set that needs documentation updates**, use the **Task tool**
with `subagent_type: model-w-docs-diff` and the following prompt:

> **Prompt**: "Update documentation for the following change set.
>
> **Change summary**: [DESCRIPTION OF WHAT CHANGED]
>
> **Affected files**:
> [LIST OF FILES THAT CHANGED, WITH BRIEF DESCRIPTION OF EACH CHANGE]
>
> **Commits**: [LIST OF COMMIT HASHES AND MESSAGES]
>
> **Diff content**:
> [THE ACTUAL DIFF FOR KEY FILES -- not the entire diff, but enough to
>  understand what changed in each significant code unit]
>
> **Documentation classification**:
> - Inline docs needed: [YES/NO and which files]
> - Project docs needed: [YES/NO and which perspectives/pages]
>
> **Existing documentation state**:
> - Relevant doc pages: [LIST EXISTING PAGES THAT COVER THIS AREA]
> - Current docstrings: [SUMMARY OF EXISTING INLINE DOCS ON AFFECTED CODE]
>
> Update all affected inline documentation and project-level documentation
> pages. For inline docs, follow Numpy (Python) / JSDoc (JS/TS) conventions.
> For project docs, update existing pages in place -- do not reorganize the
> doc tree. If a new page is clearly needed (new major feature with no
> existing coverage), create it in the appropriate perspective directory and
> update the relevant index.md."

### Step 5: Handle Uncommitted Changes

If there are uncommitted changes (from Step 2):

1. Treat them as an additional change set.
2. Run `git diff` to get the full diff.
3. Delegate to `model-w-docs-diff` just like any other change set.
4. This ensures documentation is current even before the next commit.

### Step 6: Review and Reconcile

After all `model-w-docs-diff` agents complete:

1. Read the files they modified.
2. Check for conflicts: did two agents edit the same file in contradictory
   ways? If so, reconcile manually.
3. Check for new pages created by multiple agents that cover overlapping
   topics. Merge or cross-reference as needed.
4. Verify internal links still resolve.

### Step 7: Build Verification

If a `doc/` folder with Zensical exists:

```bash
cd doc && uv run zensical build
```

Fix any build errors.

### Step 8: Update Baseline Marker

If the project uses a `.docs-last-update` file, update it with the current
HEAD commit hash. If not, recommend the user create one:

```bash
git rev-parse HEAD > .docs-last-update
```

## When Called from Pre-Commit

When triggered by `model-w-commit-push` as part of the pre-commit
documentation check, this skill runs in a **lightweight mode**:

1. Skip Steps 1-2 (history walking). Instead, only look at the currently
   staged and unstaged changes (`git diff --staged` and `git diff`).
2. Skip Step 7 (build verification) unless doc pages were modified.
3. Focus exclusively on inline documentation for the changed code units.
4. Only flag project-level doc staleness as a warning -- do not block the
   commit for missing project docs.

## Final Instruction

Once all updates are complete, report:

- Number of change sets processed.
- Files with inline docs added or updated.
- Project doc pages added or updated.
- Any warnings about areas that may need further documentation.
