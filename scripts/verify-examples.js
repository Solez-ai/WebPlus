const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');
const EXAMPLES = [
    'hello-world',
    'game',
    'chat-app',
    'dashboard',
    'server-api',
    'stdlib-demo',
    'worker-fib'
];

async function verifyExample(exampleName) {
    const exampleDir = path.join(EXAMPLES_DIR, exampleName);
    const mainFile = path.join(exampleDir, 'main.webplus');
    const buildDir = path.join(exampleDir, 'build');

    console.log(chalk.cyan(`\n📦 Verifying ${exampleName}...`));

    // Check if main.webplus exists
    if (!fs.existsSync(mainFile)) {
        console.log(chalk.red(`  ✗ main.webplus not found`));
        return { name: exampleName, success: false, error: 'main.webplus not found' };
    }

    // Clean build directory
    if (fs.existsSync(buildDir)) {
        await fs.remove(buildDir);
    }

    try {
        // Try to build the example
        console.log(chalk.gray(`  Building...`));

        const command = `webplus build main.webplus -o build`;
        execSync(command, {
            cwd: exampleDir,
            stdio: 'pipe',
            encoding: 'utf-8'
        });

        // Check if build outputs exist
        const appCpp = path.join(buildDir, 'app.cpp');
        if (!fs.existsSync(appCpp)) {
            console.log(chalk.yellow(`  ⚠ app.cpp not generated`));
            return { name: exampleName, success: false, error: 'app.cpp not generated' };
        }

        console.log(chalk.green(`  ✓ Build successful`));
        return { name: exampleName, success: true };

    } catch (error) {
        console.log(chalk.red(`  ✗ Build failed`));
        console.log(chalk.gray(`  Error: ${error.message}`));
        return { name: exampleName, success: false, error: error.message };
    }
}

async function main() {
    console.log(chalk.bold.cyan('\n🚀 Web+ Examples Verification\n'));
    console.log(chalk.gray(`Verifying ${EXAMPLES.length} examples...\n`));

    const results = [];

    for (const example of EXAMPLES) {
        const result = await verifyExample(example);
        results.push(result);
    }

    // Print summary
    console.log(chalk.bold('\n📊 Summary:\n'));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(chalk.green(`  ✓ Successful: ${successful.length}/${results.length}`));
    if (failed.length > 0) {
        console.log(chalk.red(`  ✗ Failed: ${failed.length}/${results.length}`));
        console.log(chalk.red('\n  Failed examples:'));
        failed.forEach(r => {
            console.log(chalk.red(`    - ${r.name}: ${r.error}`));
        });
    }

    if (failed.length === 0) {
        console.log(chalk.green.bold('\n✨ All examples verified successfully!\n'));
        process.exit(0);
    } else {
        console.log(chalk.red.bold('\n❌ Some examples failed verification\n'));
        process.exit(1);
    }
}

main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
});
