# TrainStation Docker Deployment Scripts

This directory contains client scripts that automate pulling and deploying the latest Docker image of the TrainStation app for local testing.

## 🚀 Quick Start

### Linux/macOS
```bash
# Deploy latest version with default settings
./Scripts/deploy-latest.sh

# Deploy specific version  
./Scripts/deploy-latest.sh --tag v1.2.3

# Deploy on custom port and keep existing data
./Scripts/deploy-latest.sh --port 3000 --keep-data
```

### Windows (PowerShell)
```powershell
# Deploy latest version with default settings
.\Scripts\Deploy-Latest.ps1

# Deploy specific version
.\Scripts\Deploy-Latest.ps1 -Tag "v1.2.3"

# Deploy on custom port and keep existing data
.\Scripts\Deploy-Latest.ps1 -Port 3000 -KeepData
```

## 📋 Requirements

### All Platforms
- **Docker**: Docker Desktop or Docker Engine installed and running
- **Internet connection**: To pull images and check latest releases

### Linux/macOS Additional Requirements
- **curl**: For health checks and API calls (usually pre-installed)
- **jq**: For JSON parsing (`sudo apt install jq` or `brew install jq`)

### Windows Additional Requirements
- **PowerShell 5.1+**: Usually pre-installed on Windows 10+
- **curl**: Included in Windows 10 version 1803+ (built-in)

## 🎯 What These Scripts Do

1. **Auto-detect Latest Version**: Query GitHub API to find the latest tagged release
2. **Pull Docker Image**: Download the latest TrainStation image from GitHub Container Registry
3. **Clean Environment**: Stop and remove any existing TrainStation containers
4. **Handle Data**: Option to preserve or reset database and logs
5. **Start Services**: Launch all required containers (app, database, logging)
6. **Health Check**: Verify the deployment is working correctly
7. **Show Status**: Display access URLs and management commands

## 🔧 Configuration Options

### Linux/macOS (`deploy-latest.sh`)

| Option | Description | Default |
|--------|-------------|---------|
| `--tag TAG` | Use specific image tag instead of latest | auto-detect |
| `--port PORT` | Web interface port | 8080 |
| `--seq-port PORT` | SEQ logging UI port | 5341 |
| `--keep-data` | Preserve existing database and log data | false |
| `--help` | Show help message | - |

### Windows (`Deploy-Latest.ps1`)

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-Tag TAG` | Use specific image tag instead of latest | auto-detect |
| `-Port PORT` | Web interface port | 8080 |
| `-SeqPort PORT` | SEQ logging UI port | 5341 |
| `-KeepData` | Preserve existing database and log data | false |
| `-Help` | Show help message | - |

## 🌐 Access Points

After successful deployment, you can access:

- **🚂 TrainStation Web App**: http://localhost:8080 (or your custom port)
- **📊 SEQ Logging Dashboard**: http://localhost:5341
  - Username: `admin`
  - Password: `admin123`

## 🔄 Common Operations

### View Container Logs
```bash
# Application logs
docker logs trainstation_app -f

# Database logs  
docker logs trainstation_db -f

# SEQ logging service logs
docker logs trainstation_seq -f
```

### Stop All Services
```bash
docker stop trainstation_app trainstation_db trainstation_seq
```

### Remove All Containers
```bash
docker rm trainstation_app trainstation_db trainstation_seq
```

### Check Health
```bash
curl http://localhost:8080/health
```

### Clean Up Everything (Including Data)
```bash
# Stop and remove containers
docker stop trainstation_app trainstation_db trainstation_seq
docker rm trainstation_app trainstation_db trainstation_seq

# Remove data volumes (⚠️ This deletes all data!)
docker volume rm trainstation_dbdata trainstation_seqdata

# Remove network
docker network rm trainstation_network
```

## 📦 Docker Image Details

The scripts pull images from GitHub Container Registry:
- **Registry**: `ghcr.io/plausiblealibi/trainstation`
- **Tags Available**: 
  - `latest` - Latest successful build from main branch
  - `vX.Y.Z` - Specific version tags (e.g., `v1.2.3`)
  - `X.Y.Z` - Version without 'v' prefix (e.g., `1.2.3`)
  - `X.Y` - Minor version (e.g., `1.2`)
  - `X` - Major version (e.g., `1`)

## 🔐 Authentication

### Public Images
No authentication required for public images.

### Private Images
If the TrainStation image becomes private, authenticate with:

```bash
# Login to GitHub Container Registry
docker login ghcr.io

# Username: Your GitHub username
# Password: GitHub Personal Access Token with 'read:packages' scope
```

## 🐛 Troubleshooting

### Image Pull Fails
```
❌ Failed to pull ghcr.io/plausiblealibi/trainstation:latest
```

**Solutions:**
1. Check internet connection
2. Verify the image exists: https://github.com/PlausibleAlibi/trainstation/pkgs/container/trainstation
3. For private repos, ensure you're logged in: `docker login ghcr.io`
4. Try specific tag instead of latest: `--tag v1.0.0`

### Health Check Fails
```
❌ Health check failed after 30 attempts
```

**Solutions:**
1. Check container logs: `docker logs trainstation_app`
2. Verify database is running: `docker logs trainstation_db`
3. Check port conflicts: `netstat -tulpn | grep 8080`
4. Wait longer - database migrations might be running

### Port Already in Use
```
Error: bind: address already in use
```

**Solutions:**
1. Use different port: `--port 3000`
2. Stop conflicting service: `sudo lsof -ti:8080 | xargs kill -9`
3. Stop existing TrainStation containers

### Permission Denied (Linux/macOS)
```
bash: ./Scripts/deploy-latest.sh: Permission denied
```

**Solution:**
```bash
chmod +x ./Scripts/deploy-latest.sh
```

### Docker Not Running
```
❌ Docker is not running
```

**Solutions:**
- **Linux**: `sudo systemctl start docker`
- **macOS/Windows**: Start Docker Desktop application

### Missing jq (Linux/macOS)
```
❌ Missing required tools: jq
```

**Solutions:**
- **Ubuntu/Debian**: `sudo apt install jq`
- **CentOS/RHEL**: `sudo yum install jq`
- **macOS**: `brew install jq`

## 🚀 Advanced Usage

### Custom Environment Variables
You can override environment variables by modifying the scripts or using Docker commands directly:

```bash
# Example: Run with custom database password
docker run -d \
  --name trainstation_app \
  --network trainstation_network \
  -p 8080:8000 \
  -e DATABASE_URL="postgresql+psycopg2://trainsAdmin:mypassword@trainstation_db:5432/trains" \
  ghcr.io/plausiblealibi/trainstation:latest
```

### Development vs Production
These scripts are designed for local testing. For production deployment:
- Use proper orchestration (Docker Compose, Kubernetes)
- Configure proper secrets management
- Set up reverse proxy (nginx)
- Configure SSL/TLS
- Use production database settings
- Set up proper backup strategies

### Using with CI/CD
These scripts can be integrated into CI/CD pipelines for automated testing:

```bash
# In your CI script
./Scripts/deploy-latest.sh --tag $BUILD_TAG --port 8080
sleep 30  # Wait for startup
curl -f http://localhost:8080/health || exit 1
# Run your tests here
```

## 📞 Support

For issues related to:
- **TrainStation Application**: Open an issue at https://github.com/PlausibleAlibi/trainstation/issues
- **Docker**: Check Docker documentation at https://docs.docker.com/
- **These Scripts**: Include full error output and system information when reporting issues

## 📝 Contributing

To improve these scripts:
1. Fork the repository
2. Make your changes
3. Test on your platform
4. Submit a pull request

Please test changes on both platforms when possible.