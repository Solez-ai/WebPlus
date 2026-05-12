# Dodge Game

An interactive game demonstrating Web+'s real-time performance capabilities with manual memory management and multi-threaded game loops.

## Features

- **Real-time Physics** - 60 FPS physics simulation in Web Worker
- **Collision Detection** - Efficient circle-to-circle collision
- **Multi-threaded** - Separate workers for physics, rendering, and input
- **Manual Memory** - Pre-allocated game objects, no GC pauses
- **Keyboard Input** - WASD or Arrow keys for movement
- **Progressive Difficulty** - Enemies spawn faster as score increases

## Gameplay

**Objective:** Avoid the falling red enemies for as long as possible!

**Controls:**
- **Arrow Keys** or **WASD** to move
- **Click "Start Game"** to begin

**Scoring:**
- +1 point per second survived
- Every 10 points, a new enemy spawns
- Maximum 100 enemies

## Architecture

```
┌────────────────┐
│  Physics Worker│ ───► Update positions
│   (~60 FPS)    │ ───► Check collisions
└────────────────┘

┌────────────────┐
│  Render Worker │ ───► Generate SVG
│   (~60 FPS)    │ ───► Update DOM
└────────────────┘

┌────────────────┐
│  Input Worker  │ ───► Read keyboard
│   (~60 FPS)    │ ───► Update velocity
└────────────────┘
```

## Data Structures

### Player
```webplus
struct Player {
    Vector2 position;
    Vector2 velocity;
    float radius;
    int score;
};
```

### Enemy
```webplus
struct Enemy {
    Vector2 position;
    Vector2 velocity;
    float radius;
    bool active;
};
```

### Memory Allocation
```webplus
Player* player = alloc<Player>(1);          // 32 bytes
Enemy* enemies = alloc<Enemy>(100);         // ~3.2 KB

// Total game memory: < 4 KB
// No runtime allocations during gameplay
```

## Performance

### Frame Timing
- **Physics**: 16ms budget (~60 FPS)
- **Rendering**: 16ms budget (~60 FPS)
- **Input**: 16ms budget (instant response)

### Collision Detection
- **Algorithm**: Circle-to-circle distance check
- **Complexity**: O(n) where n = enemy count
- **Performance**: < 1ms for 100 enemies

```webplus
float dx = player->position.x - enemy->position.x;
float dy = player->position.y - enemy->position.y;
float distance = sqrt(dx * dx + dy * dy);

if (distance < player->radius + enemy->radius) {
    // Collision!
}
```

## Web Workers

### Physics Worker
```webplus
physicsWorker = worker::spawn([] {
    while (gameRunning) {
        updatePhysics();  // Move all objects
        checkCollisions(); // Detect hits
        sleep(16);         // 60 FPS
    }
});
```

### Render Worker
```webplus
gameLoop = worker::spawn([] {
    while (gameRunning) {
        render();  // Generate SVG
        sleep(16); // 60 FPS
    }
});
```

### Input Worker
```webplus
inputWorker = worker::spawn([] {
    while (true) {
        if (keys[LEFT]) player->velocity.x -= 0.5;
        if (keys[RIGHT]) player->velocity.x += 0.5;
        sleep(16);
    }
});
```

## Building

```bash
webplus build main.webplus -o build
```

## Running

```bash
webplus serve . --port 3000
```

Open `http://localhost:3000` and click "Start Game"

## HTML Template

```html
<div id="app">
  <h1>Dodge Game</h1>
  <div id="score">Score: 0</div>
  <div id="gameCanvas"></div>
  <button id="startButton">Start Game</button>
  <div id="instructions"></div>
  
  <div id="gameOver" style="display: none;">
    <h2>Game Over!</h2>
    <div id="gameOverScore"></div>
    <button id="restartButton">Play Again</button>
  </div>
</div>
```

## Game Physics

### Movement
```webplus
player->position.x += player->velocity.x;
player->position.y += player->velocity.y;

// Apply friction
player->velocity.x *= 0.95;
player->velocity.y *= 0.95;
```

### Boundary Collision
```webplus
if (player->position.x < player->radius) 
    player->position.x = player->radius;
if (player->position.x > canvasWidth - player->radius)
    player->position.x = canvasWidth - player->radius;
```

### Enemy Spawning
```webplus
void spawnEnemy(Enemy* enemy) {
    enemy->position.x = randomFloat(0, canvasWidth);
    enemy->position.y = -50.0;  // Above screen
    enemy->velocity.y = randomFloat(2.0, 5.0);
    enemy->active = true;
}
```

## Performance Benchmarks

| Enemies | Physics Time | Render Time | Frame Rate |
| ------- | ------------ | ----------- | ---------- |
| 10      | < 1ms        | ~2ms        | 60 FPS     |
| 50      | ~2ms         | ~5ms        | 60 FPS     |
| 100     | ~5ms         | ~10ms       | 60 FPS     |

**No garbage collection pauses** - consistent frame times!

## Advantages over JavaScript

1. **No GC pauses** - Deterministic frame timing
2. **Manual memory** - Pre-allocated, cache-friendly
3. **Web Workers** - True parallelism for physics/rendering
4. **Low overhead** - Minimal runtime, direct WebAssembly

## Future Enhancements

- Canvas 2D rendering for better performance
- WebGL for 3D graphics
- Power-ups and bonuses
- High score persistence
- Multiplayer mode
- Sound effects
- Particle effects

## Customization

### Change game speed
```webplus
sleep(32);  // 30 FPS instead of 60
```

### Increase difficulty
```webplus
enemy->velocity.y = randomFloat(5.0, 10.0);  // Faster enemies
```

### Change player size
```webplus
player->radius = 15.0;  // Smaller player
```

---

**Made with Web+** - C++ performance for web games
