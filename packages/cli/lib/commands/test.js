import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { transpile } from '@solez-ai/transpiler';
import chokidar from 'chokidar';
export async function testCommand(pattern, options) {
    console.log(chalk.cyan.bold('Web+ Test Runner\n'));
    const testFiles = await findTestFiles(pattern);
    if (testFiles.length === 0) {
        console.log(chalk.yellow('No test files found matching pattern: ' + pattern));
        return;
    }
    console.log(chalk.gray(`Found ${testFiles.length} test file(s)\n`));
    const results = [];
    for (const testFile of testFiles) {
        console.log(chalk.blue(`Running: ${path.basename(testFile)}`));
        const result = await runTest(testFile, options);
        results.push(result);
        if (result.passed) {
            console.log(chalk.green(`  ✓ ${result.name} (${result.duration}ms)`));
        }
        else {
            console.log(chalk.red(`  ✗ ${result.name} (${result.duration}ms)`));
            if (result.error && options.verbose) {
                console.log(chalk.gray(`    ${result.error}`));
            }
        }
    }
    console.log('');
    printSummary(results);
    if (options.watch) {
        console.log(chalk.gray('\nWatching for changes...'));
        watchTests(pattern, options);
    }
}
async function findTestFiles(pattern) {
    const cwd = process.cwd();
    const files = [];
    async function search(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                await search(fullPath);
            }
            else if (entry.isFile() && entry.name.endsWith('.test.webplus')) {
                files.push(fullPath);
            }
        }
    }
    await search(cwd);
    return files;
}
async function runTest(testFile, options) {
    const startTime = Date.now();
    const testName = path.basename(testFile, '.test.webplus');
    try {
        const source = await fs.readFile(testFile, 'utf-8');
        const cppCode = transpile(source);
        if (cppCode.includes('test_fail') || cppCode.includes('assert(false)')) {
            return {
                name: testName,
                passed: false,
                error: 'Test assertion failed',
                duration: Date.now() - startTime
            };
        }
        return {
            name: testName,
            passed: true,
            duration: Date.now() - startTime
        };
    }
    catch (error) {
        return {
            name: testName,
            passed: false,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - startTime
        };
    }
}
function printSummary(results) {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;
    console.log(chalk.bold('Test Summary:'));
    console.log(chalk.green(`  Passed: ${passed}/${total}`));
    if (failed > 0) {
        console.log(chalk.red(`  Failed: ${failed}/${total}`));
    }
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    console.log(chalk.gray(`  Total time: ${totalDuration}ms`));
}
function watchTests(pattern, options) {
    const watcher = chokidar.watch('**/*.test.webplus', {
        ignored: /(^|[\/\\])\../,
        persistent: true
    });
    watcher.on('change', async (filePath) => {
        console.log(chalk.yellow(`\n\nFile changed: ${filePath}`));
        await testCommand(pattern, { ...options, watch: false });
        console.log(chalk.gray('\nWatching for changes...'));
    });
}
//# sourceMappingURL=test.js.map