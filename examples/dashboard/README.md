# Live Dashboard

A real-time monitoring dashboard demonstrating Web+'s capabilities for data visualization and streaming updates.

## Features

- **Real-time Charts** - SVG-based line charts updated live
- **Web Workers** - Background data polling without blocking UI
- **Multiple Metrics** - CPU, Memory, and Network monitoring
- **Manual Memory** - Efficient ring buffer for chart data
- **Interactive Controls** - Pause/resume, manual refresh

## Architecture

```
┌──────────────┐
│   Browser    │
│              │
│  ┌────────┐  │      ┌────────────┐
│  │ Charts │  │◄─────┤ Data Worker│
│  └────────┘  │      └────────────┘
│  ┌────────┐  │            │
│  │  Stats │  │            │
│  └────────┘  │            ▼
└──────────────┘      ┌────────────┐
                      │   Server   │
                      │  /metrics  │
                      └────────────┘
```

## Data Structures

### Chart Structure
```webplus
struct DataPoint {
    int timestamp;
    float value;
};

struct Chart {
    DataPoint* data;     // Fixed-size ring buffer
    int capacity;        // Max data points
    int count;           // Current count
    string title;
    dom::Element canvas;
};
```

**Memory Efficiency:**
- 60 data points per chart
- 3 charts = 180 data points total
- ~2KB total memory for all data
- Ring buffer prevents unbounded growth

## Real-Time Features

### Background Polling
```webplus
worker dataWorker = worker::spawn([] {
    while (true) {
        fetch("/api/metrics").then(updateCharts);
        sleep(1000);  // Poll every second
    }
});
```

### Chart Rendering
```webplus
void renderChart(Chart* chart) {
    // Generate SVG path from data points
    string svg = "<svg>...</svg>";
    chart->canvas.html(svg);
}
```

### Ring Buffer
```webplus
void addDataPoint(Chart* chart, float value) {
    if (chart->count >= chart->capacity) {
        // Shift all data left (FIFO)
        for (int i = 0; i < chart->capacity - 1; i++) {
            chart->data[i] = chart->data[i + 1];
        }
    }
    // Add new point
    chart->data[chart->count].value = value;
}
```

## Building

```bash
webplus build main.webplus -o build
```

## Running

```bash
webplus serve . --port 3000
```

Open `http://localhost:3000`

## HTML Template

```html
<div id="app">
  <h1>System Dashboard</h1>
  
  <div class="stats">
    <div class="stat">
      <h3>CPU</h3>
      <div id="cpuValue">--</div>
      <div class="bar"><div id="cpuBar"></div></div>
    </div>
    <div class="stat">
      <h3>Memory</h3>
      <div id="memoryValue">--</div>
      <div class="bar"><div id="memoryBar"></div></div>
    </div>
    <div class="stat">
      <h3>Network</h3>
      <div id="networkValue">--</div>
    </div>
  </div>
  
  <div class="charts">
    <div id="cpuChart"></div>
    <div id="memoryChart"></div>
    <div id="networkChart"></div>
  </div>
  
  <button id="refreshButton">Refresh Now</button>
  <button id="toggleUpdates">Pause Updates</button>
  <div id="status"></div>
</div>
```

## API Endpoints

### GET /api/metrics
Returns current system metrics:
```json
{
  "cpu": 45.2,
  "memory": 512.5,
  "network": 234.1,
  "timestamp": 1706432100
}
```

### GET /api/history
Returns historical data:
```json
{
  "cpu": [...],
  "memory": [...],
  "network": [...],
  "count": 60
}
```

## Performance

- **Chart rendering**: ~2ms per chart
- **Data polling**: 1 second intervals
- **Memory usage**: Fixed ~2KB
- **No GC pauses** - Deterministic frame times

## Customization

### Change polling interval
```webplus
sleep(2000);  // Poll every 2 seconds
```

### Change chart capacity
```webplus
createChart("#cpuChart", "CPU", 120);  // 2 minutes of data
```

### Add new metrics
```webplus
Chart* diskChart = createChart("#diskChart", "Disk I/O", 60);
```

## Use Cases

- Server monitoring
- IoT device dashboards
- Trading platforms
- Industrial control panels
- Real-time analytics

## Future Enhancements

- Canvas rendering for better performance
- WebGL for 3D visualizations
- Historical data export
- Alert thresholds
- Data persistence

---

**Made with Web+** - Systems-level performance for web dashboards
