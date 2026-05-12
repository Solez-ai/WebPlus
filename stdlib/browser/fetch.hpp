#ifndef WEBPLUS_FETCH_HPP
#define WEBPLUS_FETCH_HPP

#include "../runtime/memory.hpp"
#include <functional>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/val.h>
#endif

namespace webplus {

class Response {
private:
    String data_;
    int status_;
    bool ok_;

public:
    Response() : status_(0), ok_(false) {}
    Response(const String& data, int status) 
        : data_(data), status_(status), ok_(status >= 200 && status < 300) {}

    const String& body() const { return data_; }
    int status() const { return status_; }
    bool ok() const { return ok_; }
    
    String json_string() const {
        return data_;
    }
};

class Promise {
private:
    int promise_id_;
    
public:
    explicit Promise(int id) : promise_id_(id) {}
    
    #ifdef __EMSCRIPTEN__
    template<typename F>
    void then(F callback) {
        auto* cb_ptr = new F(callback);
        
        EM_ASM({
            const promise = window.__webplus_promises[$0];
            if (!promise) return;
            
            promise.then(response => {
                return response.text().then(text => ({
                    status: response.status,
                    body: text
                }));
            }).then(data => {
                const bodyLen = lengthBytesUTF8(data.body) + 1;
                const bodyPtr = _malloc(bodyLen);
                stringToUTF8(data.body, bodyPtr, bodyLen);
                
                const callbackPtr = $1;
                dynCall('viii', callbackPtr, [bodyPtr, data.status, bodyLen]);
                
                _free(bodyPtr);
            }).catch(err => {
                console.error('Fetch error:', err);
            });
        }, promise_id_, cb_ptr);
    }
    #else
    template<typename F>
    void then(F callback) {}
    #endif
};

#ifdef __EMSCRIPTEN__
inline Promise fetch(const String& url) {
    int id = EM_ASM_INT({
        if (!window.__webplus_promises) {
            window.__webplus_promises = [];
            window.__webplus_promise_id = 0;
        }
        
        const promise = fetch(UTF8ToString($0));
        const id = window.__webplus_promise_id++;
        window.__webplus_promises[id] = promise;
        return id;
    }, url.c_str());
    
    return Promise(id);
}

inline Promise fetch(const String& url, const String& method, const String& body) {
    int id = EM_ASM_INT({
        if (!window.__webplus_promises) {
            window.__webplus_promises = [];
            window.__webplus_promise_id = 0;
        }
        
        const options = {
            method: UTF8ToString($1),
            headers: {
                'Content-Type': 'application/json'
            },
            body: UTF8ToString($2)
        };
        
        const promise = fetch(UTF8ToString($0), options);
        const id = window.__webplus_promise_id++;
        window.__webplus_promises[id] = promise;
        return id;
    }, url.c_str(), method.c_str(), body.c_str());
    
    return Promise(id);
}
#else
inline Promise fetch(const String& url) {
    return Promise(-1);
}

inline Promise fetch(const String& url, const String& method, const String& body) {
    return Promise(-1);
}
#endif

}

#endif
