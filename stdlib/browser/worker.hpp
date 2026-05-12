#ifndef WEBPLUS_WORKER_HPP
#define WEBPLUS_WORKER_HPP

#include "../runtime/memory.hpp"
#include <functional>
#include <thread>
#include <future>
#include <atomic>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <vector>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/threading.h>
#endif

namespace webplus {

// ====== Thread Pool ======

class ThreadPool {
private:
    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex queue_mutex_;
    std::condition_variable condition_;
    bool stop_;
    int num_threads_;

public:
    explicit ThreadPool(int num_threads = 4)
        : stop_(false), num_threads_(num_threads) {
        for (int i = 0; i < num_threads_; i++) {
            workers_.emplace_back([this] {
                while (true) {
                    std::function<void()> task;
                    {
                        std::unique_lock<std::mutex> lock(queue_mutex_);
                        condition_.wait(lock, [this] {
                            return stop_ || !tasks_.empty();
                        });
                        if (stop_ && tasks_.empty()) return;
                        task = std::move(tasks_.front());
                        tasks_.pop();
                    }
                    task();
                }
            });
        }
    }

    template<typename Func>
    auto enqueue(Func&& func) -> std::future<typename std::result_of<Func()>::type> {
        using ReturnType = typename std::result_of<Func()>::type;
        auto task_ptr = std::make_shared<std::packaged_task<ReturnType()>>(std::forward<Func>(func));
        std::future<ReturnType> result = task_ptr->get_future();

        {
            std::unique_lock<std::mutex> lock(queue_mutex_);
            if (stop_) {
                throw std::runtime_error("ThreadPool is stopped");
            }
            tasks_.push([task_ptr]() { (*task_ptr)(); });
        }
        condition_.notify_one();
        return result;
    }

    void wait_all() {
        // Wait for all tasks to complete
        while (true) {
            {
                std::unique_lock<std::mutex> lock(queue_mutex_);
                if (tasks_.empty()) break;
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }
    }

    ~ThreadPool() {
        {
            std::unique_lock<std::mutex> lock(queue_mutex_);
            stop_ = true;
        }
        condition_.notify_all();
        for (auto& worker : workers_) {
            worker.join();
        }
    }
};

// Global thread pool
inline ThreadPool& global_thread_pool() {
    static ThreadPool pool(4);
    return pool;
}

// ====== Mutex & Locking ======

class Mutex {
private:
    std::mutex mutex_;

public:
    void lock() { mutex_.lock(); }
    void unlock() { mutex_.unlock(); }
    bool try_lock() { return mutex_.try_lock(); }
};

class LockGuard {
private:
    std::mutex& mutex_;
public:
    explicit LockGuard(std::mutex& m) : mutex_(m) { mutex_.lock(); }
    ~LockGuard() { mutex_.unlock(); }
};

class RecursiveMutex {
private:
    std::recursive_mutex mutex_;
    std::thread::id owner_;
    int count_;

public:
    void lock() {
        if (owner_ != std::this_thread::get_id()) {
            mutex_.lock();
            owner_ = std::this_thread::get_id();
        }
        count_++;
    }

    void unlock() {
        if (--count_ == 0) {
            owner_ = std::thread::id();
            mutex_.unlock();
        }
    }

    bool try_lock() {
        if (owner_ == std::this_thread::get_id()) {
            count_++;
            return true;
        }
        if (mutex_.try_lock()) {
            owner_ = std::this_thread::get_id();
            count_ = 1;
            return true;
        }
        return false;
    }
};

// ====== Thread-Local Storage ======

template<typename T>
class ThreadLocal {
private:
    thread_local static T value_;
public:
    T& get() { return value_; }
    const T& get() const { return value_; }
    void set(const T& val) { value_ = val; }
};

// ====== Atomic Operations ======

template<typename T>
class Atomic {
private:
    std::atomic<T> value_;

public:
    explicit Atomic(T val = T{}) : value_(val) {}

    T load() const { return value_.load(); }
    void store(T val) { value_.store(val); }

    T fetch_add(T val) { return value_.fetch_add(val); }
    T fetch_sub(T val) { return value_.fetch_sub(val); }
    T fetch_and(T val) { return value_.fetch_and(val); }
    T fetch_or(T val) { return value_.fetch_or(val); }

    T operator++() { return ++value_; }
    T operator--() { return --value_; }
    T operator++(int) { return value_++; }
    T operator--(int) { return value_--; }

    T operator+=(T val) { return value_ += val; }
    T operator-=(T val) { return value_ -= val; }
};

// ====== Thread ID ======

inline int thread_id() {
    // Simple hash of thread ID
    return static_cast<int>(std::hash<std::thread::id>{}(std::this_thread::get_id()));
}

inline int num_threads() {
    return static_cast<int>(std::thread::hardware_concurrency());
}

// ====== Sleep ======

inline void sleep(int milliseconds) {
    #ifdef __EMSCRIPTEN__
    emscripten_sleep(milliseconds);
    #else
    std::this_thread::sleep_for(std::chrono::milliseconds(milliseconds));
    #endif
}

inline void sleep_seconds(int seconds) {
    sleep(seconds * 1000);
}

// ====== Worker class for background execution ======

class worker {
private:
    std::thread thread_;
    bool detached_;
    int result_;
    bool has_result_;

public:
    worker() : detached_(false), result_(0), has_result_(false) {}

    template<typename Func>
    worker(Func&& func) : detached_(false), result_(0), has_result_(false) {
        #ifdef __EMSCRIPTEN__
        thread_ = std::thread([this, func]() {
            result_ = func();
            has_result_ = true;
        });
        #else
        thread_ = std::thread([this, func]() {
            result_ = func();
            has_result_ = true;
        });
        #endif
    }

    int join() {
        if (thread_.joinable() && !detached_) {
            thread_.join();
        }
        return result_;
    }

    void detach() {
        if (thread_.joinable() && !detached_) {
            thread_.detach();
            detached_ = true;
        }
    }

    bool is_done() const {
        return has_result_;
    }

    ~worker() {
        if (thread_.joinable() && !detached_) {
            thread_.detach();
        }
    }
};

// Worker namespace for spawn function
namespace worker_ns {
    template<typename Func>
    inline worker spawn(Func&& func) {
        return worker(std::forward<Func>(func));
    }
}

using worker_ns::spawn;

} // namespace webplus

// Global namespace alias
namespace worker {
    template<typename Func>
    inline webplus::worker spawn(Func&& func) {
        return webplus::worker(std::forward<Func>(func));
    }
}

#endif
