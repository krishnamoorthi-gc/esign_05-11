# Fixed Deployment script for OpenSign to Google Cloud Platform (External IP approach) - PowerShell version
# Project: Esign Alpha (esign-alpha-474811)

param(
    [string]$ProjectId = "esign-alpha-474811",
    [string]$Region = "us-central1",
    [string]$Zone = "us-central1-a"
)

Write-Host "===============================================" -ForegroundColor Green
Write-Host "  OpenSign Deployment to GCP (External IPs) - FIXED VERSION" -ForegroundColor Green
Write-Host "  Project: Esign Alpha ($ProjectId)" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Check if required tools are installed
Write-Host "Checking for required tools..." -ForegroundColor Yellow
$gcloudExists = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloudExists) {
    Write-Host "Google Cloud SDK is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Visit https://cloud.google.com/sdk/docs/install for installation instructions." -ForegroundColor Yellow
    exit 1
}

# Set Google Cloud project
Write-Host "Setting Google Cloud project to $ProjectId..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# Enable required services
Write-Host "Enabling required Google Cloud services..." -ForegroundColor Yellow
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

# Generate secure master key using PowerShell (since OpenSSL might not be available)
$randomBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($randomBytes)
$MasterKey = [System.Convert]::ToBase64String($randomBytes)
Write-Host "Generated secure master key" -ForegroundColor Yellow

# Delete existing IP addresses if they exist
Write-Host "Cleaning up existing IP addresses..." -ForegroundColor Yellow
try {
    gcloud compute addresses delete opensign-mongo-ip --region=$Region --quiet 2>$null
} catch { }
try {
    gcloud compute addresses delete opensign-backend-ip --region=$Region --quiet 2>$null
} catch { }
try {
    gcloud compute addresses delete opensign-frontend-ip --region=$Region --quiet 2>$null
} catch { }

# Reserve static external IP addresses
Write-Host "Reserving static external IP addresses..." -ForegroundColor Yellow
gcloud compute addresses create opensign-mongo-ip --region=$Region
gcloud compute addresses create opensign-backend-ip --region=$Region
gcloud compute addresses create opensign-frontend-ip --region=$Region

# Get the reserved IP addresses
$MongoExternalIP = gcloud compute addresses describe opensign-mongo-ip --region=$Region --format="value(address)"
$BackendExternalIP = gcloud compute addresses describe opensign-backend-ip --region=$Region --format="value(address)"
$FrontendExternalIP = gcloud compute addresses describe opensign-frontend-ip --region=$Region --format="value(address)"

Write-Host "Reserved IP addresses:" -ForegroundColor Yellow
Write-Host "  MongoDB: $MongoExternalIP" -ForegroundColor Cyan
Write-Host "  Backend: $BackendExternalIP" -ForegroundColor Cyan
Write-Host "  Frontend: $FrontendExternalIP" -ForegroundColor Cyan

# Delete existing firewall rules if they exist
Write-Host "Cleaning up existing firewall rules..." -ForegroundColor Yellow
try {
    gcloud compute firewall-rules delete opensign-mongo-firewall --quiet 2>$null
} catch { }
try {
    gcloud compute firewall-rules delete opensign-backend-firewall --quiet 2>$null
} catch { }
try {
    gcloud compute firewall-rules delete opensign-frontend-firewall --quiet 2>$null
} catch { }

# Create firewall rules
Write-Host "Creating firewall rules..." -ForegroundColor Yellow
gcloud compute firewall-rules create opensign-mongo-firewall `
    --allow tcp:27017 `
    --source-ranges="$BackendExternalIP/32" `
    --description="Allow MongoDB access from backend"

gcloud compute firewall-rules create opensign-backend-firewall `
    --allow tcp:8081 `
    --source-ranges=0.0.0.0/0 `
    --description="Allow backend API access"

gcloud compute firewall-rules create opensign-frontend-firewall `
    --allow tcp:80 --allow tcp:443 `
    --source-ranges=0.0.0.0/0 `
    --description="Allow frontend access"

# Create startup scripts for instances
Write-Host "Creating startup scripts..." -ForegroundColor Yellow

# Create MongoDB startup script
$MongoStartupScript = @"
#!/bin/bash
set -e
apt update && apt upgrade -y
apt install -y wget gnupg
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
# Configure MongoDB to accept connections from external IPs
sed -i "s/bindIp: 127.0.0.1/bindIp: 0.0.0.0/" /etc/mongod.conf
systemctl restart mongod
"@

$MongoStartupScript | Out-File -FilePath "mongo-startup.sh" -Encoding UTF8

# Create backend startup script
$BackendStartupScript = @"
#!/bin/bash
set -e
apt update && apt upgrade -y
apt install -y curl wget gnupg software-properties-common git zip unzip
# Install Node.js (v18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
# Install PM2 for process management
npm install -g pm2
# Install LibreOffice
apt install -y libreoffice
# Create application directory
mkdir -p /opt/opensign
cd /opt/opensign
# Download the backend application files
wget -O backend.zip https://github.com/OpenSignLabs/OpenSign/archive/refs/heads/main.zip
unzip backend.zip
mv OpenSign-main/backend/OpenSignServer ./backend
rm -rf OpenSign-main backend.zip
# Install backend dependencies
cd /opt/opensign/backend/OpenSignServer
npm install
# Create environment file
cat > .env << EOF
APP_ID=opensign
MASTER_KEY="$MasterKey"
MONGODB_URI=mongodb://$MongoExternalIP:27017/OpenSignDB
SERVER_URL=http://$BackendExternalIP:8081/app
USE_LOCAL=true
PORT=8081
SMTP_ENABLE=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER_EMAIL=vatgcbs15@gmail.com
SMTP_PASS="eacb ytol wvvz nzcu"
SMTP_FROM_NAME=OpenSign
SMTP_REPLY_TO_EMAIL=vatgcbs15@gmail.com
EOF
# Create PM2 configuration
mkdir -p /opt/opensign/backend
cat > /opt/opensign/backend/ecosystem.config.js << EOF
module.exports = {
  apps : [{
    name   : "opensign-backend",
    script : "npm",
    args   : "start",
    cwd    : "/opt/opensign/backend/OpenSignServer",
    env: {
      NODE_ENV: "production"
    }
  }]
}
EOF
# Start backend with PM2
cd /opt/opensign/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
"@

$BackendStartupScript | Out-File -FilePath "backend-startup.sh" -Encoding UTF8

# Create frontend startup script
$FrontendStartupScript = @"
#!/bin/bash
set -e
apt update && apt upgrade -y
apt install -y curl wget gnupg software-properties-common git zip unzip
# Install Node.js (v18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
# Install PM2 for process management
npm install -g pm2
# Install Nginx
apt install -y nginx
# Create application directory
mkdir -p /opt/opensign
cd /opt/opensign
# Download the frontend application files
wget -O frontend.zip https://github.com/OpenSignLabs/OpenSign/archive/refs/heads/main.zip
unzip frontend.zip
mv OpenSign-main/frontend/OpenSign ./frontend
rm -rf OpenSign-main frontend.zip
# Install frontend dependencies
cd /opt/opensign/frontend
npm install
npm run build
# Create environment file
cat > .env << EOF
PUBLIC_URL=
GENERATE_SOURCEMAP=false
REACT_APP_SERVERURL=http://$BackendExternalIP:8081/app
REACT_APP_APPID=opensign
EOF
# Create PM2 configuration
mkdir -p /opt/opensign/frontend
cat > /opt/opensign/frontend/ecosystem.config.js << EOF
module.exports = {
  apps : [{
    name   : "opensign-frontend",
    script : "npm",
    args   : "run start",
    cwd    : "/opt/opensign/frontend",
    env: {
      NODE_ENV: "production"
    }
  }]
}
EOF
# Start frontend with PM2
cd /opt/opensign/frontend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Configure Nginx
cat > /etc/nginx/sites-available/opensign << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
    }
}
EOF
# Enable the site
ln -sf /etc/nginx/sites-available/opensign /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
"@

$FrontendStartupScript | Out-File -FilePath "frontend-startup.sh" -Encoding UTF8

# Delete existing instances if they exist - ONE BY ONE
Write-Host "Checking for existing instances..." -ForegroundColor Yellow
$instances = @("opensign-mongo-instance", "opensign-backend-instance", "opensign-frontend-instance")
foreach ($instance in $instances) {
    try {
        Write-Host "Deleting existing instance: $instance" -ForegroundColor Yellow
        gcloud compute instances delete $instance --zone=$Zone --quiet 2>$null
    } catch {
        Write-Host "Instance $instance does not exist or could not be deleted" -ForegroundColor Gray
    }
}

# Create instances with startup scripts
Write-Host "Creating virtual machine instances..." -ForegroundColor Yellow

# Create MongoDB instance
Write-Host "Creating MongoDB instance..." -ForegroundColor Yellow
gcloud compute instances create opensign-mongo-instance `
    --zone=$Zone `
    --machine-type=e2-medium `
    --image-family=ubuntu-2204-lts `
    --image-project=ubuntu-os-cloud `
    --address=$MongoExternalIP `
    --tags=opensign-mongo `
    --metadata-from-file startup-script=mongo-startup.sh

# Create backend instance
Write-Host "Creating backend instance..." -ForegroundColor Yellow
gcloud compute instances create opensign-backend-instance `
    --zone=$Zone `
    --machine-type=e2-medium `
    --image-family=ubuntu-2204-lts `
    --image-project=ubuntu-os-cloud `
    --address=$BackendExternalIP `
    --tags=opensign-backend `
    --metadata-from-file startup-script=backend-startup.sh `
    --scopes=cloud-platform

# Create frontend instance
Write-Host "Creating frontend instance..." -ForegroundColor Yellow
gcloud compute instances create opensign-frontend-instance `
    --zone=$Zone `
    --machine-type=e2-medium `
    --image-family=ubuntu-2204-lts `
    --image-project=ubuntu-os-cloud `
    --address=$FrontendExternalIP `
    --tags=opensign-frontend `
    --metadata-from-file startup-script=frontend-startup.sh

# Clean up temporary files
Remove-Item mongo-startup.sh -ErrorAction SilentlyContinue
Remove-Item backend-startup.sh -ErrorAction SilentlyContinue
Remove-Item frontend-startup.sh -ErrorAction SilentlyContinue

# Wait for instances to be ready
Write-Host "Waiting for instances to initialize (this may take several minutes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 120

# Check instance statuses
Write-Host "Checking instance statuses..." -ForegroundColor Yellow
gcloud compute instances list --filter="name~'opensign-'"

Write-Host "===============================================" -ForegroundColor Green
Write-Host "  Deployment initiated successfully!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "Your OpenSign application is being deployed to Google Cloud Platform!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "Access your application at:" -ForegroundColor Yellow
Write-Host "  Frontend: http://$FrontendExternalIP" -ForegroundColor Cyan
Write-Host "  Backend API: http://$BackendExternalIP:8081" -ForegroundColor Cyan
Write-Host "  MongoDB: $MongoExternalIP:27017 (internal access only)" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Green
Write-Host "Important Notes:" -ForegroundColor Yellow
Write-Host "1. Deployment may take 5-10 minutes to complete" -ForegroundColor Yellow
Write-Host "2. You can SSH into instances using:" -ForegroundColor Yellow
Write-Host "   MongoDB: gcloud compute ssh opensign-mongo-instance --zone=$Zone" -ForegroundColor Gray
Write-Host "   Backend: gcloud compute ssh opensign-backend-instance --zone=$Zone" -ForegroundColor Gray
Write-Host "   Frontend: gcloud compute ssh opensign-frontend-instance --zone=$Zone" -ForegroundColor Gray
Write-Host "3. For production use, consider setting up SSL certificates" -ForegroundColor Yellow