"""
Tests for SQLAlchemy models
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Category, Accessory, Base


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


def test_category_creation(test_db):
    """Test creating a Category model"""
    category = Category(
        Name="Test Category",
        Description="A test category",
        SortOrder=1
    )
    test_db.add(category)
    test_db.commit()
    test_db.refresh(category)
    
    assert category.Id is not None
    assert category.Name == "Test Category"
    assert category.Description == "A test category"
    assert category.SortOrder == 1


def test_accessory_creation(test_db):
    """Test creating an Accessory model with Category relationship"""
    # Create a category first
    category = Category(Name="Signals", SortOrder=1)
    test_db.add(category)
    test_db.commit()
    test_db.refresh(category)
    
    # Create an accessory
    accessory = Accessory(
        Name="Red Signal",
        CategoryId=category.Id,
        ControlType="onOff",
        Address="1",
        IsActive=True
    )
    test_db.add(accessory)
    test_db.commit()
    test_db.refresh(accessory)
    
    assert accessory.Id is not None
    assert accessory.Name == "Red Signal"
    assert accessory.CategoryId == category.Id
    assert accessory.ControlType == "onOff"
    assert accessory.Address == "1"
    assert accessory.IsActive is True
    assert accessory.Category.Name == "Signals"


def test_category_unique_name_constraint(test_db):
    """Test that category names must be unique"""
    category1 = Category(Name="Unique Name", SortOrder=1)
    category2 = Category(Name="Unique Name", SortOrder=2)
    
    test_db.add(category1)
    test_db.commit()
    
    test_db.add(category2)
    
    # This should raise an integrity error due to unique constraint
    with pytest.raises(Exception):
        test_db.commit()