"""
Tests for the logging router and SEQ integration.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime

# Import our application
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Mock seqlog import since it may not be available in test environment
with patch.dict('sys.modules', {'seqlog': MagicMock()}):
    from main import app
    from routers.logging import LogEntry, LogBatch

client = TestClient(app)


class TestLoggingRouter:
    """Test cases for the logging router endpoints."""

    def test_logging_health_endpoint(self):
        """Test the logging health check endpoint."""
        response = client.get("/logging/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        assert "seq_configured" in data

    def test_submit_logs_endpoint_success(self):
        """Test successful log submission."""
        log_batch = {
            "logs": [
                {
                    "level": "info",
                    "message": "Test log message",
                    "timestamp": datetime.now().isoformat(),
                    "context": {"test": True},
                    "source": "frontend",
                    "url": "http://localhost:3000/test"
                },
                {
                    "level": "error",
                    "message": "Test error message",
                    "context": {"error_code": 500},
                    "error_stack": "Error: Test error\n    at test"
                }
            ]
        }
        
        response = client.post("/logging/submit", json=log_batch)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["count"] == 2
        assert "Successfully processed 2 log entries" in data["message"]

    def test_submit_logs_empty_batch(self):
        """Test submitting an empty log batch."""
        log_batch = {"logs": []}
        
        response = client.post("/logging/submit", json=log_batch)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["count"] == 0

    def test_submit_logs_invalid_data(self):
        """Test submitting invalid log data."""
        # Missing required fields
        invalid_batch = {"logs": [{"level": "info"}]}  # Missing message
        
        response = client.post("/logging/submit", json=invalid_batch)
        assert response.status_code == 422  # Validation error

    def test_log_entry_validation(self):
        """Test LogEntry model validation."""
        # Valid log entry
        valid_entry = LogEntry(
            level="info",
            message="Test message",
            context={"key": "value"}
        )
        assert valid_entry.level == "info"
        assert valid_entry.message == "Test message"
        assert valid_entry.source == "frontend"  # Default value
        
        # Test with all fields
        full_entry = LogEntry(
            level="error",
            message="Error message",
            timestamp=datetime.now(),
            context={"error": True},
            source="custom",
            user_agent="Test Agent",
            url="http://test.com",
            error_stack="Stack trace"
        )
        assert full_entry.source == "custom"
        assert full_entry.error_stack == "Stack trace"

    def test_log_batch_validation(self):
        """Test LogBatch model validation."""
        batch = LogBatch(logs=[
            LogEntry(level="info", message="Message 1"),
            LogEntry(level="error", message="Message 2")
        ])
        assert len(batch.logs) == 2


class TestLoggingConfig:
    """Test cases for logging configuration."""

    @patch.dict(os.environ, {"SEQ_URL": "http://test-seq:5341"})
    def test_seq_configuration_with_url(self):
        """Test logging configuration when SEQ_URL is set."""
        with patch('seqlog.log_to_seq') as mock_log_to_seq:
            # Import here to pick up the environment variable
            from logging_config import setup_logging
            setup_logging()
            mock_log_to_seq.assert_called_once()

    @patch.dict(os.environ, {}, clear=True)
    def test_seq_configuration_without_url(self):
        """Test logging configuration when SEQ_URL is not set."""
        with patch('seqlog.log_to_seq') as mock_log_to_seq:
            from logging_config import setup_logging
            setup_logging()
            mock_log_to_seq.assert_not_called()

    def test_extract_client_ip(self):
        """Test client IP extraction from headers."""
        from logging_config import extract_client_ip
        
        # Test X-Forwarded-For header
        headers = {"x-forwarded-for": "192.168.1.1, 10.0.0.1"}
        assert extract_client_ip(headers) == "192.168.1.1"
        
        # Test X-Real-IP header
        headers = {"x-real-ip": "172.16.0.1"}
        assert extract_client_ip(headers) == "172.16.0.1"
        
        # Test fallback
        headers = {"client-ip": "127.0.0.1"}
        assert extract_client_ip(headers) == "127.0.0.1"
        
        # Test unknown
        headers = {}
        assert extract_client_ip(headers) == "unknown"


if __name__ == "__main__":
    pytest.main([__file__])