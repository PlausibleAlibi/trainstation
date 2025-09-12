"""
Dev Database Seed Script for Model Train Layout

Creates a comprehensive model train layout featuring:
- An oval mainline track with two sections
- An internal bypass section for train passing
- A siding section for train parking
- Three switches with logical SectionConnections
- Categories for signals, lights, and buildings
- Accessories for a signal, two lights, and a house
- Automatic creation of SectionConnections to form the full track graph

Usage:
    python app/dev_seed.py
    or from Python: from app.dev_seed import seed_dev_layout; seed_dev_layout()
"""

import sys
import os

# Add the app directory to the path if we're running from the root
if __name__ == "__main__":
    # Get the directory containing this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # If we're in the app directory, add the parent to sys.path
    if os.path.basename(script_dir) == "app":
        parent_dir = os.path.dirname(script_dir)
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)

try:
    from app.db import SessionLocal
    from app import models
except ImportError:
    # Try relative imports if running from the app directory
    from db import SessionLocal
    import models


def seed_dev_layout():
    """Seed the database with a comprehensive model train layout."""
    
    db = SessionLocal()
    
    try:
        # Begin transaction
        print("🚂 Starting dev database seeding...")
        
        # 1. Create Categories
        print("📂 Creating categories...")
        categories_data = [
            {"Name": "Signals", "Description": "Track signals and indicators", "SortOrder": 1},
            {"Name": "Lights", "Description": "Yard and building lights", "SortOrder": 2},
            {"Name": "Buildings", "Description": "Animated accessories and structures", "SortOrder": 3},
            {"Name": "Switches", "Description": "Track turnout motors", "SortOrder": 4},
        ]
        
        categories = {}
        for cat_data in categories_data:
            existing = db.query(models.Category).filter_by(Name=cat_data["Name"]).first()
            if not existing:
                category = models.Category(**cat_data)
                db.add(category)
                db.flush()  # Get the ID
                categories[cat_data["Name"]] = category
                print(f"  ✓ Created category: {cat_data['Name']}")
            else:
                categories[cat_data["Name"]] = existing
                print(f"  ↪ Using existing category: {cat_data['Name']}")
        
        # 2. Create TrackLine
        print("🛤️  Creating track line...")
        trackline_data = {
            "Name": "Main Layout",
            "Description": "Primary model train layout with oval mainline, bypass, and siding",
            "IsActive": True
        }
        
        existing_trackline = db.query(models.TrackLine).filter_by(Name=trackline_data["Name"]).first()
        if not existing_trackline:
            trackline = models.TrackLine(**trackline_data)
            db.add(trackline)
            db.flush()
            print(f"  ✓ Created track line: {trackline_data['Name']}")
        else:
            trackline = existing_trackline
            print(f"  ↪ Using existing track line: {trackline_data['Name']}")
        
        # 3. Create Sections
        print("📍 Creating track sections...")
        sections_data = [
            {
                "Name": "Mainline East",
                "TrackLineId": trackline.Id,
                "PositionX": 100.0,
                "PositionY": 0.0,
                "PositionZ": 0.0,
                "IsActive": True
            },
            {
                "Name": "Mainline West", 
                "TrackLineId": trackline.Id,
                "PositionX": -100.0,
                "PositionY": 0.0,
                "PositionZ": 0.0,
                "IsActive": True
            },
            {
                "Name": "Bypass Section",
                "TrackLineId": trackline.Id,
                "PositionX": 0.0,
                "PositionY": 50.0,
                "PositionZ": 0.0,
                "IsActive": True
            },
            {
                "Name": "Siding Section",
                "TrackLineId": trackline.Id,
                "PositionX": 150.0,
                "PositionY": -50.0,
                "PositionZ": 0.0,
                "IsActive": True
            }
        ]
        
        sections = {}
        for section_data in sections_data:
            existing = db.query(models.Section).filter_by(Name=section_data["Name"]).first()
            if not existing:
                section = models.Section(**section_data)
                db.add(section)
                db.flush()
                sections[section_data["Name"]] = section
                print(f"  ✓ Created section: {section_data['Name']}")
            else:
                sections[section_data["Name"]] = existing
                print(f"  ↪ Using existing section: {section_data['Name']}")
        
        # 4. Create Accessories
        print("🔧 Creating accessories...")
        accessories_data = [
            {
                "Name": "Main Signal",
                "CategoryId": categories["Signals"].Id,
                "ControlType": "onOff",
                "Address": "101",
                "IsActive": True,
                "SectionId": sections["Mainline East"].Id
            },
            {
                "Name": "Yard Light 1",
                "CategoryId": categories["Lights"].Id,
                "ControlType": "onOff", 
                "Address": "201",
                "IsActive": True,
                "SectionId": sections["Bypass Section"].Id
            },
            {
                "Name": "Yard Light 2",
                "CategoryId": categories["Lights"].Id,
                "ControlType": "toggle",
                "Address": "202", 
                "IsActive": True,
                "SectionId": sections["Siding Section"].Id
            },
            {
                "Name": "Station House",
                "CategoryId": categories["Buildings"].Id,
                "ControlType": "timed",
                "Address": "301",
                "IsActive": True,
                "TimedMs": 5000,
                "SectionId": sections["Mainline West"].Id
            },
            {
                "Name": "Switch 1 Motor",
                "CategoryId": categories["Switches"].Id,
                "ControlType": "toggle",
                "Address": "401",
                "IsActive": True,
                "SectionId": sections["Mainline East"].Id
            },
            {
                "Name": "Switch 2 Motor", 
                "CategoryId": categories["Switches"].Id,
                "ControlType": "toggle",
                "Address": "402",
                "IsActive": True,
                "SectionId": sections["Bypass Section"].Id
            },
            {
                "Name": "Switch 3 Motor",
                "CategoryId": categories["Switches"].Id,
                "ControlType": "toggle", 
                "Address": "403",
                "IsActive": True,
                "SectionId": sections["Mainline East"].Id
            }
        ]
        
        accessories = {}
        for acc_data in accessories_data:
            existing = db.query(models.Accessory).filter_by(Name=acc_data["Name"]).first()
            if not existing:
                accessory = models.Accessory(**acc_data)
                db.add(accessory)
                db.flush()
                accessories[acc_data["Name"]] = accessory
                print(f"  ✓ Created accessory: {acc_data['Name']}")
            else:
                accessories[acc_data["Name"]] = existing
                print(f"  ↪ Using existing accessory: {acc_data['Name']}")
        
        # 5. Create Switches
        print("🔀 Creating switches...")
        switches_data = [
            {
                "Name": "Bypass Entry Switch",
                "AccessoryId": accessories["Switch 1 Motor"].Id,
                "SectionId": sections["Mainline East"].Id,
                "Kind": "turnout",
                "DefaultRoute": "straight",
                "Orientation": 45.0,
                "PositionX": 80.0,
                "PositionY": 10.0,
                "PositionZ": 0.0,
                "IsActive": True
            },
            {
                "Name": "Bypass Exit Switch",
                "AccessoryId": accessories["Switch 2 Motor"].Id,
                "SectionId": sections["Bypass Section"].Id,
                "Kind": "turnout",
                "DefaultRoute": "straight", 
                "Orientation": -45.0,
                "PositionX": -80.0,
                "PositionY": 10.0,
                "PositionZ": 0.0,
                "IsActive": True
            },
            {
                "Name": "Siding Switch",
                "AccessoryId": accessories["Switch 3 Motor"].Id,
                "SectionId": sections["Mainline East"].Id,
                "Kind": "turnout",
                "DefaultRoute": "straight",
                "Orientation": -30.0,
                "PositionX": 120.0,
                "PositionY": -20.0,
                "PositionZ": 0.0,
                "IsActive": True
            }
        ]
        
        switches = {}
        for switch_data in switches_data:
            existing = db.query(models.Switch).filter_by(Name=switch_data["Name"]).first()
            if not existing:
                switch = models.Switch(**switch_data)
                db.add(switch)
                db.flush()
                switches[switch_data["Name"]] = switch
                print(f"  ✓ Created switch: {switch_data['Name']}")
            else:
                switches[switch_data["Name"]] = existing
                print(f"  ↪ Using existing switch: {switch_data['Name']}")
        
        # 6. Create SectionConnections to form the complete track graph
        print("🔗 Creating section connections...")
        connections_data = [
            # Main oval connections
            {
                "FromSectionId": sections["Mainline East"].Id,
                "ToSectionId": sections["Mainline West"].Id,
                "connection_type": "direct",
                "IsBidirectional": True,
                "IsActive": True
            },
            {
                "FromSectionId": sections["Mainline West"].Id,
                "ToSectionId": sections["Mainline East"].Id,
                "connection_type": "direct",
                "IsBidirectional": True,
                "IsActive": True
            },
            # Bypass connections via switches
            {
                "FromSectionId": sections["Mainline East"].Id,
                "ToSectionId": sections["Bypass Section"].Id,
                "connection_type": "switch",
                "SwitchId": switches["Bypass Entry Switch"].Id,
                "IsBidirectional": True,
                "IsActive": True
            },
            {
                "FromSectionId": sections["Bypass Section"].Id,
                "ToSectionId": sections["Mainline West"].Id,
                "connection_type": "switch",
                "SwitchId": switches["Bypass Exit Switch"].Id,
                "IsBidirectional": True,
                "IsActive": True
            },
            # Siding connection via switch
            {
                "FromSectionId": sections["Mainline East"].Id,
                "ToSectionId": sections["Siding Section"].Id,
                "connection_type": "switch",
                "SwitchId": switches["Siding Switch"].Id,
                "IsBidirectional": True,
                "IsActive": True
            }
        ]
        
        for conn_data in connections_data:
            # Check if connection already exists (in either direction)
            existing = db.query(models.SectionConnection).filter(
                ((models.SectionConnection.FromSectionId == conn_data["FromSectionId"]) &
                 (models.SectionConnection.ToSectionId == conn_data["ToSectionId"])) |
                ((models.SectionConnection.FromSectionId == conn_data["ToSectionId"]) &
                 (models.SectionConnection.ToSectionId == conn_data["FromSectionId"]))
            ).first()
            
            if not existing:
                connection = models.SectionConnection(**conn_data)
                db.add(connection)
                from_name = next(name for name, section in sections.items() if section.Id == conn_data["FromSectionId"])
                to_name = next(name for name, section in sections.items() if section.Id == conn_data["ToSectionId"])
                print(f"  ✓ Created connection: {from_name} → {to_name} ({conn_data['connection_type']})")
            else:
                from_name = next(name for name, section in sections.items() if section.Id == conn_data["FromSectionId"])
                to_name = next(name for name, section in sections.items() if section.Id == conn_data["ToSectionId"])
                print(f"  ↪ Using existing connection: {from_name} → {to_name}")
        
        # Commit all changes
        db.commit()
        print("\n✅ Dev database seeding completed successfully!")
        print(f"Created layout with {len(sections)} sections, {len(switches)} switches, and {len(accessories)} accessories")
        print("Track graph includes oval mainline, bypass section, and siding with proper connections.")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_dev_layout()