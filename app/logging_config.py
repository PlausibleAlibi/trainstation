"""
Structured logging configuration for TrainStation API using structlog and SEQ.

This module configures structured logging with JSON output for all API requests
and application events. It provides a consistent logging format that includes
request details like method, path, query parameters, and client IP.

Logs are sent to both console (for development) and SEQ (for centralized logging).
"""

import logging
import os
import sys
from typing import Any, Dict

import structlog
from structlog.types import Processor

try:
    import seqlog
    HAS_SEQLOG = True
except ImportError:
    HAS_SEQLOG = False
    print("WARNING: seqlog not available. SEQ logging will be disabled.")


def setup_logging() -> None:
    """
    Configure structured logging with JSON output and SEQ integration.
    
    Sets up structlog with processors for consistent JSON formatted logs
    that include timestamps, log levels, and structured data. Optionally
    sends logs to SEQ if configured.
    """
    # Configure standard library logging to work with structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    
    # Configure SEQ logging if available and configured
    seq_url = os.getenv("SEQ_URL")
    seq_api_key = os.getenv("SEQ_API_KEY")
    
    if HAS_SEQLOG and seq_url:
        try:
            seqlog.log_to_seq(
                server_url=seq_url,
                api_key=seq_api_key,  # Can be None/empty for anonymous
                level=logging.INFO,
                batch_size=10,
                auto_flush_timeout=2,  # Flush logs every 2 seconds
                override_root_logger=False  # Don't override root logger
            )
            print(f"SEQ logging configured: {seq_url}")
        except Exception as e:
            print(f"WARNING: Failed to configure SEQ logging: {e}")
    else:
        if not HAS_SEQLOG:
            print("SEQ logging disabled: seqlog library not available")
        else:
            print("SEQ logging disabled: SEQ_URL not configured")
    
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