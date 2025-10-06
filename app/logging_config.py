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
import time
from typing import Any, Dict, Optional
from urllib.parse import urlparse

import structlog
from structlog.types import Processor

try:
    import seqlog
    HAS_SEQLOG = True
except ImportError:
    HAS_SEQLOG = False
    print("WARNING: seqlog not available. SEQ logging will be disabled.")

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("WARNING: requests library not available. SEQ health checks will be disabled.")

# Global SEQ connection state
_seq_connection_state = {
    "connected": False,
    "last_check": 0,
    "last_error": None,
    "retry_count": 0
}


def validate_seq_config(seq_url: str) -> tuple[bool, Optional[str]]:
    """
    Validate SEQ configuration.
    
    Args:
        seq_url: SEQ server URL
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not seq_url:
        return False, "SEQ_URL is empty"
    
    try:
        parsed = urlparse(seq_url)
        if not parsed.scheme or not parsed.netloc:
            return False, f"Invalid SEQ_URL format: {seq_url}"
        if parsed.scheme not in ["http", "https"]:
            return False, f"SEQ_URL must use http or https protocol: {seq_url}"
        return True, None
    except Exception as e:
        return False, f"Failed to parse SEQ_URL: {e}"


def check_seq_health(seq_url: str, timeout: int = 5) -> tuple[bool, Optional[str]]:
    """
    Check if SEQ is accessible and healthy.
    
    Args:
        seq_url: SEQ server URL
        timeout: Request timeout in seconds
        
    Returns:
        Tuple of (is_healthy, error_message)
    """
    if not HAS_REQUESTS:
        return True, None  # Skip health check if requests not available
    
    try:
        # Try to reach SEQ health endpoint or root
        health_url = f"{seq_url.rstrip('/')}/api/health" if "/api/" not in seq_url else seq_url
        response = requests.get(health_url, timeout=timeout)
        if response.status_code == 200:
            return True, None
        return False, f"SEQ returned status {response.status_code}"
    except requests.exceptions.Timeout:
        return False, f"SEQ connection timeout after {timeout}s"
    except requests.exceptions.ConnectionError as e:
        return False, f"Cannot connect to SEQ: {e}"
    except Exception as e:
        return False, f"SEQ health check failed: {e}"


def configure_seq_with_retry(seq_url: str, seq_api_key: Optional[str], max_retries: int = 3) -> tuple[bool, Optional[str]]:
    """
    Configure SEQ logging with retry logic and exponential backoff.
    
    Args:
        seq_url: SEQ server URL
        seq_api_key: Optional API key for SEQ
        max_retries: Maximum number of retry attempts
        
    Returns:
        Tuple of (success, error_message)
    """
    if not HAS_SEQLOG:
        return False, "seqlog library not available"
    
    # Validate configuration
    is_valid, error_msg = validate_seq_config(seq_url)
    if not is_valid:
        return False, error_msg
    
    # Try to configure with retries
    for attempt in range(max_retries):
        try:
            seqlog.log_to_seq(
                server_url=seq_url,
                api_key=seq_api_key,
                level=logging.INFO,
                batch_size=10,
                auto_flush_timeout=2,
                override_root_logger=False
            )
            
            # Update connection state
            _seq_connection_state["connected"] = True
            _seq_connection_state["last_check"] = time.time()
            _seq_connection_state["last_error"] = None
            _seq_connection_state["retry_count"] = attempt
            
            return True, None
            
        except Exception as e:
            wait_time = min(2 ** attempt, 10)  # Exponential backoff, max 10s
            error_msg = f"Attempt {attempt + 1}/{max_retries} failed: {e}"
            print(f"WARNING: Failed to configure SEQ logging - {error_msg}")
            
            if attempt < max_retries - 1:
                print(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                _seq_connection_state["connected"] = False
                _seq_connection_state["last_error"] = str(e)
                return False, error_msg
    
    return False, "Max retries exceeded"


def setup_logging() -> None:
    """
    Configure structured logging with JSON output and SEQ integration.
    
    Sets up structlog with processors for consistent JSON formatted logs
    that include timestamps, log levels, and structured data. Optionally
    sends logs to SEQ if configured with retry logic and health checking.
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
    
    if seq_url and HAS_SEQLOG:
        # Check SEQ health before configuring
        is_healthy, health_error = check_seq_health(seq_url)
        if not is_healthy:
            print(f"WARNING: SEQ health check failed: {health_error}")
            print("Continuing with SEQ configuration anyway...")
        
        # Configure with retry logic
        success, error_msg = configure_seq_with_retry(seq_url, seq_api_key)
        if success:
            print(f"✓ SEQ logging configured: {seq_url}")
            if _seq_connection_state.get("retry_count", 0) > 0:
                print(f"  (Connected after {_seq_connection_state['retry_count']} retries)")
        else:
            print(f"✗ Failed to configure SEQ logging: {error_msg}")
            print("  Logs will only be written to console")
    else:
        if not HAS_SEQLOG:
            print("SEQ logging disabled: seqlog library not available")
        elif not seq_url:
            print("SEQ logging disabled: SEQ_URL not configured")
        else:
            print("SEQ logging disabled: Configuration incomplete")
    
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


def get_seq_connection_status() -> Dict[str, Any]:
    """
    Get current SEQ connection status and statistics.
    
    Returns:
        Dictionary with connection state, last check time, and error info
    """
    return {
        "connected": _seq_connection_state.get("connected", False),
        "last_check": _seq_connection_state.get("last_check", 0),
        "last_error": _seq_connection_state.get("last_error"),
        "retry_count": _seq_connection_state.get("retry_count", 0),
        "seq_url": os.getenv("SEQ_URL"),
        "seqlog_available": HAS_SEQLOG
    }