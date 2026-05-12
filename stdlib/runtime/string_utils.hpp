#ifndef WEBPLUS_STRING_UTILS_HPP
#define WEBPLUS_STRING_UTILS_HPP

#include "memory.hpp"
#include <cstdio>
#include <cstring>
#include <sstream>

namespace webplus {

// Convert int to string
inline String toString(int value) {
    char buffer[32];
    std::snprintf(buffer, sizeof(buffer), "%d", value);
    return String(buffer);
}

// Convert float to string
inline String toString(float value) {
    char buffer[64];
    std::snprintf(buffer, sizeof(buffer), "%.2f", value);
    return String(buffer);
}

// Convert double to string
inline String toString(double value) {
    char buffer[64];
    std::snprintf(buffer, sizeof(buffer), "%.2f", value);
    return String(buffer);
}

// Convert bool to string
inline String toString(bool value) {
    return String(value ? "true" : "false");
}

// String concatenation operator
inline String operator+(const String& left, const String& right) {
    String result(left.c_str());
    result.append(right.c_str());
    return result;
}

inline String operator+(const String& left, const char* right) {
    String result(left.c_str());
    result.append(right);
    return result;
}

inline String operator+(const char* left, const String& right) {
    String result(left);
    result.append(right.c_str());
    return result;
}

// String concatenation with numbers
inline String operator+(const String& left, int right) {
    String result(left.c_str());
    result.append(toString(right).c_str());
    return result;
}

inline String operator+(int left, const String& right) {
    String result = toString(left);
    result.append(right.c_str());
    return result;
}

inline String operator+(const String& left, float right) {
    String result(left.c_str());
    result.append(toString(right).c_str());
    return result;
}

inline String operator+(float left, const String& right) {
    String result = toString(left);
    result.append(right.c_str());
    return result;
}

inline String operator+(const String& left, double right) {
    String result(left.c_str());
    result.append(toString(right).c_str());
    return result;
}

inline String operator+(double left, const String& right) {
    String result = toString(left);
    result.append(right.c_str());
    return result;
}

// Formatted string (sprintf wrapper)
template<typename... Args>
inline String format(const char* fmt, Args... args) {
    char buffer[1024];
    std::snprintf(buffer, sizeof(buffer), fmt, args...);
    return String(buffer);
}

// String comparison
inline bool operator==(const String& left, const String& right) {
    return std::strcmp(left.c_str(), right.c_str()) == 0;
}

inline bool operator==(const String& left, const char* right) {
    return std::strcmp(left.c_str(), right) == 0;
}

inline bool operator==(const char* left, const String& right) {
    return std::strcmp(left, right.c_str()) == 0;
}

inline bool operator!=(const String& left, const String& right) {
    return std::strcmp(left.c_str(), right.c_str()) != 0;
}

inline bool operator!=(const String& left, const char* right) {
    return std::strcmp(left.c_str(), right) != 0;
}

inline bool operator!=(const char* left, const String& right) {
    return std::strcmp(left, right.c_str()) != 0;
}

} // namespace webplus

#endif
