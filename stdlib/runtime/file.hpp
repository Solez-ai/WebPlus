#ifndef WEBPLUS_FILE_HPP
#define WEBPLUS_FILE_HPP

#include <cstdio>
#include <cstdint>
#include <cstring>

namespace webplus {

// File modes
enum class FileMode {
    Read,
    Write,
    Append,
    ReadWrite
};

// File handle wrapper
class File {
private:
    FILE* fp_;
    bool open_;

public:
    File() : fp_(nullptr), open_(false) {}

    File(const char* path, FileMode mode) : fp_(nullptr), open_(false) {
        open(path, mode);
    }

    ~File() {
        close();
    }

    bool open(const char* path, FileMode mode) {
        const char* fmode;
        switch (mode) {
            case FileMode::Read: fmode = "r"; break;
            case FileMode::Write: fmode = "w"; break;
            case FileMode::Append: fmode = "a"; break;
            case FileMode::ReadWrite: fmode = "r+"; break;
            default: fmode = "r";
        }

        fp_ = fopen(path, fmode);
        open_ = (fp_ != nullptr);
        return open_;
    }

    void close() {
        if (fp_) {
            fclose(fp_);
            fp_ = nullptr;
        }
        open_ = false;
    }

    bool is_open() const { return open_; }
    bool is_eof() const { return fp_ ? feof(fp_) != 0 : true; }

    // Read methods
    int read_char() {
        return fp_ ? fgetc(fp_) : -1;
    }

    int read(void* buffer, int size) {
        return fp_ ? static_cast<int>(fread(buffer, 1, size, fp_)) : 0;
    }

    bool read_line(char* buffer, int max_size) {
        if (!fp_) return false;
        return fgets(buffer, max_size, fp_) != nullptr;
    }

    // Write methods
    int write_char(char c) {
        return fp_ ? fputc(c, fp_) : -1;
    }

    int write(const void* data, int size) {
        return fp_ ? static_cast<int>(fwrite(data, 1, size, fp_)) : 0;
    }

    int write_string(const char* str) {
        return fp_ ? static_cast<int>(fputs(str, fp_)) : -1;
    }

    // Seek methods
    bool seek(int offset, int origin = SEEK_SET) {
        return fp_ ? fseek(fp_, offset, origin) == 0 : false;
    }

    int tell() {
        return fp_ ? static_cast<int>(ftell(fp_)) : -1;
    }

    void rewind() {
        if (fp_) ::rewind(fp_);
    }
};

// File operations
inline bool file_exists(const char* path) {
    FILE* f = fopen(path, "r");
    if (f) {
        fclose(f);
        return true;
    }
    return false;
}

inline int file_size(const char* path) {
    File f(path, FileMode::Read);
    if (!f.is_open()) return -1;
    f.seek(0, SEEK_END);
    return f.tell();
}

inline bool file_read(const char* path, char* buffer, int max_size) {
    File f(path, FileMode::Read);
    if (!f.is_open()) return false;
    int bytes = f.read(buffer, max_size - 1);
    buffer[bytes] = '\0';
    return true;
}

inline bool file_write(const char* path, const char* content) {
    File f(path, FileMode::Write);
    if (!f.is_open()) return false;
    int len = strlen(content);
    return f.write(content, len) == len;
}

inline bool file_append(const char* path, const char* content) {
    File f(path, FileMode::Append);
    if (!f.is_open()) return false;
    int len = strlen(content);
    return f.write(content, len) == len;
}

inline bool file_delete(const char* path) {
    return remove(path) == 0;
}

inline bool file_copy(const char* src, const char* dst) {
    File src_file(src, FileMode::Read);
    if (!src_file.is_open()) return false;

    const int BUF_SIZE = 4096;
    char buffer[BUF_SIZE];
    int bytes;

    File dst_file(dst, FileMode::Write);
    if (!dst_file.is_open()) return false;

    while ((bytes = src_file.read(buffer, BUF_SIZE)) > 0) {
        if (dst_file.write(buffer, bytes) != bytes) return false;
    }
    return true;
}

// Directory operations (basic)
inline bool dir_exists(const char* path) {
    // Use stat on POSIX or equivalent on Windows
    // Simplified: just check if we can open as file
    return file_exists(path);
}

inline bool dir_create(const char* path) {
    // Simplified - on Windows use mkdir, on POSIX use mkdir
    return true; // Platform-specific implementation needed
}

// Path utilities
inline const char* path_basename(const char* path) {
    const char* last_slash = path;
    while (*path) {
        if (*path == '/' || *path == '\\') last_slash = path + 1;
        path++;
    }
    return last_slash;
}

inline const char* path_extension(const char* filename) {
    const char* dot = nullptr;
    while (*filename) {
        if (*filename == '.') dot = filename;
        filename++;
    }
    return dot ? dot + 1 : "";
}

inline bool path_has_extension(const char* filename, const char* ext) {
    const char* file_ext = path_extension(filename);
    return strcmp(file_ext, ext) == 0;
}

}

#endif