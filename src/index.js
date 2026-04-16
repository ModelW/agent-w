import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Agent W OpenCode Plugin
 *
 * Exposes the Model W skills to OpenCode de-facto without requiring
 * any local installation in the project's .agents folder.
 */
export async function AgentWPlugin() {
    const skillsPath = path.join(__dirname, "..", "skills");

    return {
        /**
         * Register the plugin's skills folder in the OpenCode configuration.
         * This makes skills like 'model-w-bootstrap' available to the agent
         * as if they were installed locally.
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
        },
    };
}

export default AgentWPlugin;
