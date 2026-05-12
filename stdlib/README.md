# Web+ Standard Library (stdlib)

This is the minimal standard library for Web+ v0.1, providing essential runtime primitives for both browser and server environments.

## Organization

```
stdlib/
├── runtime/        # Core runtime primitives
│   ├── memory.hpp  # Memory primitives (int, float, string)
│   ├── vector.hpp  # Vector/array implementation
│   └── print.hpp   # print() / logging utilities
├── browser/        # Browser-specific runtime
│   ├── dom.hpp     # Basic DOM access (getElementById, createElement)
│   ├── fetch.hpp   # Simple HTTP fetch wrapper
│   └── runtime.js  # Minimal JS glue for browser APIs
└── wasm/           # WebAssembly runtime support
    └── runtime.cpp # WASM module loader and initialization
```

## Included Features

### Memory Primitives
- `int` (32-bit signed integer)
- `float` (32-bit floating point)
- `string` (UTF-8 string with manual memory management)

### Vectors / Arrays
- `Vector<T>` - Dynamic array with manual memory management
- Essential operations: push, pop, at, size, clear

### Logging
- `print()` - Basic console output
- `warn()` - Warning messages
- `error()` - Error messages

### DOM Access (Browser Only)
- `dom::getElementById(id)` - Get element by ID
- `dom::createElement(tag)` - Create new element
- `Element.text(value)` - Get/set text content
- `Element.on(event, callback)` - Attach event listeners

### HTTP Fetch (Browser Only)
- `fetch(url)` - Simple HTTP GET wrapper
- Basic promise-like interface

## Usage

The standard library is automatically included when building Web+ applications:

```bash
webplus build main.webplus -o build/
```

The transpiler will automatically link the necessary stdlib components based on what features your code uses.

## Future Additions (v0.2+)

- Complete DOM API
- Full HTTP routing runtime
- SQLite bindings
- Advanced containers (Map, Set)
- File I/O
- Streams

---

**Built by:** Samin Yeasar ([@Solez-ai](https://github.com/Solez-ai))  
**License:** MIT  
**Version:** 0.1.0
