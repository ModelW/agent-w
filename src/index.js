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
    // Internal skills bundled with the plugin
    const internalSkillsPath = path.join(__dirname, "..", "skills");

    // Workspace skills in .agents/skills
    // context.worktree is an object { path: string, ... }
    const workspaceRoot =
        context?.worktree?.path || context?.directory || process.cwd();
    const workspaceSkillsPath = path.join(workspaceRoot, ".agents", "skills");

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

// Multiple export patterns for maximum compatibility with different loaders
export const Plugin = AgentWPlugin;
export const server = AgentWPlugin;
export default AgentWPlugin;
