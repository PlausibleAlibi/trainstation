"""
Test for section connections relationship attributes
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, SectionConnection, Section, Switch, TrackLine, Category, Accessory


@pytest.fixture
def test_db():
    """Create an in-memory test database"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_section_connection_relationship_attributes(test_db):
    """Test that SectionConnection model has correct relationship attribute names"""
    # Create a track line
    track_line = TrackLine(Name="Test Track", IsActive=True)
    test_db.add(track_line)
    test_db.commit()
    test_db.refresh(track_line)
    
    # Create sections
    from_section = Section(
        Name="From Section",
        TrackLineId=track_line.Id,
        IsActive=True
    )
    to_section = Section(
        Name="To Section", 
        TrackLineId=track_line.Id,
        IsActive=True
    )
    test_db.add(from_section)
    test_db.add(to_section)
    test_db.commit()
    test_db.refresh(from_section)
    test_db.refresh(to_section)
    
    # Create category and accessory for switch
    category = Category(Name="Switches", SortOrder=1)
    test_db.add(category)
    test_db.commit()
    test_db.refresh(category)
    
    accessory = Accessory(
        Name="Test Switch Accessory",
        CategoryId=category.Id,
        ControlType="toggle",
        Address="1",
        IsActive=True
    )
    test_db.add(accessory)
    test_db.commit()
    test_db.refresh(accessory)
    
    # Create switch
    switch = Switch(
        Name="Test Switch",
        AccessoryId=accessory.Id,
        SectionId=from_section.Id,
        Kind="turnout",
        position="straight",
        IsActive=True
    )
    test_db.add(switch)
    test_db.commit()
    test_db.refresh(switch)
    
    # Create section connection with switch
    connection = SectionConnection(
        FromSectionId=from_section.Id,
        ToSectionId=to_section.Id,
        SwitchId=switch.Id,
        connection_type="switch",
        IsActive=True
    )
    test_db.add(connection)
    test_db.commit()
    test_db.refresh(connection)
    
    # Test that the correct relationship attribute names exist and work
    # These are the correct PascalCase names that should be used
    assert hasattr(connection, 'FromSection'), "FromSection relationship should exist"
    assert hasattr(connection, 'ToSection'), "ToSection relationship should exist"
    assert hasattr(connection, 'Switch'), "Switch relationship should exist"
    
    # Test that the relationships return the correct objects
    assert connection.FromSection is not None, "FromSection should not be None"
    assert connection.ToSection is not None, "ToSection should not be None"
    assert connection.Switch is not None, "Switch should not be None"
    
    assert connection.FromSection.Id == from_section.Id, "FromSection should match created from_section"
    assert connection.ToSection.Id == to_section.Id, "ToSection should match created to_section"
    assert connection.Switch.Id == switch.Id, "Switch should match created switch"
    
    # Test that the incorrect lowercase names do NOT exist or return None
    # This is what the buggy code was trying to use
    assert not hasattr(connection, 'from_section'), "from_section (lowercase) should not exist"
    assert not hasattr(connection, 'to_section'), "to_section (lowercase) should not exist" 
    assert not hasattr(connection, 'switch'), "switch (lowercase) should not exist"


def test_section_connection_without_switch(test_db):
    """Test section connection without switch (switch should be None)"""
    # Create a track line
    track_line = TrackLine(Name="Test Track", IsActive=True)
    test_db.add(track_line)
    test_db.commit()
    test_db.refresh(track_line)
    
    # Create sections
    from_section = Section(
        Name="From Section",
        TrackLineId=track_line.Id,
        IsActive=True
    )
    to_section = Section(
        Name="To Section",
        TrackLineId=track_line.Id,
        IsActive=True
    )
    test_db.add(from_section)
    test_db.add(to_section)
    test_db.commit()
    test_db.refresh(from_section)
    test_db.refresh(to_section)
    
    # Create section connection without switch
    connection = SectionConnection(
        FromSectionId=from_section.Id,
        ToSectionId=to_section.Id,
        SwitchId=None,  # No switch
        connection_type="direct",
        IsActive=True
    )
    test_db.add(connection)
    test_db.commit()
    test_db.refresh(connection)
    
    # Test that relationships work correctly
    assert connection.FromSection is not None
    assert connection.ToSection is not None
    assert connection.Switch is None  # Should be None when no switch
    
    # Verify the correct section relationships
    assert connection.FromSection.Id == from_section.Id
    assert connection.ToSection.Id == to_section.Id