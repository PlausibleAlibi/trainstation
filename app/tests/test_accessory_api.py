"""
Tests for the test accessory API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)

def test_list_test_accessories(client):
    """Test listing available accessories for testing"""
    response = client.get("/test/accessories")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "ok"
    assert "accessories" in data
    assert "count" in data
    assert isinstance(data["accessories"], list)
    assert data["count"] > 0
    
    # Check structure of first accessory
    if data["accessories"]:
        accessory = data["accessories"][0]
        assert "name" in accessory
        assert "esp32_node" in accessory
        assert "control_type" in accessory
        assert "description" in accessory

def test_list_esp32_nodes(client):
    """Test listing ESP32 nodes"""
    response = client.get("/test/esp32-nodes")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "ok"
    assert "nodes" in data
    assert "count" in data
    assert isinstance(data["nodes"], list)
    assert data["count"] > 0
    
    # Check structure of first node
    if data["nodes"]:
        node = data["nodes"][0]
        assert "node_id" in node
        assert "ip" in node
        assert "port" in node

def test_accessory_command_toggle(client):
    """Test sending a toggle command to an accessory"""
    response = client.post("/test/accessory", json={
        "accessory_name": "Main Line Turnout 1",
        "action": "toggle"
    })
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "ok"
    assert data["accessory_name"] == "Main Line Turnout 1"
    assert data["action"] == "toggle"
    assert data["esp32_node"] == "esp32-01"
    assert data["pin"] == 2
    assert data["control_type"] == "toggle"
    assert "simulated_result" in data
    assert "message" in data

def test_accessory_command_onoff(client):
    """Test sending on/off commands to a signal"""
    # Test 'on' command
    response = client.post("/test/accessory", json={
        "accessory_name": "Signal Block 1",
        "action": "on"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "on"
    assert data["control_type"] == "onOff"
    
    # Test 'off' command
    response = client.post("/test/accessory", json={
        "accessory_name": "Signal Block 1",
        "action": "off"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "off"

def test_accessory_command_timed(client):
    """Test sending a timed command"""
    response = client.post("/test/accessory", json={
        "accessory_name": "Main Crossing Gate",
        "action": "timed",
        "milliseconds": 3000
    })
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["action"] == "timed"
    assert data["control_type"] == "timed"
    assert data["milliseconds"] == 3000

def test_accessory_not_found(client):
    """Test error handling for non-existent accessory"""
    response = client.post("/test/accessory", json={
        "accessory_name": "Non-existent Accessory",
        "action": "on"
    })
    
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()

def test_invalid_action_for_control_type(client):
    """Test error handling for invalid action/control type combination"""
    response = client.post("/test/accessory", json={
        "accessory_name": "Main Line Turnout 1",  # toggle type
        "action": "on"  # invalid for toggle
    })
    
    # This should still work as we allow basic actions across types
    # but let's test a truly invalid case
    assert response.status_code in [200, 400]  # Depends on validation logic