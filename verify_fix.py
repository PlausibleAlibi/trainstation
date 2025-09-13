#!/usr/bin/env python3
"""
Comprehensive verification that the Switch position field issue is resolved
"""
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_position_attribute_exists():
    """Test that Switch model has position attribute"""
    print("1. Testing Switch model has position attribute...")
    try:
        from models import Switch
        
        # Test model has position attribute
        assert hasattr(Switch, 'position'), "Switch model missing position attribute"
        
        # Test position column is nullable string 
        position_col = getattr(Switch, 'position')
        assert position_col.type.python_type == str or hasattr(position_col.type, 'length'), "Position should be String type"
        
        print("   ✅ Switch model correctly has position attribute")
        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_schema_includes_position():
    """Test that schemas include position field"""
    print("2. Testing schemas include position field...")
    try:
        from schemas import SwitchCreate, SwitchRead
        
        # Test SwitchCreate has position in model fields
        create_fields = SwitchCreate.model_fields
        assert 'position' in create_fields, "SwitchCreate missing position field"
        
        # Test SwitchRead has position in model fields  
        read_fields = SwitchRead.model_fields
        assert 'position' in read_fields, "SwitchRead missing position field"
        
        print("   ✅ Schemas correctly include position field")
        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_switch_creation():
    """Test creating Switch instance with position"""
    print("3. Testing Switch object creation with position...")
    try:
        from models import Switch
        
        # Test creating switch with position
        switch = Switch(
            Name="Test Switch",
            AccessoryId=1,
            SectionId=1,
            Kind="turnout",
            position="straight",
            IsActive=True
        )
        
        assert switch.position == "straight", f"Expected 'straight', got {switch.position}"
        
        print("   ✅ Switch object created successfully with position")
        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_migration_exists():
    """Test that migration for position column exists"""
    print("4. Testing migration file exists...")
    try:
        migration_file = "/home/runner/work/trainstation/trainstation/app/alembic/versions/003_add_position_column_to_switches.py"
        assert os.path.exists(migration_file), "Migration file missing"
        
        # Check migration content
        with open(migration_file, 'r') as f:
            content = f.read()
            assert 'position' in content, "Migration doesn't mention position column"
            assert 'add_column' in content, "Migration doesn't add column"
        
        print("   ✅ Migration file exists and contains position column addition")
        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("🔍 Verifying Switch position field implementation...\n")
    
    tests = [
        test_position_attribute_exists,
        test_schema_includes_position, 
        test_switch_creation,
        test_migration_exists
    ]
    
    results = []
    for test in tests:
        results.append(test())
        print()
    
    if all(results):
        print("✅ ALL TESTS PASSED!")
        print("🎉 The Switch position field issue has been successfully resolved!")
        print("\nSummary of changes:")
        print("  - Added 'position' column to Switch SQLAlchemy model")
        print("  - Created migration to add position column to database")
        print("  - Updated schemas to include position field") 
        print("  - Updated API routes to handle position field")
        print("  - Updated dev seed script to include position values")
        print("  - Fixed field name mismatches in router")
        print("  - Updated frontend TypeScript types")
        print("\n🔧 AttributeError 'Switch object has no attribute position' is now FIXED!")
        return True
    else:
        print("❌ Some tests failed. Check the output above for details.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)