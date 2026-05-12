#ifndef WEBPLUS_DATETIME_HPP
#define WEBPLUS_DATETIME_HPP

#include <cstdint>
#include <ctime>
#include <cstring>

namespace webplus {

class DateTime {
private:
    int64_t timestamp_;  // Unix timestamp in milliseconds

public:
    DateTime() : timestamp_(0) {}

    static DateTime now() {
        DateTime dt;
        dt.timestamp_ = static_cast<int64_t>(std::time(nullptr)) * 1000;
        return dt;
    }

    static DateTime from_timestamp(int64_t ts) {
        DateTime dt;
        dt.timestamp_ = ts;
        return dt;
    }

    int64_t timestamp() const { return timestamp_; }

    // Get components
    int year() const {
        std::tm* tm = std::localtime(reinterpret_cast<time_t*>(&timestamp_));
        return tm ? tm->tm_year + 1900 : 0;
    }

    int month() const {
        std::tm* tm = std::localtime(reinterpret_cast<time_t*>(&timestamp_));
        return tm ? tm->tm_mon + 1 : 0;
    }

    int day() const {
        std::tm* tm = std::localtime(reinterpret_cast<time_t*>(&timestamp_));
        return tm ? tm->tm_mday : 0;
    }

    int hour() const {
        std::tm* tm = std::localtime(reinterpret_cast<time_t*>(&timestamp_));
        return tm ? tm->tm_hour : 0;
    }

    int minute() const {
        std::tm* tm = std::localtime(reinterpret_cast<time_t*>(&timestamp_));
        return tm ? tm->tm_min : 0;
    }

    int second() const {
        std::tm* tm = std::localtime(reinterpret_cast<time_t*>(&timestamp_));
        return tm ? tm->tm_sec : 0;
    }

    int day_of_week() const {
        std::tm* tm = std::localtime(reinterpret_cast<time_t*>(&timestamp_));
        return tm ? tm->tm_wday : 0;
    }

    int day_of_year() const {
        std::tm* tm = std::localtime(reinterpret_cast<time_t*>(&timestamp_));
        return tm ? tm->tm_yday : 0;
    }

    // Format as string
    void format(char* buffer, size_t size, const char* fmt) const {
        std::tm* tm = std::localtime(reinterpret_cast<time_t*>(&timestamp_));
        if (tm) {
            std::strftime(buffer, size, fmt, tm);
        }
    }

    // Add time
    DateTime add_seconds(int64_t s) const {
        DateTime dt;
        dt.timestamp_ = timestamp_ + s * 1000;
        return dt;
    }

    DateTime add_minutes(int64_t m) const { return add_seconds(m * 60); }
    DateTime add_hours(int64_t h) const { return add_seconds(h * 3600); }
    DateTime add_days(int64_t d) const { return add_seconds(d * 86400); }

    // Difference in seconds
    int64_t diff_seconds(const DateTime& other) const {
        return (timestamp_ - other.timestamp_) / 1000;
    }

    int64_t diff_days(const DateTime& other) const {
        return diff_seconds(other) / 86400;
    }

    // Comparison
    bool operator<(const DateTime& other) const { return timestamp_ < other.timestamp_; }
    bool operator>(const DateTime& other) const { return timestamp_ > other.timestamp_; }
    bool operator<=(const DateTime& other) const { return timestamp_ <= other.timestamp_; }
    bool operator>=(const DateTime& other) const { return timestamp_ >= other.timestamp_; }
    bool operator==(const DateTime& other) const { return timestamp_ == other.timestamp_; }
};

// Duration for time measurements
class Duration {
private:
    int64_t milliseconds_;

public:
    Duration() : milliseconds_(0) {}

    static Duration from_millis(int64_t ms) {
        Duration d;
        d.milliseconds_ = ms;
        return d;
    }

    static Duration from_seconds(double s) {
        Duration d;
        d.milliseconds_ = static_cast<int64_t>(s * 1000);
        return d;
    }

    static Duration from_minutes(double m) {
        Duration d;
        d.milliseconds_ = static_cast<int64_t>(m * 60000);
        return d;
    }

    static Duration from_hours(double h) {
        Duration d;
        d.milliseconds_ = static_cast<int64_t>(h * 3600000);
        return d;
    }

    int64_t as_millis() const { return milliseconds_; }
    double as_seconds() const { return milliseconds_ / 1000.0; }
    double as_minutes() const { return milliseconds_ / 60000.0; }
    double as_hours() const { return milliseconds_ / 3600000.0; }

    Duration operator+(const Duration& other) const {
        Duration result;
        result.milliseconds_ = milliseconds_ + other.milliseconds_;
        return result;
    }

    Duration operator-(const Duration& other) const {
        Duration result;
        result.milliseconds_ = milliseconds_ - other.milliseconds_;
        return result;
    }
};

// Timer for measuring elapsed time
class Timer {
private:
    int64_t start_time_;
    int64_t paused_time_;
    bool paused_;

public:
    Timer() : start_time_(0), paused_time_(0), paused_(false) {
        start();
    }

    void start() {
        start_time_ = now_millis();
        paused_time_ = 0;
        paused_ = false;
    }

    void reset() {
        start_time_ = now_millis();
        paused_time_ = 0;
        paused_ = false;
    }

    void pause() {
        if (!paused_) {
            paused_time_ = now_millis();
            paused_ = true;
        }
    }

    void resume() {
        if (paused_) {
            start_time_ = now_millis() - (paused_time_ - start_time_);
            paused_ = false;
        }
    }

    Duration elapsed() const {
        int64_t now = now_millis();
        if (paused_) {
            return Duration::from_millis(paused_time_ - start_time_);
        }
        return Duration::from_millis(now - start_time_);
    }

    static int64_t now_millis() {
        return static_cast<int64_t>(std::time(nullptr)) * 1000;
    }
};

inline int64_t timestamp() {
    return Timer::now_millis();
}

}

#endif