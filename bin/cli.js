#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

// ANSI color codes
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

const showHelp = () => {
    console.log(`
${colors.cyan}Agent W - CLI${colors.reset}

Usage: 
  agent-w <command> [options]

Commands:
  install [destination]    Install the Model W skill. 
                           Defaults to ${colors.yellow}~/.agents/skills${colors.reset}.

Options:
  -h, --help               Show this help message.

Example:
  agent-w install
  agent-w install /path/to/custom/agents/folder
`);
};

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    showHelp();
    process.exit(0);
}

const command = args[0];

if (command === "install") {
    let destBase = args[1];
    if (!destBase) {
        destBase = path.join(os.homedir(), ".agents", "skills");
    } else if (destBase.startsWith("~/")) {
        destBase = path.join(os.homedir(), destBase.slice(2));
    }

    const destFolder = path.join(destBase, "model-w-bootstrap");
    const srcFolder = path.join(__dirname, "..", "skills", "model-w-bootstrap");

    console.log(`${colors.blue}Installing Agent W skill...${colors.reset}`);
    console.log(`Source: ${colors.yellow}${srcFolder}${colors.reset}`);
    console.log(`Destination: ${colors.yellow}${destFolder}${colors.reset}`);

    try {
        if (!fs.existsSync(destFolder)) {
            fs.mkdirSync(destFolder, { recursive: true });
        }

        const srcFile = path.join(srcFolder, "SKILL.md");
        const destFile = path.join(destFolder, "SKILL.md");

        if (!fs.existsSync(srcFile)) {
            console.error(
                `${colors.red}Error: Source file not found at ${srcFile}${colors.reset}`
            );
            process.exit(1);
        }

        fs.copyFileSync(srcFile, destFile);
        console.log(
            `${colors.green}✔ Successfully installed Agent W skill to ${destFile}${colors.reset}`
        );
    } catch (error) {
        console.error(
            `${colors.red}Error during installation:${colors.reset}`,
            error.message
        );
        process.exit(1);
    }
} else {
    console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
    showHelp();
    process.exit(1);
}
