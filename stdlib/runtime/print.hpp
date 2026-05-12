#ifndef WEBPLUS_PRINT_HPP
#define WEBPLUS_PRINT_HPP

#include <iostream>
#include <sstream>
#include "memory.hpp"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

namespace webplus {

template<typename T>
void print_value(std::ostream& os, const T& value) {
    os << value;
}

template<>
void print_value<String>(std::ostream& os, const String& value) {
    os << value.c_str();
}

template<>
void print_value<bool_t>(std::ostream& os, const bool_t& value) {
    os << (value ? "true" : "false");
}

inline void print() {
    std::cout << std::endl;
}

template<typename T>
void print(const T& arg) {
    print_value(std::cout, arg);
    std::cout << std::endl;
}

template<typename T, typename... Args>
void print(const T& first, const Args&... args) {
    print_value(std::cout, first);
    std::cout << " ";
    print(args...);
}

inline void warn() {
    std::cerr << std::endl;
}

template<typename T>
void warn(const T& arg) {
    std::cerr << "[WARN] ";
    print_value(std::cerr, arg);
    std::cerr << std::endl;
}

template<typename T, typename... Args>
void warn(const T& first, const Args&... args) {
    std::cerr << "[WARN] ";
    print_value(std::cerr, first);
    std::cerr << " ";
    warn(args...);
}

inline void error() {
    std::cerr << std::endl;
}

template<typename T>
void error(const T& arg) {
    std::cerr << "[ERROR] ";
    print_value(std::cerr, arg);
    std::cerr << std::endl;
}

template<typename T, typename... Args>
void error(const T& first, const Args&... args) {
    std::cerr << "[ERROR] ";
    print_value(std::cerr, first);
    std::cerr << " ";
    error(args...);
}

#ifdef __EMSCRIPTEN__
template<typename... Args>
void log(const Args&... args) {
    std::ostringstream oss;
    ([&] {
        print_value(oss, args);
        oss << " ";
    }(), ...);
    
    std::string msg = oss.str();
    EM_ASM({
        console.log(UTF8ToString($0));
    }, msg.c_str());
}
#else
template<typename... Args>
void log(const Args&... args) {
    print(args...);
}
#endif

}

#endif
