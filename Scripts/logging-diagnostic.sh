#!/bin/bash
# Logging System Diagnostic Script
# Collects comprehensive diagnostic information about the logging system

echo "========================================"
echo "TrainStation Logging Diagnostic Report"
echo "========================================"
echo "Generated at: $(date)"
echo ""

echo "========== Docker Services =========="
echo "Checking container status..."
docker compose ps seq api nginx
echo ""

echo "========== SEQ Service Logs (last 20 lines) =========="
docker compose logs seq --tail=20
echo ""

echo "========== API Logging Configuration =========="
docker compose logs api --tail=100 | grep -E "(SEQ|logging)" | tail -20
echo ""

echo "========== Logging Health Check =========="
HEALTH_URL="http://localhost:3000/api/logging/health"
if command -v jq &> /dev/null; then
    curl -s "$HEALTH_URL" | jq
else
    curl -s "$HEALTH_URL"
fi
echo ""

echo "========== Logging Metrics =========="
METRICS_URL="http://localhost:3000/api/logging/metrics"
if command -v jq &> /dev/null; then
    curl -s "$METRICS_URL" | jq '{
        frontend_success_rate: .frontend_logs.success_rate,
        frontend_total_logs: .frontend_logs.total_logs,
        frontend_failed_batches: .frontend_logs.failed_batches,
        api_success_rate: .request_metrics.success_rate,
        api_total_requests: .request_metrics.total_requests,
        seq_connected: .seq_status.connected,
        seq_last_error: .seq_status.last_error
    }'
else
    curl -s "$METRICS_URL"
fi
echo ""

echo "========== Network Connectivity =========="
echo "Testing API -> SEQ connectivity..."
docker compose exec -T api ping -c 3 seq 2>/dev/null || echo "Ping failed or container not running"
echo ""
echo "Testing API -> SEQ HTTP..."
docker compose exec -T api curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://seq:5341/api/health 2>/dev/null || echo "HTTP test failed or container not running"
echo ""

echo "========== SEQ Container Details =========="
echo "SEQ URL Configuration:"
docker compose exec -T api env | grep SEQ || echo "No SEQ environment variables found"
echo ""

echo "========== Port Status =========="
echo "Checking if SEQ ports are accessible..."
netstat -tulpn 2>/dev/null | grep -E "(5341|5342)" || ss -tulpn 2>/dev/null | grep -E "(5341|5342)" || echo "Could not check port status (need root or ss/netstat)"
echo ""

echo "========== Disk Usage =========="
echo "Checking Docker volumes..."
docker system df -v 2>/dev/null | grep -E "(seqdata|VOLUME NAME)" || echo "Could not check disk usage"
echo ""

echo "========== Recent Errors =========="
echo "API errors (last 10):"
docker compose logs api --tail=100 | grep -i error | tail -10
echo ""
echo "SEQ errors (last 10):"
docker compose logs seq --tail=100 | grep -i error | tail -10
echo ""

echo "========================================"
echo "Diagnostic Report Complete"
echo "========================================"
echo ""
echo "If you need to report an issue, please include this entire output."
echo "For more help, see: docs/logging-troubleshooting.md"
