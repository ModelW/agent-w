---
name: model-w-run-tests
description: >-
    MUST be loaded before running tests, linting, type-checking, or any QA
    pipeline. Orchestrates static analysis and test execution through sub-agents
    with an iterative fix loop that minimizes context usage.
license: WTFPL
metadata:
    author: with-madrid.com
---

# Model W Run Tests

This skill orchestrates the full quality-assurance pipeline -- static analysis,
test execution, and iterative failure resolution -- through context-efficient
sub-agents. Each sub-agent receives only the information it needs, and the root
agent curates summaries between steps to avoid context bloat.

**CRITICAL: You are an orchestrator.** Your default mode is delegation -- every
action goes through a sub-agent. You read sub-agent reports, decide what to do
next, and craft the right prompt for the next sub-agent. You MAY take direct
action (edit a file, run a command) only as a **last resort** when a sub-agent
has failed or returned unusable results and re-delegating would not help. This
should be rare. (Exception: maintaining the Testing contract in Step 6 is
yours.)

## When to Use

- The user asks to "run the tests", "run QA", "check everything", or similar.
- The user asks to "fix the tests" or "make the tests pass".
- Before committing (called implicitly by `model-w-commit-push`'s hygiene
  check).

## When NOT to Use

If the user asks for a **small, specific scope** (e.g., "run just this one
test", "only lint this file", "type-check the api component"), run the command
directly without this orchestration -- but still apply the Testing contract's
fast command, quiet flags, output-to-file, and explicit timeout.

## Sub-Agent Roster

| Agent                    | Role                        | Can edit code? | Can run tests? |
| ------------------------ | --------------------------- | -------------- | -------------- |
| `model-w-qa-static`     | Static analysis (fix loop)  | Yes            | No             |
| `model-w-qa-test-runner` | Test execution (report only) | No             | Yes            |
| `model-w-qa-test-fixer`  | Failure investigation + fix  | Yes            | No             |

Additionally, `model-w-bootstrap-explorer` is used for tooling discovery when
project-specific QA skills are not available.

## The Testing Contract

Model W projects document how to run tests **fast** in a conventional
place. The contract lives in the project's `AGENTS.md` under a
`## Testing` section, and -- when the project has been bootstrapped --
also in its `model-w-qa-*` skills. It looks like:

```markdown
## Testing

- Full suite (fast): `pytest -q -n auto --reuse-db` (~90s, timeout 240000ms)
- Single test: `pytest -q path/to/test.py::test_name` (~5s, timeout 60000ms)
- One BDD feature: `pytest -q tests/bdd/LOG-73.feature` (~20s, timeout 120000ms)
- Always: redirect output to a temp file; silent on success; dump failures only.
- Last measured: 2026-08-13, full suite 87s.
```

Every test invocation in this skill follows three rules, no exception:

1. **Fast command**: use the contract's parallel/quiet command
   (`-n auto` when pytest-xdist is installed, `--reuse-db`, `-q`), not a
   bare runner invocation.
2. **Output to file, quiet on success**: all output redirected to a
   temp file; on green runs nothing gets quoted back; on failures only
   the relevant excerpts.
3. **Explicit timeout**: every bash call running tests passes a
   `timeout` (~2× the documented wall time). Never rely on the 120 s
   default.

## Step 0: Discover QA Commands

Before launching any sub-agent, you MUST determine the exact commands to run.

1. **Read the Testing contract**: check `AGENTS.md` for a `## Testing`
   section and any loaded `model-w-qa-*` / `model-w-hygiene` skills. If
   either exists, take the test commands, timings, and timeouts from
   there. Read the QA skills fully for the static-analysis commands.

2. **Fallback discovery** (only if neither exists): Invoke the
   `model-w-bootstrap-explorer` agent:

   > Analyze this project's architecture, dependency managers, and developer
   > tooling. I need to determine the exact commands for:
   >
   > - **Formatting**: Which formatter is configured and how to run it (check
   >   mode and write mode).
   > - **Linting**: Which linter is configured and how to run it.
   > - **Type checking**: Which type checker is configured (mypy, pyright, tsc,
   >   etc.) and how to run it.
   > - **Testing**: Which test runner is used, and the FASTEST correct way to
   >   run the full suite: check whether pytest-xdist (`-n auto`), `--reuse-db`
   >   (pytest-django), or an equivalent parallel/caching mechanism is
   >   installed, and include those flags plus the quiet flag (`-q`) in the
   >   command. This MUST cover ALL test types: unit, integration, BDD /
   >   pytest-bdd, e2e. Check for `pytest-bdd`, `.feature` files,
   >   `tests/bdd/` directories, Playwright, Cypress, or any other test
   >   infrastructure.
   >
   > Check `pyproject.toml`, `package.json` scripts, `Makefile` targets,
   > `tsconfig.json`, linter config files, and any CI configuration.
   >
   > Provide a structured report with the exact commands for each category.
   > If the project has multiple test suites (e.g., unit + BDD, or backend +
   > frontend), list each command separately.

3. **Produce two command lists**:
   - `STATIC_COMMANDS`: Format check, lint, type check (in that order), plus
     their "fix" variants (e.g., `ruff format` vs `ruff format --check`).
   - `TEST_COMMANDS`: The fast test invocation(s) with quiet + parallel flags,
     each with its timeout in ms. Multiple suites (unit + BDD, backend +
     frontend) are listed separately and MAY be handed to **parallel runner
     agents** when they don't share mutable state (e.g. backend pytest and
     frontend vitest). Suites sharing a database run sequentially.

These command lists are passed verbatim to the sub-agents. Sub-agents do NOT
discover tooling themselves -- they receive explicit instructions.

## Step 1: Static Analysis

Invoke the `model-w-qa-static` agent:

> Run the following static analysis commands in order:
> ```
> [STATIC_COMMANDS, one per line, check variants]
> ```
>
> For fixing, the corresponding write-mode commands are:
> ```
> [Fix variants, one per line]
> ```
>
> Working directory: [PROJECT_ROOT or component path]

**After the agent returns**: Review the summary. If there are unresolved static
issues that will block tests (e.g., syntax errors, import errors), invoke a
`model-w-qa-test-fixer` agent with the list of unresolved issues and ask it to
fix them. Do NOT fix them yourself. Warnings and style issues can be left.

## Step 2: Full Test Run

Invoke the `model-w-qa-test-runner` agent (one per independent suite,
in parallel when suites are independent):

> Run the full test suite:
> ```
> [TEST_COMMAND with fast flags]
> ```
> Timeout: [N ms from the Testing contract]

**After the agent returns**: Note the reported duration (you may need it in
Step 6). If all tests pass, skip to Step 5. Otherwise, extract the structured
failure list and proceed to Step 3.

## Step 3: Per-Failure Fix Agents

For each distinct test failure from Step 2, invoke a `model-w-qa-test-fixer`
agent. You MAY invoke multiple fixer agents **in parallel** when the failures
are in unrelated modules. Group related failures (e.g., multiple tests in the
same module failing with the same root cause) into a single fixer agent.

Prompt structure for each:

> The following test(s) are failing:
>
> [For each test in this group:]
> - **Test**: `test_module::test_name`
> - **Error**: [One-line error summary from Step 2]
>
> [On retries, add:]
> **Previous attempt**: [Root cause and fix that was tried]
> **Result**: Still failing. New error: [Updated error message]
> **Diagnostic output**: [Any logging output captured from the re-run]

**After all fixer agents return**: Collect the summaries. Note any LOW
confidence fixes or diagnostic logging additions.

## Step 4: Targeted Re-Test

Invoke the `model-w-qa-test-runner` agent scoped to only the previously
failing tests:

> Run ONLY the following tests:
> ```
> [Fast command scoped to the failing tests, e.g.:]
> [pytest -q path/to/test_file.py::test_name path/to/other.py::test_other]
> ```
> Timeout: [single-test timeout from the contract × number of tests, min 120000 ms]

**After the agent returns**:

- If all previously-failing tests now pass: proceed to Step 5.
- If some tests still fail: go back to **Step 3** with the updated error
  information. Feed the fixer agents the context from the previous attempt so
  they do not repeat the same fix.
- **Loop limit**: Repeat Steps 3-4 at most **3 times**. If tests are still
  failing after 3 rounds, proceed to Step 5 anyway and report the remaining
  failures to the user.

## Step 5: Final Verification

Run the **complete** pipeline one final time to catch regressions. Invoke both
agents sequentially:

1. Invoke `model-w-qa-static` with the same commands as Step 1.
2. Invoke `model-w-qa-test-runner` with the full (unscoped) fast test command
   and its timeout.

**After both agents return**:

- If everything passes: invoke a `model-w-qa-test-fixer` agent to remove any
  diagnostic logging that was added during the fix loop (provide it the list
  of files and lines from the fixer reports). Then do Step 6 and report
  success to the user.
- If there are **new failures** (tests that passed in Step 2 but now fail):
  a fix introduced a regression. Go back to **Step 3** with these new
  failures. The 3-attempt limit resets for regressions.
- If the **same tests** are still failing after exhausting the loop limit:
  clean up diagnostic logging via a fixer agent, then report the remaining
  failures to the user with all accumulated context.

## Step 6: Refresh the Testing Contract

After a green full run, keep the contract honest. This is the one direct
edit you make yourself:

1. **Always update `AGENTS.md`**: create or refresh the `## Testing`
   section with the fast commands actually used, the measured full-suite
   duration from the runner's report, the recommended timeouts (~2×
   measured), and the "Last measured" date. If the runner flagged a
   timing drift >50%, this update is mandatory, not optional.
2. **If the project has `model-w-qa-*` skills**, mirror the same
   information into their Testing section as well. AGENTS.md is updated
   no matter what; the skills are updated *in addition* when they exist.

Keep the section short -- commands, timings, timeouts, the
quiet-on-success rule. It is a contract, not documentation.

## Context Curation Rules

The key to this workflow is keeping each sub-agent's context minimal and
focused. Follow these rules strictly:

1. **Delegate by default.** Never edit files, run shell commands, or fix code
   yourself unless a sub-agent has failed and re-delegating would not help
   (Step 6's contract update is the standing exception).
2. **Never forward raw command output** between steps. Always distill it into
   the structured summaries that the runner agent produces.
3. **Fixer agents receive only their specific failures**, not the full test
   report.
4. **Accumulate context across retries**: When looping back to Step 3, include
   what was tried before and the new error, but not the full history of every
   previous attempt.
5. **Clean up after yourself**: Delegate diagnostic logging removal to a fixer
   agent before reporting success to the user.
6. **Group intelligently**: If 15 tests fail in the same file with the same
   `ImportError`, that is one fixer agent, not 15.
7. **Fast, quiet, time-boxed -- everywhere.** Every test invocation, by any
   agent, uses the contract's fast command, redirects output to a file, says
   nothing on success, and passes an explicit bash timeout.
