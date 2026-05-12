# Hello World Example

This is the simplest possible Web+ application. It demonstrates:

- Basic DOM manipulation using `dom::get`
- Element text modification
- Zero-overhead WebAssembly execution

## Build

```bash
webplus build main.webplus -o build
```

## Run

Open `build/index.html` in your browser or use:

```bash
webplus serve .
```

## Expected Output

The page will display "Hello, Web+!" in the #app element.
