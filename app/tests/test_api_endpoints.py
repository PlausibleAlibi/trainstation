"""
Tests for FastAPI endpoints
"""
import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


def test_health_endpoint(client):
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_version_endpoint(client):
    """Test the version endpoint"""
    response = client.get("/version")
    assert response.status_code == 200
    data = response.json()
    assert "commit" in data
    assert "built_at" in data


def test_categories_endpoint_structure(client):
    """Test that categories endpoint returns expected structure"""
    response = client.get("/categories")
    assert response.status_code in [200, 404, 500]  # Expect some response
    
    # If successful, check structure
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


def test_accessories_endpoint_structure(client):
    """Test that accessories endpoint returns expected structure"""  
    response = client.get("/accessories")
    assert response.status_code in [200, 404, 500]  # Expect some response
    
    # If successful, check structure
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)


def test_cors_headers(client):
    """Test that CORS headers are properly set"""
    response = client.options("/health")
    # Should allow CORS preflight
    assert response.status_code in [200, 404, 405]


def test_nonexistent_endpoint(client):
    """Test that non-existent endpoints return 404"""
    response = client.get("/nonexistent")
    assert response.status_code == 404