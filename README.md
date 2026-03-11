# Agent W

<img src="agent-w.png" alt="Agent W" width="300">

Agent W is a Gemini CLI extension that provides tools and skills required to
facilitate working on Model W projects with coding agents.

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

## Features

- **Model W Meta-Skill:** Installs a philosophy and strategy skill (`model-w`)
  that guides the AI agent to understand and adopt the Model W project
  structure, dependencies, testing, and deployment processes.
- **CLI Tool:** Includes a command-line interface (`agent-w`) for managing the
  Agent W environment.

## For End-Users

### Installation

Install the package globally via npm:

```bash
npm install -g @model-w/agent-w
```

### CLI Usage

Agent W comes with a CLI tool to manage its components.

#### Install Skill

To install the Model W skill into your agent skills directory (defaults to
`~/.agents/skills`):

```bash
agent-w install
```

To install to a custom directory:

```bash
agent-w install /path/to/custom/skills
```

### Usage with Gemini

Once the package is installed and the skill has been added to your agents
folder, you can use it within any Gemini CLI session.

1.  **Verify Installation:** Go to your project root and list the available
    skills to ensure `model-w` is visible:
    ```bash
    /skills list
    ```
2.  **Initialize your project:** Ask Gemini to set up the local context for your
    specific Model W project:
    ```bash
    gemini "Please investigate this project and create the local model-w-local skill"
    ```
3.  **Reload Skills:** After the local skill is created in
    `.agents/skills/model-w-local/SKILL.md`, reload the skill list so Gemini can
    use it:
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
