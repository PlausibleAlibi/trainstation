#!/usr/bin/env python3
"""
Test script to verify switch API functionality
"""
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    from schemas import SwitchCreate, SwitchRead
    print("✅ Successfully imported switch schemas")
    
    # Test creating a SwitchCreate object
    switch_create = SwitchCreate(
        name="Test Switch",
        accessoryId=1,
        sectionId=1,
        position="straight",
        isActive=True
    )
    print("✅ Successfully created SwitchCreate object")
    print(f"  Name: {switch_create.name}")
    print(f"  AccessoryId: {switch_create.accessoryId}")
    print(f"  SectionId: {switch_create.sectionId}")
    print(f"  Position: {switch_create.position}")
    print(f"  IsActive: {switch_create.isActive}")
    
    # Test creating a SwitchRead object  
    switch_read = SwitchRead(
        id=1,
        name="Test Switch",
        accessoryId=1,
        sectionId=1,
        position="straight",
        isActive=True
    )
    print("✅ Successfully created SwitchRead object")
    print(f"  ID: {switch_read.id}")
    print(f"  Position: {switch_read.position}")
    
    print("✅ All schema tests passed!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()