---
name: model-w
description: Meta skill to create a management skill for Model W projects
license: WTFPL
metadata:
    author: with-madrid.com
---

# Model W

## The Model W Philosophy

Model W is a concept used by the company WITH in order to have a uniform
developer experience across many projects managed in the agency. The core ideas
of Model W are:

- Always use Django and SvelteKit (previously Nuxt, but no longer).
- There is a release every quarter (`2026.01`, `2026.04`, etc), which imposes
  strict versions of Python, Node, Django, Svelte and a bunch of other key
  packages. This is materialized through the "preset" packages.
- The project uses a base Docker image, matching the release number, which
  contains all the usual dependencies you would need for Django _and_ Svelte at
  the same time, including image manipulation and all kinds stuff.
- The project gets deployed by a tool called Kerfufoo which relies on repo
  conventions rather than explicit CI/CD scripts. The manifest for deployment is
  in the `snow.yml` file. While not to be taken literally (the commands to run
  inside the Docker environment are not _exactly_ the ones you would run in
  dev), this gives you a good idea of the project's architecture, the
  environment variables and what they mean
- The project is a monorepo in which all the components are laid in first-level
  directories of the repo. You get this information from the `images` section of
  the `snow.yml` file
- The priority is to local development: no Docker, just using the local
  PostgreSQL and Redis instances if available.

Use these big principles to weight out decisions that you will take later on

## What you need to figure

If not present, you need to create yourself a local skill file in the project,
inside the `.agents/skills/model-w-local/SKILL.md` file. Don't forget the
frontmatter (see https://agentskills.io/specification).

Things that you need to explain in this file are the specifics of that project:

- Which are the components of the project, and in which directory are they
  stored?
- Which package management?
    - In Python this could be `uv` or `poetry`, have a look at the Python
    - In Node this could be `npm` or `pnpm`
- How to run the Django manage?
    - With `poetry` it's going to be `poetry run ./manage.py`
    - With `uv` it's going to be `uv run ./manage.py`
- How to install the project's dependencies
    - On Python side
        - Either `poetry install`
        - Either `uv sync`
    - On Node side
        - Either `pnpm install`
        - Either `npm install`
- What are good smoke tests to check that the project "compiles"
    - Django's check command
    - Same thing for SvelteKit
    - etc

- What are the project's tests and how to run them. This must be the most wildly
  variable thing in all Model W projects. Check for a `bdd` folder if there is,
  and it should contain some basic documentation. Other than that there might be
  some `pytest` tests, or some `vitest` tests, or something else. Keep it
  simple, but note down the commands for the project's tests. If tests massively
  fail despite being run correctly, they are probably not maintained anymore, in
  which case take note to not run the tests.
- How to update the project's dependencies
    - To update to a new version of Model W:
        - You need to locate the various dependencies declaration files in
          Python, Node and Docker (do not forget the Dockerfile!)
        - Inside of them locate the Model W preset or base image version
        - Set it to be the new release
        - Then update every single package to the latest allowable version if
          you respect the dependencies/peer dependencies of the Model W preset
        - Run smoke tests on every component to see if something broke
        - And then run all automated tests, if they exist
        - Of course, also test that the Docker images build
        - There might be some software that causes major issues (usual suspects
          are going to be Wagtail, Svelte, Oscar amongst others), in which case
          you should not attempt to fix those issues autonomously. Instead you
          should limit the update to the last compatible version and take a note
          for the user to decide what to do.
    - To simply update the dependencies without updating the Model W version,
      just update every single package to the latest allowable version if you
      respect the dependencies/peer dependencies of the Model W preset
    - In any case, when all is up-to-date, append/create a `CHANGELOG.md` file,
      in which you describe the **most impactful** things that you've done for
      this update. If some versions have been held back, highlight this
      information in a blockquote starting with a ⚠️ sign
- Then comes the linting and formatting. Each project their own rules.
    - Look at the Makefile declarations, it often gets in there
    - Usually it's `prettier` for JS/Svelte/etc and `ruff` or `black` + `isort`
      for the API
    - Figure what is in use in the project, what shortcuts are to be called, and
      let it be
    - After every single change, all the linting and formatting must pass

## Your job

Following the investigation from above, you need to create/update the local
Model W skill which will then allow to directly do the important operations of
the project. Make sure that you pass all the philosophical knowledge and
concepts from here to the local skill, this way this skill is not needed
anymore.

When you're done, check the skill's visibility or tell the user to reload the
skills list.
