/**
 * ESP32 Relay Control Node
 * 
 * This firmware turns an ESP32 into a network-accessible relay controller.
 * It exposes a REST API for controlling GPIO pins connected to relay modules.
 * 
 * Hardware Requirements:
 * - ESP32 development board
 * - Relay module (1-16 channels)
 * - Power supply appropriate for your relay module
 * 
 * API Endpoints:
 * - POST /control - Control a relay pin
 * - GET  /status  - Get node status and pin states
 * - POST /reset   - Reset all pins to OFF state
 * - GET  /history - Get command history
 * 
 * Configuration:
 * - Update WIFI_SSID and WIFI_PASSWORD with your network credentials
 * - Update NODE_ID to uniquely identify this ESP32
 * - Configure RELAY_PINS array with the GPIO pins connected to your relay module
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// ============================================================================
// Configuration
// ============================================================================

// WiFi credentials
const char* WIFI_SSID = "your_wifi_ssid";
const char* WIFI_PASSWORD = "your_wifi_password";

// Node identification
const char* NODE_ID = "esp32-01";

// Web server port
const int HTTP_PORT = 8080;

// Relay GPIO pins (customize based on your wiring)
const int RELAY_PINS[] = {2, 4, 5, 12, 13, 14, 15, 16};
const int RELAY_COUNT = sizeof(RELAY_PINS) / sizeof(RELAY_PINS[0]);

// Pin state tracking
struct PinState {
  bool isActive;
  unsigned long activatedAt;
  unsigned long duration;
};

PinState pinStates[40] = {0}; // ESP32 has up to 40 GPIO pins

// Command history
const int MAX_HISTORY = 50;
struct CommandRecord {
  unsigned long timestamp;
  int pin;
  String action;
  int duration;
};
CommandRecord commandHistory[MAX_HISTORY];
int historyIndex = 0;
int historyCount = 0;

// Web server instance
WebServer server(HTTP_PORT);

// Startup timestamp
unsigned long startupTime;

// ============================================================================
// Setup
// ============================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== ESP32 Relay Control Node ===");
  Serial.print("Node ID: ");
  Serial.println(NODE_ID);
  
  // Initialize relay pins
  Serial.println("Initializing relay pins...");
  for (int i = 0; i < RELAY_COUNT; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], LOW); // Relays off by default (assuming active HIGH)
    Serial.print("  Pin ");
    Serial.print(RELAY_PINS[i]);
    Serial.println(" configured as OUTPUT (LOW)");
  }
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Port: ");
    Serial.println(HTTP_PORT);
  } else {
    Serial.println("\nFailed to connect to WiFi!");
    Serial.println("Check credentials and restart.");
  }
  
  // Setup web server routes
  server.on("/control", HTTP_POST, handleControl);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/reset", HTTP_POST, handleReset);
  server.on("/history", HTTP_GET, handleHistory);
  
  // Enable CORS for all routes
  server.enableCORS(true);
  
  // Start server
  server.begin();
  Serial.println("HTTP server started");
  Serial.println("Ready to accept commands!");
  Serial.println("================================\n");
  
  startupTime = millis();
}

// ============================================================================
// Main Loop
// ============================================================================

void loop() {
  server.handleClient();
  
  // Check for timed pin operations
  unsigned long currentTime = millis();
  for (int i = 0; i < 40; i++) {
    if (pinStates[i].isActive && pinStates[i].duration > 0) {
      if (currentTime - pinStates[i].activatedAt >= pinStates[i].duration) {
        // Turn off the pin
        digitalWrite(i, LOW);
        pinStates[i].isActive = false;
        pinStates[i].duration = 0;
        Serial.print("Auto-OFF: Pin ");
        Serial.println(i);
      }
    }
  }
}

// ============================================================================
// Request Handlers
// ============================================================================

void handleControl() {
  // Parse JSON request body
  if (!server.hasArg("plain")) {
    sendError(400, "Missing request body");
    return;
  }
  
  String body = server.arg("plain");
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    sendError(400, "Invalid JSON");
    return;
  }
  
  // Extract parameters
  if (!doc.containsKey("pin")) {
    sendError(400, "Missing 'pin' parameter");
    return;
  }
  
  int pin = doc["pin"];
  String action = doc["action"] | "on";
  int duration = doc["duration_ms"] | 0;
  
  // Validate pin number
  if (pin < 0 || pin >= 40) {
    sendError(400, "Invalid pin number");
    return;
  }
  
  // Check if pin is configured
  bool pinConfigured = false;
  for (int i = 0; i < RELAY_COUNT; i++) {
    if (RELAY_PINS[i] == pin) {
      pinConfigured = true;
      break;
    }
  }
  
  if (!pinConfigured) {
    char msg[64];
    sprintf(msg, "Pin %d is not configured for relay control", pin);
    sendError(400, msg);
    return;
  }
  
  // Execute the action
  Serial.print("Command: Pin ");
  Serial.print(pin);
  Serial.print(" -> ");
  Serial.print(action);
  if (duration > 0) {
    Serial.print(" (");
    Serial.print(duration);
    Serial.print("ms)");
  }
  Serial.println();
  
  if (action == "on") {
    digitalWrite(pin, HIGH);
    pinStates[pin].isActive = true;
    pinStates[pin].activatedAt = millis();
    pinStates[pin].duration = 0;
    
  } else if (action == "off") {
    digitalWrite(pin, LOW);
    pinStates[pin].isActive = false;
    pinStates[pin].duration = 0;
    
  } else if (action == "toggle" || action == "timed") {
    digitalWrite(pin, HIGH);
    pinStates[pin].isActive = true;
    pinStates[pin].activatedAt = millis();
    pinStates[pin].duration = (duration > 0) ? duration : 250;
    
  } else {
    sendError(400, "Invalid action. Use: on, off, toggle, or timed");
    return;
  }
  
  // Record command in history
  addToHistory(pin, action, duration);
  
  // Send success response
  DynamicJsonDocument response(256);
  response["status"] = "success";
  response["node_id"] = NODE_ID;
  response["pin"] = pin;
  response["action"] = action;
  if (duration > 0) {
    response["duration_ms"] = duration;
  }
  response["timestamp"] = millis();
  
  String responseStr;
  serializeJson(response, responseStr);
  server.send(200, "application/json", responseStr);
}

void handleStatus() {
  DynamicJsonDocument response(1024);
  
  response["node_id"] = NODE_ID;
  response["status"] = "online";
  response["ip_address"] = WiFi.localIP().toString();
  response["uptime_ms"] = millis() - startupTime;
  response["timestamp"] = millis();
  
  // Add pin states
  JsonObject pins = response.createNestedObject("pin_states");
  for (int i = 0; i < RELAY_COUNT; i++) {
    int pin = RELAY_PINS[i];
    JsonObject pinInfo = pins.createNestedObject(String(pin));
    pinInfo["state"] = pinStates[pin].isActive ? "on" : "off";
    if (pinStates[pin].duration > 0) {
      pinInfo["duration_ms"] = pinStates[pin].duration;
      pinInfo["remaining_ms"] = pinStates[pin].duration - (millis() - pinStates[pin].activatedAt);
    }
  }
  
  String responseStr;
  serializeJson(response, responseStr);
  server.send(200, "application/json", responseStr);
}

void handleReset() {
  Serial.println("RESET: All pins OFF");
  
  // Turn off all configured relay pins
  for (int i = 0; i < RELAY_COUNT; i++) {
    digitalWrite(RELAY_PINS[i], LOW);
    pinStates[RELAY_PINS[i]].isActive = false;
    pinStates[RELAY_PINS[i]].duration = 0;
  }
  
  DynamicJsonDocument response(256);
  response["status"] = "success";
  response["message"] = "All relay pins reset to OFF";
  response["timestamp"] = millis();
  
  String responseStr;
  serializeJson(response, responseStr);
  server.send(200, "application/json", responseStr);
}

void handleHistory() {
  DynamicJsonDocument response(2048);
  
  response["node_id"] = NODE_ID;
  response["total_commands"] = historyCount;
  
  JsonArray history = response.createNestedArray("history");
  
  int limit = 50;
  if (server.hasArg("limit")) {
    limit = server.arg("limit").toInt();
  }
  
  int startIdx = (historyCount > limit) ? (historyCount - limit) : 0;
  for (int i = startIdx; i < historyCount && i < MAX_HISTORY; i++) {
    int idx = (historyIndex - historyCount + i + MAX_HISTORY) % MAX_HISTORY;
    JsonObject cmd = history.createNestedObject();
    cmd["timestamp"] = commandHistory[idx].timestamp;
    cmd["pin"] = commandHistory[idx].pin;
    cmd["action"] = commandHistory[idx].action;
    if (commandHistory[idx].duration > 0) {
      cmd["duration_ms"] = commandHistory[idx].duration;
    }
  }
  
  String responseStr;
  serializeJson(response, responseStr);
  server.send(200, "application/json", responseStr);
}

// ============================================================================
// Helper Functions
// ============================================================================

void sendError(int code, const char* message) {
  DynamicJsonDocument response(256);
  response["error"] = message;
  response["timestamp"] = millis();
  
  String responseStr;
  serializeJson(response, responseStr);
  server.send(code, "application/json", responseStr);
  
  Serial.print("ERROR ");
  Serial.print(code);
  Serial.print(": ");
  Serial.println(message);
}

void addToHistory(int pin, String action, int duration) {
  commandHistory[historyIndex].timestamp = millis();
  commandHistory[historyIndex].pin = pin;
  commandHistory[historyIndex].action = action;
  commandHistory[historyIndex].duration = duration;
  
  historyIndex = (historyIndex + 1) % MAX_HISTORY;
  if (historyCount < MAX_HISTORY) {
    historyCount++;
  }
}
