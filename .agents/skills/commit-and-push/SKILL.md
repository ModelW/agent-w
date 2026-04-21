---
name: commit-and-push
description: Guidelines for committing and pushing changes to the repository.
---

# Commit and Push Strategy

This skill defines the strict rules for version control operations within this project.

## 1. Explicit Consent

**NEVER** commit or push changes unless you have been explicitly asked to do so by the user. Automatic or proactive commits are strictly prohibited.

## 2. Commit Message Format

When you are asked to commit, you must follow this exact format for the commit message:

### Title (Subject Line)
A short, descriptive title that highlights the **business or functional value** of the changes.

### Description (Body)
A short paragraph (separated by a blank line from the title) explaining **what** was changed and **why** it was necessary.

### Example:
```text
Enable native Claude Code plugin support

Created the required plugin manifests and established a symlink-based skill
discovery mechanism. This allows Claude Code users to use Model W skills
out-of-the-box without manual configuration.
```
