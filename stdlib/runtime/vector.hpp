#ifndef WEBPLUS_VECTOR_HPP
#define WEBPLUS_VECTOR_HPP

#include <cstdlib>
#include <cstring>
#include <new>

namespace webplus {

template<typename T>
class Vector {
private:
    T* data_;
    size_t size_;
    size_t capacity_;

    void grow() {
        size_t new_capacity = capacity_ == 0 ? 8 : capacity_ * 2;
        T* new_data = static_cast<T*>(std::malloc(new_capacity * sizeof(T)));
        
        if (data_) {
            for (size_t i = 0; i < size_; ++i) {
                new (&new_data[i]) T(data_[i]);
                data_[i].~T();
            }
            std::free(data_);
        }
        
        data_ = new_data;
        capacity_ = new_capacity;
    }

public:
    Vector() : data_(nullptr), size_(0), capacity_(0) {}

    ~Vector() {
        if (data_) {
            for (size_t i = 0; i < size_; ++i) {
                data_[i].~T();
            }
            std::free(data_);
        }
    }

    Vector(const Vector& other) : size_(other.size_), capacity_(other.capacity_) {
        data_ = static_cast<T*>(std::malloc(capacity_ * sizeof(T)));
        for (size_t i = 0; i < size_; ++i) {
            new (&data_[i]) T(other.data_[i]);
        }
    }

    Vector& operator=(const Vector& other) {
        if (this != &other) {
            for (size_t i = 0; i < size_; ++i) {
                data_[i].~T();
            }
            std::free(data_);
            
            size_ = other.size_;
            capacity_ = other.capacity_;
            data_ = static_cast<T*>(std::malloc(capacity_ * sizeof(T)));
            for (size_t i = 0; i < size_; ++i) {
                new (&data_[i]) T(other.data_[i]);
            }
        }
        return *this;
    }

    void push(const T& value) {
        if (size_ >= capacity_) {
            grow();
        }
        new (&data_[size_]) T(value);
        ++size_;
    }

    T pop() {
        if (size_ == 0) {
            return T();
        }
        --size_;
        T value = data_[size_];
        data_[size_].~T();
        return value;
    }

    T& at(size_t index) {
        return data_[index];
    }

    const T& at(size_t index) const {
        return data_[index];
    }

    T& operator[](size_t index) {
        return data_[index];
    }

    const T& operator[](size_t index) const {
        return data_[index];
    }

    size_t size() const {
        return size_;
    }

    size_t capacity() const {
        return capacity_;
    }

    bool empty() const {
        return size_ == 0;
    }

    void clear() {
        for (size_t i = 0; i < size_; ++i) {
            data_[i].~T();
        }
        size_ = 0;
    }

    void reserve(size_t new_capacity) {
        if (new_capacity <= capacity_) return;
        
        T* new_data = static_cast<T*>(std::malloc(new_capacity * sizeof(T)));
        
        if (data_) {
            for (size_t i = 0; i < size_; ++i) {
                new (&new_data[i]) T(data_[i]);
                data_[i].~T();
            }
            std::free(data_);
        }
        
        data_ = new_data;
        capacity_ = new_capacity;
    }

    T* data() {
        return data_;
    }

    const T* data() const {
        return data_;
    }

    T* begin() { return data_; }
    T* end() { return data_ + size_; }
    const T* begin() const { return data_; }
    const T* end() const { return data_ + size_; }
};

}

#endif
