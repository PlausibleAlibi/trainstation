#!/usr/bin/env python3
"""
Example demonstrations of the Model Context Protocol (MCP) context manager.

These examples show various usage patterns for the MCP context manager
in different scenarios.
"""

from context_mcp import mcp_context, MCPContext, async_mcp_context, get_mcp_session
from models import Category, Accessory, TrackLine, Section
import asyncio


def example_basic_usage():
    """Example 1: Basic usage with automatic commit"""
    print("Example 1: Basic Usage")
    print("-" * 50)
    
    with mcp_context() as session:
        category = Category(
            Name="Example Category",
            Description="Created by MCP example",
            SortOrder=1
        )
        session.add(category)
    
    print("✅ Category created and automatically committed\n")


def example_read_only():
    """Example 2: Read-only operations without auto-commit"""
    print("Example 2: Read-Only Operations")
    print("-" * 50)
    
    with mcp_context(auto_commit=False) as session:
        categories = session.query(Category).all()
        print(f"Found {len(categories)} categories:")
        for cat in categories[:5]:  # Show first 5
            print(f"  - {cat.Name}")
    
    print("✅ Read completed without unnecessary commit\n")


def example_error_handling():
    """Example 3: Automatic rollback on error"""
    print("Example 3: Error Handling with Auto-Rollback")
    print("-" * 50)
    
    try:
        with mcp_context() as session:
            category = Category(
                Name="This Will Not Be Saved",
                SortOrder=99
            )
            session.add(category)
            
            # Simulate an error
            raise ValueError("Simulated validation error")
            
    except ValueError as e:
        print(f"❌ Error occurred: {e}")
        print("✅ Transaction automatically rolled back\n")


def example_manual_control():
    """Example 4: Manual transaction control"""
    print("Example 4: Manual Transaction Control")
    print("-" * 50)
    
    ctx = MCPContext(auto_commit=False)
    with ctx as session:
        # Create parent
        category = Category(Name="Manual Control Example", SortOrder=1)
        session.add(category)
        session.flush()  # Get ID without committing
        
        print(f"Category ID after flush: {category.Id}")
        
        # Create children
        for i in range(3):
            accessory = Accessory(
                Name=f"Accessory {i+1}",
                CategoryId=category.Id,
                ControlType="onOff",
                Address=f"10{i}"
            )
            session.add(accessory)
        
        # Decide when to commit
        ctx.commit()
        print("✅ Manually committed after verifying all objects\n")


def example_nested_operations():
    """Example 5: Complex nested operations"""
    print("Example 5: Nested Operations")
    print("-" * 50)
    
    with mcp_context() as session:
        # Create track line
        trackline = TrackLine(
            Name="Demo Layout",
            Description="Example track layout",
            IsActive=True
        )
        session.add(trackline)
        session.flush()
        
        # Create sections on the track line
        sections = []
        for i in range(3):
            section = Section(
                Name=f"Section {i+1}",
                Description=f"Track section {i+1}",
                TrackLineId=trackline.Id,
                SortOrder=i+1
            )
            session.add(section)
            sections.append(section)
        
        session.flush()
        
        # Create category for accessories
        category = Category(Name="Track Accessories", SortOrder=1)
        session.add(category)
        session.flush()
        
        # Add accessories to sections
        for i, section in enumerate(sections):
            accessory = Accessory(
                Name=f"Signal {i+1}",
                CategoryId=category.Id,
                ControlType="onOff",
                Address=f"50{i}",
                SectionId=section.Id
            )
            session.add(accessory)
    
    print("✅ Created track line with sections and accessories\n")


def example_multiple_contexts():
    """Example 6: Multiple sequential contexts"""
    print("Example 6: Multiple Sequential Contexts")
    print("-" * 50)
    
    # First context: Create categories
    with mcp_context() as session:
        for name in ["Signals", "Switches", "Lights"]:
            category = Category(Name=name, SortOrder=1)
            session.add(category)
    
    print("✅ First context: Created categories")
    
    # Second context: Query categories
    with mcp_context(auto_commit=False) as session:
        count = session.query(Category).count()
        print(f"✅ Second context: Found {count} categories")
    
    # Third context: Update a category
    with mcp_context() as session:
        category = session.query(Category).filter_by(Name="Signals").first()
        if category:
            category.Description = "Traffic signals and indicators"
            print("✅ Third context: Updated category description\n")


async def example_async_context():
    """Example 7: Async context manager"""
    print("Example 7: Async Context Manager")
    print("-" * 50)
    
    async with async_mcp_context() as session:
        category = Category(
            Name="Async Example",
            Description="Created with async context",
            SortOrder=1
        )
        session.add(category)
    
    print("✅ Category created using async context\n")


def example_factory_pattern():
    """Example 8: Using the factory function"""
    print("Example 8: Factory Pattern")
    print("-" * 50)
    
    # Get a configured context
    ctx = get_mcp_session(auto_commit=True, auto_rollback=True)
    
    with ctx as session:
        category = Category(
            Name="Factory Example",
            Description="Created using factory pattern",
            SortOrder=1
        )
        session.add(category)
    
    print("✅ Used factory function to create context\n")


def example_conditional_commit():
    """Example 9: Conditional commit based on validation"""
    print("Example 9: Conditional Commit")
    print("-" * 50)
    
    ctx = MCPContext(auto_commit=False)
    with ctx as session:
        category = Category(Name="Conditional Example", SortOrder=1)
        session.add(category)
        session.flush()
        
        # Validation logic
        if len(category.Name) > 5:
            ctx.commit()
            print("✅ Validation passed - committed")
        else:
            ctx.rollback()
            print("❌ Validation failed - rolled back")
    
    print()


def example_batch_operations():
    """Example 10: Batch operations with single transaction"""
    print("Example 10: Batch Operations")
    print("-" * 50)
    
    with mcp_context() as session:
        # Batch create categories
        categories = [
            Category(Name=f"Batch Category {i}", SortOrder=i)
            for i in range(10)
        ]
        session.add_all(categories)
        
        print(f"✅ Created {len(categories)} categories in single transaction\n")


def run_all_examples():
    """Run all examples in sequence"""
    print("\n" + "=" * 70)
    print("MCP Context Manager Examples")
    print("=" * 70 + "\n")
    
    # Note: These examples assume a test database setup
    # In production, ensure database is properly configured
    
    try:
        example_basic_usage()
        example_read_only()
        example_error_handling()
        example_manual_control()
        example_nested_operations()
        example_multiple_contexts()
        example_factory_pattern()
        example_conditional_commit()
        example_batch_operations()
        
        # Async example
        print("Running async example...")
        asyncio.run(example_async_context())
        
    except Exception as e:
        print(f"\n⚠️  Note: Examples require a configured database")
        print(f"   Error: {e}")
        print(f"   Set up your database and run: python mcp_usage_examples.py\n")
    
    print("=" * 70)
    print("Examples completed!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_all_examples()
