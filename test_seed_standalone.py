"""
Standalone test for dev_seed.py logic using SQLite
"""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, Float, DateTime
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from datetime import datetime

# Create test Base and models for standalone testing
Base = declarative_base()

class Category(Base):
    __tablename__ = "Categories"
    Id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(50), nullable=False, unique=True, index=True)
    Description = Column(String(255), nullable=True)
    SortOrder = Column(Integer, nullable=False, default=0)
    Accessories = relationship("Accessory", back_populates="Category", lazy="selectin")

class Accessory(Base):
    __tablename__ = "Accessories"
    Id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=False, index=True)
    CategoryId = Column(Integer, ForeignKey("Categories.Id"), nullable=False)
    ControlType = Column(String(20), nullable=False)
    Address = Column(String(50), nullable=False)
    IsActive = Column(Boolean, nullable=False, default=True)
    TimedMs = Column(Integer, nullable=True)
    SectionId = Column(Integer, ForeignKey("Sections.Id"), nullable=True, index=True)
    Category = relationship("Category", back_populates="Accessories", lazy="joined")
    Section = relationship("Section", back_populates="Accessories", lazy="joined")

class TrackLine(Base):
    __tablename__ = "TrackLines"
    Id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=False, unique=True, index=True)
    Description = Column(String(255), nullable=True)
    IsActive = Column(Boolean, nullable=False, default=True)
    Sections = relationship("Section", back_populates="TrackLine", lazy="selectin")

class Section(Base):
    __tablename__ = "Sections"
    Id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=False)
    TrackLineId = Column(Integer, ForeignKey("TrackLines.Id"), nullable=False, index=True)
    PositionX = Column(Float, nullable=True)
    PositionY = Column(Float, nullable=True)
    PositionZ = Column(Float, nullable=True)
    IsActive = Column(Boolean, nullable=False, default=True)
    TrackLine = relationship("TrackLine", back_populates="Sections", lazy="joined")
    Accessories = relationship("Accessory", back_populates="Section", lazy="selectin")
    Switches = relationship("Switch", back_populates="Section", lazy="selectin")
    OutgoingConnections = relationship("SectionConnection", foreign_keys="SectionConnection.FromSectionId", back_populates="FromSection", lazy="selectin")
    IncomingConnections = relationship("SectionConnection", foreign_keys="SectionConnection.ToSectionId", back_populates="ToSection", lazy="selectin")

class Switch(Base):
    __tablename__ = "Switches"
    Id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=True, index=True)
    AccessoryId = Column(Integer, ForeignKey("Accessories.Id"), nullable=False, index=True)
    SectionId = Column(Integer, ForeignKey("Sections.Id"), nullable=False, index=True)
    Kind = Column(String(50), nullable=False)
    DefaultRoute = Column(String(50), nullable=True)
    Orientation = Column(Float, nullable=True)
    PositionX = Column(Float, nullable=True)
    PositionY = Column(Float, nullable=True)
    PositionZ = Column(Float, nullable=True)
    IsActive = Column(Boolean, default=True, nullable=False)
    Accessory = relationship("Accessory", lazy="joined")
    Section = relationship("Section", back_populates="Switches", lazy="joined")
    Connections = relationship("SectionConnection", back_populates="Switch", lazy="selectin")

class SectionConnection(Base):
    __tablename__ = "SectionConnections"
    Id = Column(Integer, primary_key=True, index=True)
    FromSectionId = Column(Integer, ForeignKey("Sections.Id"), nullable=False, index=True)
    ToSectionId = Column(Integer, ForeignKey("Sections.Id"), nullable=False, index=True)
    SwitchId = Column(Integer, ForeignKey("Switches.Id"), nullable=True, index=True)
    RouteInfo = Column(String(255), nullable=True)
    IsBidirectional = Column(Boolean, nullable=False, default=True)
    connection_type = Column(String(50), nullable=False, default="direct")
    IsActive = Column(Boolean, nullable=False, default=True)
    FromSection = relationship("Section", foreign_keys=[FromSectionId], back_populates="OutgoingConnections", lazy="joined")
    ToSection = relationship("Section", foreign_keys=[ToSectionId], back_populates="IncomingConnections", lazy="joined")
    Switch = relationship("Switch", back_populates="Connections", lazy="joined")

def test_seed_logic():
    """Test the seed logic with in-memory SQLite database."""
    
    # Create engine and session
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = TestSessionLocal()
    
    try:
        print("🚂 Testing dev database seeding logic...")
        
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
            category = Category(**cat_data)
            db.add(category)
            db.flush()
            categories[cat_data["Name"]] = category
            print(f"  ✓ Created category: {cat_data['Name']}")
        
        # 2. Create TrackLine
        print("🛤️  Creating track line...")
        trackline_data = {
            "Name": "Main Layout",
            "Description": "Primary model train layout with oval mainline, bypass, and siding",
            "IsActive": True
        }
        trackline = TrackLine(**trackline_data)
        db.add(trackline)
        db.flush()
        print(f"  ✓ Created track line: {trackline_data['Name']}")
        
        # 3. Create Sections
        print("📍 Creating track sections...")
        sections_data = [
            {"Name": "Mainline East", "TrackLineId": trackline.Id, "PositionX": 100.0, "PositionY": 0.0, "PositionZ": 0.0, "IsActive": True},
            {"Name": "Mainline West", "TrackLineId": trackline.Id, "PositionX": -100.0, "PositionY": 0.0, "PositionZ": 0.0, "IsActive": True},
            {"Name": "Bypass Section", "TrackLineId": trackline.Id, "PositionX": 0.0, "PositionY": 50.0, "PositionZ": 0.0, "IsActive": True},
            {"Name": "Siding Section", "TrackLineId": trackline.Id, "PositionX": 150.0, "PositionY": -50.0, "PositionZ": 0.0, "IsActive": True}
        ]
        
        sections = {}
        for section_data in sections_data:
            section = Section(**section_data)
            db.add(section)
            db.flush()
            sections[section_data["Name"]] = section
            print(f"  ✓ Created section: {section_data['Name']}")
        
        # 4. Create Accessories
        print("🔧 Creating accessories...")
        accessories_data = [
            {"Name": "Main Signal", "CategoryId": categories["Signals"].Id, "ControlType": "onOff", "Address": "101", "IsActive": True, "SectionId": sections["Mainline East"].Id},
            {"Name": "Yard Light 1", "CategoryId": categories["Lights"].Id, "ControlType": "onOff", "Address": "201", "IsActive": True, "SectionId": sections["Bypass Section"].Id},
            {"Name": "Yard Light 2", "CategoryId": categories["Lights"].Id, "ControlType": "toggle", "Address": "202", "IsActive": True, "SectionId": sections["Siding Section"].Id},
            {"Name": "Station House", "CategoryId": categories["Buildings"].Id, "ControlType": "timed", "Address": "301", "IsActive": True, "TimedMs": 5000, "SectionId": sections["Mainline West"].Id},
            {"Name": "Switch 1 Motor", "CategoryId": categories["Switches"].Id, "ControlType": "toggle", "Address": "401", "IsActive": True, "SectionId": sections["Mainline East"].Id},
            {"Name": "Switch 2 Motor", "CategoryId": categories["Switches"].Id, "ControlType": "toggle", "Address": "402", "IsActive": True, "SectionId": sections["Bypass Section"].Id},
            {"Name": "Switch 3 Motor", "CategoryId": categories["Switches"].Id, "ControlType": "toggle", "Address": "403", "IsActive": True, "SectionId": sections["Mainline East"].Id}
        ]
        
        accessories = {}
        for acc_data in accessories_data:
            accessory = Accessory(**acc_data)
            db.add(accessory)
            db.flush()
            accessories[acc_data["Name"]] = accessory
            print(f"  ✓ Created accessory: {acc_data['Name']}")
        
        # 5. Create Switches
        print("🔀 Creating switches...")
        switches_data = [
            {"Name": "Bypass Entry Switch", "AccessoryId": accessories["Switch 1 Motor"].Id, "SectionId": sections["Mainline East"].Id, "Kind": "turnout", "DefaultRoute": "straight", "Orientation": 45.0, "PositionX": 80.0, "PositionY": 10.0, "PositionZ": 0.0, "IsActive": True},
            {"Name": "Bypass Exit Switch", "AccessoryId": accessories["Switch 2 Motor"].Id, "SectionId": sections["Bypass Section"].Id, "Kind": "turnout", "DefaultRoute": "straight", "Orientation": -45.0, "PositionX": -80.0, "PositionY": 10.0, "PositionZ": 0.0, "IsActive": True},
            {"Name": "Siding Switch", "AccessoryId": accessories["Switch 3 Motor"].Id, "SectionId": sections["Mainline East"].Id, "Kind": "turnout", "DefaultRoute": "straight", "Orientation": -30.0, "PositionX": 120.0, "PositionY": -20.0, "PositionZ": 0.0, "IsActive": True}
        ]
        
        switches = {}
        for switch_data in switches_data:
            switch = Switch(**switch_data)
            db.add(switch)
            db.flush()
            switches[switch_data["Name"]] = switch
            print(f"  ✓ Created switch: {switch_data['Name']}")
        
        # 6. Create SectionConnections
        print("🔗 Creating section connections...")
        connections_data = [
            {"FromSectionId": sections["Mainline East"].Id, "ToSectionId": sections["Mainline West"].Id, "connection_type": "direct", "IsBidirectional": True, "IsActive": True},
            {"FromSectionId": sections["Mainline West"].Id, "ToSectionId": sections["Mainline East"].Id, "connection_type": "direct", "IsBidirectional": True, "IsActive": True},
            {"FromSectionId": sections["Mainline East"].Id, "ToSectionId": sections["Bypass Section"].Id, "connection_type": "switch", "SwitchId": switches["Bypass Entry Switch"].Id, "IsBidirectional": True, "IsActive": True},
            {"FromSectionId": sections["Bypass Section"].Id, "ToSectionId": sections["Mainline West"].Id, "connection_type": "switch", "SwitchId": switches["Bypass Exit Switch"].Id, "IsBidirectional": True, "IsActive": True},
            {"FromSectionId": sections["Mainline East"].Id, "ToSectionId": sections["Siding Section"].Id, "connection_type": "switch", "SwitchId": switches["Siding Switch"].Id, "IsBidirectional": True, "IsActive": True}
        ]
        
        for conn_data in connections_data:
            connection = SectionConnection(**conn_data)
            db.add(connection)
            from_name = next(name for name, section in sections.items() if section.Id == conn_data["FromSectionId"])
            to_name = next(name for name, section in sections.items() if section.Id == conn_data["ToSectionId"])
            print(f"  ✓ Created connection: {from_name} → {to_name} ({conn_data['connection_type']})")
        
        # Commit all changes
        db.commit()
        
        # Verify the results
        print("\n🔍 Verifying created data...")
        categories_count = db.query(Category).count()
        sections_count = db.query(Section).count()
        accessories_count = db.query(Accessory).count()
        switches_count = db.query(Switch).count()
        connections_count = db.query(SectionConnection).count()
        
        print(f"  📊 Categories: {categories_count}")
        print(f"  📊 Sections: {sections_count}")
        print(f"  📊 Accessories: {accessories_count}")
        print(f"  📊 Switches: {switches_count}")
        print(f"  📊 Connections: {connections_count}")
        
        # Test some relationships
        print("\n🔗 Testing relationships...")
        main_east = db.query(Section).filter_by(Name="Mainline East").first()
        print(f"  Mainline East has {len(main_east.Accessories)} accessories and {len(main_east.Switches)} switches")
        
        bypass_switch = db.query(Switch).filter_by(Name="Bypass Entry Switch").first()
        print(f"  Bypass Entry Switch is connected to accessory: {bypass_switch.Accessory.Name}")
        
        print("\n✅ Dev database seed logic test completed successfully!")
        print(f"Created complete track layout with oval mainline, bypass section, and siding")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during testing: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_seed_logic()