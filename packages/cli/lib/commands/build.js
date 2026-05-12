import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';
// @ts-ignore
import { transpile } from '@solez-ai/transpiler';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function buildCommand(source, options) {
    const format = options.format || 'wasm';
    const isNativeWasm = format === 'wasm' || format === 'wat';
    try {
        const entryFile = path.resolve(process.cwd(), source);
        const outputDir = path.resolve(process.cwd(), options.output || './build');
        if (!fs.existsSync(entryFile)) {
            console.error(chalk.red(`Entry file not found: ${entryFile}`));
            process.exit(1);
        }
        console.log(chalk.cyan(`Building ${path.basename(entryFile)}...`));
        await fs.ensureDir(outputDir);
        // Read source code
        const code = await fs.readFile(entryFile, 'utf-8');
        if (isNativeWasm) {
            // Direct WASM generation (no Emscripten needed)
            console.log(chalk.blue('Generating WebAssembly...'));
            // Generate WAT (WebAssembly Text Format)
            const watCode = transpile(code, { output: 'wat', debug: options.debug });
            const watPath = path.join(outputDir, 'app.wat');
            await fs.writeFile(watPath, watCode);
            console.log(chalk.gray(`  Generated: ${watPath}`));
            // Try to compile WAT to binary WASM using wat2wasm
            let wat2wasmFound = false;
            try {
                execSync('wat2wasm --version', { stdio: 'ignore' });
                wat2wasmFound = true;
            }
            catch (e) { }
            if (wat2wasmFound) {
                console.log(chalk.blue('Compiling to binary WASM...'));
                try {
                    execSync(`wat2wasm "${watPath}" -o "${path.join(outputDir, 'app.wasm')}"`, { stdio: 'inherit' });
                    console.log(chalk.green('  ✔ Binary WASM generated'));
                }
                catch (e) {
                    console.error(chalk.red('  ✘ WAT compilation failed'));
                }
            }
            else {
                console.log(chalk.yellow('  Note: wat2wasm not found. Install WABT to compile to binary.'));
                console.log(chalk.gray('  Install from: https://github.com/WebAssembly/wabt'));
            }
            // Create a simple loader for the generated WASM
            await createWasmLoader(outputDir, entryFile);
        }
        else {
            // C++ generation (default, requires Emscripten)
            const cppCode = transpile(code);
            const appCppPath = path.join(outputDir, 'app.cpp');
            await fs.writeFile(appCppPath, cppCode);
            // 2. Locate Standard Library
            let stdlibPath = path.resolve(__dirname, '../../../../stdlib');
            if (!fs.existsSync(stdlibPath)) {
                stdlibPath = path.resolve(__dirname, '../../stdlib');
            }
            if (!fs.existsSync(stdlibPath)) {
                console.warn(chalk.yellow("Warning: Standard library headers not found."));
            }
            // 3. Try to compile with Emscripten
            let emccFound = false;
            try {
                execSync('emcc --version', { stdio: 'ignore' });
                emccFound = true;
            }
            catch (e) { }
            if (emccFound) {
                console.log(chalk.blue('Invoking Emscripten compiler...'));
                const emccCommand = [
                    'emcc',
                    `"${appCppPath}"`,
                    '-o', `"${path.join(outputDir, 'app.js')}"`,
                    '-s', 'WASM=1',
                    '-s', 'ALLOW_MEMORY_GROWTH=1',
                    '-s', 'EXPORTED_RUNTIME_METHODS=["ccall","cwrap"]',
                    '-s', 'MODULARIZE=1',
                    '-s', 'EXPORT_NAME="createWebPlusModule"',
                    `-I"${stdlibPath}"`,
                    '-lembind',
                    '-pthread',
                    '-s', 'PTHREAD_POOL_SIZE=4',
                    '--bind',
                    options.optimize ? '-O3' : '-O1'
                ].join(' ');
                try {
                    execSync(emccCommand, { stdio: 'inherit', cwd: outputDir });
                    console.log(chalk.green('✔ WebAssembly compilation successful!'));
                }
                catch (e) {
                    console.error(chalk.red('✘ Emscripten compilation failed.'));
                }
            }
            else {
                console.log(chalk.yellow('Note: Emscripten (emcc) not found in PATH.'));
                console.log(chalk.gray('Generated C++ source at:') + ` ${appCppPath}`);
            }
        }
        // Copy Runtime Assets
        let runtimePath = path.resolve(__dirname, '../../../../packages/runtime/dist');
        if (!fs.existsSync(runtimePath)) {
            runtimePath = path.resolve(__dirname, '../../runtime/dist');
        }
        if (fs.existsSync(runtimePath)) {
            await fs.copy(runtimePath, outputDir, {
                filter: (src) => !src.endsWith('.d.ts') && !src.endsWith('.map')
            });
        }
        // Copy index.html if provided in project
        const projectHtml = path.join(path.dirname(entryFile), 'index.html');
        if (fs.existsSync(projectHtml)) {
            await fs.copy(projectHtml, path.join(outputDir, 'index.html'));
        }
        console.log(chalk.green(`\n✔ Build complete -> ${outputDir}`));
    }
    catch (e) {
        console.error(chalk.red("\nBuild failed:"), e.message);
        process.exit(1);
    }
}
async function createWasmLoader(outputDir, entryFile) {
    // Create a simple JavaScript loader for native WASM
    const loader = `// Web+ Native WASM Loader
// This loader works without Emscripten

async function loadWebPlusWasm() {
    const wasmPath = './app.wasm';

    // Check for WebAssembly support
    if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly not supported in this browser');
    }

    // Fetch and instantiate the WASM module
    const response = await fetch(wasmPath);
    if (!response.ok) {
        throw new Error('Failed to fetch WASM file');
    }

    const wasmBuffer = await response.arrayBuffer();
    const wasmModule = await WebAssembly.compile(wasmBuffer);

    // Define imports for DOM and runtime
    const imports = {
        env: {
            print: (val) => console.log(val),
            printStr: (ptr) => { /* Handle string pointer */ },
            domGet: (ptr, len) => {
                const selector = new Uint8Array(wasmModule).slice(ptr, ptr + len);
                return 0; // Return element reference
            },
            domSetText: (el, ptr) => { /* Set element text */ },
            domSetHtml: (el, ptr) => { /* Set element HTML */ },
            domCreateElement: (tagPtr) => { return document.createElement('div').id = ''; },
            domAppendChild: (parent, child) => { },
            domRemove: (el) => { },
            domSetStyle: (el, propPtr, valPtr) => { },
            domOn: (el, eventPtr, callback) => { },
            alloc: (size) => 0,
            free: (ptr) => { },
            rand: () => Math.floor(Math.random() * 2147483647),
            sleep: (ms) => new Promise(r => setTimeout(r, ms)),
            fetch: (urlPtr, methodPtr, callback) => { },
            workerSpawn: (ptr) => 0
        }
    };

    const instance = await WebAssembly.instantiate(wasmModule, imports);

    // Export the WASM functions
    return instance.exports;
}

// Auto-load if this is the main module
if (typeof window !== 'undefined') {
    loadWebPlusWasm()
        .then(exports => {
            console.log('Web+ WASM loaded successfully');
            if (exports._start) {
                exports._start();
            } else if (exports.main) {
                exports.main();
            }
        })
        .catch(err => console.error('Failed to load Web+:', err));
}

export { loadWebPlusWasm };
`;
    await fs.writeFile(path.join(outputDir, 'webplus-loader.js'), loader);
    console.log(chalk.gray(`  Generated: ${path.join(outputDir, 'webplus-loader.js')}`));
}
export const buildOptionsSpec = {
    output: { short: 'o', long: 'output', description: 'Output directory', default: './build' },
    format: { short: 'f', long: 'format', description: 'Output format: wasm, wat, or cpp', default: 'wasm' },
    optimize: { short: 'O', long: 'optimize', description: 'Enable optimizations', default: false },
    debug: { short: 'g', long: 'debug', description: 'Generate debug info', default: false }
};
//# sourceMappingURL=build.js.map