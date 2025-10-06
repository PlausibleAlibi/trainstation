"""
Relay Control Router
Provides endpoints for controlling relay devices through ESP32 nodes.
This router integrates with the ESP32RelayProxy for network-based relay control.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from hardware.relay_proxy import get_relay_proxy
from logging_config import get_logger

logger = get_logger("relay_router")

router = APIRouter(prefix="/relay", tags=["relay"])


class RelayControlRequest(BaseModel):
    """Request model for relay control operations."""
    node_address: str
    pin: int
    action: str  # "on", "off", "toggle", "timed"
    duration_ms: Optional[int] = None


class RelayStatusRequest(BaseModel):
    """Request model for getting relay node status."""
    node_address: str


class RelayControlResponse(BaseModel):
    """Response model for relay control operations."""
    status: str
    node_id: str
    pin: int
    action: str
    duration_ms: Optional[int] = None


@router.post("/control", response_model=RelayControlResponse)
async def control_relay(request: RelayControlRequest):
    """
    Send a control command to an ESP32 relay node.
    
    Args:
        request: Relay control request containing node address, pin, action, and optional duration
        
    Returns:
        Response from the ESP32 node
        
    Raises:
        HTTPException: On communication errors with the ESP32 node
    """
    proxy = get_relay_proxy()
    
    # Validate action
    valid_actions = ["on", "off", "toggle", "timed"]
    if request.action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Must be one of: {', '.join(valid_actions)}"
        )
    
    # Validate pin number
    if request.pin < 0 or request.pin > 40:  # ESP32 typical GPIO range
        raise HTTPException(
            status_code=400,
            detail="Invalid pin number. Must be between 0 and 40"
        )
    
    try:
        result = await proxy.send_command(
            node_address=request.node_address,
            pin=request.pin,
            action=request.action,
            duration_ms=request.duration_ms
        )
        
        return RelayControlResponse(
            status=result.get("status", "success"),
            node_id=result.get("node_id", "unknown"),
            pin=result.get("pin", request.pin),
            action=result.get("action", request.action),
            duration_ms=result.get("duration_ms")
        )
        
    except Exception as e:
        logger.error(
            "Failed to control relay",
            node_address=request.node_address,
            pin=request.pin,
            action=request.action,
            error=str(e)
        )
        raise HTTPException(
            status_code=503,
            detail=f"Failed to communicate with ESP32 node: {str(e)}"
        )


@router.get("/status")
async def get_node_status(node_address: str):
    """
    Get the status of an ESP32 relay node.
    
    Args:
        node_address: ESP32 node address (e.g., "192.168.1.101:8080")
        
    Returns:
        Status information from the ESP32 node
    """
    proxy = get_relay_proxy()
    
    try:
        status = await proxy.get_status(node_address)
        return status
        
    except Exception as e:
        logger.error(
            "Failed to get node status",
            node_address=node_address,
            error=str(e)
        )
        raise HTTPException(
            status_code=503,
            detail=f"Failed to communicate with ESP32 node: {str(e)}"
        )


@router.post("/reset")
async def reset_node(request: RelayStatusRequest):
    """
    Reset all pin states on an ESP32 relay node.
    
    Args:
        request: Request containing the node address
        
    Returns:
        Response from the ESP32 node
    """
    proxy = get_relay_proxy()
    
    try:
        result = await proxy.reset_node(request.node_address)
        return result
        
    except Exception as e:
        logger.error(
            "Failed to reset node",
            node_address=request.node_address,
            error=str(e)
        )
        raise HTTPException(
            status_code=503,
            detail=f"Failed to communicate with ESP32 node: {str(e)}"
        )


@router.get("/health")
def relay_health():
    """
    Health check endpoint for the relay service.
    
    Returns:
        Health status
    """
    proxy = get_relay_proxy()
    return {
        "status": "ok",
        "service": "relay",
        "mock_mode": proxy.mock_mode
    }
