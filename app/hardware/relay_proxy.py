"""
ESP32 Relay Proxy
Provides HTTP-based communication with ESP32 relay control nodes.
This module handles all network communication with distributed ESP32 devices.
"""
import os
import httpx
from typing import Optional, Dict, Any
from logging_config import get_logger

logger = get_logger("relay_proxy")


class ESP32RelayProxy:
    """
    Proxy for communicating with ESP32 relay control nodes via HTTP.
    Supports multiple control modes: on, off, toggle, and timed operations.
    """
    
    def __init__(self, timeout: float = 5.0):
        """
        Initialize the ESP32 relay proxy.
        
        Args:
            timeout: Request timeout in seconds (default: 5.0)
        """
        self.timeout = timeout
        self.mock_mode = os.getenv("ESP32_MOCK_MODE", "false").lower() == "true"
        
        if self.mock_mode:
            logger.info("ESP32 relay proxy running in MOCK mode")
        
    async def send_command(
        self,
        node_address: str,
        pin: int,
        action: str,
        duration_ms: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Send a control command to an ESP32 node.
        
        Args:
            node_address: ESP32 node address (e.g., "192.168.1.101:8080")
            pin: GPIO pin number to control
            action: Action to perform ("on", "off", "toggle", "timed")
            duration_ms: Duration in milliseconds (for toggle/timed actions)
            
        Returns:
            Response dict from ESP32 node
            
        Raises:
            httpx.HTTPError: On network or HTTP errors
        """
        if self.mock_mode:
            return self._mock_response(pin, action, duration_ms)
        
        url = f"http://{node_address}/control"
        payload = {
            "pin": pin,
            "action": action
        }
        
        if duration_ms is not None:
            payload["duration_ms"] = duration_ms
        
        logger.info(
            "Sending command to ESP32",
            node_address=node_address,
            pin=pin,
            action=action,
            duration_ms=duration_ms
        )
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                result = response.json()
                
                logger.info(
                    "ESP32 command successful",
                    node_address=node_address,
                    pin=pin,
                    action=action,
                    status=result.get("status")
                )
                
                return result
                
        except httpx.TimeoutException as e:
            logger.error(
                "ESP32 request timeout",
                node_address=node_address,
                pin=pin,
                error=str(e)
            )
            raise
            
        except httpx.HTTPError as e:
            logger.error(
                "ESP32 request failed",
                node_address=node_address,
                pin=pin,
                error=str(e)
            )
            raise
    
    async def get_status(self, node_address: str) -> Dict[str, Any]:
        """
        Get the status of an ESP32 node.
        
        Args:
            node_address: ESP32 node address (e.g., "192.168.1.101:8080")
            
        Returns:
            Status dict from ESP32 node
        """
        if self.mock_mode:
            return self._mock_status_response(node_address)
        
        url = f"http://{node_address}/status"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPError as e:
            logger.error(
                "Failed to get ESP32 status",
                node_address=node_address,
                error=str(e)
            )
            raise
    
    async def reset_node(self, node_address: str) -> Dict[str, Any]:
        """
        Reset all pin states on an ESP32 node.
        
        Args:
            node_address: ESP32 node address (e.g., "192.168.1.101:8080")
            
        Returns:
            Response dict from ESP32 node
        """
        if self.mock_mode:
            return {"status": "success", "message": "Node reset (mock mode)"}
        
        url = f"http://{node_address}/reset"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url)
                response.raise_for_status()
                return response.json()
                
        except httpx.HTTPError as e:
            logger.error(
                "Failed to reset ESP32 node",
                node_address=node_address,
                error=str(e)
            )
            raise
    
    def _mock_response(
        self,
        pin: int,
        action: str,
        duration_ms: Optional[int]
    ) -> Dict[str, Any]:
        """Generate a mock response for testing without real hardware."""
        response = {
            "status": "success",
            "node_id": "mock-esp32",
            "pin": pin,
            "action": action,
            "timestamp": "2024-01-01T00:00:00.000000"
        }
        
        if duration_ms is not None:
            response["duration_ms"] = duration_ms
        
        logger.debug(
            "Mock ESP32 response generated",
            pin=pin,
            action=action
        )
        
        return response
    
    def _mock_status_response(self, node_address: str) -> Dict[str, Any]:
        """Generate a mock status response."""
        return {
            "node_id": f"mock-{node_address}",
            "status": "online",
            "timestamp": "2024-01-01T00:00:00.000000",
            "pin_states": {},
            "uptime_seconds": 0
        }


# Global instance for convenience
_proxy_instance: Optional[ESP32RelayProxy] = None


def get_relay_proxy() -> ESP32RelayProxy:
    """
    Get the global ESP32RelayProxy instance.
    Creates one if it doesn't exist.
    """
    global _proxy_instance
    if _proxy_instance is None:
        _proxy_instance = ESP32RelayProxy()
    return _proxy_instance
