"""
Logging middleware for FastAPI application.

This middleware logs every incoming HTTP request with structured logging,
capturing method, path, query parameters, and client IP address.
"""

import time
from typing import Callable
from urllib.parse import parse_qs

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from logging_config import get_logger, extract_client_ip


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
        Process each HTTP request and log details.
        
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
            
            # Add response details
            log_context.update({
                "status_code": response.status_code,
                "processing_time_ms": round((time.time() - start_time) * 1000, 2)
            })
            
            # Log successful request
            self.logger.info("HTTP request processed", **log_context)
            
        except Exception as exc:
            # Log failed request
            log_context.update({
                "status_code": 500,
                "error": str(exc),
                "processing_time_ms": round((time.time() - start_time) * 1000, 2)
            })
            
            self.logger.error("HTTP request failed", **log_context)
            raise
        
        return response