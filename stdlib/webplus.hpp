#ifndef WEBPLUS_STDLIB_HPP
#define WEBPLUS_STDLIB_HPP

// Core runtime - Memory & Safety
#include "runtime/memory.hpp"        // Arc, Weak, Option, Result, alloc, free, Arena
#include "runtime/vector.hpp"         // Vector<T>
#include "runtime/print.hpp"          // print, log, warn, error
#include "runtime/math.hpp"           // Math functions
#include "runtime/string_utils.hpp"   // String utilities

// Extended runtime
#include "runtime/datetime.hpp"       // DateTime, Duration, Timer, timestamp
#include "runtime/json.hpp"           // JsonValue, json_parse, json_* helpers
#include "runtime/file.hpp"          // File, file_read, file_write, file_exists
#include "runtime/algorithm.hpp"     // sort, find, transform, min, max, etc.

// Browser APIs (when compiled for browser)
#ifdef __EMSCRIPTEN__
#include "browser/dom.hpp"            // DOM manipulation, Element, style properties
#include "browser/fetch.hpp"         // HTTP fetch
#include "browser/worker.hpp"         // Web Workers, ThreadPool, Mutex, Atomic
#include "browser/event.hpp"         // Event, MouseEvent, KeyboardEvent
#endif

namespace webplus {

inline void stdlib_init() {
    // Initialize random seed
    srand(static_cast<unsigned int>(time(nullptr)));

    #ifdef __EMSCRIPTEN__
    // Browser-specific initialization if needed
    #endif
}

inline void stdlib_cleanup() {
    #ifdef __EMSCRIPTEN__
    // Browser-specific cleanup if needed
    #endif
}

}

#endif
