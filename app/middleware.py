"""
Logging middleware for FastAPI application.

This middleware logs every incoming HTTP request with structured logging,
capturing method, path, query parameters, and client IP address.
"""

import time
from typing import Callable
from urllib.parse import parse_qs
from collections import defaultdict
from threading import Lock

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from logging_config import get_logger, extract_client_ip

# Request metrics tracking
_request_metrics = {
    "total_requests": 0,
    "failed_requests": 0,
    "status_codes": defaultdict(int),
    "total_processing_time": 0.0,
    "lock": Lock()
}


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP requests with structured logging.
    
    Logs every request at INFO level with details including:
    - HTTP method
    - Request path
    - Query parameters
    - Client IP address
    - Response status code
    - Processing time
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.logger = get_logger("request")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process each HTTP request and log details with metrics tracking.
        
        Args:
            request: The incoming HTTP request
            call_next: The next middleware/endpoint in the chain
            
        Returns:
            The HTTP response from the application
        """
        start_time = time.time()
        
        # Extract request details
        method = request.method
        path = str(request.url.path)
        query_string = str(request.url.query) if request.url.query else ""
        
        # Get client IP from headers or connection
        client_ip = extract_client_ip(dict(request.headers))
        if client_ip == "unknown" and hasattr(request, "client") and request.client:
            client_ip = request.client.host
        
        # Prepare log context
        log_context = {
            "event_type": "request",
            "method": method,
            "path": path,
            "query": query_string,
            "client_ip": client_ip,
        }
        
        # Process the request
        try:
            response = await call_next(request)
            processing_time = round((time.time() - start_time) * 1000, 2)
            
            # Update metrics
            with _request_metrics["lock"]:
                _request_metrics["total_requests"] += 1
                _request_metrics["status_codes"][response.status_code] += 1
                _request_metrics["total_processing_time"] += processing_time
            
            # Add response details
            log_context.update({
                "status_code": response.status_code,
                "processing_time_ms": processing_time
            })
            
            # Log successful request
            self.logger.info("HTTP request processed", **log_context)
            
        except Exception as exc:
            processing_time = round((time.time() - start_time) * 1000, 2)
            
            # Update metrics for failed request
            with _request_metrics["lock"]:
                _request_metrics["total_requests"] += 1
                _request_metrics["failed_requests"] += 1
                _request_metrics["status_codes"][500] += 1
                _request_metrics["total_processing_time"] += processing_time
            
            # Log failed request with more context
            log_context.update({
                "status_code": 500,
                "error": str(exc),
                "error_type": type(exc).__name__,
                "processing_time_ms": processing_time
            })
            
            self.logger.error("HTTP request failed", exc_info=True, **log_context)
            raise
        
        return response


def get_request_metrics() -> dict:
    """
    Get current request metrics.
    
    Returns:
        Dictionary with request statistics
    """
    with _request_metrics["lock"]:
        avg_time = (_request_metrics["total_processing_time"] / _request_metrics["total_requests"] 
                   if _request_metrics["total_requests"] > 0 else 0)
        
        return {
            "total_requests": _request_metrics["total_requests"],
            "failed_requests": _request_metrics["failed_requests"],
            "success_rate": ((_request_metrics["total_requests"] - _request_metrics["failed_requests"]) 
                           / _request_metrics["total_requests"] * 100 
                           if _request_metrics["total_requests"] > 0 else 100),
            "status_codes": dict(_request_metrics["status_codes"]),
            "avg_processing_time_ms": round(avg_time, 2)
        }