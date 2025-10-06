"""
Logging router for handling frontend log submissions.

This router provides endpoints for the frontend to submit logs that will be
forwarded to the structured logging system and SEQ for centralized log management.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from fastapi import APIRouter, HTTPException, Request
from logging_config import get_logger, get_seq_connection_status

router = APIRouter(prefix="/logging", tags=["logging"])
logger = get_logger("frontend_logs")

# Track frontend log submission metrics
_submission_metrics = {
    "total_batches": 0,
    "total_logs": 0,
    "failed_batches": 0,
    "logs_by_level": {"debug": 0, "info": 0, "warn": 0, "error": 0}
}


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
        
        # Update metrics
        _submission_metrics["total_batches"] += 1
        _submission_metrics["total_logs"] += len(log_batch.logs)
        
        for log_entry in log_batch.logs:
            # Track log level metrics
            level = log_entry.level.lower()
            if level in _submission_metrics["logs_by_level"]:
                _submission_metrics["logs_by_level"][level] += 1
            
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
        _submission_metrics["failed_batches"] += 1
        logger.error("Failed to process frontend logs", error=str(e), error_type=type(e).__name__, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process logs")


@router.get("/health", summary="Logging health check")
async def logging_health():
    """
    Health check endpoint for the logging system.
    
    Returns detailed information about the logging configuration, SEQ connection
    status, and any errors encountered.
    """
    import os
    from datetime import datetime
    
    status = get_seq_connection_status()
    seq_configured = bool(os.getenv("SEQ_URL"))
    
    # Convert timestamp to readable format
    last_check_time = None
    if status.get("last_check"):
        last_check_time = datetime.fromtimestamp(status["last_check"]).isoformat()
    
    return {
        "status": "healthy" if status.get("connected") or not seq_configured else "degraded",
        "seq_configured": seq_configured,
        "seq_connected": status.get("connected", False),
        "seq_url": status.get("seq_url"),
        "seqlog_available": status.get("seqlog_available", False),
        "last_check": last_check_time,
        "last_error": status.get("last_error"),
        "retry_count": status.get("retry_count", 0),
        "message": "SEQ connection active" if status.get("connected") 
                   else "SEQ not configured" if not seq_configured
                   else f"SEQ connection failed: {status.get('last_error', 'Unknown error')}"
    }


@router.get("/metrics", summary="Get logging metrics")
async def logging_metrics():
    """
    Get logging system metrics and statistics.
    
    Returns metrics about log submissions, processing, and system performance.
    """
    from middleware import get_request_metrics
    
    request_metrics = get_request_metrics()
    
    return {
        "frontend_logs": {
            "total_batches": _submission_metrics["total_batches"],
            "total_logs": _submission_metrics["total_logs"],
            "failed_batches": _submission_metrics["failed_batches"],
            "success_rate": ((_submission_metrics["total_batches"] - _submission_metrics["failed_batches"]) 
                           / _submission_metrics["total_batches"] * 100 
                           if _submission_metrics["total_batches"] > 0 else 100),
            "logs_by_level": _submission_metrics["logs_by_level"]
        },
        "request_metrics": request_metrics,
        "seq_status": get_seq_connection_status()
    }