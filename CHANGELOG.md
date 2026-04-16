# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0] - 2026-04-16

### Features

- **Native OpenCode Support:** Enable Agent W as a native OpenCode plugin via a
  new configuration hook that automatically registers the Model W skill library.
- **ES Modules Refactor:** Complete migration of the codebase to ES Modules to
  support the plugin SDK and modern Node.js standards.

### Refactoring

- Refactor bootstrap skill for improved reliability and maintainability.

### Fixes

- Filter out TTS models during maturity analysis to ensure accurate project
  assessment.
- Fix maturity analysis script to correctly use `.cjs` extension where required.

### Maintenance

- Clean up temporary release files in CI/CD workflows and `.gitignore`.

## [0.3.1] - 2026-03-11

### CI/CD & Publishing

- Re-enable NPM token publishing (provenance not supported for private repos)
- Simplify NPM publish workflow

## [0.3.0] - 2026-03-11

### Features

- Automate GitHub Release creation with AI-generated notes

### CI/CD & Security

- Switch to NPM trusted publishing (provenance)
- Force non-interactive mode in CI/CD via CI=true environment variable

## [0.2.0] - 2026-03-11

### Features

- Auto-detect and use latest Gemini flash model for Phase 1
- Make model detection and LLM output explicit in Phase 1 logs

## [0.1.1] - 2026-03-11

### Security & Refactoring

- Refactor Phase 1 to use gh cli and direct Gemini API call for security
- Fix Phase 1 prompt injection and prevent unauthorized tool use

## [0.1.0] - 2026-03-11

### Features

- Integrate GitHub MCP server for Phase 1 project maturity analysis
- Implement AI-driven release with GitHub issue verification
- Add AI-driven release workflow and maintainer skill
- Enable YOLO mode for the AI release agent
- Initial commit of Agent W: Gemini CLI extension with Model W meta-skill and
  CLI installer

### Fixes

- Fix invalid approval-mode in release workflow
- Fix Gemini CLI flag and maturity analysis in release workflow

### Maintenance

- Upgrade CI to Node 24 and add human-approval mandate to maintainer skill
- Update GitHub Action workflow to use Node 22
