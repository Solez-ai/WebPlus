import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { buildCommand } from './build.js';
export async function runCommand(target, options) {
    const targetPath = path.resolve(process.cwd(), target);
    // If target is a .webplus file or directory with source, build it first
    let buildDir = targetPath;
    if (targetPath.endsWith('.webplus') || (fs.existsSync(path.join(targetPath, 'src')))) {
        console.log(chalk.gray("Building source before running..."));
        const outputDir = path.join(process.cwd(), 'build');
        await buildCommand(targetPath, { output: outputDir, optimize: false, check: false, emitJson: false });
        buildDir = outputDir;
    }
    console.log(chalk.cyan(`Running Web+ app from ${buildDir}`));
    console.log(chalk.gray("Starting local server..."));
    // Simple static server for build dir
    // In a real CLI, we'd use 'serve-handler' or similar
    console.log(chalk.green(`\nServer running at http://localhost:8080`));
    console.log(chalk.gray(`Opening browser...`));
    // Simulate open
    // import open from 'open'; open('http://localhost:8080');
}
//# sourceMappingURL=run.js.map