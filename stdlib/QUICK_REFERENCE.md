# Web+ Standard Library - Quick Reference

## 🚀 Getting Started

```cpp
#include "webplus.hpp"

void main() {
    webplus::stdlib_init();
    // Your code here
    webplus::stdlib_cleanup();
}
```

---

## 📦 Memory Primitives

```cpp
// Types
webplus::int32 age = 25;
webplus::float32 price = 19.99f;
webplus::String name = "Web+";

// Allocation
int* ptr = webplus::alloc<int>(10);
webplus::free_ptr(ptr);

// Arena (bulk)
webplus::Arena<int> arena(1000);
int* temp = arena.allocate(10);
arena.reset();
```

---

## 📊 Containers

```cpp
// Vector
webplus::Vector<int> numbers;
numbers.push(42);
numbers.push(100);
int last = numbers.pop();
int first = numbers.at(0);
size_t len = numbers.size();
numbers.clear();
```

---

## 🖨️ Logging

```cpp
webplus::print("Hello", "World", 42);
webplus::warn("Something might be wrong");
webplus::error("Something is definitely wrong");
```

---

## 🌐 DOM (Browser Only)

```cpp
using namespace webplus::dom;

// Get elements
Element app = get("#app");
Element btn = getElementById("myButton");

// Create elements
Element div = createElement("div");
div.text("Hello!");
div.html("<h1>Title</h1>");
div.add_class("active");
div.set_attribute("id", "myDiv");

// Manipulate DOM
app.append(div);
div.remove();
```

---

## 🌍 HTTP Fetch (Browser Only)

```cpp
// Simple GET
webplus::String url = "https://api.example.com/data";
webplus::Promise response = webplus::fetch(url);

// POST with body
webplus::String jsonBody = "{\"key\":\"value\"}";
webplus::Promise res = webplus::fetch(url, "POST", jsonBody);
```

---

## 🔧 Build & Run

```bash
# Build
webplus build main.webplus -o build/

# Copy runtime
cp stdlib/browser/index.html build/
cp stdlib/browser/runtime.js build/

# Serve
cd build && python -m http.server 8000
```

---

## 📁 Include Paths

```cpp
#include "webplus.hpp"              // All features

// Or individual headers
#include "runtime/memory.hpp"
#include "runtime/vector.hpp"
#include "runtime/print.hpp"
#include "browser/dom.hpp"          // Browser only
#include "browser/fetch.hpp"        // Browser only
```

---

## ⚡ Quick Example

```cpp
#include "webplus.hpp"

void main() {
    webplus::stdlib_init();
    
    // Data
    webplus::Vector<webplus::String> items;
    items.push("Item 1");
    items.push("Item 2");
    items.push("Item 3");
    
    // Log
    webplus::print("Items:", items.size());
    
    // DOM
    webplus::dom::Element app = webplus::dom::get("#app");
    webplus::dom::Element list = webplus::dom::createElement("ul");
    
    for (size_t i = 0; i < items.size(); i++) {
        webplus::dom::Element li = webplus::dom::createElement("li");
        li.text(items[i]);
        list.append(li);
    }
    
    app.append(list);
    
    webplus::stdlib_cleanup();
}
```

---

## 📚 Full Documentation

- [Standard Library Reference](./docs/stdlib-reference.mdx)
- [Browser Runtime Guide](./docs/browser-runtime.mdx)
- [Example Applications](./examples/stdlib-demo/)

---

**Built by:** Samin Yeasar ([@Solez-ai](https://github.com/Solez-ai))  
**Version:** 0.1.0
