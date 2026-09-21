---
name: model-w-feature
description: >-
    MUST be loaded whenever the user asks to implement, build, or work on a
    feature, ticket, story, or Linear issue (e.g. "implement LOG-73",
    "let's work on this ticket", "build this feature"). Orchestrates the
    feature lifecycle -- spec filtering, planning, root-level
    implementation, visual testing, BDD coverage, and regression checks.
license: WTFPL
metadata:
    author: with-madrid.com
---

# Model W Feature Implementation

This skill drives the **end-to-end implementation of a single feature**,
from a Linear ticket to merge-ready code with BDD coverage.

**You orchestrate the surrounding phases and implement the code
yourself.** Spec filtering, planning, visual testing, and BDD writing go
through sub-agents to keep your context clean. Implementation happens at
root level, in this conversation, so the user can watch and steer.

**Resume, don't repeat.** Sub-agent sessions keep their context. When
you need more from a sub-agent that already ran (a question about the
raw ticket, an answer folded into the plan), re-invoke it with its
`task_id` instead of starting fresh or redoing its work yourself.

**Announce each phase transition in one line** before the tool call that
starts it: `Phase N (<name>) done → Phase M (<name>), delegating to
<sub-agent>` (or `handling at root`).

## When to Use

- The user asks to implement, build, or "work on" a feature, ticket,
  story, or Linear issue.
- The user pastes a Linear URL, issue ID (e.g. `LOG-73`), or Figma URL
  and asks for implementation.

## When NOT to Use

- Pure bug fixes with no design or specification work.
- Refactors that do not change behavior.
- Obviously trivial tasks (one-line changes, typo fixes).
- The user explicitly asks for a different workflow ("just write the
  code, no planning").

## Sub-Agent Roster

| Agent                           | Role                                                        | Resumable for |
| ------------------------------- | ----------------------------------------------------------- | ------------- |
| `model-w-feature-ticket-filter` | Fetches the ticket, returns a noise-filtered delta-only spec | Q&A about the raw ticket, any phase |
| `model-w-feature-planner`       | Explores the codebase, returns an Implementation Brief       | Folding in the user's answers (Round 2) |
| `model-w-feature-tester`        | Verifies criteria in the browser, converges CSS to Figma, builds the Selector Map | Re-testing after fixes |
| `model-w-feature-bdd`           | Proposes a Test Plan, then implements it from the Selector Map | Round 2 (approved plan), follow-up fixes |

## Phase 0: Specification

**Never fetch the raw Linear ticket yourself.** Most tickets are
AI-drafted and full of invented technical detail. The ticket-filter
agent is the only place raw ticket content is handled; it returns
"valid high-surprise elements" only. When a later phase needs a detail
the filtered spec lacks, **resume the filter session with a specific
question** — never re-fetch the ticket.

1. **Identify the ticket**: from the user's message, or the git branch
   (`*/[issue-id]-*` pattern), or ask via the `question` tool.
2. **Collect project context**: note any loaded `model-w-project-*` /
   `model-w-qa-*` skills — the filter and planner need their names.
3. **Delegate to `model-w-feature-ticket-filter`**:

   > Fetch and filter the following ticket.
   >
   > **Ticket identifier**: [ID / URL / branch]
   > **Project context**: [stack summary + project skill names]
   >
   > Return the filtered delta-only spec, confirmation questions,
   > Figma/image references, a filter audit, and codebase notes.

   Keep the returned `task_id` — you will need it for Q&A.

   If the filter reports the ticket can't be found or is unusable, stop
   and tell the user. Do not invent a specification.

4. **Resolve confirmation questions**: ask the user via the `question`
   tool. Merge each answer into the relevant CHANGES/CHECKS bullet so
   the spec reads as if the answers were always there. No separate
   "clarifications" section.
5. **Resolve Figma references**: fetch each frame's design context via
   the Figma MCP and pin down its viewport (`mobile` ≤640 px, `tablet`
   641–1023, `desktop` ≥1024, or `responsive`). A filter tag
   (`[mobile]` etc.) from ticket text wins over width inference; a `[?]`
   you cannot resolve from Figma metadata goes to the user via
   `question`.
6. **Assemble the Specification Pack** — the artifact you forward to
   sub-agents:
   - The filtered, answer-merged spec.
   - A `DESIGN` block grouped by viewport (`viewport: - frame name URL`
     per line; drop empty groups, drop the block if no frames).
   - One line naming the project-context skill(s) to consult.

   Do NOT include the raw ticket, the filter audit, or the codebase
   notes (the notes go only into the planner prompt).

## Phase 1: Planning

Delegate to `model-w-feature-planner` (Round 1):

> Plan the implementation of the following feature.
>
> **Specification Pack**: [INSERT]
> **Codebase notes from the ticket filter**: [INSERT]
> **Project context**: [INSERT]
>
> Explore the codebase and return a draft Implementation Brief
> (elements, data flow, touchpoints, implementation order, verdict)
> plus the confirmation questions that block finalization.

Keep the planner's `task_id`. Then:

1. **Ask the user** the planner's confirmation questions via the
   `question` tool (group related questions into one call). If a
   question is about what the ticket meant, resume the **filter** first
   and only bother the user if the ticket doesn't answer it.
2. **Resume the planner** (same `task_id`) with the answers. It returns
   the **Final Implementation Brief**. If it was already FINAL (no
   questions), skip the resume.
3. **Present the plan** to the user: goal, data-model / backend /
   frontend changes, sequence, out-of-scope. Ask for explicit sign-off
   via `question`. Do NOT implement until they confirm; on requested
   changes, revise (resuming the planner if the change needs new
   exploration) and ask again.

## Phase 2: Implementation (root level)

You implement the code **yourself, in this session**, following the
Brief's implementation order. The user can watch and interject — that
is the point of doing it here.

For each step in the Brief:

1. Read the surrounding code first; match project conventions (naming,
   file layout, error handling, loading states).
2. Make the smallest reasonable diff. No adjacent refactors.
3. Add inline docs for every new code unit (Numpy-style for Python,
   JSDoc for JS/TS, block comments for CSS) explaining **why**, not
   restating the signature.
4. Run mechanical follow-ups (migrations, codegen, formatter) with the
   project's standard commands. Do NOT run the test suite or full
   linter — that is Phase 6.

Along the way:

- Keep a running **change log** (file, kind, what, why) — you need it
  for the tester briefing and the commit.
- **Surprises surface immediately.** If the Brief is wrong (a pathway
  doesn't exist, a data shape mismatches), tell the user what you found
  and how you propose to adapt; for anything that changes the plan's
  shape, use the `question` tool before diverging. If the surprise
  needs new exploration, resume the planner rather than spelunking with
  a dirty context.
- Do NOT widen scope. Unrelated problems get noted for the user, not
  fixed.
- Do NOT install new dependencies unless the plan calls for them — ask
  first otherwise.

## Phase 3: Visual Testing (only if the feature has a UI)

No UI (pure backend job, migration)? Skip to Phase 4.

1. **Verify dev servers are running.** Never start them yourself. If
   they are down, ask the user to start them and wait.
2. **Prepare test data**: create the records/users the feature needs
   using the project's standard tooling, and collect credentials into a
   Test Data Pack. Never read `.env` for secrets — ask the user via
   `question` if a value is needed.
3. **Delegate to `model-w-feature-tester`**:

   > Test the following feature against the running application.
   >
   > **Specification Pack**: [INSERT]
   > **Implementation summary**: [YOUR CHANGE LOG + anything to watch]
   > **Test Data Pack**: login URL, credentials, record IDs, navigation
   > steps.
   > **Figma references**: [the (viewport, frame, URL) triples]
   > **Styling conventions**: [Tailwind / CSS modules / etc., token
   > locations]
   >
   > Walk the acceptance criteria, converge the CSS toward the Figma
   > frames live (HMR), and return the accessibility-first Selector Map.

4. **React to the report**:
   - Functional failures → fix them at root level (Phase 2 rules),
     then resume the tester to re-check just those criteria.
   - Outstanding design deltas needing markup/logic → same.
   - Accessibility findings (missing labels/roles) → fix them now;
     they block reliable BDD locators.
   - Keep the **Selector Map** — it is the main input to Phase 5.

## Phase 4: User Review

Hand off via `question`:

> The feature is implemented and tested. Please review and try it
> yourself. Any changes, or shall I proceed to BDD tests and final QA?

Apply requested changes (re-running Phase 3 if visuals changed). Do not
proceed without the go-ahead.

## Phase 5: BDD Tests

Delegate to `model-w-feature-bdd` — do NOT write the Gherkin yourself;
the agent starts with a fresh context and a mechanical procedure, which
is far more reliable at this depth of the session. It runs in **two
rounds** with a user checkpoint between them.

**Round 1 — Test Plan.** Invoke the agent:

> Propose the BDD Test Plan for [TICKET-ID]. Do not write tests yet.
>
> **CHECKS**: [the acceptance criteria from the Spec Pack — the agent
> treats them as input signal, not a test list; many are LLM filler]
> **Selector Map**: [verbatim from the tester report]
> **BDD conventions**: feature files in [dir], steps in [dir],
> framework [pytest-bdd/...], consult [model-w-python-tests / project
> BDD skill].
> **Run command**: [single-feature-file command from the project's QA
> skill or AGENTS.md `## Testing` section, with its timeout in ms]
> **Tester notes**: [BDD-relevant observations, if any]

Keep the `task_id`. The agent returns a Test Plan: coverage **goals**
(happy path end-to-end, security rules, probable failure modes), each
with an EXTEND-existing-scenario or NEW placement, plus a NOT COVERED
list.

**Checkpoint — validate the goals with the user.** Present the plan via
the `question` tool. The user validates *what* gets tested (the goals
and the NOT COVERED list), not the step-by-step of each test. Fold
their amendments in (add a goal, rescue a NOT COVERED item, drop a
goal).

**Round 2 — Implementation.** Resume the agent (same `task_id`) with
the approved plan. It writes the tests (extending existing scenarios by
default, with explanatory comments), runs the affected files, and fixes
its own breakage.

If the agent reports failures that look like feature bugs, fix them at
root level, then resume the BDD agent to re-run.

## Phase 6: Full Regression

Load and follow the `model-w-run-tests` skill for the full QA pipeline
(static analysis + entire suite, including the new BDD scenarios). Fix
regressions introduced by the feature through that skill's normal flow.
Do not declare the feature done until everything passes.

## Phase 7: Commit

Ask the user via `question` whether to commit. If yes, defer to the
`model-w-commit-push` skill (Linear-ID-aware messages, hygiene checks).
Never push without a separate explicit instruction.

## Rules

1. **Never fetch the raw Linear ticket.** The filter session holds it;
   resume with questions instead.
2. **Resume before redoing.** Filter Q&A, planner Round 2, tester
   re-checks, BDD re-runs — all through `task_id` resumes.
3. **Never forward raw sub-agent transcripts.** Pass the structured
   artifacts: Specification Pack, Implementation Brief, Test Data Pack,
   Selector Map.
4. **Sub-agents see only what they need.** The BDD agent gets CHECKS +
   Selector Map, not the whole session history.
5. **Checkpoints are mandatory**: filter questions (0.4), plan sign-off
   (1.3), user review (Phase 4), BDD Test Plan validation (Phase 5).
   Use the `question` tool, never free-form text.
6. **Surprises trigger decisions, not silent fixes.** Plan-shape
   changes go back to the user before you diverge.
7. **Never start a dev server.** Ask the user.
8. **Never read `.env` or `.env.*`.** OpenCode blocks them. For config
   keys, use the framework's declarative settings surface
   (`settings.py`, `.svelte-kit/ambient.d.ts`, `next.config.*`, or
   `process.env.` / `os.environ` greps). For secret values, ask the
   user.
