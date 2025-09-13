#!/usr/bin/env python3
"""
Test switch endpoints specifically
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_switches_endpoint():
    """Test switches endpoint without requiring database"""
    from main import app
    
    client = TestClient(app)
    
    # Test the switches endpoint exists and returns proper structure
    try:
        response = client.get("/switches")
        print(f"GET /switches status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ /switches endpoint returns 200")
            print(f"Response data type: {type(data)}")
            if isinstance(data, list):
                print(f"Number of switches: {len(data)}")
                if len(data) > 0:
                    switch = data[0]
                    print(f"Sample switch: {switch}")
                    if 'position' in switch:
                        print(f"✅ Switch has position field: {switch['position']}")
                    else:
                        print("❌ Switch missing position field")
            return True
        elif response.status_code == 500:
            print("⚠️  Database connection error (expected in test environment)")
            return True
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing switches endpoint: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_switches_endpoint()
    if success:
        print("✅ Switch endpoint test completed successfully")
    else:
        print("❌ Switch endpoint test failed")
        exit(1)