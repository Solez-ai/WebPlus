#include <emscripten.h>
#include <emscripten/bind.h>
#include "../runtime/memory.hpp"
#include "../runtime/vector.hpp"
#include "../runtime/print.hpp"
#include "../browser/dom.hpp"
#include "../browser/fetch.hpp"

namespace webplus {
namespace wasm {

extern "C" {

EMSCRIPTEN_KEEPALIVE
void runtime_init() {
    EM_ASM({
        if (window.__webplus && window.__webplus.init) {
            window.__webplus.init();
        }
    });
}

EMSCRIPTEN_KEEPALIVE
void runtime_cleanup() {
    EM_ASM({
        if (window.__webplus) {
            for (let i = 0; i < window.__webplus_workers.length; i++) {
                window.__webplus.cleanupWorker(i);
            }
        }
    });
}

EMSCRIPTEN_KEEPALIVE
const char* runtime_version() {
    return "0.1.0";
}

}

class Runtime {
private:
    bool initialized_;

public:
    Runtime() : initialized_(false) {}

    void initialize() {
        if (!initialized_) {
            runtime_init();
            initialized_ = true;
            webplus::log("Web+ Runtime initialized");
        }
    }

    void cleanup() {
        if (initialized_) {
            runtime_cleanup();
            initialized_ = false;
        }
    }

    bool is_initialized() const {
        return initialized_;
    }

    static Runtime& instance() {
        static Runtime runtime;
        return runtime;
    }
};

inline void init() {
    Runtime::instance().initialize();
}

inline void cleanup() {
    Runtime::instance().cleanup();
}

}
}

using namespace emscripten;

EMSCRIPTEN_BINDINGS(webplus_runtime) {
    function("runtime_init", &webplus::wasm::runtime_init);
    function("runtime_cleanup", &webplus::wasm::runtime_cleanup);
    function("runtime_version", &webplus::wasm::runtime_version);
    
    class_<webplus::wasm::Runtime>("Runtime")
        .constructor<>()
        .function("initialize", &webplus::wasm::Runtime::initialize)
        .function("cleanup", &webplus::wasm::Runtime::cleanup)
        .function("is_initialized", &webplus::wasm::Runtime::is_initialized)
        .class_function("instance", &webplus::wasm::Runtime::instance, allow_raw_pointers());
}
