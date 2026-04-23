---
name: model-w-python-tests
description: Guidelines for Python automated, e2e, and unit tests in Model W projects.
license: WTFPL
metadata:
    author: with-madrid.com
---

# Model W Python Testing

This skill provides the standard workflow and conventions for testing Python (and Django) projects within the Model W ecosystem.

**CRITICAL**: Existing project organization, file naming, and directory structure ALWAYS take precedence over the guidelines below. Use the following instructions as fallback guidance or when establishing new patterns in case of doubt.

## Core Principles

- **Flat Structure**: Do NOT use class-based tests (e.g., `class TestSomething`). Use flat function-based tests.
- **Minimal Mocking**: Avoid mocking logic or services. Especially in Django projects, use real models and database state.
- **Pytest First**: All tests must be run using `pytest`.

## Database & Models

When testing Django applications, you must ensure the database is handled correctly.

- **Fixtures**: Create all necessary Django models as `pytest` fixtures in `conftest.py` or alongside tests.
- **Database Access**: Always use the `db` or `transactional_db` fixture to allow database access.
- **No Mocking Models**: Do not mock Django models. Create them for real in the test database.

## External API Calls

If the code makes external HTTP calls (either directly via `httpx` or through a custom API client abstraction):

- **pytest-httpx**: Use `pytest-httpx` to intercept and verify outgoing calls at the network level.
- **No Mocking of Abstractions**: Do NOT mock custom API client classes or wrappers. Allow the real code to execute its logic and verify that it produces the expected `httpx` requests.
- **Verification**: Ensure the correct queries, headers, and payloads are sent through to the intercepted calls.

## End-to-End & BDD

Front-end and complex flows should be tested using `pytest-bdd`.

- **Infrastructure**: Assume `pytest-bdd` infrastructure is already in place (usually involving a `tests/bdd/` directory).
- **Driving State**: Use the same Django model fixtures discussed above to set up the database state for BDD tests.
- **Organization**: BDD tests MUST be organized by ticket ID.
    - **Extract Ticket ID**: Extract the ticket ID from the current git branch name (e.g., `feature/XXX-111-some-feature` -> `XXX-111`).
    - **Feature Files**: Save or look for feature files named after the ticket ID, e.g., `XXX-111.feature`.
    - **Proper Contribution**: Look up how BDD is currently implemented in the project's `tests/` directory before adding new steps or features.

## Step-by-Step Workflow

1. **Identify Branch/Ticket**: Determine the ticket ID from the branch name.
2. **Setup Fixtures**: Define or update fixtures for the required data state.
3. **Write Feature**: For E2E, write the Gherkin scenario in `tests/bdd/<TICKET-ID>.feature`.
4. **Implement Steps**: Connect Gherkin steps to Python functions using `pytest-bdd`.
5. **Unit/Integration**: Add flat `test_*.py` files for specific logic, using `pytest-httpx` for external calls.
6. **Execute**: Run `pytest` to verify.
