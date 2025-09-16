# TrainStation Testing Framework

This directory contains test and example code to demonstrate end-to-end communication between the FastAPI backend, ESP32 nodes, and accessory relays as mapped in `accessory_map.yaml`.

## 📋 Overview

The testing framework provides:

1. **Backend Test API** (`/test/accessory`) - FastAPI endpoints for testing accessory commands
2. **Frontend Test UI** - Simple web interface for manual testing
3. **Mock ESP32 Nodes** - Python script to simulate hardware responses
4. **Configuration Mapping** - YAML-based accessory-to-hardware mapping

## 🚀 Quick Start

### 1. Start the Backend API

Make sure you have the dependencies installed:

```bash
cd app/
pip install -r ../requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The test endpoints will be available at:
- `GET /test/accessories` - List all available accessories
- `GET /test/esp32-nodes` - List all ESP32 node configurations  
- `POST /test/accessory` - Send commands to accessories

### 2. Test with the Web UI

#### Option A: Standalone HTML (Recommended for quick testing)

1. Start the FastAPI backend on port 8000
2. Open `labtest/accessory_tester.html` in your web browser
3. Select an accessory and test different actions

#### Option B: React Component Integration

1. Copy `labtest/AccessoryTester.tsx` to your React frontend
2. Add the component to your routing
3. Make sure Material-UI dependencies are installed

### 3. Optional: Run Mock ESP32 Nodes

To test the full stack with simulated hardware responses:

```bash
cd labtest/
pip install aiohttp aiohttp-cors
python mock_esp32.py
```

This starts 5 mock ESP32 nodes on ports 8081-8085 that can receive and respond to commands.

## 📁 File Structure

```
labtest/
├── README.md                 # This file
├── AccessoryTester.tsx       # React component for UI testing
├── accessory_tester.html     # Standalone HTML test interface
├── mock_esp32.py            # Mock ESP32 node simulation
└── example_requests.py      # Example API usage scripts

accessory_map.yaml           # Hardware mapping configuration
app/routers/test_accessory.py # Backend test API endpoints
app/tests/test_accessory_api.py # Unit tests for test API
```

## 🔧 API Reference

### List Accessories

```http
GET /test/accessories
```

**Response:**
```json
{
  "status": "ok",
  "accessories": [
    {
      "name": "Main Line Turnout 1",
      "esp32_node": "esp32-01",
      "control_type": "toggle",
      "description": "Main line east junction turnout"
    }
  ],
  "count": 12
}
```

### Send Accessory Command

```http
POST /test/accessory
Content-Type: application/json

{
  "accessory_name": "Main Line Turnout 1",
  "action": "toggle",
  "milliseconds": 500
}
```

**Response:**
```json
{
  "status": "ok",
  "accessory_name": "Main Line Turnout 1",
  "action": "toggle",
  "esp32_node": "esp32-01",
  "hardware_address": "192.168.1.101:8080",
  "pin": 2,
  "control_type": "toggle",
  "milliseconds": 500,
  "simulated_result": "SUCCESS: Command sent to esp32-01 at 192.168.1.101:8080 (duration: 500ms)",
  "message": "Simulated toggle command for 'Main Line Turnout 1' on pin 2 for 500ms"
}
```

### List ESP32 Nodes

```http
GET /test/esp32-nodes
```

**Response:**
```json
{
  "status": "ok",
  "nodes": [
    {
      "node_id": "esp32-01",
      "ip": "192.168.1.101",
      "port": 8080,
      "description": "Main line turnouts controller",
      "location": "East Junction"
    }
  ],
  "count": 5
}
```

## 🎛️ Control Types

The system supports three types of accessory controls:

### 1. OnOff Controls (Signals, Lights)
- **Actions:** `on`, `off`
- **Use case:** Traffic signals, platform lights
- **Example:** Station Platform Light

### 2. Toggle Controls (Turnouts, Switches)
- **Actions:** `toggle`
- **Duration:** Configurable pulse duration (default 250ms)
- **Use case:** Momentary activation of turnout motors
- **Example:** Main Line Turnout 1

### 3. Timed Controls (Crossing Gates)
- **Actions:** `timed`, `on` (with duration)
- **Duration:** Configurable on-time (default 5000ms)
- **Use case:** Temporary activation like crossing gates
- **Example:** Main Crossing Gate

## 📊 Testing Scenarios

### Basic Functionality Test
1. Start the backend API
2. Open the HTML test interface
3. Select "Signal Block 1" (onOff type)
4. Click "Turn On" - should show success response
5. Click "Turn Off" - should show success response

### Toggle Test
1. Select "Main Line Turnout 1" (toggle type)
2. Adjust duration to 500ms
3. Click "Toggle" - should show 500ms duration in response

### Timed Test
1. Select "Main Crossing Gate" (timed type)
2. Set duration to 3000ms
3. Click "Timed Pulse" - should activate for 3 seconds

### Error Handling Test
1. Try to send invalid commands (should show error messages)
2. Test with network disconnected (should show connection errors)

## 🔍 Troubleshooting

### Common Issues

**"Accessory map configuration not found"**
- Ensure `accessory_map.yaml` exists in the project root
- Check file permissions and YAML syntax

**"Failed to load accessories"**
- Verify FastAPI backend is running on port 8000
- Check CORS configuration for cross-origin requests
- Look at browser console for network errors

**"Command failed: HTTP 500"**
- Check FastAPI logs for detailed error messages
- Verify accessory names match exactly (case-sensitive)
- Ensure required dependencies (PyYAML) are installed

### Mock ESP32 Issues

**"Address already in use"**
- Stop any existing mock ESP32 processes
- Use different ports if needed: `python mock_esp32.py --port 8090`

**"No module named 'aiohttp'"**
- Install dependencies: `pip install aiohttp aiohttp-cors`

## 🧪 Running Tests

### Backend API Tests
```bash
cd app/
python -m pytest tests/test_accessory_api.py -v
```

### Full Integration Test
```bash
# Terminal 1: Start backend
cd app/
uvicorn main:app --reload --port 8000

# Terminal 2: Start mock ESP32 nodes
cd labtest/
python mock_esp32.py

# Terminal 3: Run tests
cd app/
python -m pytest tests/ -v
```

## 📈 Performance Monitoring

The test API includes structured logging that can be monitored via SEQ or other log aggregation tools:

```python
logger.info(
    "Simulated ESP32 command",
    accessory_name=request.accessory_name,
    esp32_node=esp32_node,
    address=address,
    pin=pin,
    action=request.action,
    duration_ms=duration_ms
)
```

## 🔮 Future Enhancements

- **Real ESP32 Integration:** Replace mock responses with actual HTTP calls to ESP32 nodes
- **WebSocket Support:** Add real-time status updates from hardware
- **Advanced Scheduling:** Queue and schedule multiple commands
- **Hardware Monitoring:** Track pin states and provide feedback
- **Load Testing:** Stress test with multiple concurrent commands

## 📝 Contributing

When adding new accessories or ESP32 nodes:

1. Update `accessory_map.yaml` with the new configuration
2. Test with the UI to ensure proper mapping
3. Add any new control types to the backend validation
4. Update this README with new examples

## 🔗 Related Documentation

- [Main Project README](../README.md)
- [Backend API Documentation](../docs/)
- [Logging Configuration](../docs/logging.md)
- [Hardware Setup Guide](../docs/hardware.md) (if available)