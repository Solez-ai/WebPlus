# Web+ Standard Library Demo

This example demonstrates the **minimal standard library** features available in Web+ v0.1.

## Features Demonstrated

### ✅ Memory Primitives
- `int` (32-bit signed integer)
- `float` (32-bit floating point)
- `string` (UTF-8 string with manual memory management)

### ✅ Vectors / Arrays
- `Vector<T>` - Dynamic array implementation
- `push()`, `pop()`, `at()`, `size()` operations
- Manual memory management

### ✅ Logging
- `print()` - Console output with variadic arguments
- `warn()` - Warning messages
- `error()` - Error messages

### ✅ DOM Access (Browser Only)
- `dom::get(selector)` - Query elements
- `dom::createElement(tag)` - Create new elements
- `Element.text()` / `Element.html()` - Content manipulation
- `Element.append()` - DOM tree manipulation
- `Element.add_class()` / `Element.remove_class()` - CSS classes

### ✅ HTTP Fetch (Browser Only)
- `fetch(url)` - Simple HTTP GET wrapper
- Promise-like interface (full callbacks in v0.2)

## Building

```bash
# From the webplus root directory
webplus build examples/stdlib-demo/main.webplus -o examples/stdlib-demo/build
```

## Running

### Browser
1. Build the project (see above)
2. Copy `stdlib/browser/index.html` and `stdlib/browser/runtime.js` to the build directory
3. Serve the build directory with a local HTTP server:
   ```bash
   cd examples/stdlib-demo/build
   python -m http.server 8000
   ```
4. Open http://localhost:8000 in your browser

### Server (WASI)
```bash
webplus run examples/stdlib-demo/main.webplus
```

## Code Structure

```cpp
void main() {
    // Initialize runtime
    webplus::stdlib_init();
    
    // Use memory primitives
    webplus::int32 count = 42;
    webplus::String message = "Hello!";
    
    // Use vectors
    webplus::Vector<int32> numbers;
    numbers.push(10);
    
    // Print to console
    webplus::print("Count:", count);
    
    // DOM manipulation (browser only)
    webplus::dom::Element app = webplus::dom::get("#app");
    app.text("Web+ is running!");
    
    // Cleanup
    webplus::stdlib_cleanup();
}
```

## What's NOT Included (v0.2+)

These features are planned for future releases:

- ❌ Full callback support for async operations
- ❌ Complete DOM API
- ❌ HTTP routing runtime
- ❌ SQLite bindings
- ❌ Advanced containers (Map, Set)
- ❌ File I/O
- ❌ Streams

## Performance Notes

- Zero-cost abstractions: No overhead from stdlib usage
- Manual memory management: Predictable performance
- Minimal WASM binary size: Only used features are included
- No garbage collection: Deterministic execution

## Architecture

```
┌─────────────────────────────────────┐
│      Web+ Application Code         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Web+ Standard Library (C++)      │
│  - Memory primitives               │
│  - Vectors                         │
│  - Print/logging                   │
│  - DOM/Fetch (browser)             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Emscripten (Transpiler)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         WebAssembly (WASM)         │
└──────────────┬──────────────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
┌─────────┐      ┌──────────────┐
│ Browser │      │ WASI Runtime │
└─────────┘      └──────────────┘
```

## Credits

**Built by:** Samin Yeasar  
- GitHub: [@Solez-ai](https://github.com/Solez-ai)
- X: [@Solez_None](https://x.com/Solez_None)
- Portfolio: [solez.vercel.app](https://solez.vercel.app)

**License:** MIT  
**Version:** 0.1.0
