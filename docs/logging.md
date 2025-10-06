# Logging Configuration and Setup

TrainStation uses centralized logging with SEQ for comprehensive log management and analysis. This document covers setup, configuration, usage, and verification for both development and production environments.

## 🎯 Overview

The logging system consists of:
- **SEQ**: Centralized log aggregation and analysis platform
- **Backend Logging**: Python structured logging with `structlog` and `seqlog`
- **Frontend Logging**: TypeScript logging utilities that relay logs through backend API
- **Docker Integration**: SEQ container included in Docker Compose setup

## 🚀 Quick Start

### 1. Environment Setup

The SEQ service is automatically included in Docker Compose. No additional setup is required for basic functionality.

```bash
# Start development environment (includes SEQ)
make dev

# Start production environment (includes SEQ)
make prod
```

### 2. Access SEQ Dashboard

- **Development**: http://localhost:5341
- **Production**: http://localhost:5341 (or configured port)

Default credentials for development:
- **Username**: admin
- **Password**: admin123

## 🔧 Configuration

### Environment Variables

Add these variables to your environment files:

#### `.env.dev` (Development)
```bash
# SEQ Configuration
SEQ_UI_PORT=5341
SEQ_INGESTION_PORT=5342
SEQ_URL=http://seq:5341
SEQ_API_KEY=
```

#### `.env.prod` (Production)
```bash
# SEQ Configuration
SEQ_UI_PORT=5341
SEQ_INGESTION_PORT=5342
SEQ_URL=http://seq:5341
SEQ_API_KEY=your_production_api_key_here
SEQ_ADMIN_PASSWORD=your_secure_password_here
```

### Set Production Password

For production, set a secure password in your environment file:

```bash
# In .env.prod
SEQ_ADMIN_PASSWORD=your_very_secure_password_here
```

**Security Note**: Always use strong passwords in production environments.

### SEQ Service Configuration

The SEQ service is configured in `docker-compose.yml`:

```yaml
seq:
  image: datalust/seq:latest
  environment:
    - ACCEPT_EULA=Y
    - SEQ_FIRSTRUN_ADMINPASSWORD=${SEQ_ADMIN_PASSWORD:-YourStrongPassword123}
  ports:
    - "${SEQ_UI_PORT:-5341}:80"
    - "${SEQ_INGESTION_PORT:-5342}:5341"
  volumes:
    - seqdata:/data
  restart: unless-stopped
  networks:
    - trainstation
```

## 💻 Usage

### Backend Logging

The backend automatically logs all HTTP requests and application events:

```python
from logging_config import get_logger

logger = get_logger("my_module")

# Structured logging examples
logger.info("User action completed", user_id=123, action="create_asset")
logger.error("Database connection failed", error=str(e), retry_count=3)
logger.debug("Processing request", request_id="abc-123", processing_time=45.2)
```

### Frontend Logging

Use the logging utilities in your React components:

```typescript
import { log } from '../shared/logging';

// Basic logging
log.info('Component mounted', { component: 'Dashboard' });
log.warn('API response slow', { responseTime: 3500 });

// Error logging with stack trace
try {
  // some operation
} catch (error) {
  log.error('Operation failed', error, { operation: 'fetchAssets' });
}

// Manual flush (useful before navigation)
await log.flush();
```

### Automatic Error Capture

The frontend automatically captures:
- Uncaught JavaScript errors
- Unhandled promise rejections
- Component errors (when using error boundaries)

## 📊 Log Structure

### Backend Logs

```json
{
  "event_type": "request",
  "method": "GET",
  "path": "/trainAssets",
  "query": "status=active",
  "client_ip": "172.18.0.1",
  "status_code": 200,
  "processing_time_ms": 23.45,
  "event": "HTTP request processed",
  "level": "info",
  "logger": "request",
  "timestamp": "2025-01-15T10:30:45.123Z"
}
```

### Frontend Logs

```json
{
  "event_type": "frontend_log",
  "source": "frontend",
  "client_ip": "172.18.0.1",
  "user_agent": "Mozilla/5.0...",
  "url": "http://localhost:3000/dashboard",
  "client_timestamp": "2025-01-15T10:30:45.123Z",
  "component": "Dashboard",
  "level": "info",
  "event": "Component mounted",
  "timestamp": "2025-01-15T10:30:45.124Z"
}
```

## 🔍 Verification

### 1. Check Service Status

```bash
# Check all services are running
docker compose ps

# Check SEQ specific logs
docker compose logs seq

# Check backend logging
docker compose logs api | grep -E "(SEQ|logging)"
```

### 2. Test Logging Endpoints

```bash
# Health check for logging system (enhanced with connection status)
curl http://localhost:3000/api/logging/health | jq

# Expected response:
# {
#   "status": "healthy",
#   "seq_configured": true,
#   "seq_connected": true,
#   "seq_url": "http://seq:5341",
#   "seqlog_available": true,
#   "last_check": "2025-01-15T10:30:45.123Z",
#   "last_error": null,
#   "retry_count": 0,
#   "message": "SEQ connection active"
# }

# Get logging metrics
curl http://localhost:3000/api/logging/metrics | jq

# Test log submission (from backend perspective)
curl -X POST http://localhost:3000/api/logging/submit \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [{
      "level": "info",
      "message": "Test log from curl",
      "context": {"test": true}
    }]
  }'
```

### 3. Verify SEQ Integration

1. Open SEQ dashboard: http://localhost:5341
2. Login with configured credentials
3. Look for logs with sources:
   - `request` - HTTP requests from backend middleware
   - `frontend_logs` - Logs relayed from frontend
   - `main` - Application startup/shutdown events

### 4. Test Frontend Logging

Open browser console and run:

```javascript
// Test the logging system
import('./shared/logging').then(({ log }) => {
  log.info('Manual test log', { testId: 'manual-123' });
  log.error('Test error', new Error('Test error message'));
});
```

## 🚨 Troubleshooting

### Enhanced Reliability Features

The logging system now includes:
- **Automatic Retry Logic**: SEQ connection attempts retry up to 3 times with exponential backoff
- **Connection Monitoring**: Real-time tracking of SEQ connection status
- **Frontend Resilience**: Failed log batches are queued and retried when connection recovers
- **Metrics Tracking**: Comprehensive metrics for monitoring system health

For detailed troubleshooting, see [Logging Troubleshooting Guide](./logging-troubleshooting.md).

### Quick Diagnostics

```bash
# Check overall health with detailed status
curl http://localhost:3000/api/logging/health | jq

# Get comprehensive metrics
curl http://localhost:3000/api/logging/metrics | jq

# Frontend status (in browser console)
import('./shared/logging').then(({ log }) => {
  console.log('Logging Status:', log.getStatus());
});
```

### Common Issues

#### SEQ Connection Failed

If health check shows `"status": "degraded"`:

1. Check SEQ container is running:
   ```bash
   docker compose ps seq
   docker compose logs seq --tail=50
   ```

2. Test network connectivity:
   ```bash
   docker compose exec api ping seq
   docker compose exec api curl http://seq:5341/api/health
   ```

3. Check retry count and last error:
   ```bash
   curl http://localhost:3000/api/logging/health | jq '{retry_count, last_error, last_check}'
   ```

4. Restart services if needed:
   ```bash
   docker compose restart seq api
   sleep 5
   curl http://localhost:3000/api/logging/health | jq
   ```

#### Frontend Logs Not Being Sent

1. Check browser console for retry messages
2. Verify connection status:
   ```javascript
   import('./shared/logging').then(({ log }) => {
     const status = log.getStatus();
     console.log(`Buffer: ${status.bufferSize}, Failed: ${status.failedBatches}, Online: ${status.isOnline}`);
   });
   ```

3. Check metrics for failed batches:
   ```bash
   curl http://localhost:3000/api/logging/metrics | jq '.frontend_logs'
   ```

#### Performance Issues

Monitor metrics for issues:
```bash
# Check success rates and processing times
curl http://localhost:3000/api/logging/metrics | jq '{
  frontend_success: .frontend_logs.success_rate,
  api_success: .request_metrics.success_rate,
  avg_time: .request_metrics.avg_processing_time_ms
}'
```

For comprehensive troubleshooting procedures, see [docs/logging-troubleshooting.md](./logging-troubleshooting.md).

## 🔐 Security Considerations

### Production Deployment

1. **Change Default Passwords**: Always use secure passwords for SEQ admin account
2. **Use API Keys**: Configure SEQ API keys for controlled access
3. **Network Security**: Consider firewall rules for SEQ UI port (5341)
4. **Log Filtering**: Be careful not to log sensitive information (passwords, tokens, etc.)

### Log Sanitization

The system automatically filters sensitive headers and data. Customize in `logging_config.py`:

```python
# Example: Add custom sanitization
SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key']

def sanitize_context(context: dict) -> dict:
    """Remove sensitive information from log context."""
    return {k: '***' if any(field in k.lower() for field in SENSITIVE_FIELDS) else v 
            for k, v in context.items()}
```

## 📈 Advanced Configuration

### Custom Log Levels

```python
# Backend: Add custom log levels
logger.bind(severity="critical").error("Critical system failure")
```

```typescript
// Frontend: Add custom context
log.info('User interaction', { 
  interaction: 'button_click',
  button_id: 'save_asset',
  user_session: 'session-123'
});
```

### SEQ Queries

Useful SEQ queries for monitoring:

```sql
-- Frontend errors in last hour
@timestamp > now() - 1h and event_type = "frontend_log" and level = "error"

-- Slow API requests
event_type = "request" and processing_time_ms > 1000

-- Failed requests by IP
event_type = "request" and status_code >= 400 
| group by client_ip 
| order by count() desc
```

### Retention and Storage

Configure SEQ retention in the admin panel:
1. Go to Settings > Retention
2. Set policies based on log level and age
3. Monitor disk usage regularly

## 📝 Log Best Practices

1. **Use Structured Context**: Always include relevant context in logs
2. **Avoid Sensitive Data**: Never log passwords, tokens, or personal information
3. **Use Appropriate Levels**: Debug for development, Info for normal operations, Error for problems
4. **Include Request IDs**: Use correlation IDs for tracking requests across services
5. **Log User Actions**: Track important user interactions for analytics and debugging
6. **Monitor Metrics**: Regularly check `/logging/metrics` for system health
7. **Set Up Alerts**: Monitor success rates and connection status
8. **Review Failed Batches**: Check for patterns in failed log submissions

## 🎯 New Features

### Automatic Retry Logic

The system now automatically retries failed SEQ connections:
- **Backend**: 3 retry attempts with exponential backoff (up to 10s)
- **Frontend**: 3 retry attempts per batch with exponential backoff
- **Automatic Recovery**: Frontend queues failed batches and retries when network recovers

### Connection Monitoring

Real-time connection status tracking:
```bash
curl http://localhost:3000/api/logging/health | jq
```

Returns:
- Connection status (connected/disconnected)
- Last successful check time
- Last error encountered
- Number of retries needed to connect
- Configuration validation status

### Metrics and Observability

Comprehensive metrics endpoint:
```bash
curl http://localhost:3000/api/logging/metrics | jq
```

Provides:
- Frontend log submission stats (total, success rate, by level)
- API request metrics (total, failed, status codes, avg time)
- SEQ connection status
- Failed batch counts

### Enhanced Error Handling

- **Buffer Overflow Protection**: Frontend automatically manages buffer size
- **Batch Size Limits**: Maximum 50 logs per batch to prevent oversized payloads
- **Online/Offline Detection**: Frontend monitors network status and pauses sending when offline
- **Error Context**: Detailed error information including error types and stack traces

## 🔄 Maintenance

### Regular Tasks

1. **Monitor Disk Usage**: SEQ data volume can grow large
2. **Review Log Levels**: Adjust verbosity based on environment
3. **Update Retention Policies**: Balance storage costs with debugging needs
4. **Check Performance**: Monitor logging overhead on application performance

### Backup and Recovery

SEQ data is stored in the `seqdata` Docker volume:

```bash
# Backup SEQ data
docker run --rm -v trainstation_seqdata:/data -v $(pwd):/backup alpine tar czf /backup/seq-backup.tar.gz -C /data .

# Restore SEQ data
docker run --rm -v trainstation_seqdata:/data -v $(pwd):/backup alpine tar xzf /backup/seq-backup.tar.gz -C /data
```