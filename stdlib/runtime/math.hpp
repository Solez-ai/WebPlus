#ifndef WEBPLUS_MATH_HPP
#define WEBPLUS_MATH_HPP

#include <cmath>
#include <cstdlib>
#include <ctime>

namespace webplus {

// Constants
#ifndef RAND_MAX
#define RAND_MAX 2147483647
#endif

// Random number generation
inline void srand(unsigned int seed) {
    std::srand(seed);
}

inline int rand() {
    return std::rand();
}

// Basic math functions
inline float sqrt(float x) {
    return std::sqrt(x);
}

inline double sqrt(double x) {
    return std::sqrt(x);
}

inline float sin(float x) {
    return std::sin(x);
}

inline double sin(double x) {
    return std::sin(x);
}

inline float cos(float x) {
    return std::cos(x);
}

inline double cos(double x) {
    return std::cos(x);
}

inline float tan(float x) {
    return std::tan(x);
}

inline double tan(double x) {
    return std::tan(x);
}

inline float abs(float x) {
    return std::fabs(x);
}

inline double abs(double x) {
    return std::fabs(x);
}

inline int abs(int x) {
    return std::abs(x);
}

inline float pow(float base, float exp) {
    return std::pow(base, exp);
}

inline double pow(double base, double exp) {
    return std::pow(base, exp);
}

inline float floor(float x) {
    return std::floor(x);
}

inline double floor(double x) {
    return std::floor(x);
}

inline float ceil(float x) {
    return std::ceil(x);
}

inline double ceil(double x) {
    return std::ceil(x);
}

inline float round(float x) {
    return std::round(x);
}

inline double round(double x) {
    return std::round(x);
}

inline float min(float a, float b) {
    return a < b ? a : b;
}

inline double min(double a, double b) {
    return a < b ? a : b;
}

inline int min(int a, int b) {
    return a < b ? a : b;
}

inline float max(float a, float b) {
    return a > b ? a : b;
}

inline double max(double a, double b) {
    return a > b ? a : b;
}

inline int max(int a, int b) {
    return a > b ? a : b;
}

// Utility function for random float in range
inline float randomFloat(float min, float max) {
    return min + (max - min) * (static_cast<float>(std::rand()) / static_cast<float>(RAND_MAX));
}

inline double randomDouble(double min, double max) {
    return min + (max - min) * (static_cast<double>(std::rand()) / static_cast<double>(RAND_MAX));
}

} // namespace webplus

#endif
