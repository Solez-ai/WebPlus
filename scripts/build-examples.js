const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const examples = [
    'hello-world',
    'server-api',
    'worker-fib'
];

console.log('Building Web+ examples...\n');

for (const example of examples) {
    const examplePath = path.join(__dirname, '..', 'examples', example);
    const source = path.join(examplePath, 'main.webplus');
    const buildPath = path.join(examplePath, 'build');

    if (!fs.existsSync(source)) {
        console.log(`❌ Skipping ${example}: main.webplus not found`);
        continue;
    }

    console.log(`📦 Building ${example}...`);

    try {
        const command = `node ../cli/lib/index.js build ${source} -o ${buildPath}`;
        execSync(command, { cwd: __dirname, stdio: 'inherit' });
        console.log(`✅ ${example} built successfully\n`);
    } catch (error) {
        console.error(`❌ Failed to build ${example}\n`);
    }
}

console.log('Done!');
