# Worker Fibonacci Example

This example showcases Web+'s concurrency model:

- Background worker threads
- Recursive algorithm (Fibonacci)
- DOM updates from worker results
- Performance demonstration

## Features

- Spawns a Web Worker to calculate Fibonacci(40)
- Non-blocking UI during computation
- Direct memory access in worker thread
- Zero-overhead WebAssembly performance

## Build

```bash
webplus build main.webplus -o build
```

## Run

```bash
webplus serve .
```

## Performance

Web+ compiles to optimized WebAssembly, providing near-native performance for computationally intensive tasks like recursive Fibonacci calculations.

Expected calculation time: ~1-2 seconds (varies by hardware)

## Code Highlights

**Worker Spawn:**
```webplus
worker w = worker::spawn([] {
    return fib(40);
});

int result = w.join();
```

This spawns a background thread, executes the calculation, and waits for completion—all with deterministic memory behavior and no garbage collection overhead.
