import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import plugin from "../index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillIDs = fs
    .readdirSync(path.join(root, "skills"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
const agentFiles = fs
    .readdirSync(path.join(root, "agents"))
    .filter((f) => f.endsWith(".md"));

/** Minimal fake of the OpenCode v2 plugin context. */
function fakeContext() {
    const skills = new Map();
    const agents = new Map();
    return {
        skills,
        agents,
        skill: {
            transform: async (cb) => {
                cb({
                    list: () => [...skills.values()],
                    get: (id) => skills.get(id),
                    add: (s) => skills.set(s.id, { ...s }),
                    update: (id, fn) => fn(skills.get(id)),
                    remove: (id) => skills.delete(id),
                });
                return { dispose: async () => {} };
            },
        },
        agent: {
            transform: async (cb) => {
                cb({
                    list: () => [...agents.values()],
                    get: (id) => agents.get(id),
                    default: () => {},
                    // Mirrors core: update() creates the agent with defaults.
                    update: (id, fn) => {
                        const current = agents.get(id) ?? {
                            id,
                            name: id,
                            request: { settings: {}, headers: {}, body: {} },
                            mode: "primary",
                            hidden: false,
                            permissions: [
                                { action: "*", resource: "*", effect: "allow" },
                            ],
                        };
                        agents.set(id, current);
                        fn(current);
                        current.id = id;
                    },
                    remove: (id) => agents.delete(id),
                });
                return { dispose: async () => {} };
            },
        },
    };
}

test("default export has the dual v1/v2 plugin shape", () => {
    assert.equal(plugin.id, "model-w.agent-w");
    assert.equal(typeof plugin.server, "function");
    assert.equal(typeof plugin.setup, "function");
});

test("every agent file has a valid frontmatter block", () => {
    for (const file of agentFiles) {
        const content = fs.readFileSync(
            path.join(root, "agents", file),
            "utf-8"
        );
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
        assert.ok(match, `${file}: missing frontmatter`);
        assert.match(match[1], /^name: \S+/m, `${file}: missing name`);
        assert.match(
            match[1],
            /^description:/m,
            `${file}: missing description`
        );
        // Multi-line block scalars must be explicit (`>-`/`|`); an implicit
        // multi-line plain scalar is invalid YAML for some hosts (Claude Code).
        assert.doesNotMatch(
            match[1],
            /^description:\s*\n/m,
            `${file}: multi-line description must use \`description: >-\``
        );
    }
});

test("v1 server(): config hook registers skills path and agents", async () => {
    const hooks = await plugin.server();
    assert.equal(typeof hooks.config, "function");

    const config = {};
    await hooks.config(config);

    assert.deepEqual(config.skills.paths, [path.join(root, "skills")]);

    const names = Object.keys(config.agent).sort();
    assert.equal(names.length, agentFiles.length);
    for (const name of names) {
        const agent = config.agent[name];
        assert.equal(agent.mode, "subagent");
        assert.ok(agent.description, `${name}: empty description`);
        assert.ok(agent.prompt.length > 0, `${name}: empty prompt`);
    }
    assert.deepEqual(config.agent["model-w-docs-orchestrator"].permission, {
        task: "allow",
    });
    assert.equal(config.agent["model-w-push"].permission, undefined);

    // Idempotent: running twice does not duplicate the skills path.
    await hooks.config(config);
    assert.equal(config.skills.paths.length, 1);
});

test("v2 setup(): registers skills through ctx.skill.transform", async () => {
    const ctx = fakeContext();
    await plugin.setup(ctx);

    assert.deepEqual([...ctx.skills.keys()].sort(), skillIDs);
    for (const skill of ctx.skills.values()) {
        assert.equal(
            skill.path,
            path.join(root, "skills", skill.id, "SKILL.md")
        );
        assert.ok(skill.name, `${skill.id}: empty name`);
        assert.ok(skill.description, `${skill.id}: empty description`);
        assert.ok(
            skill.content.trim().length > 0,
            `${skill.id}: empty content`
        );
        assert.doesNotMatch(
            skill.content,
            /^---/,
            `${skill.id}: frontmatter leaked`
        );
    }
    // Display name comes from frontmatter, ID from the directory.
    assert.equal(
        ctx.skills.get("model-w-linear-review").name,
        "model-w-linear-ticket-review"
    );
});

test("v2 setup(): registers agents through ctx.agent.transform", async () => {
    const ctx = fakeContext();
    await plugin.setup(ctx);

    assert.equal(ctx.agents.size, agentFiles.length);
    for (const agent of ctx.agents.values()) {
        assert.equal(agent.mode, "subagent");
        assert.ok(agent.description, `${agent.id}: empty description`);
        assert.ok(agent.system.length > 0, `${agent.id}: empty system prompt`);
    }

    // v1 `task: allow` maps to a v2 `subagent` rule appended after defaults.
    const orchestrator = ctx.agents.get("model-w-docs-orchestrator");
    assert.deepEqual(orchestrator.permissions.at(-1), {
        action: "subagent",
        resource: "*",
        effect: "allow",
    });
    const push = ctx.agents.get("model-w-push");
    assert.equal(push.permissions.length, 1);

    // Multi-line `>-` description is folded to one line.
    const planner = ctx.agents.get("model-w-feature-planner");
    assert.doesNotMatch(planner.description, /\n/);
    assert.match(planner.description, /^Plans a feature end-to-end/);
});
