"""
Model Context Protocol (MCP) Context Manager

This module provides a context manager for managing database sessions and other
resources following the Model Context Protocol pattern. It ensures proper lifecycle
management, error handling, and cleanup of database connections.

The MCP context manager provides:
- Automatic session creation and cleanup
- Transaction management with commit/rollback
- Error handling and logging
- Resource pooling and connection management
- Support for both sync and async contexts
"""

from contextlib import contextmanager, asynccontextmanager
from typing import Generator, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from db import SessionLocal
from logging_config import get_logger

logger = get_logger("mcp")


class MCPContext:
    """
    Model Context Protocol context manager for database sessions.
    
    Provides a context manager that handles database session lifecycle,
    including automatic commit on success and rollback on error.
    
    Example usage:
        with MCPContext() as session:
            # Use session for database operations
            user = session.query(User).first()
            
        # Session is automatically committed and closed
    
    For async operations:
        async with MCPContext.async_context() as session:
            # Async database operations
            result = await session.execute(query)
    """
    
    def __init__(self, auto_commit: bool = True, auto_rollback: bool = True):
        """
        Initialize MCP context manager.
        
        Args:
            auto_commit: Automatically commit transaction on success (default: True)
            auto_rollback: Automatically rollback transaction on error (default: True)
        """
        self.session: Optional[Session] = None
        self.auto_commit = auto_commit
        self.auto_rollback = auto_rollback
        self._committed = False
        self._rolled_back = False
    
    def __enter__(self) -> Session:
        """
        Enter the context and create a database session.
        
        Returns:
            Database session instance
        """
        self.session = SessionLocal()
        logger.info("mcp_context_entered", auto_commit=self.auto_commit)
        return self.session
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Exit the context and cleanup database session.
        
        Args:
            exc_type: Exception type if an error occurred
            exc_val: Exception value if an error occurred
            exc_tb: Exception traceback if an error occurred
            
        Returns:
            False to propagate exceptions, if any
        """
        if self.session is None:
            return False
        
        try:
            if exc_type is not None:
                # An exception occurred
                if self.auto_rollback and not self._rolled_back:
                    self.session.rollback()
                    self._rolled_back = True
                    logger.warning(
                        "mcp_context_rollback",
                        exception_type=exc_type.__name__ if exc_type else None,
                        exception_message=str(exc_val) if exc_val else None
                    )
            else:
                # No exception, commit if auto_commit is enabled
                if self.auto_commit and not self._committed:
                    self.session.commit()
                    self._committed = True
                    logger.info("mcp_context_committed")
        except SQLAlchemyError as e:
            # Error during commit/rollback
            logger.error(
                "mcp_context_cleanup_error",
                error=str(e),
                error_type=type(e).__name__
            )
            try:
                self.session.rollback()
            except Exception:
                pass  # Best effort rollback
        finally:
            # Always close the session
            self.session.close()
            logger.info("mcp_context_exited")
            self.session = None
        
        return False  # Propagate any exceptions
    
    def commit(self):
        """Manually commit the current transaction."""
        if self.session and not self._committed:
            self.session.commit()
            self._committed = True
            logger.info("mcp_manual_commit")
    
    def rollback(self):
        """Manually rollback the current transaction."""
        if self.session and not self._rolled_back:
            self.session.rollback()
            self._rolled_back = True
            logger.info("mcp_manual_rollback")


@contextmanager
def mcp_context(auto_commit: bool = True, auto_rollback: bool = True) -> Generator[Session, None, None]:
    """
    Context manager function for database session management.
    
    This is a functional alternative to the MCPContext class, providing
    a simpler interface for basic use cases.
    
    Args:
        auto_commit: Automatically commit transaction on success (default: True)
        auto_rollback: Automatically rollback transaction on error (default: True)
    
    Yields:
        Database session instance
    
    Example:
        with mcp_context() as session:
            user = session.query(User).filter_by(id=1).first()
            user.name = "Updated Name"
        # Automatically committed and closed
    """
    ctx = MCPContext(auto_commit=auto_commit, auto_rollback=auto_rollback)
    session = ctx.__enter__()
    try:
        yield session
    except Exception as e:
        ctx.__exit__(type(e), e, e.__traceback__)
        raise
    else:
        ctx.__exit__(None, None, None)


@asynccontextmanager
async def async_mcp_context(auto_commit: bool = True, auto_rollback: bool = True):
    """
    Async context manager for database session management.
    
    Provides async support for the MCP context manager pattern.
    Note: This uses a synchronous session but provides async context
    manager interface for compatibility with async code.
    
    Args:
        auto_commit: Automatically commit transaction on success (default: True)
        auto_rollback: Automatically rollback transaction on error (default: True)
    
    Yields:
        Database session instance
    
    Example:
        async with async_mcp_context() as session:
            result = session.query(User).all()
        # Automatically committed and closed
    """
    ctx = MCPContext(auto_commit=auto_commit, auto_rollback=auto_rollback)
    session = ctx.__enter__()
    try:
        yield session
    except Exception as e:
        ctx.__exit__(type(e), e, e.__traceback__)
        raise
    else:
        ctx.__exit__(None, None, None)


def get_mcp_session(auto_commit: bool = True, auto_rollback: bool = True) -> MCPContext:
    """
    Factory function to create an MCP context manager.
    
    Args:
        auto_commit: Automatically commit transaction on success (default: True)
        auto_rollback: Automatically rollback transaction on error (default: True)
    
    Returns:
        MCPContext instance ready to be used as a context manager
    
    Example:
        with get_mcp_session() as session:
            # Database operations
            pass
    """
    return MCPContext(auto_commit=auto_commit, auto_rollback=auto_rollback)
