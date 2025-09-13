"""
Logging router for handling frontend log submissions.

This router provides endpoints for the frontend to submit logs that will be
forwarded to the structured logging system and SEQ for centralized log management.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from fastapi import APIRouter, HTTPException, Request
from logging_config import get_logger

router = APIRouter(prefix="/logging", tags=["logging"])
logger = get_logger("frontend_logs")


class LogEntry(BaseModel):
    """Frontend log entry model."""
    level: str = Field(..., description="Log level (debug, info, warn, error)")
    message: str = Field(..., description="Log message")
    timestamp: Optional[datetime] = Field(default=None, description="Client timestamp")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")
    source: Optional[str] = Field(default="frontend", description="Log source")
    user_agent: Optional[str] = Field(default=None, description="User agent string")
    url: Optional[str] = Field(default=None, description="Current page URL")
    error_stack: Optional[str] = Field(default=None, description="Error stack trace if available")


class LogBatch(BaseModel):
    """Batch of frontend log entries."""
    logs: List[LogEntry] = Field(..., description="Array of log entries")


@router.post("/submit", summary="Submit frontend logs")
async def submit_logs(log_batch: LogBatch, request: Request):
    """
    Submit frontend logs to the backend logging system.
    
    This endpoint receives logs from the frontend and forwards them to the
    structured logging system where they will be sent to SEQ for centralized
    log management and analysis.
    
    Args:
        log_batch: Batch of log entries from the frontend
        request: FastAPI request object for extracting client info
        
    Returns:
        Success message with the number of logs processed
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        for log_entry in log_batch.logs:
            # Prepare structured log context
            log_context = {
                "event_type": "frontend_log",
                "source": log_entry.source or "frontend",
                "client_ip": client_ip,
                "user_agent": log_entry.user_agent or user_agent,
                "url": log_entry.url,
                "client_timestamp": log_entry.timestamp.isoformat() if log_entry.timestamp else None,
                **(log_entry.context or {})
            }
            
            # Add error stack if present
            if log_entry.error_stack:
                log_context["error_stack"] = log_entry.error_stack
            
            # Log based on level
            level = log_entry.level.lower()
            if level == "debug":
                logger.debug(log_entry.message, **log_context)
            elif level == "info":
                logger.info(log_entry.message, **log_context)
            elif level == "warn" or level == "warning":
                logger.warning(log_entry.message, **log_context)
            elif level == "error":
                logger.error(log_entry.message, **log_context)
            else:
                # Default to info for unknown levels
                logger.info(log_entry.message, level=level, **log_context)
        
        return {
            "status": "success",
            "message": f"Successfully processed {len(log_batch.logs)} log entries",
            "count": len(log_batch.logs)
        }
        
    except Exception as e:
        logger.error("Failed to process frontend logs", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process logs")


@router.get("/health", summary="Logging health check")
async def logging_health():
    """
    Health check endpoint for the logging system.
    
    Returns basic information about the logging configuration and status.
    """
    import os
    
    seq_configured = bool(os.getenv("SEQ_URL"))
    
    return {
        "status": "healthy",
        "seq_configured": seq_configured,
        "seq_url": os.getenv("SEQ_URL") if seq_configured else None
    }