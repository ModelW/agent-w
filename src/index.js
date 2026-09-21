import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SKILLS_PATH = path.join(__dirname, "..", "skills");
const AGENTS_PATH = path.join(__dirname, "..", "agents");

/** Stable plugin ID. OpenCode v2 scopes plugin storage/diagnostics by it. */
const PLUGIN_ID = "model-w.agent-w";

/**
 * Parse a YAML frontmatter value that may span multiple indented lines.
 *
 * Handles both single-line (`key: value`) and multi-line block scalar
 * (`key:\n    line1\n    line2`) forms used in agent markdown files.
 * Joins continuation lines with spaces and trims the result.
 *
 * Parameters
 * ----------
 * frontmatter : string
 *     The raw YAML frontmatter text (between the --- delimiters).
 * key : string
 *     The YAML key to extract.
 *
 * Returns
 * -------
 * string
 *     The parsed value, or an empty string if the key is not found.
 */
function parseFrontmatterValue(frontmatter, key) {
    const lines = frontmatter.split("\n");
    let value = "";
    let capturing = false;

    for (const line of lines) {
        if (capturing) {
            // Continuation lines are indented (start with spaces/tabs)
            if (/^\s+/.test(line)) {
                value += " " + line.trim();
            } else {
                break;
            }
        } else {
            const match = line.match(new RegExp(`^${key}:\\s*(.*)`));
            if (match) {
                const inline = match[1].trim();
                if (inline && !/^[>|][+-]?$/.test(inline)) {
                    // Single-line value: `key: value`
                    return inline;
                }
                // Multi-line value, either an implicit continuation
                // (`key:\n    line1`) or an explicit block scalar
                // (`key: >-\n    line1`). Lines are joined with spaces.
                capturing = true;
            }
        }
    }

    return value.trim();
}

/**
 * Parse a simple nested YAML object from frontmatter.
 *
 * Handles one level of nesting like:
 *   permission:
 *       task: allow
 *       edit: deny
 *
 * This is intentionally simplistic -- it covers the patterns used in
 * agent markdown files without pulling in a full YAML parser.
 *
 * Parameters
 * ----------
 * frontmatter : string
 *     The raw YAML frontmatter text.
 * key : string
 *     The top-level YAML key to extract as an object.
 *
 * Returns
 * -------
 * object|null
 *     The parsed object, or null if the key is not found or has no
 *     nested values.
 */
function parseFrontmatterObject(frontmatter, key) {
    const lines = frontmatter.split("\n");
    let capturing = false;
    const result = {};
    let found = false;

    for (const line of lines) {
        if (capturing) {
            const nested = line.match(/^\s+(\w[\w.-]*):\s*(.*)/);
            if (nested) {
                result[nested[1]] = nested[2].trim();
                found = true;
            } else if (/^\S/.test(line)) {
                break;
            }
        } else {
            const match = line.match(new RegExp(`^${key}:\\s*$`));
            if (match) {
                capturing = true;
            }
        }
    }

    return found ? result : null;
}

/**
 * Split a markdown document into its YAML frontmatter and body.
 *
 * Parameters
 * ----------
 * content : string
 *     Raw markdown file content.
 *
 * Returns
 * -------
 * {frontmatter: string, body: string}|null
 *     The two parts, or null when the file has no frontmatter block.
 */
function splitFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) {
        return null;
    }
    return { frontmatter: match[1], body: match[2] };
}

/**
 * Load every agent definition shipped in the `agents/` directory.
 *
 * Returns
 * -------
 * Array<{name: string, description: string, prompt: string, permission: object|null}>
 *     One entry per agent markdown file that has a `name` in its
 *     frontmatter. `permission` is the v1-style `{tool: effect}` map.
 */
function loadAgents() {
    if (!fs.existsSync(AGENTS_PATH)) {
        return [];
    }

    const agents = [];
    const files = fs
        .readdirSync(AGENTS_PATH)
        .filter((f) => f.endsWith(".md"))
        .sort();

    for (const file of files) {
        const content = fs.readFileSync(path.join(AGENTS_PATH, file), "utf-8");
        const parts = splitFrontmatter(content);
        if (!parts) {
            continue;
        }

        const name = parseFrontmatterValue(parts.frontmatter, "name");
        if (!name) {
            continue;
        }

        agents.push({
            name,
            description: parseFrontmatterValue(
                parts.frontmatter,
                "description"
            ),
            prompt: parts.body.trim(),
            permission: parseFrontmatterObject(parts.frontmatter, "permission"),
        });
    }

    return agents;
}

/**
 * Load every skill shipped in the `skills/` directory.
 *
 * Mirrors OpenCode v2's own skill discovery: each `skills/<id>/SKILL.md`
 * becomes a skill whose ID is the directory name, whose display name is
 * the frontmatter `name` (falling back to the ID) and whose content is the
 * markdown body.
 *
 * Returns
 * -------
 * Array<{id: string, name: string, description?: string, path: string, content: string}>
 */
function loadSkills() {
    if (!fs.existsSync(SKILLS_PATH)) {
        return [];
    }

    const skills = [];
    const dirs = fs
        .readdirSync(SKILLS_PATH, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();

    for (const id of dirs) {
        const skillFile = path.join(SKILLS_PATH, id, "SKILL.md");
        if (!fs.existsSync(skillFile)) {
            continue;
        }

        const content = fs.readFileSync(skillFile, "utf-8");
        const parts = splitFrontmatter(content);
        if (!parts) {
            continue;
        }

        const description = parseFrontmatterValue(
            parts.frontmatter,
            "description"
        );
        skills.push({
            id,
            name: parseFrontmatterValue(parts.frontmatter, "name") || id,
            ...(description ? { description } : {}),
            path: skillFile,
            content: parts.body,
        });
    }

    return skills;
}

/**
 * Map a v1 permission/tool key to its v2 permission action name.
 *
 * Mirrors OpenCode's own v1 -> v2 config migration.
 */
function normalizeAction(action) {
    if (action === "write" || action === "patch") return "edit";
    if (action === "task") return "subagent";
    if (action === "bash") return "shell";
    return action;
}

/**
 * Convert a v1-style `{tool: effect}` permission map into a v2 ruleset.
 *
 * Parameters
 * ----------
 * permission : object|null
 *     e.g. `{ task: "allow", edit: "deny" }`
 *
 * Returns
 * -------
 * Array<{action: string, resource: string, effect: "allow"|"deny"|"ask"}>
 */
function toPermissionRules(permission) {
    if (!permission) {
        return [];
    }
    return Object.entries(permission)
        .filter(([, effect]) => ["allow", "deny", "ask"].includes(effect))
        .map(([action, effect]) => ({
            action: normalizeAction(action),
            resource: "*",
            effect,
        }));
}

/**
 * OpenCode v1 entrypoint.
 *
 * Registers the plugin's skills directory and agents through the legacy
 * mutable `config` hook.
 */
async function server() {
    const agents = loadAgents();

    return {
        config: async (config) => {
            if (!config.skills) {
                config.skills = {};
            }
            if (!config.skills.paths) {
                config.skills.paths = [];
            }
            if (!config.skills.paths.includes(SKILLS_PATH)) {
                config.skills.paths.push(SKILLS_PATH);
            }

            if (!config.agent) {
                config.agent = {};
            }

            for (const agent of agents) {
                const agentConfig = {
                    description: agent.description,
                    prompt: agent.prompt,
                    mode: "subagent",
                };
                if (agent.permission) {
                    agentConfig.permission = agent.permission;
                }
                config.agent[agent.name] = agentConfig;
            }
        },
    };
}

/**
 * OpenCode v2 entrypoint.
 *
 * Registers skills through `ctx.skill.transform` and agents through
 * `ctx.agent.transform`. Files are read once here (outside the
 * synchronous, replayable transform callbacks) as the v2 docs require.
 */
async function setup(ctx) {
    const skills = loadSkills();
    const agents = loadAgents();

    await ctx.skill.transform((editor) => {
        for (const skill of skills) {
            editor.add(skill);
        }
    });

    await ctx.agent.transform((editor) => {
        for (const agent of agents) {
            const rules = toPermissionRules(agent.permission);
            // `update` creates the agent (with OpenCode's defaults) when it
            // does not exist yet, so it doubles as "add".
            editor.update(agent.name, (draft) => {
                draft.mode = "subagent";
                draft.system = agent.prompt;
                if (agent.description) {
                    draft.description = agent.description;
                }
                draft.permissions.push(...rules);
            });
        }
    });
}

/**
 * Agent W OpenCode Plugin
 *
 * Exposes the Model W skills and agents to OpenCode without requiring any
 * local installation in the project's .agents folder. Reads agent markdown
 * files from the agents/ directory and skills from the skills/ directory,
 * parses their YAML frontmatter and registers them with OpenCode.
 *
 * The default export supports both plugin APIs from one package:
 *   - OpenCode v1 (>= 1.18.29) calls `server()`
 *   - OpenCode v2 calls `setup(ctx)`
 *
 * The object has the same shape `Plugin.define()` from `@opencode/plugin`
 * returns (which is an identity function), without requiring that
 * dependency at runtime.
 */
const AgentWPlugin = {
    id: PLUGIN_ID,
    server,
    setup,
};

export default AgentWPlugin;
