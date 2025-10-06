"""
Integration tests for ESP32 relay proxy.
These tests mock ESP32 HTTP responses to test the full communication stack.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from hardware.relay_proxy import ESP32RelayProxy, get_relay_proxy


class TestESP32RelayProxyMock:
    """Test ESP32RelayProxy with mock mode enabled."""
    
    def test_mock_mode_initialization(self):
        """Test that mock mode can be initialized."""
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'true'}):
            proxy = ESP32RelayProxy()
            assert proxy.mock_mode is True
    
    @pytest.mark.asyncio
    async def test_mock_send_command(self):
        """Test sending a command in mock mode."""
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'true'}):
            proxy = ESP32RelayProxy()
            
            result = await proxy.send_command(
                node_address="192.168.1.101:8080",
                pin=2,
                action="on"
            )
            
            assert result["status"] == "success"
            assert result["node_id"] == "mock-esp32"
            assert result["pin"] == 2
            assert result["action"] == "on"
    
    @pytest.mark.asyncio
    async def test_mock_send_command_with_duration(self):
        """Test sending a timed command in mock mode."""
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'true'}):
            proxy = ESP32RelayProxy()
            
            result = await proxy.send_command(
                node_address="192.168.1.101:8080",
                pin=4,
                action="toggle",
                duration_ms=500
            )
            
            assert result["status"] == "success"
            assert result["pin"] == 4
            assert result["action"] == "toggle"
            assert result["duration_ms"] == 500
    
    @pytest.mark.asyncio
    async def test_mock_get_status(self):
        """Test getting status in mock mode."""
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'true'}):
            proxy = ESP32RelayProxy()
            
            status = await proxy.get_status("192.168.1.101:8080")
            
            assert "node_id" in status
            assert status["status"] == "online"
            assert "pin_states" in status
    
    @pytest.mark.asyncio
    async def test_mock_reset_node(self):
        """Test resetting a node in mock mode."""
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'true'}):
            proxy = ESP32RelayProxy()
            
            result = await proxy.reset_node("192.168.1.101:8080")
            
            assert result["status"] == "success"
            assert "mock mode" in result["message"]


class TestESP32RelayProxyHTTP:
    """Test ESP32RelayProxy with mocked HTTP responses."""
    
    @pytest.mark.asyncio
    async def test_send_command_success(self):
        """Test successful HTTP command."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "status": "success",
            "node_id": "esp32-01",
            "pin": 2,
            "action": "on",
            "timestamp": "2024-01-01T00:00:00"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'false'}):
            proxy = ESP32RelayProxy()
            
            with patch('httpx.AsyncClient') as mock_client:
                mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                    return_value=mock_response
                )
                
                result = await proxy.send_command(
                    node_address="192.168.1.101:8080",
                    pin=2,
                    action="on"
                )
                
                assert result["status"] == "success"
                assert result["node_id"] == "esp32-01"
                assert result["pin"] == 2
    
    @pytest.mark.asyncio
    async def test_send_command_with_duration(self):
        """Test HTTP command with duration."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "status": "success",
            "node_id": "esp32-01",
            "pin": 4,
            "action": "toggle",
            "duration_ms": 500,
            "timestamp": "2024-01-01T00:00:00"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'false'}):
            proxy = ESP32RelayProxy()
            
            with patch('httpx.AsyncClient') as mock_client:
                mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                    return_value=mock_response
                )
                
                result = await proxy.send_command(
                    node_address="192.168.1.101:8080",
                    pin=4,
                    action="toggle",
                    duration_ms=500
                )
                
                assert result["action"] == "toggle"
                assert result["duration_ms"] == 500
    
    @pytest.mark.asyncio
    async def test_send_command_timeout(self):
        """Test handling of HTTP timeout."""
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'false'}):
            proxy = ESP32RelayProxy(timeout=1.0)
            
            with patch('httpx.AsyncClient') as mock_client:
                mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                    side_effect=httpx.TimeoutException("Timeout")
                )
                
                with pytest.raises(httpx.TimeoutException):
                    await proxy.send_command(
                        node_address="192.168.1.101:8080",
                        pin=2,
                        action="on"
                    )
    
    @pytest.mark.asyncio
    async def test_send_command_http_error(self):
        """Test handling of HTTP errors."""
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'false'}):
            proxy = ESP32RelayProxy()
            
            with patch('httpx.AsyncClient') as mock_client:
                mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                    side_effect=httpx.HTTPError("Connection failed")
                )
                
                with pytest.raises(httpx.HTTPError):
                    await proxy.send_command(
                        node_address="192.168.1.101:8080",
                        pin=2,
                        action="on"
                    )
    
    @pytest.mark.asyncio
    async def test_get_status_success(self):
        """Test successful status retrieval."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "node_id": "esp32-01",
            "status": "online",
            "pin_states": {
                "2": {"state": "on"},
                "4": {"state": "off"}
            },
            "uptime_seconds": 12345
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'false'}):
            proxy = ESP32RelayProxy()
            
            with patch('httpx.AsyncClient') as mock_client:
                mock_client.return_value.__aenter__.return_value.get = AsyncMock(
                    return_value=mock_response
                )
                
                status = await proxy.get_status("192.168.1.101:8080")
                
                assert status["node_id"] == "esp32-01"
                assert status["status"] == "online"
                assert "pin_states" in status
    
    @pytest.mark.asyncio
    async def test_reset_node_success(self):
        """Test successful node reset."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "status": "success",
            "message": "All relay pins reset to OFF",
            "timestamp": "2024-01-01T00:00:00"
        }
        mock_response.raise_for_status = MagicMock()
        
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'false'}):
            proxy = ESP32RelayProxy()
            
            with patch('httpx.AsyncClient') as mock_client:
                mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                    return_value=mock_response
                )
                
                result = await proxy.reset_node("192.168.1.101:8080")
                
                assert result["status"] == "success"
                assert "reset" in result["message"].lower()


class TestRelayProxyGlobalInstance:
    """Test the global relay proxy instance."""
    
    def test_get_relay_proxy_singleton(self):
        """Test that get_relay_proxy returns the same instance."""
        proxy1 = get_relay_proxy()
        proxy2 = get_relay_proxy()
        
        assert proxy1 is proxy2
    
    def test_get_relay_proxy_creates_instance(self):
        """Test that get_relay_proxy creates an instance if needed."""
        # Reset global instance
        import hardware.relay_proxy
        hardware.relay_proxy._proxy_instance = None
        
        proxy = get_relay_proxy()
        assert proxy is not None
        assert isinstance(proxy, ESP32RelayProxy)


class TestActionTypes:
    """Test different action types."""
    
    @pytest.mark.asyncio
    async def test_action_on(self):
        """Test 'on' action."""
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'true'}):
            proxy = ESP32RelayProxy()
            result = await proxy.send_command("test:8080", 2, "on")
            assert result["action"] == "on"
    
    @pytest.mark.asyncio
    async def test_action_off(self):
        """Test 'off' action."""
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'true'}):
            proxy = ESP32RelayProxy()
            result = await proxy.send_command("test:8080", 2, "off")
            assert result["action"] == "off"
    
    @pytest.mark.asyncio
    async def test_action_toggle(self):
        """Test 'toggle' action."""
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'true'}):
            proxy = ESP32RelayProxy()
            result = await proxy.send_command("test:8080", 2, "toggle", 250)
            assert result["action"] == "toggle"
            assert result["duration_ms"] == 250
    
    @pytest.mark.asyncio
    async def test_action_timed(self):
        """Test 'timed' action."""
        with patch.dict('os.environ', {'ESP32_MOCK_MODE': 'true'}):
            proxy = ESP32RelayProxy()
            result = await proxy.send_command("test:8080", 2, "timed", 5000)
            assert result["action"] == "timed"
            assert result["duration_ms"] == 5000
