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
# Health check for logging system
curl http://localhost:3000/api/logging/health

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

### SEQ Container Won't Start

1. Check port conflicts:
   ```bash
   netstat -tulpn | grep -E "(5341|5342)"
   ```

2. Check Docker logs:
   ```bash
   docker compose logs seq
   ```

3. Verify environment variables:
   ```bash
   docker compose config
   ```

4. **Clean up SEQ volume if initialization failed**:
   ```bash
   # Stop all services
   docker compose down
   
   # Remove SEQ data volume (this will delete all log data)
   docker volume rm trainstation_seqdata
   
   # Restart services - SEQ will initialize with fresh volume
   docker compose up -d
   ```

   **Warning**: This will permanently delete all stored logs in SEQ.

### Logs Not Appearing in SEQ

1. Check backend SEQ configuration:
   ```bash
   curl http://localhost:3000/api/logging/health
   ```

2. Check backend logs for SEQ connection errors:
   ```bash
   docker compose logs api | grep -i seq
   ```

3. Verify network connectivity:
   ```bash
   docker compose exec api ping seq
   ```

### Frontend Logs Not Being Sent

1. Check browser console for errors
2. Verify API endpoint accessibility:
   ```bash
   curl http://localhost:3000/api/logging/health
   ```

3. Check network tab in browser dev tools for failed requests to `/api/logging/submit`

### Performance Issues

1. Adjust frontend logging buffer settings:
   - Increase `bufferSize` for less frequent network calls
   - Decrease `flushInterval` for more real-time logging

2. Configure SEQ retention policies to manage disk usage

3. Use SEQ API keys to control ingestion rate

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