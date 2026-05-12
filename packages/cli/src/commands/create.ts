import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createCommand(name: string): Promise<void> {
    const projectPath = path.resolve(process.cwd(), name);

    if (fs.existsSync(projectPath)) {
        console.error(chalk.red(`Directory ${name} already exists.`));
        process.exit(1);
    }

    console.log(chalk.cyan(`Creating Web+ project: ${name}`));

    try {
        // Use global templates directory
        // Resolution: resolve 'webplus' package root, then look in templates/project
        let packageRoot = path.dirname(__dirname); // dist -> root (if built in dist)
        // Adjust based on directory structure: 
        // If run from src: packages/cli/src -> packages/cli
        // If run from dist: packages/cli/dist/bin -> packages/cli
        // A safer way in dev mode vs prod mode needed

        // Assumption: CLI is installed and running from its packaged location
        // Try to find templates relative to this file

        // In this workspace: c:\Projects\Web+\webplus\packages\cli\templates\project
        // This file: c:\Projects\Web+\webplus\packages\cli\src\commands\create.ts

        let templatePath = path.resolve(__dirname, '../../templates/project');

        if (!fs.existsSync(templatePath)) {
            // Fallback for compiled structure: packages/cli/dist/templates/project
            templatePath = path.resolve(__dirname, '../templates/project');
        }

        // For this specific workspace dev environment:
        if (!fs.existsSync(templatePath)) {
            templatePath = path.join(process.cwd(), 'packages/cli/templates/project');
        }

        // For this specific workspace dev environment:
        if (!fs.existsSync(templatePath)) {
            templatePath = path.join(process.cwd(), 'packages/cli/templates/project');
        }

        await fs.ensureDir(projectPath);

        // Create basic template files
        const mainWebplus = `// ${name}
// Entry point

void main() {
    print("Hello, Web+ from ${name}!");
    dom::Element app = dom::get("#app");
    app.html("<h1>${name} is running!</h1>");
}
`;

        const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
    <style>
        body { background: #0f172a; color: #f8fafc; font-family: system-ui; display: grid; place-items: center; height: 100vh; margin: 0; }
    </style>
</head>
<body>
    <div id="app"></div>
    <script src="runtime.js"></script>
    <script src="wasm_loader.js"></script>
    <script>
        WebPlus.load('app.wasm'); // Loads the compiled app
    </script>
</body>
</html>`;

        const configToml = `name = "${name}"
version = "0.1.0"
entry = "src/main.webplus"
`;

        await fs.ensureDir(path.join(projectPath, 'src'));
        await fs.writeFile(path.join(projectPath, 'src', 'main.webplus'), mainWebplus);
        await fs.writeFile(path.join(projectPath, 'index.html'), indexHtml);
        await fs.writeFile(path.join(projectPath, 'webplus.toml'), configToml);

        // Create gitignore
        await fs.writeFile(path.join(projectPath, '.gitignore'), 'build/\nnode_modules/\n.DS_Store\n');

        console.log(chalk.green(`\nSuccess! Created ${name} at ${projectPath}`));
        console.log(chalk.gray('\nInside that directory, you can run:'));
        console.log(chalk.cyan(`  webplus run .`));
        console.log(chalk.gray('\nHappy coding! 🚀\n'));

    } catch (error: any) {
        console.error(chalk.red('Failed to create project:'), error.message);
        process.exit(1);
    }
}
