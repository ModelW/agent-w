# Agent W

<img src="agent-w.png" alt="Agent W" width="300">

Agent W is a Gemini CLI extension, OpenCode plugin, and Claude Code plugin that
provides tools and skills required to facilitate working on Model W projects
with coding agents.

## Philosophy

Agent W strictly follows the Model W philosophy used by WITH to ensure a uniform
developer experience across projects.

By enforcing a **uniform tech stack** across the company, we minimize the mental
overhead and learning curve that typically comes from diverging technological
choices. This standardization allows developers to stay focused on what really
matters: high-level technical and architectural decisions on the non-trivial
aspects of the project.

In this paradigm, **everything that can be automated or handled by AI is
considered trivial**. Agent W exists to bridge that gap, providing the
specialized skills and tools required for coding agents to handle the trivial
lifting autonomously, ensuring they stay aligned with the broader Model W
ecosystem.

- **Focus on Impact:** Leave the boilerplate and convention-enforcement to the
  agent.
- **Local First:** Emphasizes development without Docker where possible for
  speed and simplicity.
- **Quarterly Releases:** Adheres to strict versioning across Python, Node,
  Django, and Svelte.
- **Quality by Default:** Enforces robust automated testing and consistent
  linting rules.

## Project Status

**⚠️ Alpha Quality (MATURITY_ALPHA):** Agent W is currently in alpha. It is
under active development, and its APIs, skills, and CLI commands are subject to
breaking changes. Use with caution in production environments.

### Goals for Version 1.0

We aim to reach version 1.0 once the following milestones are achieved:

- **Strong Internal Adoption:** Widespread use of the agent across projects
  within the company.
- **Front-End & Figma Integration:** Definitive AI-assisted workflows for
  translating Figma designs into high-quality front-end code.
- **Boosted Maintenance:** Significant automation of common project management
  and maintenance tasks.
- **Agentic Upgrades:** Model W version upgrades distributed and executed
  reliably through agentic skills.

## Features

- **Model W Meta Bootstrap:** Provides a bootstrapping skill
  (`model-w-bootstrap`) that guides the AI agent to create specialized local
  skills for the project's structure, dependencies, testing, and update
  processes.
- **De Facto Skills (OpenCode & Claude Code):** When used as an OpenCode or
  Claude Code plugin, Agent W skills are automatically available to the agent
  without any project-level installation.
- **CLI Tool:** Includes a command-line interface (`agent-w`) for managing the
  Agent W environment.

## For End-Users

### Installation

Install the package globally via npm:

```bash
npm install -g @model-w/agent-w
```

### Usage with OpenCode

Agent W works as a native OpenCode plugin. When installed, it automatically
registers its skill library, making the Model W bootstrapping skills available
to the LLM without any project-level setup.

To add Agent W to your OpenCode environment:

```bash
opencode plugin add @model-w/agent-w
```

Once installed, you can simply ask the agent to bootstrap your project:
"Initialize this project using the model-w-bootstrap skill."

### Usage with Claude Code

Agent W works as a native Claude Code plugin. It automatically discovers and
injects skills from your project's `.agents/skills` directory, making them
available in your Claude Code sessions.

You can install it by adding the Model W marketplace and then installing the
plugin:

```bash
claude plugin marketplace add ModelW/agent-w
claude plugin install agent-w
```

Once installed, you can use the `/model-w-bootstrap` command directly in your
session.

**Note:** After running the bootstrap command and generating the local skills in
`.agents/skills`, you must restart/reload your Claude Code session for the new
skills to be discovered.

### Usage with Gemini

Once the package is installed and the skill has been added to your agents
folder, you can use it within any Gemini CLI session.

1.  **Verify Installation:** Go to your project root and list the available
    skills to ensure `model-w-bootstrap` is visible:
    ```bash
    /skills list
    ```
2.  **Initialize your project:** Ask Gemini to bootstrap the local context for
    your specific Model W project:
    ```bash
    gemini "Use the model-w-bootstrap skill to initialize this project"
    ```
3.  **Reload Skills:** After the local skills are created in `.agents/skills/`,
    reload the skill list so Gemini can use them:
    ```bash
    /skills reload
    ```

#### Examples of what you can ask:

- "Update all dependencies to the latest Model W release."
- "Check if the project's linting and formatting rules are followed."
- "Run the smoke tests for both the Django API and the SvelteKit frontend."
- "Create a changelog for the latest updates I just made."
- "Figure out how to run the BDD tests for this project."

## For Contributors

If you want to modify or improve Agent W, you can test it locally.

### Local Development

You can link this folder to your Gemini CLI for local extension development:

```bash
gemini extensions link .
```

To test the CLI command locally without publishing, link the npm package
globally:

```bash
npm link
agent-w install
```

### Formatting & Linting

This project follows the
[WITH Code Guidelines](https://with-codeguidelines.readthedocs-hosted.com/en/latest/code-formatting.html).
It uses **Prettier** with a 4-space indent to maintain consistency with the
Python ecosystem.

To format the project:

```bash
npx prettier --write .
```

## License

WTFPL
