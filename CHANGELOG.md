# Changelog

## v0.1.2 - 2026-05-12

### Added
- index.html files for all 7 examples (hello-world, stdlib-demo, worker-fib, dashboard, chat-app, server-api, game)
- Enhanced DOM stdlib with `style` property for CSS manipulation (display, width, height, color, etc.)
- Event class with key, type, and target properties
- Updated examples to use consistent syntax
- Publishing guide (PUBLISHING_GUIDE.md)
- Fixed stdlib-demo to use correct syntax (direct instead of webplus:: prefix)
- Optimized C++ generator to use array-based string building (O(n) instead of O(n²))

### Fixed
- CLI package name changed to "webplus" for simple `npm install -g webplus`
- Parser now handles expression statements (assignments) properly
- DOM stdlib now compiles without multiple definition errors

### Known Issues
- Compound assignment operators (+=, -=, etc.) have parsing issues
- Large files (>300 lines) may cause memory issues
- Some complex examples (game, dashboard, chat-app) have parser errors

---

## v0.1.1 - 2026-02-04

### Added
- Initial transpiler implementation (Web+ → C++)
- CLI with commands: create, build, run, serve, format, lint, test
- Standard library: math, string_utils, memory, vector, print, worker, dom, fetch
- 7 example applications
- VS Code extension
- Documentation (GETTING_STARTED.md, README.md, etc.)

---

## Architecture

```
Web+ Source Code
       ↓
   Transpiler (TypeScript)
       ↓
    C++ Code
       ↓
  Emscripten (optional)
       ↓
  WebAssembly
       ↓
 Browser/WASI Runtime
```

---

## What's Needed for v1.0

1. **Fix compound assignment operators** (+=, -=, *=, /=, %=, etc.)
2. **Optimize parser** for large files
3. **Complete all examples** to work with transpiler
4. **Add unit tests** for transpiler
5. **Improve error messages**
6. **Add LSP support** for IDE integration
7. **Remove Emscripten dependency** (compile directly to WASM)

---

## Comparison with C++

| Feature | Web+ | C++ |
|---------|------|-----|
| Manual Memory | ✅ | ✅ |
| Web Primitives | ✅ DOM, HTTP, Workers built-in | ❌ External libs |
| Cross-platform WASM | ✅ Native | ❌ Requires emscripten |
| Simple Syntax | ✅ | ❌ Complex |
| Safety Options | Optional bounds checking | Manual |
| String Handling | Built-in | Manual |

---

## Comparison with JavaScript/TypeScript

| Feature | Web+ | JS/TS |
|---------|------|-------|
| Performance | Near-native (WASM) | Interpreter/JIT |
| Memory Control | Manual | GC |
| Determinism | ✅ | ❌ |
| Type System | Static | Dynamic/Static |
| Web Primitives | ✅ Built-in | ✅ External |

---

**Made by Samin Yeasar**
GitHub: https://github.com/Solez-ai
Email: sheditzofficial918@gmail.com