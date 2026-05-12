#ifndef WEBPLUS_ALGORITHM_HPP
#define WEBPLUS_ALGORITHM_HPP

#include <cstdint>
#include <cmath>
#include <cstdlib>

namespace webplus {

// ====== Sort Functions ======

template<typename T>
void sort(T* arr, int size) {
    // Simple quicksort
    if (size <= 1) return;
    T pivot = arr[size / 2];
    int left = 0, right = size - 1;
    while (left <= right) {
        while (arr[left] < pivot) left++;
        while (arr[right] > pivot) right--;
        if (left <= right) {
            T temp = arr[left];
            arr[left] = arr[right];
            arr[right] = temp;
            left++;
            right--;
        }
    }
    if (right > 0) sort(arr, right + 1);
    if (left < size - 1) sort(arr + left, size - left);
}

template<typename T>
void sort_range(T* arr, int start, int end) {
    int size = end - start;
    if (size <= 1) return;
    T pivot = arr[start + size / 2];
    int left = start, right = end - 1;
    while (left <= right) {
        while (arr[left] < pivot) left++;
        while (arr[right] > pivot) right--;
        if (left <= right) {
            T temp = arr[left];
            arr[left] = arr[right];
            arr[right] = temp;
            left++;
            right--;
        }
    }
    if (right > start) sort_range(arr, start, right + 1);
    if (left < end - 1) sort_range(arr, left, end);
}

// ====== Search Functions ======

template<typename T>
int find(T* arr, int size, const T& value) {
    for (int i = 0; i < size; i++) {
        if (arr[i] == value) return i;
    }
    return -1;
}

template<typename T>
int find_if(T* arr, int size, bool (*pred)(const T&)) {
    for (int i = 0; i < size; i++) {
        if (pred(arr[i])) return i;
    }
    return -1;
}

template<typename T>
bool contains(T* arr, int size, const T& value) {
    return find(arr, size, value) != -1;
}

// ====== Transform Functions ======

template<typename T, typename F>
void transform(T* arr, int size, F func) {
    for (int i = 0; i < size; i++) {
        arr[i] = func(arr[i]);
    }
}

template<typename T, typename F>
void transform_inplace(T* dest, T* src, int size, F func) {
    for (int i = 0; i < size; i++) {
        dest[i] = func(src[i]);
    }
}

// ====== Accumulate ======

template<typename T, typename F>
T accumulate(T* arr, int size, T init, F func) {
    for (int i = 0; i < size; i++) {
        init = func(init, arr[i]);
    }
    return init;
}

template<typename T>
T sum(T* arr, int size) {
    T total = 0;
    for (int i = 0; i < size; i++) {
        total += arr[i];
    }
    return total;
}

template<typename T>
T product(T* arr, int size) {
    T total = 1;
    for (int i = 0; i < size; i++) {
        total *= arr[i];
    }
    return total;
}

// ====== Min/Max ======

template<typename T>
T min_value(T* arr, int size) {
    if (size <= 0) return T{};
    T min = arr[0];
    for (int i = 1; i < size; i++) {
        if (arr[i] < min) min = arr[i];
    }
    return min;
}

template<typename T>
T max_value(T* arr, int size) {
    if (size <= 0) return T{};
    T max = arr[0];
    for (int i = 1; i < size; i++) {
        if (arr[i] > max) max = arr[i];
    }
    return max;
}

template<typename T>
int min_index(T* arr, int size) {
    if (size <= 0) return -1;
    int idx = 0;
    for (int i = 1; i < size; i++) {
        if (arr[i] < arr[idx]) idx = i;
    }
    return idx;
}

template<typename T>
int max_index(T* arr, int size) {
    if (size <= 0) return -1;
    int idx = 0;
    for (int i = 1; i < size; i++) {
        if (arr[i] > arr[idx]) idx = i;
    }
    return idx;
}

// ====== Fill/Copy ======

template<typename T>
void fill(T* arr, int size, const T& value) {
    for (int i = 0; i < size; i++) {
        arr[i] = value;
    }
}

template<typename T>
void copy(T* dest, T* src, int size) {
    for (int i = 0; i < size; i++) {
        dest[i] = src[i];
    }
}

template<typename T>
void reverse(T* arr, int size) {
    for (int i = 0; i < size / 2; i++) {
        T temp = arr[i];
        arr[i] = arr[size - 1 - i];
        arr[size - 1 - i] = temp;
    }
}

// ====== Unique ======

template<typename T>
int unique(T* arr, int size) {
    if (size <= 0) return 0;
    int write = 1;
    for (int read = 1; read < size; read++) {
        if (arr[read] != arr[write - 1]) {
            arr[write++] = arr[read];
        }
    }
    return write;
}

// ====== Helper Functions ======

template<typename T>
void swap(T& a, T& b) {
    T temp = a;
    a = b;
    b = temp;
}

template<typename T>
int distance(T* a, T* b) {
    return static_cast<int>(b - a);
}

template<typename T>
bool equal(T* a, T* b, int size) {
    for (int i = 0; i < size; i++) {
        if (a[i] != b[i]) return false;
    }
    return true;
}

// ====== Numeric Algorithms ======

inline int abs_int(int x) { return x < 0 ? -x : x; }
inline float abs_float(float x) { return x < 0 ? -x : x; }
inline double abs_double(double x) { return x < 0 ? -x : x; }

inline int min_int(int a, int b) { return a < b ? a : b; }
inline int max_int(int a, int b) { return a > b ? a : b; }

template<typename T>
T clamp(T val, T min_val, T max_val) {
    if (val < min_val) return min_val;
    if (val > max_val) return max_val;
    return val;
}

inline float lerp(float a, float b, float t) {
    return a + (b - a) * t;
}

}

#endif