"""
Test script for dev_seed.py using SQLite in-memory database
"""
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from db import Base
import models

def test_dev_seed():
    """Test the dev seed script with an in-memory SQLite database."""
    
    # Create an in-memory SQLite database for testing
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    
    # Create session
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Temporarily replace the SessionLocal in models
    import app.dev_seed as dev_seed
    original_session = dev_seed.SessionLocal
    dev_seed.SessionLocal = TestSessionLocal
    
    try:
        # Run the seed function
        dev_seed.seed_dev_layout()
        
        # Verify the data was created correctly
        db = TestSessionLocal()
        try:
            # Check categories
            categories = db.query(models.Category).all()
            print(f"Created {len(categories)} categories:")
            for cat in categories:
                print(f"  - {cat.Name}: {cat.Description}")
            
            # Check track line
            tracklines = db.query(models.TrackLine).all()
            print(f"\nCreated {len(tracklines)} track lines:")
            for tl in tracklines:
                print(f"  - {tl.Name}: {tl.Description}")
            
            # Check sections
            sections = db.query(models.Section).all()
            print(f"\nCreated {len(sections)} sections:")
            for section in sections:
                print(f"  - {section.Name} (x={section.PositionX}, y={section.PositionY})")
            
            # Check accessories
            accessories = db.query(models.Accessory).all()
            print(f"\nCreated {len(accessories)} accessories:")
            for acc in accessories:
                print(f"  - {acc.Name} ({acc.ControlType}) - Address: {acc.Address}")
            
            # Check switches
            switches = db.query(models.Switch).all()
            print(f"\nCreated {len(switches)} switches:")
            for switch in switches:
                print(f"  - {switch.Name} ({switch.Kind}) - Default: {switch.DefaultRoute}")
            
            # Check connections
            connections = db.query(models.SectionConnection).all()
            print(f"\nCreated {len(connections)} section connections:")
            for conn in connections:
                from_section = db.query(models.Section).filter_by(Id=conn.FromSectionId).first()
                to_section = db.query(models.Section).filter_by(Id=conn.ToSectionId).first()
                conn_type = conn.connection_type
                switch_info = ""
                if conn.SwitchId:
                    switch = db.query(models.Switch).filter_by(Id=conn.SwitchId).first()
                    switch_info = f" via {switch.Name}"
                print(f"  - {from_section.Name} → {to_section.Name} ({conn_type}){switch_info}")
            
            print(f"\n✅ Test completed successfully!")
            print(f"Summary: {len(categories)} categories, {len(sections)} sections, {len(switches)} switches, {len(accessories)} accessories, {len(connections)} connections")
            
        finally:
            db.close()
    
    finally:
        # Restore original session
        dev_seed.SessionLocal = original_session

if __name__ == "__main__":
    test_dev_seed()