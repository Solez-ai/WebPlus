#ifndef WEBPLUS_DOM_HPP
#define WEBPLUS_DOM_HPP

#include "../runtime/memory.hpp"
#include <functional>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/val.h>
#include <emscripten/bind.h>
#endif

namespace webplus {
namespace dom {

// Comprehensive CSS Style Proxy
class StyleProxy {
private:
    int element_id_;

public:
    StyleProxy() : element_id_(-1) {}
    explicit StyleProxy(int id) : element_id_(id) {}

    // Display
    void display(const String& value);
    String display() const;

    // Visibility
    void visibility(const String& value);
    String visibility() const;

    // Sizing
    void width(const String& value);
    void height(const String& value);
    void minWidth(const String& value);
    void minHeight(const String& value);
    void maxWidth(const String& value);
    void maxHeight(const String& value);

    // Positioning
    void position(const String& value);
    void top(const String& value);
    void bottom(const String& value);
    void left(const String& value);
    void right(const String& value);
    void zIndex(int value);

    // Box Model
    void margin(const String& value);
    void marginTop(const String& value);
    void marginBottom(const String& value);
    void marginLeft(const String& value);
    void marginRight(const String& value);
    void padding(const String& value);
    void paddingTop(const String& value);
    void paddingBottom(const String& value);
    void paddingLeft(const String& value);
    void paddingRight(const String& value);

    // Border
    void border(const String& value);
    void borderWidth(const String& value);
    void borderColor(const String& value);
    void borderRadius(const String& value);

    // Colors
    void color(const String& value);
    void background(const String& value);
    void backgroundColor(const String& value);
    void opacity(const String& value);

    // Typography
    void fontSize(const String& value);
    void fontWeight(const String& value);
    void fontFamily(const String& value);
    void textAlign(const String& value);
    void textDecoration(const String& value);
    void lineHeight(const String& value);

    // Effects
    void transform(const String& value);
    void transition(const String& value);
    void boxShadow(const String& value);
    void cursor(const String& value);

    // Flexbox
    void flex(const String& value);
    void flexDirection(const String& value);
    void justifyContent(const String& value);
    void alignItems(const String& value);
    void flexWrap(const String& value);
    void gap(const String& value);

    // Grid
    void gridTemplateColumns(const String& value);
    void gridTemplateRows(const String& value);
    void gridColumn(const String& value);
    void gridRow(const String& value);

    // Overflow
    void overflow(const String& value);
    void overflowX(const String& value);
    void overflowY(const String& value);
};

// Event class for DOM events
class Event {
private:
    String key_;
    String type_;
    void* target_;
    int clientX_;
    int clientY_;

public:
    Event() : target_(nullptr), clientX_(0), clientY_(0) {}
    Event(const String& key, const String& type, void* target = nullptr)
        : key_(key), type_(type), target_(target), clientX_(0), clientY_(0) {}

    String key() const { return key_; }
    String type() const { return type_; }
    void* target() const { return target_; }
    int clientX() const { return clientX_; }
    int clientY() const { return clientY_; }
};

// Mouse Event extends Event
class MouseEvent : public Event {
private:
    int button_;
    int screenX_;
    int screenY_;
    int offsetX_;
    int offsetY_;

public:
    MouseEvent() : button_(0), screenX_(0), screenY_(0), offsetX_(0), offsetY_(0) {}
    MouseEvent(const String& type, int x, int y) : Event("", type, nullptr), button_(0), screenX_(x), screenY_(y), offsetX_(0), offsetY_(0) {}

    int button() const { return button_; }
    int screenX() const { return screenX_; }
    int screenY() const { return screenY_; }
    int offsetX() const { return offsetX_; }
    int offsetY() const { return offsetY_; }
};

// Keyboard Event extends Event
class KeyboardEvent : public Event {
private:
    int keyCode_;
    int charCode_;
    bool ctrlKey_;
    bool shiftKey_;
    bool altKey_;

public:
    KeyboardEvent() : keyCode_(0), charCode_(0), ctrlKey_(false), shiftKey_(false), altKey_(false) {}

    int keyCode() const { return keyCode_; }
    int charCode() const { return charCode_; }
    bool ctrlKey() const { return ctrlKey_; }
    bool shiftKey() const { return shiftKey_; }
    bool altKey() const { return altKey_; }
};

// Element class
class Element {
private:
    int element_id_;

public:
    Element() : element_id_(-1) {}
    explicit Element(int id) : element_id_(id) {}

    bool is_valid() const { return element_id_ >= 0; }
    int get_id() const { return element_id_; }

    // Style property
    StyleProxy style() { return StyleProxy(element_id_); }

    // Content
    void text(const String& value);
    String text() const;
    void html(const String& value);
    String html() const;

    // Attributes
    void set_attribute(const String& name, const String& value);
    String get_attribute(const String& name) const;
    void remove_attribute(const String& name);
    bool has_attribute(const String& name) const;

    // Classes
    void add_class(const String& className);
    void remove_class(const String& className);
    void toggle_class(const String& className);
    bool has_class(const String& className) const;

    // DOM Manipulation
    void append(const Element& child);
    void prepend(const Element& child);
    void remove();
    void remove_child(const Element& child);
    void replace_child(const Element& newChild, const Element& oldChild);
    void insert_before(const Element& newNode, const Element& refNode);
    void insert_after(const Element& newNode, const Element& refNode);

    // Element creation
    static Element createElement(const String& tagName);

    // Queries
    Element querySelector(const String& selector) const;
    Vector<Element> querySelectorAll(const String& selector) const;

    // Dimensions
    int clientWidth() const;
    int clientHeight() const;
    int scrollWidth() const;
    int scrollHeight() const;
    int offsetWidth() const;
    int offsetHeight() const;

    // Position
    int offsetLeft() const;
    int offsetTop() const;
    int scrollLeft() const;
    int scrollTop() const;

    // Focus
    void focus();
    void blur();
    bool is_focused() const;

    // Animation
    void animate(const String& keyframes, const String& options);

    // Event handlers
    template<typename F>
    void on(const String& event, F callback);

    template<typename F>
    void off(const String& event);

    template<typename F>
    void once(const String& event, F callback);

    // Shorthand event methods
    template<typename F>
    void onClick(F callback) { on("click", callback); }
    template<typename F>
    void onMouseDown(F callback) { on("mousedown", callback); }
    template<typename F>
    void onMouseUp(F callback) { on("mouseup", callback); }
    template<typename F>
    void onMouseMove(F callback) { on("mousemove", callback); }
    template<typename F>
    void onMouseEnter(F callback) { on("mouseenter", callback); }
    template<typename F>
    void onMouseLeave(F callback) { on("mouseleave", callback); }
    template<typename F>
    void onKeyDown(F callback) { on("keydown", callback); }
    template<typename F>
    void onKeyUp(F callback) { on("keyup", callback); }
    template<typename F>
    void onKeyPress(F callback) { on("keypress", callback); }
    template<typename F>
    void onSubmit(F callback) { on("submit", callback); }
    template<typename F>
    void onChange(F callback) { on("change", callback); }
    template<typename F>
    void onInput(F callback) { on("input", callback); }
    template<typename F>
    void onLoad(F callback) { on("load", callback); }
    template<typename F>
    void onError(F callback) { on("error", callback); }
    template<typename F>
    void onScroll(F callback) { on("scroll", callback); }
    template<typename F>
    void onResize(F callback) { on("resize", callback); }
};

// Helper functions
Element get(const String& selector);
Element createElement(const String& tagName);
Element getElementById(const String& id);

// Implementation
#ifdef __EMSCRIPTEN__

// StyleProxy implementations
inline void StyleProxy::display(const String& value) {
    EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.display = UTF8ToString($1); }, element_id_, value.c_str());
}
inline String StyleProxy::display() const {
    char* r = (char*)EM_ASM_INT({ if(window.__webplus_elements[$0]) { var s = window.__webplus_elements[$0].style.display; var l = lengthBytesUTF8(s)+1; var p = _malloc(l); stringToUTF8(s,p,l); return p; } return 0; }, element_id_);
    if(r){ String s(r); std::free(r); return s; } return String("");
}
inline void StyleProxy::visibility(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.visibility = UTF8ToString($1); }, element_id_, value.c_str()); }
inline String StyleProxy::visibility() const { return String(""); }
inline void StyleProxy::width(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.width = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::height(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.height = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::minWidth(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.minWidth = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::minHeight(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.minHeight = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::maxWidth(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.maxWidth = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::maxHeight(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.maxHeight = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::position(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.position = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::top(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.top = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::bottom(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.bottom = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::left(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.left = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::right(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.right = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::zIndex(int value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.zIndex = $1; }, element_id_, value); }
inline void StyleProxy::margin(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.margin = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::marginTop(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.marginTop = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::marginBottom(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.marginBottom = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::marginLeft(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.marginLeft = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::marginRight(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.marginRight = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::padding(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.padding = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::paddingTop(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.paddingTop = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::paddingBottom(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.paddingBottom = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::paddingLeft(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.paddingLeft = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::paddingRight(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.paddingRight = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::border(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.border = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::borderWidth(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.borderWidth = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::borderColor(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.borderColor = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::borderRadius(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.borderRadius = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::color(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.color = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::background(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.background = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::backgroundColor(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.backgroundColor = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::opacity(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.opacity = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::fontSize(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.fontSize = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::fontWeight(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.fontWeight = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::fontFamily(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.fontFamily = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::textAlign(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.textAlign = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::textDecoration(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.textDecoration = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::lineHeight(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.lineHeight = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::transform(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.transform = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::transition(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.transition = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::boxShadow(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.boxShadow = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::cursor(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.cursor = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::flex(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.flex = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::flexDirection(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.flexDirection = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::justifyContent(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.justifyContent = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::alignItems(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.alignItems = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::flexWrap(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.flexWrap = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::gap(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.gap = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::gridTemplateColumns(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.gridTemplateColumns = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::gridTemplateRows(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.gridTemplateRows = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::gridColumn(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.gridColumn = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::gridRow(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.gridRow = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::overflow(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.overflow = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::overflowX(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.overflowX = UTF8ToString($1); }, element_id_, value.c_str()); }
inline void StyleProxy::overflowY(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].style.overflowY = UTF8ToString($1); }, element_id_, value.c_str()); }

// Element implementations
inline void Element::text(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].textContent = UTF8ToString($1); }, element_id_, value.c_str()); }
inline String Element::text() const { char* r = (char*)EM_ASM_INT({ if(window.__webplus_elements[$0]) { var t = window.__webplus_elements[$0].textContent||''; var l = lengthBytesUTF8(t)+1; var p = _malloc(l); stringToUTF8(t,p,l); return p; } return 0; }, element_id_); if(r){ String s(r); std::free(r); return s; } return String(""); }
inline void Element::html(const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].innerHTML = UTF8ToString($1); }, element_id_, value.c_str()); }
inline String Element::html() const { char* r = (char*)EM_ASM_INT({ if(window.__webplus_elements[$0]) { var h = window.__webplus_elements[$0].innerHTML||''; var l = lengthBytesUTF8(h)+1; var p = _malloc(l); stringToUTF8(h,p,l); return p; } return 0; }, element_id_); if(r){ String s(r); std::free(r); return s; } return String(""); }
inline void Element::set_attribute(const String& name, const String& value) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].setAttribute(UTF8ToString($1), UTF8ToString($2)); }, element_id_, name.c_str(), value.c_str()); }
inline String Element::get_attribute(const String& name) const { char* r = (char*)EM_ASM_INT({ if(window.__webplus_elements[$0]) { var v = window.__webplus_elements[$0].getAttribute(UTF8ToString($1))||''; var l = lengthBytesUTF8(v)+1; var p = _malloc(l); stringToUTF8(v,p,l); return p; } return 0; }, element_id_, name.c_str()); if(r){ String s(r); std::free(r); return s; } return String(""); }
inline void Element::remove_attribute(const String& name) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].removeAttribute(UTF8ToString($1)); }, element_id_, name.c_str()); }
inline bool Element::has_attribute(const String& name) const { return EM_ASM_INT({ if(window.__webplus_elements[$0]) return window.__webplus_elements[$0].hasAttribute(UTF8ToString($1))?1:0; return 0; }, element_id_, name.c_str()) != 0; }
inline void Element::add_class(const String& className) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].classList.add(UTF8ToString($1)); }, element_id_, className.c_str()); }
inline void Element::remove_class(const String& className) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].classList.remove(UTF8ToString($1)); }, element_id_, className.c_str()); }
inline void Element::toggle_class(const String& className) { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].classList.toggle(UTF8ToString($1)); }, element_id_, className.c_str()); }
inline bool Element::has_class(const String& className) const { return EM_ASM_INT({ if(window.__webplus_elements[$0]) return window.__webplus_elements[$0].classList.contains(UTF8ToString($1))?1:0; return 0; }, element_id_, className.c_str()) != 0; }
inline void Element::append(const Element& child) { EM_ASM({ var p=window.__webplus_elements[$0],c=window.__webplus_elements[$1]; if(p&&c) p.appendChild(c); }, element_id_, child.get_id()); }
inline void Element::prepend(const Element& child) { EM_ASM({ var p=window.__webplus_elements[$0],c=window.__webplus_elements[$1]; if(p&&c) p.prepend(c); }, element_id_, child.get_id()); }
inline void Element::remove() { EM_ASM({ if(window.__webplus_elements[$0]&&window.__webplus_elements[$0].parentNode) window.__webplus_elements[$0].parentNode.removeChild(window.__webplus_elements[$0]); }, element_id_); }
inline void Element::focus() { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].focus(); }, element_id_); }
inline void Element::blur() { EM_ASM({ if(window.__webplus_elements[$0]) window.__webplus_elements[$0].blur(); }, element_id_); }
inline bool Element::is_focused() const { return EM_ASM_INT({ if(window.__webplus_elements[$0]) return document.activeElement===window.__webplus_elements[$0]?1:0; return 0; }, element_id_) != 0; }
inline int Element::clientWidth() const { return EM_ASM_INT({ if(window.__webplus_elements[$0]) return window.__webplus_elements[$0].clientWidth||0; return 0; }, element_id_); }
inline int Element::clientHeight() const { return EM_ASM_INT({ if(window.__webplus_elements[$0]) return window.__webplus_elements[$0].clientHeight||0; return 0; }, element_id_); }
inline int Element::offsetWidth() const { return EM_ASM_INT({ if(window.__webplus_elements[$0]) return window.__webplus_elements[$0].offsetWidth||0; return 0; }, element_id_); }
inline int Element::offsetHeight() const { return EM_ASM_INT({ if(window.__webplus_elements[$0]) return window.__webplus_elements[$0].offsetHeight||0; return 0; }, element_id_); }
inline int Element::offsetLeft() const { return EM_ASM_INT({ if(window.__webplus_elements[$0]) return window.__webplus_elements[$0].offsetLeft||0; return 0; }, element_id_); }
inline int Element::offsetTop() const { return EM_ASM_INT({ if(window.__webplus_elements[$0]) return window.__webplus_elements[$0].offsetTop||0; return 0; }, element_id_); }
inline int Element::scrollLeft() const { return EM_ASM_INT({ if(window.__webplus_elements[$0]) return window.__webplus_elements[$0].scrollLeft||0; return 0; }, element_id_); }
inline int Element::scrollTop() const { return EM_ASM_INT({ if(window.__webplus_elements[$0]) return window.__webplus_elements[$0].scrollTop||0; return 0; }, element_id_); }

template<typename F>
inline void Element::on(const String& event, F callback) {
    EM_ASM({
        var elem = window.__webplus_elements[$0];
        if (elem) elem.addEventListener(UTF8ToString($1), function(e) {
            window.__webplus_last_event = { key: e.key||'', type: e.type, x: e.clientX||0, y: e.clientY||0 };
        });
    }, element_id_, event.c_str());
}
template<typename F>
inline void Element::off(const String& event) {
    EM_ASM({
        var elem = window.__webplus_elements[$0];
        if (elem) elem.removeEventListener(UTF8ToString($1), null);
    }, element_id_, event.c_str());
}
template<typename F>
inline void Element::once(const String& event, F callback) {
    EM_ASM({
        var elem = window.__webplus_elements[$0];
        if (elem) elem.addEventListener(UTF8ToString($1), function(e) { elem.removeEventListener(UTF8ToString($1), this); }, {once:true});
    }, element_id_, event.c_str());
}

inline Element get(const String& selector) {
    int id = EM_ASM_INT({
        if (!window.__webplus_elements) { window.__webplus_elements = []; window.__webplus_next_id = 0; }
        var elem = document.querySelector(UTF8ToString($0));
        if (!elem) return -1;
        var id = window.__webplus_next_id++;
        window.__webplus_elements[id] = elem;
        return id;
    }, selector.c_str());
    return Element(id);
}
inline Element createElement(const String& tagName) {
    int id = EM_ASM_INT({
        if (!window.__webplus_elements) { window.__webplus_elements = []; window.__webplus_next_id = 0; }
        var elem = document.createElement(UTF8ToString($0));
        var id = window.__webplus_next_id++;
        window.__webplus_elements[id] = elem;
        return id;
    }, tagName.c_str());
    return Element(id);
}
inline Element getElementById(const String& id_str) { return get(String("#") + id_str); }
inline Element Element::createElement(const String& tagName) { return dom::createElement(tagName); }

#else

// Non-emscripten stubs
inline void StyleProxy::display(const String&) {}
inline String StyleProxy::display() const { return String(""); }
inline void StyleProxy::visibility(const String&) {}
inline String StyleProxy::visibility() const { return String(""); }
inline void StyleProxy::width(const String&) {}
inline void StyleProxy::height(const String&) {}
inline void StyleProxy::minWidth(const String&) {}
inline void StyleProxy::minHeight(const String&) {}
inline void StyleProxy::maxWidth(const String&) {}
inline void StyleProxy::maxHeight(const String&) {}
inline void StyleProxy::position(const String&) {}
inline void StyleProxy::top(const String&) {}
inline void StyleProxy::bottom(const String&) {}
inline void StyleProxy::left(const String&) {}
inline void StyleProxy::right(const String&) {}
inline void StyleProxy::zIndex(int) {}
inline void StyleProxy::margin(const String&) {}
inline void StyleProxy::marginTop(const String&) {}
inline void StyleProxy::marginBottom(const String&) {}
inline void StyleProxy::marginLeft(const String&) {}
inline void StyleProxy::marginRight(const String&) {}
inline void StyleProxy::padding(const String&) {}
inline void StyleProxy::paddingTop(const String&) {}
inline void StyleProxy::paddingBottom(const String&) {}
inline void StyleProxy::paddingLeft(const String&) {}
inline void StyleProxy::paddingRight(const String&) {}
inline void StyleProxy::border(const String&) {}
inline void StyleProxy::borderWidth(const String&) {}
inline void StyleProxy::borderColor(const String&) {}
inline void StyleProxy::borderRadius(const String&) {}
inline void StyleProxy::color(const String&) {}
inline void StyleProxy::background(const String&) {}
inline void StyleProxy::backgroundColor(const String&) {}
inline void StyleProxy::opacity(const String&) {}
inline void StyleProxy::fontSize(const String&) {}
inline void StyleProxy::fontWeight(const String&) {}
inline void StyleProxy::fontFamily(const String&) {}
inline void StyleProxy::textAlign(const String&) {}
inline void StyleProxy::textDecoration(const String&) {}
inline void StyleProxy::lineHeight(const String&) {}
inline void StyleProxy::transform(const String&) {}
inline void StyleProxy::transition(const String&) {}
inline void StyleProxy::boxShadow(const String&) {}
inline void StyleProxy::cursor(const String&) {}
inline void StyleProxy::flex(const String&) {}
inline void StyleProxy::flexDirection(const String&) {}
inline void StyleProxy::justifyContent(const String&) {}
inline void StyleProxy::alignItems(const String&) {}
inline void StyleProxy::flexWrap(const String&) {}
inline void StyleProxy::gap(const String&) {}
inline void StyleProxy::gridTemplateColumns(const String&) {}
inline void StyleProxy::gridTemplateRows(const String&) {}
inline void StyleProxy::gridColumn(const String&) {}
inline void StyleProxy::gridRow(const String&) {}
inline void StyleProxy::overflow(const String&) {}
inline void StyleProxy::overflowX(const String&) {}
inline void StyleProxy::overflowY(const String&) {}

inline void Element::text(const String&) {}
inline String Element::text() const { return String(""); }
inline void Element::html(const String&) {}
inline String Element::html() const { return String(""); }
inline void Element::set_attribute(const String&, const String&) {}
inline String Element::get_attribute(const String&) const { return String(""); }
inline void Element::remove_attribute(const String&) {}
inline bool Element::has_attribute(const String&) const { return false; }
inline void Element::add_class(const String&) {}
inline void Element::remove_class(const String&) {}
inline void Element::toggle_class(const String&) {}
inline bool Element::has_class(const String&) const { return false; }
inline void Element::append(const Element&) {}
inline void Element::prepend(const Element&) {}
inline void Element::remove() {}
inline void Element::focus() {}
inline void Element::blur() {}
inline bool Element::is_focused() const { return false; }
inline int Element::clientWidth() const { return 0; }
inline int Element::clientHeight() const { return 0; }
inline int Element::offsetWidth() const { return 0; }
inline int Element::offsetHeight() const { return 0; }
inline int Element::offsetLeft() const { return 0; }
inline int Element::offsetTop() const { return 0; }
inline int Element::scrollLeft() const { return 0; }
inline int Element::scrollTop() const { return 0; }
template<typename F> inline void Element::on(const String&, F) {}
template<typename F> inline void Element::off(const String&) {}
template<typename F> inline void Element::once(const String&, F) {}

inline Element get(const String&) { return Element(); }
inline Element createElement(const String&) { return Element(); }
inline Element getElementById(const String&) { return Element(); }

#endif

}
}

#endif