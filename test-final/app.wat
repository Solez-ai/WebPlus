(module
  ;; Web+ Generated WebAssembly (Direct WASM)

  (memory 1) ;; 1 page (64KB)
  (export "memory" (memory 0))

  ;; Import object for DOM and runtime (no Emscripten needed)
  (import "env" "print" (func $print (param i32)))
  (import "env" "printStr" (func $printStr (param i32)))
  (import "env" "domGet" (func $domGet (param i32 i32) (result i32)))
  (import "env" "domSetText" (func $domSetText (param i32 i32)))
  (import "env" "domSetHtml" (func $domSetHtml (param i32 i32)))
  (import "env" "domCreateElement" (func $domCreateElement (param i32) (result i32)))
  (import "env" "domAppendChild" (func $domAppendChild (param i32 i32)))
  (import "env" "domRemove" (func $domRemove (param i32)))
  (import "env" "domSetStyle" (func $domSetStyle (param i32 i32 i32)))
  (import "env" "domOn" (func $domOn (param i32 i32 i32)))
  (import "env" "alloc" (func $alloc (param i32) (result i32)))
  (import "env" "free" (func $free (param i32)))
  (import "env" "rand" (func $rand (result i32)))
  (import "env" "sleep" (func $sleep (param i32)))
  (import "env" "fetch" (func $fetch (param i32 i32 i32)))
  (import "env" "workerSpawn" (func $workerSpawn (param i32) (result i32)))

  (func $_start  
  (local (local $app i32))
    (local.set $app 0)
    (call $ 0) (drop)
  )

  ;; Export main function
  (export "_start" (func $_start))
  (export "main" (func $_start))

)