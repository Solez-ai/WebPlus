# Real-Time Chat Application

This example demonstrates a real-time chat application built with Web+, showcasing:

- **DOM Manipulation** - Dynamic message rendering
- **Web Workers** - Background polling for new messages
- **Fetch API** - HTTP requests to backend
- **Manual Memory** - Efficient message storage
- **HTTP Routing** - Server-side message endpoints

## Features

### Client-Side
- Real-time message display
- Auto-scroll to latest message
- Background message polling via Web Worker
- Responsive input handling
- Username support

### Server-Side
- RESTful API endpoints
- Message storage in memory
- JSON request/response handling
- Message broadcasting

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────┐
│   Browser   │◄────►│  Web Worker  │◄────►│   Server   │
│   (Main)    │      │  (Polling)   │      │  (Routes)  │
└─────────────┘      └──────────────┘      └────────────┘
      │                                            │
      │                                            │
      └────────────── Fetch API ──────────────────┘
```

## Memory Management

This app demonstrates efficient memory usage:

```webplus
// Pre-allocate message buffer
Message* messages = alloc<Message>(100);

// Each message stored in fixed buffer
Message* msg = &messages[messageCount];
msg->username = user;
msg->content = content;
```

**Memory Allocation:**
- Messages: 100 × sizeof(Message) = ~10KB
- Single allocation, no individual frees needed during runtime
- Efficient cache-friendly storage

## Web Primitives Used

### DOM
```webplus
dom::Element input = dom::get("#messageInput");
input.on("keypress", handleKeyPress);
chatBox.html(currentHtml + newMessage);
```

### Workers
```webplus
worker pollingWorker = worker::spawn([] {
    while (true) {
        fetch("/api/messages").then(updateUI);
        sleep(1000);
    }
});
```

### HTTP Routes
```webplus
route GET "/api/messages" -> Response {
    return json(messages, messageCount);
}

route POST "/api/messages" -> Response {
    // Handle new message
}
```

### Fetch
```webplus
fetch("/api/messages", {
    method: "POST",
    body: json(msg)
}).then(handleResponse);
```

## Building

```bash
webplus build main.webplus -o build
```

## Running

### Browser Mode
```bash
webplus serve . --port 3000
```

Open `http://localhost:3000`

### Server Mode (v0.2)
```bash
webplus run build --server --port 8080
```

## Usage

1. Enter your username in the top input
2. Type messages in the message input
3. Press Enter or click Send
4. Messages appear in real-time for all connected users
5. Background worker polls for new messages every second

## HTML Template

The app expects this basic HTML structure:

```html
<div id="app">
  <input id="usernameInput" placeholder="Your name" />
  <div id="chatMessages"></div>
  <input id="messageInput" placeholder="Type a message..." />
  <button id="sendButton">Send</button>
  <div id="status"></div>
  <div id="error"></div>
</div>
```

## Performance

- **Message rendering**: < 1ms per message
- **Polling overhead**: Minimal, runs in Web Worker
- **Memory usage**: Fixed 10KB for 100 messages
- **No garbage collection** - Deterministic performance

## Security Notes

- Input sanitization recommended for production
- Rate limiting should be added
- Message history should be paginated
- CORS headers required for cross-origin

## Future Enhancements

- Message persistence (SQLite)
- User authentication
- Message editing/deletion
- Typing indicators
- Read receipts
- File attachments

---

**Made with Web+** - A C++-inspired systems language for the web
