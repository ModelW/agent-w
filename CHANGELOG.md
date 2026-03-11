# Changelog

All notable changes to this project will be documented in this file.

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
