<div align="center">

<img src="./logo.png" alt="Web+ Logo" width="200"/>

# Web+

**A C++-inspired systems-level language for the web that compiles to WebAssembly**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?logo=webassembly&logoColor=white)](https://webassembly.org/)
[![Emscripten](https://img.shields.io/badge/Emscripten-3.1+-orange)](https://emscripten.org/)

[Documentation](https://github.com/Solez-ai/webplus/tree/main/docs) • [Examples](https://github.com/Solez-ai/webplus/tree/main/examples) • [Report Bug](https://github.com/Solez-ai/webplus/issues)

</div>

---

## Overview

**Web+** (internally `webplus`) is a systems-level programming language designed specifically for the web. It combines the performance and control of C++ with web-native primitives, compiling to WebAssembly for near-native execution in browsers and servers.

Unlike JavaScript or TypeScript, Web+ provides:

- ✅ **Manual memory management** with stack, heap, and arena allocators
- ✅ **Zero garbage collection** overhead
- ✅ **Deterministic execution** and predictable performance  
- ✅ **Web primitives** as first-class language features (DOM, HTTP, fetch, workers)
- ✅ **Cross-platform** execution (browser, WASI server, edge runtimes)

```webplus
// Client-side DOM manipulation
void main() {
    dom::Element button = dom::get("#submit");
    button.on("click", [] {
        dom::get("#status").text("Processing...");
    });
}

// Server-side HTTP API
route GET "/api/user/:id" -> Response {
    int userId = param("id");
    return json({ "id": userId, "name": "User" });
}

// Concurrent background calculation
worker w = worker::spawn([] { return fib(40); });
int result = w.join();
```

---

## Table of Contents

- [Why Web+?](#why-web)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Language Overview](#language-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Examples](#examples)
- [CLI Commands](#cli-commands)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## Why Web+?

### Target Audience

Web+ is designed for **experienced systems and C++ programmers** who need the control and performance of a systems language for web applications. It is **NOT** a JavaScript replacement for beginners.

Ideal use cases:

- **Performance-critical** web applications (CAD tools, video/audio editors)
- **Real-time** applications (games, simulations, data visualization)
- **Computationally intensive** tasks requiring WebAssembly performance
- **Server-side** applications where deterministic execution matters

### Design Philosophy

1. **Performance First** — Zero-cost abstractions, deterministic execution
2. **Explicit Over Implicit** — Memory and concurrency behavior is always visible
3. **Web-Native** — DOM, HTTP, workers are language primitives, not libraries
4. **No Garbage Collection** — Manual memory management for predictable behavior
5. **Systems-level Control** — Full control over memory layout and execution

---

## Features

### Core Language

- ✅ **C++-inspired syntax** with static typing
- ✅ **Manual memory management** (stack, heap, arena allocators)
- ✅ **Structs and functions** with pointers and references
- ✅ **No garbage collector** — deterministic memory behavior
- ✅ **Compile-time type checking** and error detection

### Web Primitives

Built into the language, not as libraries:

- ✅ **DOM manipulation** — `dom::get`, `Element.on`, `text()`, `html()`
- ✅ **HTTP routing** — `route GET/POST`, server-side endpoints
- ✅ **Fetch API** — Async network requests
- ✅ **Web Workers** — Concurrent background execution
- ✅ **Streams** — Real-time data handling

### Compilation Pipeline

- ✅ **Web+ → C++** transpiler (v0.1)
- ✅ **C++ → WebAssembly** via Emscripten
- ✅ **Optimized .wasm** output with minimal JS glue
- 🔄 **Direct LLVM → WebAssembly** compiler (planned for v0.2)

### Developer Tools

- ✅ **CLI** with build, run, serve, format, lint, test commands
- ✅ **Development server** with hot-reload
- ✅ **VS Code extension** with syntax highlighting and LSP (in progress)
- ✅ **Comprehensive documentation** via Mintlify

### Standard Library (v0.1 - Complete)

Essential runtime features for browser and server:

- ✅ **Memory primitives** — `int`, `float`, `string` with manual management
- ✅ **Math functions** — `sqrt`, `sin`, `cos`, `rand`, `randomFloat` and more
- ✅ **String utilities** — `toString()`, concatenation, formatting
- ✅ **Containers** — `Vector<T>` dynamic array
- ✅ **Logging** — `print()`, `warn()`, `error()` with console integration
- ✅ **DOM access** — `dom::get()`, `dom::createElement()`, event handling with `on()`
- ✅ **HTTP fetch** — Simple async fetch wrapper for network requests
- ✅ **Workers** — `worker::spawn()`, `join()`, `detach()` for background tasks
- ✅ **Browser runtime** — WASM module loader with minimal JS glue

Full API: [stdlib-reference.mdx](./docs/stdlib-reference.mdx)

---

## Installation

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Emscripten SDK** v3.1.0 or higher
- **Git**

### Install Emscripten

```bash
# Clone Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install and activate
./emsdk install latest
./emsdk activate latest

# Set up environment
source ./emsdk_env.sh  # Add to ~/.bashrc or ~/.zshrc
```

### Install Web+

### Install Web+ Globally

```bash
# Install toolchain globally
npm install -g @solez-ai/webplus
```

This installs the `webplus` CLI, compiler, and standard library available system-wide.

### Install VS Code Extension

1. Open VS Code
2. Install the **Web+** extension from the marketplace (or from local `.vsix` build).
3. Provides syntax highlighting, diagnostics, and "Run" buttons.

---

## Quick Start

### 1. Create a Web+ File

Create `hello.webplus`:

```webplus
void main() {
    dom::get("#app").text("Hello, Web+!");
}
```

### 2. Build

```bash
webplus build hello.webplus -o build
```

This transpiles Web+ → C++ → WebAssembly and generates an HTML runner.

### 3. Run

```bash
webplus serve . --port 3000
```

Open `http://localhost:3000` in your browser!

---

## Language Overview

### Primitive Types

```webplus
int age = 25;              // 32-bit signed integer
float price = 19.99;       // 32-bit floating point
double precise = 3.14159;  // 64-bit floating point
bool isActive = true;      // Boolean
char grade = 'A';          // Single character
string name = "Web+";      // UTF-8 string
void noReturn();           // No return value
```

### Memory Management

```webplus
// Stack allocation (automatic)
int x = 42;

// Heap allocation (manual)
int* ptr = alloc<int>(10);
ptr[0] = 42;
free(ptr);  // Required!

// Arena allocation (fast bulk)
int* arena = arena<int>(1000);
// No individual free needed
```

### Structs

```webplus
struct User {
    int id;
    string name;
    string email;
};

User* user = alloc<User>(1);
user->id = 1;
user->name = "Samin Yeasar";
free(user);
```

### Functions

```webplus
int add(int a, int b) {
    return a + b;
}

float multiply(float x, float y) {
    return x * y;
}
```

### DOM Manipulation

```webplus
void main() {
    dom::Element button = dom::get("#myButton");
    button.on("click", [] {
        dom::get("#output").text("Button clicked!");
    });
}
```

### HTTP Routing

```webplus
route GET "/api/hello" -> Response {
    return json({ "message": "Hello from Web+!" });
}

route GET "/api/user/:id" -> Response {
    int userId = param("id");
    return json({ "id": userId });
}
```

### Concurrency

```webplus
worker w = worker::spawn([] {
    return fib(40);  // Background calculation
});

int result = w.join();  // Wait for completion
```

---

## Technology Stack

### Language Implementation

- **Parser:** Tree-sitter (C++ grammar adapted)
- **Transpiler:** TypeScript (AST to C++ code generation)
- **Compiler Backend:** Emscripten (C++ to WebAssembly)
- **Future Compiler:** LLVM IR → WebAssembly (v0.2+)

### Runtime

- **Browser:** WebAssembly + minimal JS glue for DOM/Web APIs
- **Server:** WASI runtime (Wasmtime, Bun, Deno)
- **Edge:** Cloudflare Workers, AWS Lambda (WebAssembly)

### Developer Tools

- **CLI:** TypeScript + Commander.js
- **VS Code Extension:** TypeScript + LSP
- **Documentation:** Mintlify
- **Build System:** npm workspaces

---

## Project Structure

```
webplus/
├── transpiler/           # Web+ to C++ transpiler
│   ├── src/
│   │   ├── ast/          # AST node definitions
│   │   ├── parser.ts     # Tree-sitter based parser
│   │   └── codegen/      # C++ code generator
│   └── package.json
├── cli/                  # Command-line interface
│   ├── src/
│   │   ├── index.ts      # CLI entry point
│   │   └── commands/     # build, run, serve, etc.
│   └── package.json
├── stdlib/               # Standard library (NEW!)
│   ├── runtime/          # Core runtime primitives
│   │   ├── memory.hpp    # Memory primitives
│   │   ├── vector.hpp    # Vector container
│   │   └── print.hpp     # Logging functions
│   ├── browser/          # Browser-specific runtime
│   │   ├── dom.hpp       # DOM access
│   │   ├── fetch.hpp     # HTTP fetch
│   │   ├── runtime.js    # JS glue
│   │   └── index.html    # HTML template
│   ├── wasm/             # WASM runtime support
│   │   └── runtime.cpp   # Runtime initialization
│   └── webplus.hpp       # Main stdlib header
├── vscode-extension/     # VS Code extension (WIP)
│   ├── src/
│   └── syntaxes/
├── docs/                 # Mintlify documentation
│   ├── index.mdx
│   ├── quickstart.mdx
│   ├── stdlib-reference.mdx  # NEW!
│   ├── browser-runtime.mdx   # NEW!
│   ├── language-spec/
│   ├── api-reference/
│   └── tutorials/
├── examples/             # Example applications
│   ├── hello-world/
│   ├── server-api/
│   ├── worker-fib/
│   └── stdlib-demo/      # NEW!
├── package.json          # Root monorepo config
├── LICENSE               # MIT License
└── README.md             # This file
```

---

## Examples

### Hello World (Client-Side)

```webplus
void main() {
    dom::get("#app").text("Hello, Web+!");
}
```

**Build:** `webplus build hello.webplus -o build`  
**Run:** Open `build/index.html` in browser

### Server API

```webplus
struct User {
    int id;
    string name;
};

route GET "/api/user/:id" -> Response {
    int userId = param("id");
    
    User* user = alloc<User>(1);
    user->id = userId;
    user->name = "Samin Yeasar";
    
    Response res = json(user);
    free(user);
    
    return res;
}
```

### Worker Fibonacci

```webplus
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

void main() {
    worker w = worker::spawn([] {
        return fib(40);
    });
    
    int result = w.join();
    dom::get("#result").text("Fib(40) = " + result);
}
```

**More examples:** [/examples](https://github.com/Solez-ai/webplus/tree/main/examples)

---

## CLI Commands

### Build

Compile Web+ source to WebAssembly:

```bash
webplus build <source> -o <output>
webplus build main.webplus -o build
webplus build src/ -o dist --optimize
```

### Serve

Development server with hot-reload:

```bash
webplus serve <source> --port <port>
webplus serve src --port 3000
```

### Run

Execute compiled WebAssembly:

```bash
webplus run <target> --browser
webplus run build --server  # WASI runtime (v0.2+)
```

### Format

Format Web+ source code:

```bash
webplus format <files>
webplus format src/**/*.webplus
```

### Lint

Static analysis and error detection:

```bash
webplus lint <files>
webplus lint src/**/*.webplus --fix
```

### Test

Run unit tests:

```bash
webplus test [pattern]
webplus test **/*.test.webplus --watch
```

### Package

Create distributable module:

```bash
webplus package <directory> -o <output>
webplus package . -o dist/module.wasm
```

---

## Deployment

### Browser

Web+ applications compile to `.wasm` + `.js` + `.html`:

1. Build: `webplus build src -o dist --optimize`
2. Deploy `dist/` to any static hosting (Vercel, Netlify, GitHub Pages)
3. Serve with proper MIME types for `.wasm` files

### Server (WASI)

Planned for v0.2:

```bash
webplus build server.webplus --target=wasi
wasmtime run server.wasm
```

### Edge Runtimes

Deploy to Cloudflare Workers or AWS Lambda:

```bash
webplus build api.webplus --target=edge
wrangler deploy dist/api.wasm
```

---

## Roadmap

### v0.1 (Current - MVP)

- ✅ Transpiler (Web+ → C++ → WebAssembly)
- ✅ Core syntax and types
- ✅ DOM and HTTP primitives
- ✅ CLI with build, serve, format, lint commands
- ✅ Basic documentation

### v0.2 (Planned)

- 🔄 Native compiler (LLVM IR → WebAssembly)
- 🔄 Improved concurrency (atomics, shared memory)
- 🔄 WASI runtime support for server apps
- 🔄 Full VS Code extension with debugging
- 🔄 Package manager

### v1.0 (Future)

- 🔄 Production-ready compiler
- 🔄 Complete standard library
- 🔄 Advanced optimizations
- 🔄 Optional borrow-checking
- 🔄 Performance benchmarks vs JS/TS

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:

- Code follows existing style
- All tests pass
- Documentation is updated

---

## License

Web+ is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Samin Yeasar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Credits

**Web+** is designed and developed by:

### **Samin Yeasar**

- **GitHub:** [@Solez-ai](https://github.com/Solez-ai)
- **X (Twitter):** [@Solez_None](https://x.com/Solez_None)
- **Portfolio:** [solez.vercel.app](https://solez.vercel.app)
- **Email:** [sheditzofficial918@gmail.com](mailto:sheditzofficial918@gmail.com)

---

<div align="center">

**Made with ⚡ by [Samin Yeasar](https://github.com/Solez-ai)**

[⭐ Star on GitHub](https://github.com/Solez-ai/webplus) • [📖 Read Docs](https://github.com/Solez-ai/webplus/tree/main/docs) • [🐛 Report Issue](https://github.com/Solez-ai/webplus/issues)

</div>
