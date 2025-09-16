"""
Test router for accessory communication testing.
Provides endpoints to test end-to-end communication with ESP32 nodes.
"""
import yaml
import os
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from logging_config import get_logger

logger = get_logger("test_accessory")

router = APIRouter(prefix="/test", tags=["testing"])

class TestAccessoryRequest(BaseModel):
    accessory_name: str
    action: str  # "on", "off", "toggle", "timed"
    milliseconds: Optional[int] = None  # for timed actions

class TestAccessoryResponse(BaseModel):
    status: str
    accessory_name: str
    action: str
    esp32_node: str
    hardware_address: str
    pin: int
    control_type: str
    milliseconds: Optional[int] = None
    simulated_result: str
    message: str

def load_accessory_map() -> Dict[str, Any]:
    """Load accessory mapping from accessory_map.yaml"""
    # Look for the file in the project root directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir))
    map_file = os.path.join(project_root, "accessory_map.yaml")
    
    try:
        with open(map_file, 'r') as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        logger.error(f"Accessory map file not found: {map_file}")
        raise HTTPException(status_code=500, detail="Accessory map configuration not found")
    except yaml.YAMLError as e:
        logger.error(f"Error parsing accessory map: {e}")
        raise HTTPException(status_code=500, detail="Invalid accessory map configuration")

@router.get("/accessories")
def list_test_accessories():
    """List all available accessories for testing"""
    try:
        config = load_accessory_map()
        accessories = []
        
        for name, details in config.get("accessories", {}).items():
            accessories.append({
                "name": name,
                "esp32_node": details.get("esp32_node"),
                "control_type": details.get("control_type"),
                "description": details.get("description", "")
            })
        
        return {
            "status": "ok",
            "accessories": accessories,
            "count": len(accessories)
        }
    except Exception as e:
        logger.error(f"Error listing test accessories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/accessory", response_model=TestAccessoryResponse)
def test_accessory_command(request: TestAccessoryRequest):
    """
    Test endpoint to simulate sending commands to ESP32 nodes via accessories.
    
    This endpoint:
    1. Looks up the accessory in accessory_map.yaml
    2. Extracts the ESP32 node and pin information
    3. Simulates sending the command (logs the action)
    4. Returns detailed information about the intended operation
    """
    try:
        config = load_accessory_map()
        accessories = config.get("accessories", {})
        
        # Check if accessory exists
        if request.accessory_name not in accessories:
            available = list(accessories.keys())
            raise HTTPException(
                status_code=404, 
                detail=f"Accessory '{request.accessory_name}' not found. Available: {available}"
            )
        
        accessory = accessories[request.accessory_name]
        esp32_node = accessory.get("esp32_node")
        address = accessory.get("address")
        pin = accessory.get("pin")
        control_type = accessory.get("control_type")
        
        # Validate action against control type
        valid_actions = {
            "onOff": ["on", "off"],
            "toggle": ["toggle"],
            "timed": ["timed", "on"]  # timed can also accept 'on' with duration
        }
        
        if control_type not in valid_actions:
            raise HTTPException(status_code=400, detail=f"Unknown control type: {control_type}")
        
        if request.action not in valid_actions[control_type] and request.action not in ["on", "off", "toggle", "timed"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Action '{request.action}' not valid for control type '{control_type}'. Valid actions: {valid_actions[control_type]}"
            )
        
        # Handle timed actions
        duration_ms = None
        if request.action == "timed" or (control_type == "timed" and request.action == "on"):
            duration_ms = request.milliseconds or accessory.get("timed_duration_ms", 5000)
        elif request.action == "toggle" and request.milliseconds:
            duration_ms = request.milliseconds
        
        # Simulate the hardware command
        command_details = {
            "esp32_node": esp32_node,
            "address": address,
            "pin": pin,
            "action": request.action,
            "duration_ms": duration_ms
        }
        
        # Log the simulated command
        logger.info(
            "Simulated ESP32 command",
            accessory_name=request.accessory_name,
            **command_details
        )
        
        # Simulate sending HTTP request to ESP32
        simulated_result = f"SUCCESS: Command sent to {esp32_node} at {address}"
        if duration_ms:
            simulated_result += f" (duration: {duration_ms}ms)"
        
        # Create response message
        message = f"Simulated {request.action} command for '{request.accessory_name}' on pin {pin}"
        if duration_ms:
            message += f" for {duration_ms}ms"
        
        return TestAccessoryResponse(
            status="ok",
            accessory_name=request.accessory_name,
            action=request.action,
            esp32_node=esp32_node,
            hardware_address=address,
            pin=pin,
            control_type=control_type,
            milliseconds=duration_ms,
            simulated_result=simulated_result,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing test command: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@router.get("/esp32-nodes")
def list_esp32_nodes():
    """List all configured ESP32 nodes"""
    try:
        config = load_accessory_map()
        nodes = config.get("esp32_nodes", {})
        
        node_list = []
        for node_id, details in nodes.items():
            node_list.append({
                "node_id": node_id,
                "ip": details.get("ip"),
                "port": details.get("port"),
                "description": details.get("description", ""),
                "location": details.get("location", "")
            })
        
        return {
            "status": "ok",
            "nodes": node_list,
            "count": len(node_list)
        }
    except Exception as e:
        logger.error(f"Error listing ESP32 nodes: {e}")
        raise HTTPException(status_code=500, detail=str(e))