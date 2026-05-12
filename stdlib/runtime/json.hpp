#ifndef WEBPLUS_JSON_HPP
#define WEBPLUS_JSON_HPP

#include <cstdint>
#include <cstring>
#include <cstdlib>

namespace webplus {

// Simple JSON value types
enum class JsonType {
    Null,
    Bool,
    Number,
    String,
    Array,
    Object
};

class JsonValue {
private:
    JsonType type_;
    union {
        bool bool_val;
        double num_val;
        char* str_val;
    } value_;
    JsonValue* array_items_;
    int array_size_;
    JsonValue* obj_keys_;
    JsonValue* obj_values_;
    int obj_size_;

public:
    JsonValue() : type_(JsonType::Null), array_items_(nullptr), array_size_(0),
                  obj_keys_(nullptr), obj_values_(nullptr), obj_size_(0) {}

    static JsonValue null() { return JsonValue(); }

    static JsonValue make_bool(bool b) {
        JsonValue v;
        v.type_ = JsonType::Bool;
        v.value_.bool_val = b;
        return v;
    }

    static JsonValue make_number(double n) {
        JsonValue v;
        v.type_ = JsonType::Number;
        v.value_.num_val = n;
        return v;
    }

    static JsonValue make_string(const char* s) {
        JsonValue v;
        v.type_ = JsonType::String;
        v.value_.str_val = new char[strlen(s) + 1];
        strcpy(v.value_.str_val, s);
        return v;
    }

    ~JsonValue() {
        if (type_ == JsonType::String && value_.str_val) {
            delete[] value_.str_val;
        }
        if (type_ == JsonType::Array && array_items_) {
            for (int i = 0; i < array_size_; i++) {
                array_items_[i].~JsonValue();
            }
            delete[] array_items_;
        }
        if (type_ == JsonType::Object) {
            for (int i = 0; i < obj_size_; i++) {
                obj_keys_[i].~JsonValue();
                obj_values_[i].~JsonValue();
            }
            delete[] obj_keys_;
            delete[] obj_values_;
        }
    }

    JsonType type() const { return type_; }

    bool is_null() const { return type_ == JsonType::Null; }
    bool is_bool() const { return type_ == JsonType::Bool; }
    bool is_number() const { return type_ == JsonType::Number; }
    bool is_string() const { return type_ == JsonType::String; }
    bool is_array() const { return type_ == JsonType::Array; }
    bool is_object() const { return type_ == JsonType::Object; }

    bool as_bool() const { return value_.bool_val; }
    double as_number() const { return value_.num_val; }
    const char* as_string() const { return value_.str_val ? value_.str_val : ""; }

    // Array methods
    void set_array(int size) {
        type_ = JsonType::Array;
        array_size_ = size;
        array_items_ = new JsonValue[size];
    }

    JsonValue& operator[](int idx) {
        return array_items_[idx];
    }

    const JsonValue& operator[](int idx) const {
        return array_items_[idx];
    }

    int size() const { return array_size_; }

    // Object methods
    void set_object(int size) {
        type_ = JsonType::Object;
        obj_size_ = size;
        obj_keys_ = new JsonValue[size];
        obj_values_ = new JsonValue[size];
    }

    void set_key(int idx, const char* key) {
        obj_keys_[idx] = JsonValue::make_string(key);
    }

    JsonValue& get(const char* key) {
        for (int i = 0; i < obj_size_; i++) {
            if (strcmp(obj_keys_[i].as_string(), key) == 0) {
                return obj_values_[i];
            }
        }
        return obj_keys_[0]; // Return null
    }

    bool has(const char* key) const {
        for (int i = 0; i < obj_size_; i++) {
            if (strcmp(obj_keys_[i].as_string(), key) == 0) {
                return true;
            }
        }
        return false;
    }
};

// JSON parser
class JsonParser {
private:
    const char* pos_;
    const char* end_;

    void skip_whitespace() {
        while (pos_ < end_ && (*pos_ == ' ' || *pos_ == '\t' || *pos_ == '\n' || *pos_ == '\r')) {
            pos_++;
        }
    }

    bool check(const char* s) {
        size_t len = strlen(s);
        if (pos_ + len <= end_ && strncmp(pos_, s, len) == 0) {
            return true;
        }
        return false;
    }

    JsonValue parse_value() {
        skip_whitespace();
        if (pos_ >= end_) return JsonValue::null();

        if (*pos_ == 'n' && check("null")) {
            pos_ += 4;
            return JsonValue::null();
        }
        if (*pos_ == 't' && check("true")) {
            pos_ += 4;
            return JsonValue::make_bool(true);
        }
        if (*pos_ == 'f' && check("false")) {
            pos_ += 5;
            return JsonValue::make_bool(false);
        }
        if (*pos_ == '"') {
            return parse_string();
        }
        if (*pos_ == '[') {
            return parse_array();
        }
        if (*pos_ == '{') {
            return parse_object();
        }
        return parse_number();
    }

    JsonValue parse_string() {
        pos_++; // skip "
        const char* start = pos_;
        while (pos_ < end_ && *pos_ != '"') {
            if (*pos_ == '\\') pos_++;
            pos_++;
        }
        pos_++; // skip "

        int len = pos_ - start - 1;
        char* str = new char[len + 1];
        strncpy(str, start, len);
        str[len] = '\0';

        JsonValue v = JsonValue::make_string(str);
        delete[] str;
        return v;
    }

    JsonValue parse_number() {
        const char* start = pos_;
        while (pos_ < end_ && (*pos_ == '-' || *pos_ == '.' || *pos_ == 'e' ||
                               *pos_ == 'E' || (*pos_ >= '0' && *pos_ <= '9'))) {
            pos_++;
        }

        int len = pos_ - start;
        char* buf = new char[len + 1];
        strncpy(buf, start, len);
        buf[len] = '\0';

        double num = atof(buf);
        delete[] buf;
        return JsonValue::make_number(num);
    }

    JsonValue parse_array() {
        pos_++; // skip [
        skip_whitespace();

        int count = 0;
        const char* temp = pos_;
        while (temp < end_ && *temp != ']') {
            if (*temp == '[' || *temp == '{') count++;
            else if (*temp == ']' || *temp == '}') count--;
            else if (*temp == ',' && count == 0) break;
            temp++;
        }
        int max_items = (temp - pos_) / 2 + 1;

        JsonValue arr;
        arr.set_array(max_items);
        int idx = 0;

        while (pos_ < end_ && *pos_ != ']') {
            arr[idx++] = parse_value();
            skip_whitespace();
            if (*pos_ == ',') pos_++;
            skip_whitespace();
        }
        pos_++; // skip ]

        JsonValue result;
        result.set_array(idx);
        for (int i = 0; i < idx; i++) {
            result[i] = arr[i];
        }
        return result;
    }

    JsonValue parse_object() {
        pos_++; // skip {
        skip_whitespace();

        JsonValue obj;
        obj.set_object(16); // Start with 16 slots
        int idx = 0;

        while (pos_ < end_ && *pos_ != '}') {
            skip_whitespace();
            if (*pos_ == '"') {
                JsonValue key = parse_string();
                skip_whitespace();
                pos_++; // skip :
                skip_whitespace();
                JsonValue val = parse_value();

                if (idx < 16) {
                    obj.set_key(idx, key.as_string());
                    obj.get(key.as_string()) = val;
                    idx++;
                }
            }
            skip_whitespace();
            if (*pos_ == ',') pos_++;
            skip_whitespace();
        }
        pos_++; // skip }

        return obj;
    }

public:
    static JsonValue parse(const char* json_str) {
        JsonParser p;
        p.pos_ = json_str;
        p.end_ = json_str + strlen(json_str);
        return p.parse_value();
    }
};

// Helper functions
inline JsonValue json_parse(const char* json_str) {
    return JsonParser::parse(json_str);
}

inline JsonValue json_null() { return JsonValue::null(); }
inline JsonValue json_bool(bool b) { return JsonValue::make_bool(b); }
inline JsonValue json_number(double n) { return JsonValue::make_number(n); }
inline JsonValue json_string(const char* s) { return JsonValue::make_string(s); }

}

#endif