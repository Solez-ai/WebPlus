#ifndef WEBPLUS_MEMORY_HPP
#define WEBPLUS_MEMORY_HPP

#include <cstdint>
#include <cstdlib>
#include <cstring>

namespace webplus {

using int32 = std::int32_t;
using float32 = float;
using float64 = double;
using bool_t = bool;
using char_t = char;

class String {
private:
    char* data_;
    size_t length_;
    size_t capacity_;

public:
    String() : data_(nullptr), length_(0), capacity_(0) {}

    String(const char* str) {
        length_ = std::strlen(str);
        capacity_ = length_ + 1;
        data_ = static_cast<char*>(std::malloc(capacity_));
        std::memcpy(data_, str, length_);
        data_[length_] = '\0';
    }

    String(const String& other) {
        length_ = other.length_;
        capacity_ = other.capacity_;
        data_ = static_cast<char*>(std::malloc(capacity_));
        std::memcpy(data_, other.data_, length_ + 1);
    }

    ~String() {
        if (data_) {
            std::free(data_);
        }
    }

    String& operator=(const String& other) {
        if (this != &other) {
            if (data_) std::free(data_);
            length_ = other.length_;
            capacity_ = other.capacity_;
            data_ = static_cast<char*>(std::malloc(capacity_));
            std::memcpy(data_, other.data_, length_ + 1);
        }
        return *this;
    }

    const char* c_str() const { return data_ ? data_ : ""; }
    size_t length() const { return length_; }
    bool empty() const { return length_ == 0; }

    void append(const char* str) {
        size_t new_len = length_ + std::strlen(str);
        if (new_len + 1 > capacity_) {
            capacity_ = (new_len + 1) * 2;
            char* new_data = static_cast<char*>(std::malloc(capacity_));
            if (data_) {
                std::memcpy(new_data, data_, length_);
                std::free(data_);
            }
            data_ = new_data;
        }
        std::memcpy(data_ + length_, str, std::strlen(str) + 1);
        length_ = new_len;
    }

    void clear() {
        if (data_) {
            std::free(data_);
            data_ = nullptr;
        }
        length_ = 0;
        capacity_ = 0;
    }
};

template<typename T>
T* alloc(size_t count) {
    return static_cast<T*>(std::malloc(count * sizeof(T)));
}

template<typename T>
void free_ptr(T* ptr) {
    if (ptr) {
        std::free(ptr);
    }
}

template<typename T>
class StackArray {
private:
    T* data_;
    size_t size_;

public:
    explicit StackArray(size_t size) : size_(size) {
        data_ = new T[size_];
    }

    ~StackArray() {
        delete[] data_;
    }

    T& operator[](size_t index) { return data_[index]; }
    const T& operator[](size_t index) const { return data_[index]; }
    size_t size() const { return size_; }
    T* data() { return data_; }
};

template<typename T>
class Arena {
private:
    T* buffer_;
    size_t capacity_;
    size_t offset_;

public:
    explicit Arena(size_t capacity)
        : capacity_(capacity), offset_(0) {
        buffer_ = static_cast<T*>(std::malloc(capacity_ * sizeof(T)));
    }

    ~Arena() {
        if (buffer_) {
            std::free(buffer_);
        }
    }

    T* allocate(size_t count) {
        if (offset_ + count > capacity_) {
            return nullptr;
        }
        T* ptr = buffer_ + offset_;
        offset_ += count;
        return ptr;
    }

    void reset() {
        offset_ = 0;
    }

    size_t available() const {
        return capacity_ - offset_;
    }
};

// ===== ARC (Automatic Reference Counting) Smart Pointers =====

template<typename T>
class Arc {
private:
    T* ptr_;
    int* ref_count_;

    void release() {
        if (ref_count_) {
            (*ref_count_)--;
            if (*ref_count_ == 0) {
                delete ptr_;
                delete ref_count_;
                ptr_ = nullptr;
                ref_count_ = nullptr;
            }
        }
    }

public:
    Arc() : ptr_(nullptr), ref_count_(nullptr) {}

    explicit Arc(T* p) : ptr_(p), ref_count_(new int(1)) {}

    Arc(const Arc& other) : ptr_(other.ptr_), ref_count_(other.ref_count_) {
        if (ref_count_) (*ref_count_)++;
    }

    Arc(Arc&& other) noexcept : ptr_(other.ptr_), ref_count_(other.ref_count_) {
        other.ptr_ = nullptr;
        other.ref_count_ = nullptr;
    }

    ~Arc() { release(); }

    Arc& operator=(const Arc& other) {
        if (this != &other) {
            release();
            ptr_ = other.ptr_;
            ref_count_ = other.ref_count_;
            if (ref_count_) (*ref_count_)++;
        }
        return *this;
    }

    Arc& operator=(Arc&& other) noexcept {
        if (this != &other) {
            release();
            ptr_ = other.ptr_;
            ref_count_ = other.ref_count_;
            other.ptr_ = nullptr;
            other.ref_count_ = nullptr;
        }
        return *this;
    }

    T* get() const { return ptr_; }
    T& operator*() const { return *ptr_; }
    T* operator->() const { return ptr_; }

    int use_count() const { return ref_count_ ? *ref_count_ : 0; }
    bool is_null() const { return ptr_ == nullptr; }

    static Arc<T> make(T&& val) {
        return Arc<T>(new T(std::forward<T>(val)));
    }
};

template<typename T>
class Weak {
private:
    T* ptr_;
    int* ref_count_;

public:
    Weak() : ptr_(nullptr), ref_count_(nullptr) {}

    explicit Weak(const Arc<T>& arc) : ptr_(arc.ptr_), ref_count_(arc.ref_count_) {}

    Weak(const Weak& other) : ptr_(other.ptr_), ref_count_(other.ref_count_) {}

    Weak& operator=(const Weak& other) {
        ptr_ = other.ptr_;
        ref_count_ = other.ref_count_;
        return *this;
    }

    Arc<T> lock() const {
        if (ref_count_ && *ref_count_ > 0) {
            return Arc<T>(ptr_);
        }
        return Arc<T>(nullptr);
    }

    bool expired() const { return ref_count_ == nullptr || *ref_count_ == 0; }
};

// ===== Option type for null safety =====

template<typename T>
class Option {
private:
    T* value_;
    bool has_value_;

public:
    Option() : value_(nullptr), has_value_(false) {}

    explicit Option(T val) : value_(new T(val)), has_value_(true) {}

    ~Option() { delete value_; }

    Option(const Option& other) : value_(other.has_value_ ? new T(*other.value_) : nullptr),
                                  has_value_(other.has_value_) {}

    Option& operator=(const Option& other) {
        delete value_;
        value_ = other.has_value_ ? new T(*other.value_) : nullptr;
        has_value_ = other.has_value_;
        return *this;
    }

    bool has_value() const { return has_value_; }

    T& value() { return *value_; }
    const T& value() const { return *value_; }

    T value_or(const T& default_val) const {
        return has_value_ ? *value_ : default_val;
    }
};

// ===== Result type for error handling =====

template<typename T, typename E>
class Result {
private:
    T* ok_value_;
    E* err_value_;
    bool is_ok_;

public:
    Result() : ok_value_(nullptr), err_value_(nullptr), is_ok_(false) {}

    static Result<T, E> ok(T val) {
        Result r;
        r.ok_value_ = new T(val);
        r.is_ok_ = true;
        return r;
    }

    static Result<T, E> err(E val) {
        Result r;
        r.err_value_ = new E(val);
        r.is_ok_ = false;
        return r;
    }

    ~Result() { delete ok_value_; delete err_value_; }

    bool is_ok() const { return is_ok_; }
    bool is_err() const { return !is_ok_; }

    T& unwrap() { return *ok_value_; }
    E& unwrap_err() { return *err_value_; }

    T value_or(const T& default_val) const {
        return is_ok_ ? *ok_value_ : default_val;
    }
};

}

#endif
