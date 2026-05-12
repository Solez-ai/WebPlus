// Web+ Native WASM Loader
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
