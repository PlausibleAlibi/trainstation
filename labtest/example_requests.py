#!/usr/bin/env python3
"""
Example script demonstrating programmatic usage of the TrainStation test API.
This script shows how to interact with the test endpoints to control accessories.
"""

import asyncio
import json
import sys
from typing import List, Dict, Any

import httpx

class TrainStationTestClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def list_accessories(self) -> List[Dict[str, Any]]:
        """Get list of all available accessories"""
        response = await self.client.get(f"{self.base_url}/test/accessories")
        response.raise_for_status()
        data = response.json()
        return data.get("accessories", [])
    
    async def list_esp32_nodes(self) -> List[Dict[str, Any]]:
        """Get list of all ESP32 nodes"""
        response = await self.client.get(f"{self.base_url}/test/esp32-nodes")
        response.raise_for_status()
        data = response.json()
        return data.get("nodes", [])
    
    async def send_command(self, accessory_name: str, action: str, milliseconds: int = None) -> Dict[str, Any]:
        """Send a command to an accessory"""
        payload = {
            "accessory_name": accessory_name,
            "action": action
        }
        
        if milliseconds is not None:
            payload["milliseconds"] = milliseconds
        
        response = await self.client.post(
            f"{self.base_url}/test/accessory",
            json=payload
        )
        response.raise_for_status()
        return response.json()

async def demonstrate_basic_operations():
    """Demonstrate basic API operations"""
    print("🚂 TrainStation Test API Demo")
    print("=" * 50)
    
    async with TrainStationTestClient() as client:
        try:
            # List all accessories
            print("\n📋 Available Accessories:")
            accessories = await client.list_accessories()
            for i, acc in enumerate(accessories, 1):
                print(f"  {i:2d}. {acc['name']} ({acc['control_type']}) - {acc['esp32_node']}")
            
            # List ESP32 nodes
            print("\n🔌 ESP32 Nodes:")
            nodes = await client.list_esp32_nodes()
            for node in nodes:
                print(f"  • {node['node_id']} ({node['ip']}:{node['port']}) - {node['location']}")
            
            if not accessories:
                print("❌ No accessories found. Check backend configuration.")
                return
            
            # Test different control types
            await test_control_types(client, accessories)
            
        except httpx.RequestError as e:
            print(f"❌ Connection error: {e}")
            print("💡 Make sure the FastAPI backend is running on http://localhost:8000")
        except httpx.HTTPStatusError as e:
            print(f"❌ HTTP error {e.response.status_code}: {e.response.text}")

async def test_control_types(client: TrainStationTestClient, accessories: List[Dict[str, Any]]):
    """Test different accessory control types"""
    
    # Find examples of each control type
    onoff_accessory = next((acc for acc in accessories if acc['control_type'] == 'onOff'), None)
    toggle_accessory = next((acc for acc in accessories if acc['control_type'] == 'toggle'), None)
    timed_accessory = next((acc for acc in accessories if acc['control_type'] == 'timed'), None)
    
    print("\n🎛️  Testing Control Types:")
    print("-" * 30)
    
    # Test onOff control
    if onoff_accessory:
        print(f"\n🔴 Testing OnOff Control: {onoff_accessory['name']}")
        
        # Turn on
        result = await client.send_command(onoff_accessory['name'], 'on')
        print(f"  ✅ ON:  {result['simulated_result']}")
        
        await asyncio.sleep(1)  # Brief pause
        
        # Turn off
        result = await client.send_command(onoff_accessory['name'], 'off')
        print(f"  ✅ OFF: {result['simulated_result']}")
    
    # Test toggle control
    if toggle_accessory:
        print(f"\n🔄 Testing Toggle Control: {toggle_accessory['name']}")
        result = await client.send_command(toggle_accessory['name'], 'toggle', 750)
        print(f"  ✅ TOGGLE: {result['simulated_result']}")
    
    # Test timed control
    if timed_accessory:
        print(f"\n⏱️  Testing Timed Control: {timed_accessory['name']}")
        result = await client.send_command(timed_accessory['name'], 'timed', 3000)
        print(f"  ✅ TIMED: {result['simulated_result']}")

async def test_error_handling():
    """Test error handling scenarios"""
    print("\n⚠️  Testing Error Handling:")
    print("-" * 30)
    
    async with TrainStationTestClient() as client:
        try:
            # Test non-existent accessory
            await client.send_command("Non-existent Accessory", "on")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                print("  ✅ Correctly handled non-existent accessory (404)")
            else:
                print(f"  ❌ Unexpected error code: {e.response.status_code}")
        
        try:
            # Test invalid action (this might or might not fail depending on validation)
            result = await client.send_command("Signal Block 1", "invalid_action")
            print("  ⚠️  Invalid action was accepted (validation may be flexible)")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 400:
                print("  ✅ Correctly rejected invalid action (400)")
            else:
                print(f"  ❌ Unexpected error code: {e.response.status_code}")

async def automated_sequence_test():
    """Run an automated sequence of commands"""
    print("\n🤖 Automated Sequence Test:")
    print("-" * 30)
    
    async with TrainStationTestClient() as client:
        accessories = await client.list_accessories()
        
        if len(accessories) < 3:
            print("  ⚠️  Need at least 3 accessories for sequence test")
            return
        
        # Run a sequence of commands
        sequence = [
            ("Signal Block 1", "on"),
            ("Main Line Turnout 1", "toggle"),
            ("Main Crossing Gate", "timed"),
            ("Signal Block 1", "off"),
        ]
        
        for i, (accessory_name, action) in enumerate(sequence, 1):
            try:
                result = await client.send_command(accessory_name, action)
                print(f"  {i}. ✅ {accessory_name} -> {action}")
                await asyncio.sleep(0.5)  # Brief pause between commands
            except Exception as e:
                print(f"  {i}. ❌ {accessory_name} -> {action} FAILED: {e}")

async def main():
    """Main function"""
    if len(sys.argv) > 1:
        if sys.argv[1] == "--sequence":
            await automated_sequence_test()
        elif sys.argv[1] == "--errors":
            await test_error_handling()
        else:
            print("Usage: python example_requests.py [--sequence|--errors]")
            return
    else:
        await demonstrate_basic_operations()
    
    print("\n✨ Demo complete!")

if __name__ == "__main__":
    # Install required dependency: pip install httpx
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Demo interrupted by user")
    except ImportError:
        print("❌ Missing dependency. Install with: pip install httpx")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")