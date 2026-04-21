import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Agent W OpenCode Plugin
 *
 * Exposes the Model W skills and agents to OpenCode de-facto without requiring
 * any local installation in the project's .agents folder.
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
             * opencode configuration.
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

                        const nameMatch = frontmatter.match(/name:\s*(.*)/);
                        const descriptionMatch =
                            frontmatter.match(/description:\s*(.*)/);

                        if (nameMatch) {
                            const name = nameMatch[1].trim();
                            const description = descriptionMatch
                                ? descriptionMatch[1].trim()
                                : "";

                            config.agent[name] = {
                                description,
                                prompt: body.trim(),
                                mode: "subagent",
                            };
                        }
                    }
                }
            }
        },
    };
}

export default AgentWPlugin;
