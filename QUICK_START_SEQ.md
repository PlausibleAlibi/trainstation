# Quick Start Guide for SEQ Logging

## 🚀 Immediate Setup

Once the SSL certificate issues are resolved, follow these steps to start using SEQ logging:

### 1. Start the Services
```bash
# Development mode with SEQ
make dev

# Wait for all containers to start (about 30-60 seconds)
docker compose ps
```

### 2. Access SEQ Dashboard
- **URL**: http://localhost:5341
- **Username**: admin
- **Password**: admin123

### 3. Verify Integration
```bash
# Test logging health
curl http://localhost:3000/api/logging/health

# Submit a test log
curl -X POST http://localhost:3000/api/logging/submit \
  -H 'Content-Type: application/json' \
  -d '{"logs":[{"level":"info","message":"SEQ integration test","context":{"test":true}}]}'
```

### 4. Check Logs in SEQ
1. Go to SEQ dashboard
2. Look for logs with these sources:
   - `request` - HTTP request logs from backend
   - `frontend_logs` - Logs from React frontend
   - `main` - Application startup logs

### 5. Frontend Usage
```typescript
import { log } from './shared/logging';

// Basic logging
log.info('User logged in', { userId: 123 });
log.error('API call failed', error, { endpoint: '/api/assets' });

// Automatic error capture is already enabled
```

## 🔧 Production Setup

For production deployment:

1. **Set secure password**:
   ```bash
   # Generate password hash
   python3 -c "import bcrypt; print(bcrypt.hashpw(b'your_secure_password', bcrypt.gensalt()).decode())"
   ```

2. **Update .env.prod**:
   ```bash
   SEQ_ADMIN_PASSWORD_HASH=your_generated_hash
   SEQ_API_KEY=your_api_key_here
   ```

3. **Deploy**:
   ```bash
   make prod
   ```

## 📊 Key Features Enabled

✅ **Centralized Logging**: All logs go to SEQ  
✅ **Frontend Error Tracking**: Automatic React error capture  
✅ **Structured Data**: JSON logs with rich context  
✅ **Real-time Monitoring**: Live log streaming in SEQ  
✅ **Request Tracing**: Complete HTTP request logging  
✅ **Error Boundaries**: React component error handling  
✅ **Automatic Buffering**: Efficient frontend log batching  

## 🆘 Troubleshooting

If logs aren't appearing:
1. Check SEQ container: `docker compose logs seq`
2. Check backend connection: `curl http://localhost:3000/api/logging/health`
3. Verify environment variables: `docker compose config`

The implementation is complete and ready to use! 🎉