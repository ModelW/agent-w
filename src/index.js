import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Agent W Plugin
 *
 * Exposes the Model W skills to the agent without requiring
 * any local installation in the project's .agents folder.
 *
 * It also dynamically injects skills from the workspace's .agents/skills
 * directory if it exists, allowing Claude Code to see them natively.
 */
export async function AgentWPlugin(context) {
    const internalSkillsPath = path.join(__dirname, "..", "skills");
    const workspaceSkillsPath = context?.worktree
        ? path.join(context.worktree, ".agents", "skills")
        : path.join(process.cwd(), ".agents", "skills");

    return {
        /**
         * Register the skills folders in the configuration.
         */
        config: async (config) => {
            if (!config.skills) {
                config.skills = {};
            }
            if (!config.skills.paths) {
                config.skills.paths = [];
            }

            const pathsToAdd = [internalSkillsPath];

            if (fs.existsSync(workspaceSkillsPath)) {
                pathsToAdd.push(workspaceSkillsPath);
            }

            for (const p of pathsToAdd) {
                if (!config.skills.paths.includes(p)) {
                    config.skills.paths.push(p);
                }
            }
        },
    };
}

export default AgentWPlugin;
