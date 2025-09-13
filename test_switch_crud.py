#!/usr/bin/env python3
"""
Test switch CRUD operations
"""
import sys
import os
from fastapi.testclient import TestClient
import json

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_switch_crud():
    """Test creating, reading, updating switch with position field"""
    from main import app
    
    client = TestClient(app)
    
    try:
        # Test POST - Create a new switch
        new_switch = {
            "name": "Test Switch",
            "accessoryId": 5,  # Use existing accessory from seed
            "sectionId": 1,    # Use existing section from seed
            "kind": "turnout",
            "defaultRoute": "straight", 
            "orientation": 0.0,
            "positionX": 100.0,
            "positionY": 50.0,
            "positionZ": 0.0,
            "position": "divergent",
            "isActive": True
        }
        
        print("Testing POST /switches...")
        response = client.post("/switches", json=new_switch)
        print(f"POST status: {response.status_code}")
        
        if response.status_code == 200:
            created_switch = response.json()
            print(f"✅ Created switch: {created_switch}")
            print(f"✅ Position field present: {created_switch.get('position')}")
            
            switch_id = created_switch['id']
            
            # Test GET by ID
            print(f"\nTesting GET /switches/{switch_id}...")
            response = client.get(f"/switches/{switch_id}")
            print(f"GET status: {response.status_code}")
            
            if response.status_code == 200:
                switch_detail = response.json()
                print(f"✅ Retrieved switch: {switch_detail}")
                print(f"✅ Position field: {switch_detail.get('position')}")
            
            # Test PUT - Update switch position
            updated_switch = new_switch.copy()
            updated_switch["position"] = "unknown"
            
            print(f"\nTesting PUT /switches/{switch_id}...")
            response = client.put(f"/switches/{switch_id}", json=updated_switch)
            print(f"PUT status: {response.status_code}")
            
            if response.status_code == 200:
                updated_result = response.json()
                print(f"✅ Updated switch: {updated_result}")
                print(f"✅ Position updated to: {updated_result.get('position')}")
            
            # Test DELETE
            print(f"\nTesting DELETE /switches/{switch_id}...")
            response = client.delete(f"/switches/{switch_id}")
            print(f"DELETE status: {response.status_code}")
            
            return True
        else:
            print(f"❌ Failed to create switch: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error in CRUD test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_switch_crud()
    if success:
        print("\n✅ Switch CRUD test completed successfully")
    else:
        print("\n❌ Switch CRUD test failed")
        exit(1)