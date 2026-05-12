
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

interface FormatOptions {
    check?: boolean;
    write?: boolean;
}

export async function formatCommand(files: string[], options: FormatOptions): Promise<void> {
    console.log(chalk.cyan('Formatting Web+ files...'));

    const fileList = expandGlob(files);

    if (fileList.length === 0) {
        console.log(chalk.yellow('No files found to format'));
        return;
    }

    let changedCount = 0;
    let errorCount = 0;

    for (const file of fileList) {
        try {
            const content = await fs.readFile(file, 'utf-8');
            const formatted = formatWebPlusCode(content);

            if (content !== formatted) {
                changedCount++;

                if (options.check) {
                    console.log(chalk.yellow(`  ✗ ${path.basename(file)} - needs formatting`));
                } else {
                    await fs.writeFile(file, formatted, 'utf-8');
                    console.log(chalk.green(`  ✓ ${path.basename(file)} - formatted`));
                }
            } else {
                console.log(chalk.gray(`  ○ ${path.basename(file)} - already formatted`));
            }
        } catch (error) {
            errorCount++;
            console.log(chalk.red(`  ✗ ${path.basename(file)} - error: ${error}`));
        }
    }

    console.log('');
    console.log(chalk.bold('Summary:'));
    console.log(`  Total files: ${fileList.length}`);
    console.log(`  Changed: ${changedCount}`);
    if (errorCount > 0) {
        console.log(chalk.red(`  Errors: ${errorCount}`));
    }

    if (options.check && changedCount > 0) {
        console.log(chalk.yellow('\nSome files need formatting. Run without --check to format them.'));
        process.exit(1);
    }
}

function formatWebPlusCode(code: string): string {
    let lines = code.split('\n');
    let formatted: string[] = [];
    let indentLevel = 0;
    const indentSize = 4;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip empty lines
        if (line.length === 0) {
            formatted.push('');
            continue;
        }

        // Decrease indent for closing braces
        if (line.startsWith('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        // Add indentation
        const indent = ' '.repeat(indentLevel * indentSize);
        formatted.push(indent + line);

        // Increase indent for opening braces
        if (line.endsWith('{')) {
            indentLevel++;
        }
    }

    return formatted.join('\n');
}

function expandGlob(patterns: string[]): string[] {
    const files: string[] = [];

    for (const pattern of patterns) {
        if (fs.existsSync(pattern)) {
            const stat = fs.statSync(pattern);
            if (stat.isFile() && pattern.endsWith('.webplus')) {
                files.push(pattern);
            } else if (stat.isDirectory()) {
                const dirFiles = findWebPlusFiles(pattern);
                files.push(...dirFiles);
            }
        }
    }

    return [...new Set(files)]; // Remove duplicates
}

function findWebPlusFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...findWebPlusFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.webplus')) {
            files.push(fullPath);
        }
    }

    return files;
}
