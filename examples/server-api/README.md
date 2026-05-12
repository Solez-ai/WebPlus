# Server API Example

This example demonstrates Web+'s server-side capabilities:

- HTTP route declarations (`route GET`, `route POST`)
- Struct definitions for data modeling
- Manual memory management (`alloc`, `free`)
- JSON serialization
- Route parameters

## Features

- `GET /api/hello` - Simple JSON response
- `GET /api/user/:id` - User lookup with route parameters
- `POST /api/user` - User creation endpoint

## Build

```bash
webplus build main.webplus -o build
```

## Run

```bash
webplus run build --server
```

Note: Server-side execution via WASI is planned for v0.2. 
In v0.1, routes are compiled to WebAssembly and can be invoked from JavaScript.

## Code Highlights

**Struct Definition:**
```webplus
struct User {
    int id;
    string name;
    string email;
};
```

**Manual Memory Management:**
```webplus
User* user = alloc<User>(1);
// ... use user
free(user);
```

**HTTP Routing:**
```webplus
route GET "/api/user/:id" -> Response {
    int userId = param("id");
    // ...
}
```
