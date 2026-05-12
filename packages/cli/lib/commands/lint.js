import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
export async function lintCommand(files, options) {
    console.log(chalk.cyan('Linting Web+ files...'));
    const fileList = expandFiles(files);
    if (fileList.length === 0) {
        console.log(chalk.yellow('No files found to lint'));
        return;
    }
    const allIssues = [];
    for (const file of fileList) {
        try {
            const content = await fs.readFile(file, 'utf-8');
            const issues = lintWebPlusCode(content, file);
            allIssues.push(...issues);
            if (issues.length > 0) {
                console.log(chalk.yellow(`\n${path.basename(file)}:`));
                for (const issue of issues) {
                    const icon = issue.severity === 'error' ? '✗' : '⚠';
                    const color = issue.severity === 'error' ? chalk.red : chalk.yellow;
                    console.log(color(`  ${icon} Line ${issue.line}: ${issue.message} (${issue.rule})`));
                }
            }
            else {
                console.log(chalk.green(`✓ ${path.basename(file)}`));
            }
        }
        catch (error) {
            console.log(chalk.red(`✗ ${path.basename(file)} - error reading file: ${error}`));
        }
    }
    console.log('');
    console.log(chalk.bold('Summary:'));
    console.log(`  Total files: ${fileList.length}`);
    console.log(`  Issues found: ${allIssues.length}`);
    const errors = allIssues.filter(i => i.severity === 'error').length;
    const warnings = allIssues.filter(i => i.severity === 'warning').length;
    if (errors > 0) {
        console.log(chalk.red(`  Errors: ${errors}`));
    }
    if (warnings > 0) {
        console.log(chalk.yellow(`  Warnings: ${warnings}`));
    }
    if (allIssues.length === 0) {
        console.log(chalk.green('\n✓ No issues found!'));
    }
    else if (errors > 0) {
        process.exit(1);
    }
}
function lintWebPlusCode(code, filename) {
    const issues = [];
    const lines = code.split('\n');
    // Track allocations and frees
    const allocations = new Map();
    const frees = new Set();
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        // Check for memory leaks (alloc without free)
        const allocMatch = line.match(/(\w+)\s*=\s*alloc<.*>\(/);
        if (allocMatch) {
            const varName = allocMatch[1];
            allocations.set(varName, lineNum);
        }
        const freeMatch = line.match(/free\((\w+)\)/);
        if (freeMatch) {
            const varName = freeMatch[1];
            frees.add(varName);
        }
        // Check for missing semicolons (basic check)
        if (line.length > 0 &&
            !line.endsWith(';') &&
            !line.endsWith('{') &&
            !line.endsWith('}') &&
            !line.startsWith('//') &&
            !line.startsWith('/*') &&
            !line.startsWith('*') &&
            !line.startsWith('struct') &&
            !line.startsWith('void') &&
            !line.startsWith('int') &&
            !line.startsWith('float') &&
            !line.startsWith('route')) {
            // This is a very basic check and will have false positives
            // issues.push({
            //     file: filename,
            //     line: lineNum,
            //     column: 0,
            //     severity: 'warning',
            //     message: 'Statement might be missing semicolon',
            //     rule: 'missing-semicolon'
            // });
        }
        // Check for unused variables (basic check)
        const varDeclMatch = line.match(/^\s*(int|float|double|bool|char|string)\s+(\w+)\s*=/);
        if (varDeclMatch) {
            const varName = varDeclMatch[2];
            const restOfCode = lines.slice(i + 1).join('\n');
            if (!restOfCode.includes(varName)) {
                issues.push({
                    file: filename,
                    line: lineNum,
                    column: 0,
                    severity: 'warning',
                    message: `Variable '${varName}' is declared but never used`,
                    rule: 'unused-variable'
                });
            }
        }
    }
    // Check for potential memory leaks
    for (const [varName, lineNum] of allocations.entries()) {
        if (!frees.has(varName)) {
            issues.push({
                file: filename,
                line: lineNum,
                column: 0,
                severity: 'warning',
                message: `Potential memory leak: '${varName}' is allocated but never freed`,
                rule: 'memory-leak'
            });
        }
    }
    return issues;
}
function expandFiles(patterns) {
    const files = [];
    for (const pattern of patterns) {
        if (fs.existsSync(pattern)) {
            const stat = fs.statSync(pattern);
            if (stat.isFile() && pattern.endsWith('.webplus')) {
                files.push(pattern);
            }
            else if (stat.isDirectory()) {
                const dirFiles = findWebPlusFiles(pattern);
                files.push(...dirFiles);
            }
        }
    }
    return [...new Set(files)];
}
function findWebPlusFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...findWebPlusFiles(fullPath));
        }
        else if (entry.isFile() && entry.name.endsWith('.webplus')) {
            files.push(fullPath);
        }
    }
    return files;
}
//# sourceMappingURL=lint.js.map