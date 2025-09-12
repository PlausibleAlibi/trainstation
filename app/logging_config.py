"""
Structured logging configuration for TrainStation API using structlog.

This module configures structured logging with JSON output for all API requests
and application events. It provides a consistent logging format that includes
request details like method, path, query parameters, and client IP.
"""

import logging
import sys
from typing import Any, Dict

import structlog
from structlog.types import Processor


def setup_logging() -> None:
    """
    Configure structured logging with JSON output.
    
    Sets up structlog with processors for consistent JSON formatted logs
    that include timestamps, log levels, and structured data.
    """
    # Configure standard library logging to work with structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    
    # Define structlog processors
    processors: list[Processor] = [
        # Add timestamp
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="ISO"),
        # Add call site info for development (can be removed in production)
        structlog.dev.set_exc_info,
        # Render as JSON
        structlog.processors.JSONRenderer()
    ]
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = None) -> structlog.stdlib.BoundLogger:
    """
    Get a structured logger instance.
    
    Args:
        name: Logger name, defaults to the calling module name
        
    Returns:
        Configured structlog logger instance
    """
    return structlog.get_logger(name)


def extract_client_ip(headers: Dict[str, Any]) -> str:
    """
    Extract client IP address from request headers.
    
    Checks for common proxy headers before falling back to direct connection.
    
    Args:
        headers: FastAPI request headers
        
    Returns:
        Client IP address as string
    """
    # Check for forwarded headers (common in proxy setups)
    forwarded_for = headers.get("x-forwarded-for")
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded_for.split(",")[0].strip()
    
    real_ip = headers.get("x-real-ip")
    if real_ip:
        return real_ip
    
    # Fallback to direct connection (will be set by middleware)
    return headers.get("client-ip", "unknown")