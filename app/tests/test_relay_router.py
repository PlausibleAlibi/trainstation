"""
Tests for the relay router endpoints.
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

# Create a minimal test app with just the relay router
from routers import relay

app = FastAPI()
app.include_router(relay.router)

client = TestClient(app)


class TestRelayControlEndpoint:
    """Test the /relay/control endpoint."""
    
    @patch('routers.relay.get_relay_proxy')
    def test_control_relay_success(self, mock_get_proxy):
        """Test successful relay control."""
        mock_proxy = AsyncMock()
        mock_proxy.send_command = AsyncMock(return_value={
            "status": "success",
            "node_id": "esp32-01",
            "pin": 2,
            "action": "on"
        })
        mock_get_proxy.return_value = mock_proxy
        
        response = client.post("/relay/control", json={
            "node_address": "192.168.1.101:8080",
            "pin": 2,
            "action": "on"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["pin"] == 2
        assert data["action"] == "on"
    
    @patch('routers.relay.get_relay_proxy')
    def test_control_relay_with_duration(self, mock_get_proxy):
        """Test relay control with duration."""
        mock_proxy = AsyncMock()
        mock_proxy.send_command = AsyncMock(return_value={
            "status": "success",
            "node_id": "esp32-01",
            "pin": 4,
            "action": "toggle",
            "duration_ms": 500
        })
        mock_get_proxy.return_value = mock_proxy
        
        response = client.post("/relay/control", json={
            "node_address": "192.168.1.101:8080",
            "pin": 4,
            "action": "toggle",
            "duration_ms": 500
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "toggle"
        assert data["duration_ms"] == 500
    
    def test_control_relay_invalid_action(self):
        """Test relay control with invalid action."""
        response = client.post("/relay/control", json={
            "node_address": "192.168.1.101:8080",
            "pin": 2,
            "action": "invalid"
        })
        
        assert response.status_code == 400
        assert "Invalid action" in response.json()["detail"]
    
    def test_control_relay_invalid_pin(self):
        """Test relay control with invalid pin number."""
        response = client.post("/relay/control", json={
            "node_address": "192.168.1.101:8080",
            "pin": 100,  # Invalid pin
            "action": "on"
        })
        
        assert response.status_code == 400
        assert "Invalid pin" in response.json()["detail"]
    
    def test_control_relay_negative_pin(self):
        """Test relay control with negative pin number."""
        response = client.post("/relay/control", json={
            "node_address": "192.168.1.101:8080",
            "pin": -1,
            "action": "on"
        })
        
        assert response.status_code == 400
    
    @patch('routers.relay.get_relay_proxy')
    def test_control_relay_communication_error(self, mock_get_proxy):
        """Test relay control with communication error."""
        mock_proxy = AsyncMock()
        mock_proxy.send_command = AsyncMock(
            side_effect=Exception("Network error")
        )
        mock_get_proxy.return_value = mock_proxy
        
        response = client.post("/relay/control", json={
            "node_address": "192.168.1.101:8080",
            "pin": 2,
            "action": "on"
        })
        
        assert response.status_code == 503
        assert "Failed to communicate" in response.json()["detail"]


class TestRelayStatusEndpoint:
    """Test the /relay/status endpoint."""
    
    @patch('routers.relay.get_relay_proxy')
    def test_get_status_success(self, mock_get_proxy):
        """Test successful status retrieval."""
        mock_proxy = AsyncMock()
        mock_proxy.get_status = AsyncMock(return_value={
            "node_id": "esp32-01",
            "status": "online",
            "pin_states": {
                "2": {"state": "on"},
                "4": {"state": "off"}
            },
            "uptime_seconds": 12345
        })
        mock_get_proxy.return_value = mock_proxy
        
        response = client.get("/relay/status?node_address=192.168.1.101:8080")
        
        assert response.status_code == 200
        data = response.json()
        assert data["node_id"] == "esp32-01"
        assert data["status"] == "online"
        assert "pin_states" in data
    
    @patch('routers.relay.get_relay_proxy')
    def test_get_status_communication_error(self, mock_get_proxy):
        """Test status retrieval with communication error."""
        mock_proxy = AsyncMock()
        mock_proxy.get_status = AsyncMock(
            side_effect=Exception("Network error")
        )
        mock_get_proxy.return_value = mock_proxy
        
        response = client.get("/relay/status?node_address=192.168.1.101:8080")
        
        assert response.status_code == 503


class TestRelayResetEndpoint:
    """Test the /relay/reset endpoint."""
    
    @patch('routers.relay.get_relay_proxy')
    def test_reset_node_success(self, mock_get_proxy):
        """Test successful node reset."""
        mock_proxy = AsyncMock()
        mock_proxy.reset_node = AsyncMock(return_value={
            "status": "success",
            "message": "All relay pins reset to OFF"
        })
        mock_get_proxy.return_value = mock_proxy
        
        response = client.post("/relay/reset", json={
            "node_address": "192.168.1.101:8080"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "reset" in data["message"].lower()
    
    @patch('routers.relay.get_relay_proxy')
    def test_reset_node_communication_error(self, mock_get_proxy):
        """Test node reset with communication error."""
        mock_proxy = AsyncMock()
        mock_proxy.reset_node = AsyncMock(
            side_effect=Exception("Network error")
        )
        mock_get_proxy.return_value = mock_proxy
        
        response = client.post("/relay/reset", json={
            "node_address": "192.168.1.101:8080"
        })
        
        assert response.status_code == 503


class TestRelayHealthEndpoint:
    """Test the /relay/health endpoint."""
    
    def test_health_check(self):
        """Test relay service health check."""
        response = client.get("/relay/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "relay"
        assert "mock_mode" in data


class TestRelayRouterValidation:
    """Test input validation in relay router."""
    
    def test_missing_required_fields(self):
        """Test request with missing required fields."""
        response = client.post("/relay/control", json={
            "pin": 2,
            "action": "on"
            # Missing node_address
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_invalid_json(self):
        """Test request with invalid JSON."""
        response = client.post(
            "/relay/control",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422
    
    def test_valid_actions(self):
        """Test all valid action types."""
        valid_actions = ["on", "off", "toggle", "timed"]
        
        for action in valid_actions:
            with patch('routers.relay.get_relay_proxy') as mock_get_proxy:
                mock_proxy = AsyncMock()
                mock_proxy.send_command = AsyncMock(return_value={
                    "status": "success",
                    "node_id": "test",
                    "pin": 2,
                    "action": action
                })
                mock_get_proxy.return_value = mock_proxy
                
                response = client.post("/relay/control", json={
                    "node_address": "test:8080",
                    "pin": 2,
                    "action": action
                })
                
                assert response.status_code == 200, f"Action '{action}' should be valid"
