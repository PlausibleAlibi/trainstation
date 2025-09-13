#!/usr/bin/env python3
"""
Test script to verify Switch model has position attribute
"""
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    from models import Switch
    print("✅ Successfully imported Switch model")
    
    # Check if position attribute exists
    if hasattr(Switch, 'position'):
        print("✅ Switch model has 'position' attribute")
        position_column = getattr(Switch, 'position')
        print(f"✅ Position column: {position_column}")
    else:
        print("❌ Switch model does NOT have 'position' attribute")
        print("Available attributes:")
        for attr in dir(Switch):
            if not attr.startswith('_'):
                print(f"  - {attr}")
    
    # Test creating a switch object (without database)
    try:
        switch = Switch(
            Name="Test Switch",
            AccessoryId=1,
            SectionId=1,
            Kind="turnout",
            position="straight",
            IsActive=True
        )
        print("✅ Successfully created Switch object with position attribute")
        print(f"✅ Switch position: {switch.position}")
    except Exception as e:
        print(f"❌ Error creating Switch object: {e}")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Unexpected error: {e}")