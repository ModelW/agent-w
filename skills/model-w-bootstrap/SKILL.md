---
name: model-w-bootstrap
description: Bootstrap or update the project's own Model W management skills.
license: WTFPL
metadata:
    author: with-madrid.com
---

# Model W Meta Bootstrap

This skill orchestrates a three-phase bootstrapping process to create
project-specific management skills. It delegates the work to specialized
sub-agents to ensure thoroughness and accuracy.

## Orchestration Procedure

You MUST perform the following phases in sequence:

### Phase 1: Exploration

Invoke the `model-w-bootstrap-explorer` agent to analyze the project's
architecture, dependency managers, task management, and Model W versioning.

> **Prompt**: "Analyze this project's architecture, dependency managers
> (Python/Node), task management systems, and Model W version. Provide a
> structured report of your findings."

### Phase 2: Drafting

Take the report from Phase 1 and invoke the `model-w-bootstrap-drafter` agent to
generate the project-specific skills. **CRITICAL**: All skills must follow the
`.agents/skills/<skill-name>/SKILL.md` directory structure.

> **Prompt**: "Based on the following project report, generate the standard
> suite of Model W management skills (e.g.,
> .agents/skills/model-w-project-structure/SKILL.md) following the Model W
> Philosophy: [INSERT REPORT HERE]"

### Phase 3: Verification & Hygiene

Invoke the `model-w-bootstrap-tester` agent to verify the newly created
commands, check the skill path conventions, and ensure the project's Git
hygiene.

> **Prompt**: "Verify that all new skills follow the
> .agents/skills/<skill-name>/SKILL.md convention and have proper metadata
> headers (name, description, license, author). Verify all commands in the newly
> created skills. Ensure that .claude/ is correctly gitignored according to
> Model W strict mandates."

## Final Instruction

Once Phase 3 is complete, the bootstrap process is finished. Remind the user to
restart or reload their agent session (e.g., `/skills reload`) to discover the
new skills.
