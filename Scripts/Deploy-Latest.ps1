# TrainStation Latest Image Deployment Script (Windows PowerShell)
# 
# This script automates pulling and deploying the latest Docker image 
# of the TrainStation app for local testing.
#
# Features:
# - Detects latest tagged Docker image from GitHub Container Registry
# - Pulls latest image automatically  
# - Stops and removes existing containers safely
# - Starts new container with proper port mappings
# - Provides health check verification
#
# Usage:
#   .\Scripts\Deploy-Latest.ps1 [OPTIONS]
#
# Options:
#   -Tag TAG         Use specific tag instead of latest (e.g., -Tag "v1.2.3")
#   -Port PORT       Use custom port for web interface (default: 8080) 
#   -SeqPort PORT    Use custom port for SEQ logging UI (default: 5341)
#   -KeepData        Keep existing database and log data (default: false)
#   -Help            Show this help message
#
# Examples:
#   .\Scripts\Deploy-Latest.ps1                      # Deploy latest with defaults
#   .\Scripts\Deploy-Latest.ps1 -Tag "v1.2.3"       # Deploy specific version
#   .\Scripts\Deploy-Latest.ps1 -Port 3000          # Use port 3000 for web
#   .\Scripts\Deploy-Latest.ps1 -KeepData           # Preserve existing data
#
# Requirements:
#   - Docker Desktop installed and running
#   - PowerShell 5.1+ or PowerShell Core 6+
#   - Internet connection

[CmdletBinding()]
param(
    [string]$Tag = "",
    [int]$Port = 8080,
    [int]$SeqPort = 5341,
    [int]$SeqIngestionPort = 5342,
    [switch]$KeepData = $false,
    [switch]$Help = $false
)

# --- Configuration ---
$ImageRegistry = "ghcr.io"
$ImageOwner = "plausiblealibi" 
$ImageName = "trainstation"
$ContainerPrefix = "trainstation"

# Show help if requested
if ($Help) {
    Get-Content $PSCommandPath | Select-Object -First 30 | ForEach-Object {
        if ($_ -match "^#\s*(.*)") { $matches[1] }
    }
    exit 0
}

# --- Helper functions ---
function Write-Info { 
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success { 
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning { 
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error { 
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Stop-OnError {
    param([string]$Message)
    Write-Error $Message
    exit 1
}

function Test-Requirements {
    Write-Info "Checking requirements..."
    
    # Check if Docker is available
    try {
        $null = docker --version
        Write-Info "Docker is installed"
    }
    catch {
        Stop-OnError "Docker is not installed or not in PATH. Please install Docker Desktop."
    }
    
    # Check if Docker is running
    try {
        $null = docker info 2>$null
        Write-Info "Docker is running"
    }
    catch {
        Stop-OnError "Docker is not running. Please start Docker Desktop and try again."
    }
    
    # Check if curl is available (comes with Windows 10 1803+)
    try {
        $null = curl.exe --version 2>$null
        Write-Info "curl is available"
    }
    catch {
        Stop-OnError "curl is not available. Please ensure Windows 10 version 1803+ or install curl."
    }
}

function Get-LatestTag {
    Write-Info "Detecting latest tag from GitHub API..."
    
    $apiUrl = "https://api.github.com/repos/$ImageOwner/$ImageName/releases/latest"
    
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -ErrorAction Stop
        $latestTag = $response.tag_name
        
        if ($latestTag) {
            Write-Success "Found latest release: $latestTag"
            return $latestTag
        }
        else {
            Write-Warning "No tag found in latest release, using 'latest'"
            return "latest"
        }
    }
    catch {
        Write-Warning "Failed to get latest release from GitHub API, falling back to 'latest' tag"
        return "latest"
    }
}

function Get-DockerImage {
    param([string]$ImageTag)
    
    $fullImage = "$ImageRegistry/$ImageOwner/$ImageName`:$ImageTag"
    
    Write-Info "Pulling Docker image: $fullImage"
    
    try {
        docker pull $fullImage
        if ($LASTEXITCODE -ne 0) {
            throw "Docker pull failed"
        }
        Write-Success "Successfully pulled $fullImage"
        return $fullImage
    }
    catch {
        Write-Error "Failed to pull $fullImage"
        Write-Info "This might be because:"
        Write-Info "  1. The image doesn't exist or tag is incorrect"
        Write-Info "  2. You need to authenticate: docker login ghcr.io"
        Write-Info "  3. Network connectivity issues"
        Stop-OnError "Cannot proceed without the Docker image"
    }
}

function Stop-ExistingContainers {
    Write-Info "Checking for existing TrainStation containers..."
    
    $containers = docker ps -aq --filter "name=$ContainerPrefix" 2>$null
    
    if ($containers) {
        Write-Info "Stopping existing containers..."
        $containers | ForEach-Object { 
            docker stop $_ 2>$null >$null
        }
        
        Write-Info "Removing existing containers..."
        $containers | ForEach-Object { 
            docker rm $_ 2>$null >$null
        }
        
        Write-Success "Cleaned up existing containers"
    }
    else {
        Write-Info "No existing containers found"
    }
}

function Remove-DataVolumes {
    if ($KeepData) {
        Write-Info "Keeping existing data volumes (-KeepData specified)"
        return
    }
    
    Write-Warning "Removing existing data volumes (database and logs will be lost)"
    Write-Warning "Use -KeepData to preserve existing data"
    
    # Remove named volumes that might exist
    docker volume rm "$($ContainerPrefix)_dbdata" 2>$null >$null
    docker volume rm "$($ContainerPrefix)_seqdata" 2>$null >$null
    
    Write-Info "Data volumes cleaned up"
}

function New-DockerNetwork {
    $networkName = "$($ContainerPrefix)_network"
    
    $existingNetwork = docker network inspect $networkName 2>$null
    if ($existingNetwork) {
        Write-Info "Network $networkName already exists"
    }
    else {
        Write-Info "Creating Docker network: $networkName"
        docker network create $networkName >$null
        Write-Success "Created network: $networkName"
    }
    
    return $networkName
}

function Start-Database {
    param([string]$NetworkName)
    
    $containerName = "$($ContainerPrefix)_db"
    
    Write-Info "Starting PostgreSQL database..."
    
    docker run -d `
        --name $containerName `
        --network $NetworkName `
        --restart unless-stopped `
        -e POSTGRES_DB=trains `
        -e POSTGRES_USER=trainsAdmin `
        -e POSTGRES_PASSWORD=brokentrack `
        -v "$($ContainerPrefix)_dbdata:/var/lib/postgresql/data" `
        postgres:16 >$null
    
    # Wait for database to be ready
    Write-Info "Waiting for database to be ready..."
    $retries = 30
    while ($retries -gt 0) {
        $ready = docker exec $containerName pg_isready -U trainsAdmin -d trains 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database is ready"
            return
        }
        Start-Sleep -Seconds 2
        $retries--
    }
    
    Stop-OnError "Database failed to start within expected time"
}

function Start-SeqLogging {
    param([string]$NetworkName)
    
    $containerName = "$($ContainerPrefix)_seq"
    
    Write-Info "Starting SEQ logging service..."
    
    docker run -d `
        --name $containerName `
        --network $NetworkName `
        --restart unless-stopped `
        -e ACCEPT_EULA=Y `
        -e SEQ_FIRSTRUN_ADMINPASSWORD=admin123 `
        -p "$($SeqPort):80" `
        -p "$($SeqIngestionPort):5341" `
        -v "$($ContainerPrefix)_seqdata:/data" `
        datalust/seq:latest >$null
    
    Write-Success "SEQ logging service started on port $SeqPort"
}

function Start-Application {
    param(
        [string]$NetworkName,
        [string]$Image
    )
    
    $containerName = "$($ContainerPrefix)_app"
    
    Write-Info "Starting TrainStation application..."
    
    docker run -d `
        --name $containerName `
        --network $NetworkName `
        --restart unless-stopped `
        -p "$($Port):8000" `
        -e "DATABASE_URL=postgresql+psycopg2://trainsAdmin:brokentrack@$($ContainerPrefix)_db:5432/trains" `
        -e "SEQ_URL=http://$($ContainerPrefix)_seq:5341" `
        -e PYTHONPATH=/app `
        -e PORT=8000 `
        -e UVICORN_HOST=0.0.0.0 `
        -e UVICORN_WORKERS=1 `
        $Image >$null
    
    Write-Success "TrainStation application started on port $Port"
}

function Test-Deployment {
    $maxRetries = 30
    $retryCount = 0
    
    Write-Info "Verifying deployment health..."
    
    while ($retryCount -lt $maxRetries) {
        try {
            $response = curl.exe -sSf "http://localhost:$Port/health" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Health check passed! TrainStation is running"
                return $true
            }
        }
        catch {
            # Continue trying
        }
        
        Start-Sleep -Seconds 3
        $retryCount++
        
        if ($retryCount % 10 -eq 0) {
            Write-Info "Still waiting for application to be ready... ($retryCount/$maxRetries)"
        }
    }
    
    Write-Error "Health check failed after $maxRetries attempts"
    Write-Error "Application may not be running correctly"
    return $false
}

function Show-Status {
    Write-Host ""
    Write-Host "🚂 TrainStation Deployment Complete!" -ForegroundColor Green
    Write-Host "======================================="
    Write-Host ""
    Write-Host "📱 Web Interface:    http://localhost:$Port" -ForegroundColor Cyan
    Write-Host "📊 SEQ Logs:         http://localhost:$SeqPort" -ForegroundColor Cyan
    Write-Host "    SEQ Login:       admin / admin123" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔧 Management Commands:" -ForegroundColor Yellow
    Write-Host "  View logs:         docker logs $($ContainerPrefix)_app -f"
    Write-Host "  Stop all:          docker stop $($ContainerPrefix)_app $($ContainerPrefix)_db $($ContainerPrefix)_seq"
    Write-Host "  Remove all:        docker rm $($ContainerPrefix)_app $($ContainerPrefix)_db $($ContainerPrefix)_seq"
    Write-Host "  Health check:      curl http://localhost:$Port/health"
    Write-Host ""
    if (!$KeepData) {
        Write-Host "💾 Data: Fresh database and logs (use -KeepData to preserve)" -ForegroundColor Yellow
    }
    else {
        Write-Host "💾 Data: Existing data preserved" -ForegroundColor Green
    }
    Write-Host ""
}

# --- Main execution ---
function Main {
    Write-Host "🚂 TrainStation Docker Deployment Script" -ForegroundColor Green
    Write-Host "========================================"
    Write-Host ""
    
    Test-Requirements
    
    # Determine which tag to use
    if ([string]::IsNullOrEmpty($Tag)) {
        $Tag = Get-LatestTag
    }
    else {
        Write-Info "Using specified tag: $Tag"
    }
    
    # Pull the image
    $image = Get-DockerImage -ImageTag $Tag
    
    # Stop existing containers
    Stop-ExistingContainers
    
    # Handle data volumes
    Remove-DataVolumes
    
    # Create network
    $network = New-DockerNetwork
    
    # Start services in order
    Start-Database -NetworkName $network
    Start-SeqLogging -NetworkName $network
    Start-Application -NetworkName $network -Image $image
    
    # Verify everything is working
    if (Test-Deployment) {
        Show-Status
    }
    else {
        Write-Error "Deployment verification failed"
        Write-Info "Check container logs for troubleshooting:"
        Write-Info "  docker logs $($ContainerPrefix)_app"
        Write-Info "  docker logs $($ContainerPrefix)_db"
        Write-Info "  docker logs $($ContainerPrefix)_seq"
        exit 1
    }
}

# Run main function
try {
    Main
}
catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    exit 1
}