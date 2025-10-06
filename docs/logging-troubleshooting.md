# SEQ Logging Troubleshooting Guide

This guide helps diagnose and resolve issues with the enhanced SEQ logging integration, including connection problems, retry failures, and observability concerns.

## 🔍 Quick Diagnostics

### Check Overall System Health

```bash
# Check logging system health
curl http://localhost:3000/api/logging/health | jq

# Check logging metrics
curl http://localhost:3000/api/logging/metrics | jq

# Check SEQ container status
docker compose ps seq
docker compose logs seq --tail=50
```

### Health Endpoint Response

A healthy system should return:
```json
{
  "status": "healthy",
  "seq_configured": true,
  "seq_connected": true,
  "seq_url": "http://seq:5341",
  "seqlog_available": true,
  "last_check": "2025-01-15T10:30:45.123Z",
  "last_error": null,
  "retry_count": 0,
  "message": "SEQ connection active"
}
```

## 🚨 Common Issues

### 1. SEQ Connection Failed

**Symptoms:**
- Health endpoint shows `"status": "degraded"`
- `seq_connected` is `false`
- Error message in `last_error` field
- Backend logs show "Failed to configure SEQ logging"

**Diagnostic Commands:**
```bash
# Check if SEQ container is running
docker compose ps seq

# Check SEQ logs for errors
docker compose logs seq | grep -i error

# Test network connectivity from API container
docker compose exec api ping seq

# Test SEQ HTTP endpoint
docker compose exec api curl http://seq:5341/api/health
```

**Common Causes & Solutions:**

#### a) SEQ Container Not Running
```bash
# Check container status
docker compose ps seq

# If not running, check logs
docker compose logs seq

# Restart SEQ service
docker compose restart seq
```

#### b) Network Connectivity Issues
```bash
# Verify both services are on same network
docker network inspect trainstation_trainstation

# Check if API can reach SEQ
docker compose exec api nc -zv seq 5341
```

#### c) Invalid SEQ_URL Configuration
```bash
# Check environment configuration
docker compose config | grep -A5 "api:" | grep SEQ_URL

# Update in .env file
# SEQ_URL should be: http://seq:5341 (internal Docker network)
# NOT: http://localhost:5341
```

#### d) SEQ Port Conflict
```bash
# Check if ports are already in use
netstat -tulpn | grep -E "(5341|5342)"

# Change ports in .env file if needed
SEQ_UI_PORT=5343
SEQ_INGESTION_PORT=5344
```

### 2. Retry Logic Not Working

**Symptoms:**
- `retry_count` stays at 0 even with connection issues
- Logs show only one connection attempt
- Connection fails immediately without retries

**Diagnostics:**
```bash
# Check backend logs for retry attempts
docker compose logs api | grep -i "retry"

# Verify retry configuration in code
docker compose exec api cat /app/logging_config.py | grep -A10 "configure_seq_with_retry"
```

**Solutions:**

#### a) Max Retries Exhausted
The system retries 3 times by default. If SEQ is completely unavailable, it will fail after retries.

```bash
# Check last error details
curl http://localhost:3000/api/logging/health | jq '.last_error'

# Fix the underlying issue (SEQ not running, network problem, etc.)
# Then restart API to retry connection
docker compose restart api
```

#### b) Transient Network Issues
If you see retry counts > 0 but still failing:

```bash
# Check for intermittent network issues
docker compose exec api ping -c 10 seq

# Check SEQ health
curl http://localhost:5341/api/health
```

### 3. Logs Not Appearing in SEQ

**Symptoms:**
- Health check shows connected
- No errors in logs
- But logs don't appear in SEQ UI

**Diagnostics:**
```bash
# Check if logs are being sent
docker compose logs api | grep "SEQ logging configured"

# Check SEQ ingestion port
docker compose logs seq | grep -i ingestion

# Verify log levels
curl http://localhost:3000/api/logging/metrics | jq '.frontend_logs'
```

**Solutions:**

#### a) Wrong SEQ Ingestion Port
```bash
# Internal applications should use port 5341 (not 5342)
# Check configuration
docker compose config | grep -A10 "seq:"

# Verify SEQ_URL in .env
SEQ_URL=http://seq:5341  # Correct
# NOT: http://seq:5342  # This is external ingestion port
```

#### b) SEQ API Key Issues
```bash
# Check if API key is required
curl http://localhost:5341

# If authentication required, verify API key
# In .env file:
SEQ_API_KEY=your_api_key_here

# Restart API service
docker compose restart api
```

#### c) Log Level Filtering
```bash
# SEQ might be filtering logs by level
# Check SEQ UI Settings > Stream > Filters
# Ensure log level is set to include INFO/DEBUG
```

### 4. Frontend Log Submission Failures

**Symptoms:**
- Browser console shows "Failed to send logs to backend"
- Network tab shows 500 errors on `/api/logging/submit`
- Metrics show high `failed_batches` count

**Diagnostics:**
```bash
# Check frontend log metrics
curl http://localhost:3000/api/logging/metrics | jq '.frontend_logs'

# Check backend logs for processing errors
docker compose logs api | grep "frontend_logs"

# Test the endpoint manually
curl -X POST http://localhost:3000/api/logging/submit \
  -H "Content-Type: application/json" \
  -d '{"logs":[{"level":"info","message":"test"}]}'
```

**Solutions:**

#### a) Oversized Log Batches
Frontend now limits batches to 50 logs. If you see buffer overflow warnings:

```javascript
// In browser console, check buffer status
import('./shared/logging').then(({ log }) => {
  console.log(log.getStatus());
});
```

#### b) Network Connectivity from Browser
```bash
# Check if API is accessible from browser
curl http://localhost:3000/api/logging/health

# Check nginx proxy configuration
docker compose exec nginx cat /etc/nginx/conf.d/default.conf | grep logging
```

#### c) CORS Issues (if frontend on different domain)
```bash
# Check nginx configuration for CORS headers
docker compose logs nginx | grep -i cors

# Verify API allows requests from frontend origin
```

### 5. High Memory/CPU Usage

**Symptoms:**
- API container using excessive resources
- Slow log processing
- Timeouts on log submission

**Diagnostics:**
```bash
# Check container resource usage
docker stats

# Check log buffer sizes
curl http://localhost:3000/api/logging/metrics | jq

# Check SEQ resource usage
docker compose exec seq top
```

**Solutions:**

#### a) Too Many Logs
```bash
# Check log volume
curl http://localhost:3000/api/logging/metrics | jq '.frontend_logs.total_logs'

# Adjust frontend buffer settings if needed:
# - Increase bufferSize (less frequent flushes)
# - Increase flushInterval (longer between flushes)
```

#### b) Failed Batch Queue Building Up
```javascript
// Check failed batch queue in browser console
import('./shared/logging').then(({ log }) => {
  const status = log.getStatus();
  console.log('Failed batches:', status.failedBatches);
});

// If queue is large, force a flush
log.flush();
```

#### c) SEQ Database Size
```bash
# Check SEQ data volume size
docker system df -v | grep seqdata

# Configure retention policies in SEQ UI
# Settings > Retention > Add retention policy
```

## 📊 Monitoring Best Practices

### 1. Regular Health Checks

Set up monitoring to check the health endpoint:

```bash
# Example monitoring script
#!/bin/bash
while true; do
  STATUS=$(curl -s http://localhost:3000/api/logging/health | jq -r '.status')
  if [ "$STATUS" != "healthy" ]; then
    echo "ALERT: Logging system degraded at $(date)"
    curl -s http://localhost:3000/api/logging/health | jq
  fi
  sleep 60
done
```

### 2. Metrics Dashboard

Create a simple dashboard for key metrics:

```bash
# Get current metrics
curl -s http://localhost:3000/api/logging/metrics | jq '{
  frontend_success_rate: .frontend_logs.success_rate,
  total_logs: .frontend_logs.total_logs,
  failed_batches: .frontend_logs.failed_batches,
  api_success_rate: .request_metrics.success_rate,
  seq_connected: .seq_status.connected
}'
```

### 3. Alert Thresholds

Monitor these thresholds:
- **Success Rate < 95%**: Investigate connection issues
- **Failed Batches > 10**: Check network stability
- **Retry Count > 2**: SEQ may be unhealthy
- **Average Processing Time > 100ms**: Performance degradation

## 🔧 Advanced Troubleshooting

### Enable Debug Logging

Temporarily enable debug logging for more details:

```bash
# Edit docker-compose.yml to add debug flag
# Under api service environment:
- LOG_LEVEL=DEBUG

# Restart service
docker compose restart api

# View debug logs
docker compose logs -f api
```

### Check SEQ Internal Logs

```bash
# Access SEQ container
docker compose exec seq /bin/sh

# Check SEQ internal logs (location may vary)
cat /data/Logs/*.log

# Check SEQ configuration
cat /data/Settings/*.json
```

### Network Packet Analysis

For deep network debugging:

```bash
# Install tcpdump in API container
docker compose exec api apt-get update && apt-get install -y tcpdump

# Capture traffic to SEQ
docker compose exec api tcpdump -i any -n host seq and port 5341 -w /tmp/seq-traffic.pcap

# Analyze with Wireshark or tcpdump
docker compose exec api tcpdump -r /tmp/seq-traffic.pcap -A
```

### Test SEQ Health Endpoint

```bash
# Test from various locations

# 1. From host machine
curl http://localhost:5341/api/health

# 2. From API container
docker compose exec api curl http://seq:5341/api/health

# 3. From another container
docker compose exec db curl http://seq:5341/api/health
```

## 🆘 Getting Help

If issues persist after trying these solutions:

1. **Collect Diagnostic Information:**
   ```bash
   # Run diagnostic script
   ./scripts/logging-diagnostic.sh > diagnostic-report.txt
   
   # Or manually collect:
   docker compose ps > diagnostic.txt
   curl http://localhost:3000/api/logging/health | jq >> diagnostic.txt
   curl http://localhost:3000/api/logging/metrics | jq >> diagnostic.txt
   docker compose logs api --tail=100 >> diagnostic.txt
   docker compose logs seq --tail=100 >> diagnostic.txt
   ```

2. **Check SEQ Documentation:**
   - [SEQ Documentation](https://docs.datalust.co/docs)
   - [SEQ Docker Guide](https://hub.docker.com/r/datalust/seq)

3. **Review Application Logs:**
   ```bash
   # Backend startup logs
   docker compose logs api | grep -A20 "SEQ logging"
   
   # Recent error logs
   docker compose logs api | grep -i error | tail -50
   ```

4. **Create GitHub Issue:**
   Include the diagnostic information and:
   - Environment (dev/prod)
   - Docker Compose version
   - Recent changes
   - Steps to reproduce

## 📝 Prevention Checklist

To prevent common issues:

- [ ] SEQ_URL uses internal Docker network name (seq), not localhost
- [ ] SEQ container is in the same Docker network as API
- [ ] Ports 5341 and 5342 are not in use by other services
- [ ] SEQ data volume has sufficient disk space
- [ ] API container can resolve 'seq' hostname
- [ ] Frontend can reach /api/logging/submit endpoint
- [ ] SEQ admin password is set in production
- [ ] Retention policies configured to prevent disk fill
- [ ] Monitoring alerts set up for health endpoint
- [ ] Log levels appropriate for environment (DEBUG/INFO/ERROR)

## 🔄 Recovery Procedures

### Full Reset

If all else fails, completely reset the logging system:

```bash
# 1. Stop all services
docker compose down

# 2. Remove SEQ data volume (DELETES ALL LOGS!)
docker volume rm trainstation_seqdata

# 3. Remove API container to clear any cached state
docker compose rm -f api

# 4. Rebuild and restart
docker compose build api
docker compose up -d

# 5. Verify health
sleep 10
curl http://localhost:3000/api/logging/health | jq
```

### Restart Just Logging Components

```bash
# Restart SEQ and API (preserves logs)
docker compose restart seq api

# Wait for initialization
sleep 5

# Check health
curl http://localhost:3000/api/logging/health | jq
```
