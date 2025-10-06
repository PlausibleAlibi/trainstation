"""
Tests for Model Context Protocol (MCP) context manager
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from context_mcp import MCPContext, mcp_context, async_mcp_context, get_mcp_session
from models import Base, Category, Accessory
from db import SessionLocal


@pytest.fixture
def test_db_engine():
    """Create an in-memory test database engine"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def test_db_session(test_db_engine):
    """Create a test database session"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db_engine)
    
    # Temporarily replace SessionLocal for testing
    import context_mcp
    original_session = context_mcp.SessionLocal
    context_mcp.SessionLocal = TestingSessionLocal
    
    yield TestingSessionLocal
    
    # Restore original SessionLocal
    context_mcp.SessionLocal = original_session


def test_mcp_context_basic_usage(test_db_session):
    """Test basic MCP context manager usage"""
    with MCPContext() as session:
        assert session is not None
        # Create a test category
        category = Category(Name="Test Category", SortOrder=1)
        session.add(category)
    
    # Verify the category was committed
    with MCPContext() as session:
        result = session.query(Category).filter_by(Name="Test Category").first()
        assert result is not None
        assert result.Name == "Test Category"


def test_mcp_context_auto_commit(test_db_session):
    """Test that auto_commit works correctly"""
    with MCPContext(auto_commit=True) as session:
        category = Category(Name="Auto Commit Test", SortOrder=1)
        session.add(category)
    
    # Verify commit happened
    with MCPContext() as session:
        result = session.query(Category).filter_by(Name="Auto Commit Test").first()
        assert result is not None


def test_mcp_context_no_auto_commit(test_db_session):
    """Test that disabling auto_commit prevents automatic commits"""
    with MCPContext(auto_commit=False) as session:
        category = Category(Name="No Auto Commit", SortOrder=1)
        session.add(category)
    
    # Verify nothing was committed
    with MCPContext() as session:
        result = session.query(Category).filter_by(Name="No Auto Commit").first()
        assert result is None


def test_mcp_context_manual_commit(test_db_session):
    """Test manual commit within context"""
    ctx = MCPContext(auto_commit=False)
    with ctx as session:
        category = Category(Name="Manual Commit", SortOrder=1)
        session.add(category)
        ctx.commit()
    
    # Verify manual commit worked
    with MCPContext() as session:
        result = session.query(Category).filter_by(Name="Manual Commit").first()
        assert result is not None


def test_mcp_context_auto_rollback_on_exception(test_db_session):
    """Test that exceptions trigger automatic rollback"""
    try:
        with MCPContext(auto_commit=True, auto_rollback=True) as session:
            category = Category(Name="Rollback Test", SortOrder=1)
            session.add(category)
            # Force an exception
            raise ValueError("Test exception")
    except ValueError:
        pass
    
    # Verify rollback happened - nothing should be committed
    with MCPContext() as session:
        result = session.query(Category).filter_by(Name="Rollback Test").first()
        assert result is None


def test_mcp_context_manual_rollback(test_db_session):
    """Test manual rollback within context"""
    ctx = MCPContext(auto_commit=False)
    with ctx as session:
        category = Category(Name="Manual Rollback", SortOrder=1)
        session.add(category)
        session.flush()
        # Manually rollback
        ctx.rollback()
    
    # Verify nothing was committed
    with MCPContext() as session:
        result = session.query(Category).filter_by(Name="Manual Rollback").first()
        assert result is None


def test_mcp_context_functional_interface(test_db_session):
    """Test the functional mcp_context interface"""
    with mcp_context() as session:
        category = Category(Name="Functional Test", SortOrder=1)
        session.add(category)
    
    # Verify commit
    with mcp_context() as session:
        result = session.query(Category).filter_by(Name="Functional Test").first()
        assert result is not None


def test_mcp_context_nested_operations(test_db_session):
    """Test nested database operations within single context"""
    with MCPContext() as session:
        # Create category
        category = Category(Name="Parent Category", SortOrder=1)
        session.add(category)
        session.flush()
        
        # Create accessory with the category
        accessory = Accessory(
            Name="Test Accessory",
            CategoryId=category.Id,
            ControlType="onOff",
            Address="100"
        )
        session.add(accessory)
    
    # Verify both were committed
    with MCPContext() as session:
        category = session.query(Category).filter_by(Name="Parent Category").first()
        assert category is not None
        
        accessory = session.query(Accessory).filter_by(Name="Test Accessory").first()
        assert accessory is not None
        assert accessory.CategoryId == category.Id


def test_get_mcp_session_factory(test_db_session):
    """Test the get_mcp_session factory function"""
    ctx = get_mcp_session(auto_commit=True)
    assert isinstance(ctx, MCPContext)
    assert ctx.auto_commit is True
    
    with ctx as session:
        category = Category(Name="Factory Test", SortOrder=1)
        session.add(category)
    
    # Verify commit
    with mcp_context() as session:
        result = session.query(Category).filter_by(Name="Factory Test").first()
        assert result is not None


def test_mcp_context_exception_propagation(test_db_session):
    """Test that exceptions are properly propagated"""
    with pytest.raises(ValueError):
        with MCPContext() as session:
            category = Category(Name="Exception Test", SortOrder=1)
            session.add(category)
            raise ValueError("Test exception propagation")


def test_mcp_context_multiple_sequential_contexts(test_db_session):
    """Test using multiple sequential contexts"""
    # First context
    with MCPContext() as session:
        category1 = Category(Name="Sequential 1", SortOrder=1)
        session.add(category1)
    
    # Second context
    with MCPContext() as session:
        category2 = Category(Name="Sequential 2", SortOrder=2)
        session.add(category2)
    
    # Verify both commits
    with MCPContext() as session:
        result1 = session.query(Category).filter_by(Name="Sequential 1").first()
        result2 = session.query(Category).filter_by(Name="Sequential 2").first()
        assert result1 is not None
        assert result2 is not None


@pytest.mark.asyncio
async def test_async_mcp_context(test_db_session):
    """Test async context manager interface"""
    async with async_mcp_context() as session:
        category = Category(Name="Async Test", SortOrder=1)
        session.add(category)
    
    # Verify commit
    with mcp_context() as session:
        result = session.query(Category).filter_by(Name="Async Test").first()
        assert result is not None


@pytest.mark.asyncio
async def test_async_mcp_context_exception(test_db_session):
    """Test async context manager with exception"""
    try:
        async with async_mcp_context() as session:
            category = Category(Name="Async Rollback", SortOrder=1)
            session.add(category)
            raise ValueError("Async test exception")
    except ValueError:
        pass
    
    # Verify rollback
    with mcp_context() as session:
        result = session.query(Category).filter_by(Name="Async Rollback").first()
        assert result is None


def test_mcp_context_session_cleanup(test_db_session):
    """Test that session is properly cleaned up"""
    ctx = MCPContext()
    with ctx as session:
        assert session is not None
        assert ctx.session is session
    
    # After context exit, session should be None
    assert ctx.session is None


def test_mcp_context_double_commit_safe(test_db_session):
    """Test that multiple commits don't cause issues"""
    ctx = MCPContext(auto_commit=True)
    with ctx as session:
        category = Category(Name="Double Commit Test", SortOrder=1)
        session.add(category)
        ctx.commit()  # Manual commit
        # Auto commit on exit should handle already committed state
    
    # Verify only one category was created
    with mcp_context() as session:
        results = session.query(Category).filter_by(Name="Double Commit Test").all()
        assert len(results) == 1


def test_mcp_context_read_only_operations(test_db_session):
    """Test MCP context with read-only operations"""
    # First create some data
    with MCPContext() as session:
        category = Category(Name="Read Only Test", SortOrder=1)
        session.add(category)
    
    # Then read it without modifications
    with MCPContext(auto_commit=False) as session:
        result = session.query(Category).filter_by(Name="Read Only Test").first()
        assert result is not None
        assert result.Name == "Read Only Test"
