import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
                if (match[1].trim()) {
                    // Single-line value: `key: value`
                    return match[1].trim();
                }
                // Multi-line value: `key:\n    line1\n    line2`
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
 * Agent W OpenCode Plugin
 *
 * Exposes the Model W skills and agents to OpenCode de-facto without requiring
 * any local installation in the project's .agents folder. Reads agent markdown
 * files from the agents/ directory, parses their YAML frontmatter (including
 * multi-line descriptions and permission blocks), and registers them as
 * subagents in the OpenCode configuration.
 */
export async function AgentWPlugin() {
    const skillsPath = path.join(__dirname, "..", "skills");
    const agentsPath = path.join(__dirname, "..", "agents");

    return {
        /**
         * Register the plugin's skills and agents in the OpenCode configuration.
         * This makes skills like 'model-w-bootstrap' and agents like
         * 'model-w-bootstrap-explorer' available to the agent as if they were
         * installed locally.
         */
        config: async (config) => {
            if (!config.skills) {
                config.skills = {};
            }
            if (!config.skills.paths) {
                config.skills.paths = [];
            }

            if (!config.skills.paths.includes(skillsPath)) {
                config.skills.paths.push(skillsPath);
            }

            if (!config.agent) {
                config.agent = {};
            }

            /**
             * Load agents from the agents folder and inject them into the
             * opencode configuration. Parses YAML frontmatter for name,
             * multi-line description, and optional permission block.
             */
            if (fs.existsSync(agentsPath)) {
                const agentFiles = fs
                    .readdirSync(agentsPath)
                    .filter((f) => f.endsWith(".md"));

                for (const file of agentFiles) {
                    const content = fs.readFileSync(
                        path.join(agentsPath, file),
                        "utf-8"
                    );
                    const match = content.match(
                        /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
                    );

                    if (match) {
                        const frontmatter = match[1];
                        const body = match[2];

                        const name = parseFrontmatterValue(
                            frontmatter,
                            "name"
                        );
                        const description = parseFrontmatterValue(
                            frontmatter,
                            "description"
                        );

                        if (name) {
                            const agentConfig = {
                                description,
                                prompt: body.trim(),
                                mode: "subagent",
                            };

                            const permission = parseFrontmatterObject(
                                frontmatter,
                                "permission"
                            );
                            if (permission) {
                                agentConfig.permission = permission;
                            }

                            config.agent[name] = agentConfig;
                        }
                    }
                }
            }
        },
    };
}

export default AgentWPlugin;
