# ESP32 Relay Control Architecture

## Overview

This document describes the network-based ESP32 relay control architecture for the TrainStation system. Instead of direct hardware control from the backend, we use ESP32 microcontrollers as network-accessible relay proxies. This provides:

- **Decoupled Architecture**: Backend and hardware are separated by a network API
- **Scalability**: Multiple ESP32 nodes can control different sections of the layout
- **Robustness**: Network failures don't crash the main application
- **Flexibility**: Easy to add, remove, or reconfigure relay nodes
- **Testing**: Mock mode enables full testing without hardware

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Backend API Server                     │
│                  (FastAPI Application)                   │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │         app/hardware/relay_proxy.py                 │ │
│  │      ESP32RelayProxy - HTTP Client                  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                         │
                         │ HTTP REST API
                         ├──────────────────┬──────────────────┐
                         ▼                  ▼                  ▼
        ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
        │   ESP32 Node 01      │  │   ESP32 Node 02      │  │   ESP32 Node 03      │
        │   192.168.1.101:8080 │  │   192.168.1.102:8080 │  │   192.168.1.103:8080 │
        │                      │  │                      │  │                      │
        │  GPIO Pins: 2-7      │  │  GPIO Pins: 8-13     │  │  GPIO Pins: 14-19    │
        └──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘
                   │                         │                         │
                   ▼                         ▼                         ▼
        ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
        │  Relay Module 1      │  │  Relay Module 2      │  │  Relay Module 3      │
        │  (Turnouts)          │  │  (Signals)           │  │  (Accessories)       │
        └─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

## Components

### 1. Backend Relay Proxy (`app/hardware/relay_proxy.py`)

The `ESP32RelayProxy` class handles all HTTP communication with ESP32 nodes:

- **HTTP Client**: Uses `httpx` for async HTTP requests
- **Error Handling**: Proper timeout and error handling
- **Mock Mode**: Can run without real hardware for testing
- **Logging**: Structured logging for all operations

#### Key Methods:

```python
async def send_command(node_address, pin, action, duration_ms=None)
async def get_status(node_address)
async def reset_node(node_address)
```

### 2. Relay Router (`app/routers/relay.py`)

REST API endpoints for relay control:

- `POST /relay/control` - Control a relay pin
- `GET /relay/status?node_address=...` - Get node status
- `POST /relay/reset` - Reset all pins on a node
- `GET /relay/health` - Health check

### 3. ESP32 Firmware (`firmware/esp32_relay_control.ino`)

Arduino firmware that runs on each ESP32 node:

- **WiFi Connectivity**: Connects to your network
- **REST API Server**: Exposes HTTP endpoints
- **Pin Control**: Manages GPIO pins connected to relays
- **State Tracking**: Monitors pin states and timing
- **History**: Records command history

#### API Endpoints (on ESP32):

- `POST /control` - Control a pin (on/off/toggle/timed)
- `GET /status` - Get node status and pin states
- `POST /reset` - Reset all pins to OFF
- `GET /history` - Get command history

## Hardware Setup

### Required Components per Node:

1. **ESP32 Development Board** (e.g., ESP32-WROOM-32)
2. **Relay Module** (4-16 channel, 5V or 3.3V compatible)
3. **Power Supply**:
   - 5V/2A for ESP32 and relays
   - Separate power for high-current loads
4. **Jumper Wires**
5. **Optional**: Case/enclosure for mounting

### Wiring Example:

```
ESP32                    Relay Module              Load (Accessory)
─────                    ────────────              ─────────────────
GPIO 2 ───────────────► IN1 ──► COM1 ──► + ────► Switch/Light
GPIO 4 ───────────────► IN2 ──► COM2 ──► + ────► Signal
GPIO 5 ───────────────► IN3 ──► COM3 ──► + ────► Crossing Gate
...                      ...

GND ───────────────────► GND
3.3V or 5V ────────────► VCC
```

### Important Wiring Notes:

- **Logic Level**: Some relay modules require 5V logic. Use a level shifter if needed.
- **Power**: Don't power high-current loads through ESP32. Use relay's NO/NC contacts.
- **Isolation**: Relay modules provide electrical isolation between ESP32 and loads.
- **Common Ground**: ESP32 and relay module must share a common ground.

## Software Setup

### 1. Flash ESP32 Firmware

1. Install Arduino IDE and ESP32 board support
2. Install required libraries:
   - WiFi (built-in)
   - WebServer (built-in)
   - ArduinoJson (Library Manager)
3. Open `firmware/esp32_relay_control.ino`
4. Configure settings:
   ```cpp
   const char* WIFI_SSID = "your_wifi_ssid";
   const char* WIFI_PASSWORD = "your_wifi_password";
   const char* NODE_ID = "esp32-01";  // Unique ID
   const int RELAY_PINS[] = {2, 4, 5, 12, 13, 14, 15, 16};
   ```
5. Select board: Tools → Board → ESP32 Dev Module
6. Select port: Tools → Port → (your ESP32 port)
7. Upload the sketch

### 2. Test ESP32 Node

After flashing, open Serial Monitor (115200 baud) to see:

```
=== ESP32 Relay Control Node ===
Node ID: esp32-01
Initializing relay pins...
  Pin 2 configured as OUTPUT (LOW)
  Pin 4 configured as OUTPUT (LOW)
  ...
Connecting to WiFi: your_wifi_ssid
...............
WiFi connected!
IP Address: 192.168.1.101
Port: 8080
HTTP server started
Ready to accept commands!
```

Note the IP address - you'll need it for configuration.

### 3. Test with curl

```bash
# Test status
curl http://192.168.1.101:8080/status

# Turn on pin 2
curl -X POST http://192.168.1.101:8080/control \
  -H "Content-Type: application/json" \
  -d '{"pin": 2, "action": "on"}'

# Toggle pin 4 for 500ms
curl -X POST http://192.168.1.101:8080/control \
  -H "Content-Type: application/json" \
  -d '{"pin": 4, "action": "toggle", "duration_ms": 500}'

# Turn off pin 2
curl -X POST http://192.168.1.101:8080/control \
  -H "Content-Type: application/json" \
  -d '{"pin": 2, "action": "off"}'

# Reset all pins
curl -X POST http://192.168.1.101:8080/reset
```

### 4. Configure Backend

Update `accessory_map.yaml` with your ESP32 node addresses:

```yaml
accessories:
  "Main Line Turnout 1":
    esp32_node: "esp32-01"
    address: "192.168.1.101:8080"  # Your ESP32's actual IP
    pin: 2
    control_type: "toggle"
    description: "Main line east junction turnout"
```

### 5. Backend Environment Configuration

Set environment variables for the backend:

```bash
# Enable mock mode for testing without hardware
export ESP32_MOCK_MODE=false  # Set to 'true' for mock mode

# Or add to .env file
echo "ESP32_MOCK_MODE=false" >> .env
```

## Testing

### Mock Mode Testing (No Hardware Required)

1. Set `ESP32_MOCK_MODE=true` in your environment
2. Start the backend API
3. All relay commands will be simulated

```bash
export ESP32_MOCK_MODE=true
cd app
uvicorn main:app --reload
```

### Mock ESP32 Server (Python Simulator)

For integration testing without real ESP32 hardware:

```bash
cd labtest
pip install aiohttp aiohttp-cors
python mock_esp32.py
```

This starts mock ESP32 nodes on ports 8081-8085. Update your `accessory_map.yaml`:

```yaml
accessories:
  "Test Turnout":
    esp32_node: "esp32-mock"
    address: "localhost:8081"
    pin: 2
    control_type: "toggle"
```

### API Testing

Test the backend relay endpoints:

```bash
# Control a relay
curl -X POST http://localhost:8000/relay/control \
  -H "Content-Type: application/json" \
  -d '{
    "node_address": "192.168.1.101:8080",
    "pin": 2,
    "action": "on"
  }'

# Get node status
curl http://localhost:8000/relay/status?node_address=192.168.1.101:8080

# Reset node
curl -X POST http://localhost:8000/relay/reset \
  -H "Content-Type: application/json" \
  -d '{
    "node_address": "192.168.1.101:8080"
  }'

# Health check
curl http://localhost:8000/relay/health
```

## Integration with Existing Code

The relay proxy can be integrated with existing accessory control:

```python
from hardware.relay_proxy import get_relay_proxy

async def control_accessory(accessory_id):
    # Get accessory configuration from database
    accessory = db.query(Accessory).get(accessory_id)
    
    # Get ESP32 node address from configuration
    node_address = get_node_address(accessory)
    pin = get_pin_number(accessory)
    
    # Send command through relay proxy
    proxy = get_relay_proxy()
    result = await proxy.send_command(
        node_address=node_address,
        pin=pin,
        action="toggle",
        duration_ms=250
    )
    
    return result
```

## Troubleshooting

### ESP32 Won't Connect to WiFi

- **Check credentials**: Verify SSID and password are correct
- **Signal strength**: Move ESP32 closer to router
- **2.4GHz only**: ESP32 doesn't support 5GHz WiFi
- **Serial monitor**: Check connection messages
- **Reset**: Press EN button on ESP32 to restart

### Can't Reach ESP32 from Backend

- **Same network**: Backend and ESP32 must be on same network
- **Firewall**: Check firewall settings on ESP32's network
- **IP address**: Verify ESP32's IP hasn't changed (use static IP or DHCP reservation)
- **Port**: Ensure port 8080 is not blocked
- **Ping test**: Try `ping 192.168.1.101` from backend server

### Relay Not Activating

- **Power**: Check relay module has adequate power supply
- **Wiring**: Verify GPIO to relay module connections
- **Logic level**: Some relays need 5V logic (use level shifter)
- **Pin configuration**: Verify pins in firmware match physical wiring
- **Relay type**: Check if relay is active HIGH or active LOW
- **Serial monitor**: Watch for pin state changes

### Backend Timeout Errors

- **Network latency**: ESP32 might be slow to respond
- **Increase timeout**: Adjust timeout in ESP32RelayProxy constructor
- **ESP32 load**: Check if ESP32 is handling too many requests
- **WiFi quality**: Poor WiFi can cause timeouts

### Commands Not Working

- **Mock mode**: Check if `ESP32_MOCK_MODE=true` (should be false for real hardware)
- **Node address**: Verify correct IP:port in configuration
- **Pin number**: Ensure pin is in RELAY_PINS array in firmware
- **Action type**: Use valid action: "on", "off", "toggle", or "timed"
- **Check logs**: Review backend logs for detailed error messages

## Production Deployment

### Network Configuration

1. **Static IPs**: Assign static IPs to ESP32 nodes or use DHCP reservations
2. **DNS**: Optionally use local DNS for friendly names
3. **Network segmentation**: Consider separate VLAN for IoT devices
4. **Port forwarding**: Not recommended for security (use VPN if remote access needed)

### Security Considerations

1. **WiFi Security**: Use WPA2 or WPA3 encryption
2. **Network isolation**: Keep ESP32 network separate from public internet
3. **Authentication**: Consider adding authentication to ESP32 API (future enhancement)
4. **HTTPS**: For sensitive deployments, add TLS support (requires ESP32 certificates)
5. **Firmware updates**: Keep ESP32 firmware updated

### Monitoring and Maintenance

1. **Health checks**: Regularly poll `/status` endpoint
2. **Uptime monitoring**: Track ESP32 uptime and restart counts
3. **Logging**: Configure backend to log all relay operations
4. **Alerts**: Set up alerts for node failures or timeouts
5. **Documentation**: Keep inventory of nodes, IPs, and physical locations

### Scaling

To add more nodes:

1. Flash additional ESP32 boards with unique NODE_IDs
2. Connect to network and note IP addresses
3. Update `accessory_map.yaml` with new node configurations
4. No backend code changes required!

### Backup and Recovery

1. **Firmware backup**: Keep copy of configured firmware
2. **Configuration backup**: Version control `accessory_map.yaml`
3. **Quick recovery**: Pre-flash spare ESP32 boards
4. **Documentation**: Maintain wiring diagrams for each node

## API Reference

### Backend Relay Proxy Methods

#### `send_command(node_address, pin, action, duration_ms=None)`

Send a control command to an ESP32 node.

**Parameters:**
- `node_address` (str): ESP32 address, e.g., "192.168.1.101:8080"
- `pin` (int): GPIO pin number to control
- `action` (str): Action to perform - "on", "off", "toggle", or "timed"
- `duration_ms` (int, optional): Duration in milliseconds for toggle/timed actions

**Returns:** Dict with response from ESP32

**Raises:** `httpx.HTTPError` on communication errors

#### `get_status(node_address)`

Get the status of an ESP32 node.

**Parameters:**
- `node_address` (str): ESP32 address

**Returns:** Dict with node status and pin states

#### `reset_node(node_address)`

Reset all pins on an ESP32 node to OFF state.

**Parameters:**
- `node_address` (str): ESP32 address

**Returns:** Dict with reset confirmation

### ESP32 API Endpoints

All endpoints return JSON responses.

#### `POST /control`

Control a relay pin.

**Request body:**
```json
{
  "pin": 2,
  "action": "on",
  "duration_ms": 500  // optional
}
```

**Response:**
```json
{
  "status": "success",
  "node_id": "esp32-01",
  "pin": 2,
  "action": "on",
  "timestamp": 1234567890
}
```

#### `GET /status`

Get node status and pin states.

**Response:**
```json
{
  "node_id": "esp32-01",
  "status": "online",
  "ip_address": "192.168.1.101",
  "uptime_ms": 123456789,
  "pin_states": {
    "2": {
      "state": "on"
    },
    "4": {
      "state": "off"
    }
  }
}
```

#### `POST /reset`

Reset all relay pins to OFF state.

**Response:**
```json
{
  "status": "success",
  "message": "All relay pins reset to OFF",
  "timestamp": 1234567890
}
```

#### `GET /history?limit=50`

Get command history.

**Query parameters:**
- `limit` (int, optional): Number of recent commands to return (default: 50)

**Response:**
```json
{
  "node_id": "esp32-01",
  "total_commands": 150,
  "history": [
    {
      "timestamp": 1234567890,
      "pin": 2,
      "action": "on"
    }
  ]
}
```

## Future Enhancements

- **WebSocket Support**: Real-time bidirectional communication
- **Authentication**: JWT or API key authentication
- **HTTPS/TLS**: Encrypted communication
- **MQTT Support**: Alternative protocol for IoT messaging
- **Firmware OTA**: Over-the-air firmware updates
- **Multi-WiFi**: Automatic failover between multiple WiFi networks
- **Pin Groups**: Control multiple pins simultaneously
- **Scheduling**: Built-in command scheduling on ESP32
- **Sensor Support**: Read sensor values from ESP32

## References

- **ESP32 Documentation**: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/
- **Arduino JSON**: https://arduinojson.org/
- **httpx Python Client**: https://www.python-httpx.org/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Mock ESP32 Server**: `labtest/mock_esp32.py`
- **Example Usage**: `labtest/example_requests.py`

## Support

For issues or questions:

1. Check this documentation
2. Review backend logs: `docker compose logs -f api`
3. Check ESP32 serial output
4. Test with mock mode first
5. Verify network connectivity
6. Check accessory_map.yaml configuration

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-01  
**Maintainer**: TrainStation Team
