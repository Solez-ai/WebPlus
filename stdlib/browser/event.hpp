#ifndef WEBPLUS_EVENT_HPP
#define WEBPLUS_EVENT_HPP

#include "../runtime/memory.hpp"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/val.h>
#include <emscripten/bind.h>
#endif

namespace webplus {

// Event class for DOM events
class Event {
private:
    String key_;
    String type_;
    int target_id_;

public:
    Event() : key_(""), type_(""), target_id_(-1) {}
    
    Event(const String& key, const String& type, int target_id = -1)
        : key_(key), type_(type), target_id_(target_id) {}

    // Get the key that was pressed (for keyboard events)
    String key() const { return key_; }
    
    // Get the event type
    String type() const { return type_; }
    
    // Get the target element ID
    int target_id() const { return target_id_; }

    #ifdef __EMSCRIPTEN__
    // Create Event from Emscripten val
    static Event fromJS(emscripten::val jsEvent) {
        String key = "";
        String type = "";
        
        if (jsEvent.hasOwnProperty("key")) {
            std::string keyStr = jsEvent["key"].as<std::string>();
            key = String(keyStr.c_str());
        }
        
        if (jsEvent.hasOwnProperty("type")) {
            std::string typeStr = jsEvent["type"].as<std::string>();
            type = String(typeStr.c_str());
        }
        
        return Event(key, type);
    }
    #endif
};

} // namespace webplus

#ifdef __EMSCRIPTEN__
// Emscripten bindings for Event class
EMSCRIPTEN_BINDINGS(webplus_event) {
    emscripten::class_<webplus::Event>("Event")
        .constructor<>()
        .function("key", &webplus::Event::key)
        .function("type", &webplus::Event::type);
}
#endif

#endif
