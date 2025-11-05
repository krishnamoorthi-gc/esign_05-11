# Complete deployment script for OpenSign to GCP

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  OpenSign GCP Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Set project
    Write-Host "1. Setting Google Cloud project..." -ForegroundColor Yellow
    gcloud config set project esign-474713
    Write-Host "   [SUCCESS] Project set" -ForegroundColor Green

    # Enable services
    Write-Host "2. Enabling required services..." -ForegroundColor Yellow
    gcloud services enable compute.googleapis.com cloudresourcemanager.googleapis.com
    Write-Host "   [SUCCESS] Services enabled" -ForegroundColor Green

    # Generate secure master key
    Write-Host "3. Generating secure master key..." -ForegroundColor Yellow
    # Use a different approach for generating the key in PowerShell
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $keyBytes = New-Object byte[] 32
    $rng.GetBytes($keyBytes)
    $masterKey = [Convert]::ToBase64String($keyBytes)
    $rng.Dispose()
    Write-Host "   [SUCCESS] Master key generated" -ForegroundColor Green

    # Reserve static external IP addresses
    Write-Host "4. Reserving static external IP addresses..." -ForegroundColor Yellow
    gcloud compute addresses create opensign-mongo-ip --region=us-central1
    gcloud compute addresses create opensign-backend-ip --region=us-central1
    gcloud compute addresses create opensign-frontend-ip --region=us-central1
    Write-Host "   [SUCCESS] IP addresses reserved" -ForegroundColor Green

    # Get the reserved IP addresses
    Write-Host "5. Getting reserved IP addresses..." -ForegroundColor Yellow
    $mongoIP = gcloud compute addresses describe opensign-mongo-ip --region=us-central1 --format="value(address)"
    $backendIP = gcloud compute addresses describe opensign-backend-ip --region=us-central1 --format="value(address)"
    $frontendIP = gcloud compute addresses describe opensign-frontend-ip --region=us-central1 --format="value(address)"
    
    Write-Host "   Reserved IP addresses:" -ForegroundColor Gray
    Write-Host "     MongoDB: $mongoIP" -ForegroundColor Gray
    Write-Host "     Backend: $backendIP" -ForegroundColor Gray
    Write-Host "     Frontend: $frontendIP" -ForegroundColor Gray

    # Create firewall rules
    Write-Host "6. Creating firewall rules..." -ForegroundColor Yellow
    gcloud compute firewall-rules create opensign-mongo-firewall `
        --allow tcp:27017 `
        --source-ranges="$backendIP/32" `
        --description="Allow MongoDB access from backend"
        
    gcloud compute firewall-rules create opensign-backend-firewall `
        --allow tcp:8081 `
        --source-ranges=0.0.0.0/0 `
        --description="Allow backend API access"
        
    gcloud compute firewall-rules create opensign-frontend-firewall `
        --allow tcp:80,tcp:443 `
        --source-ranges=0.0.0.0/0 `
        --description="Allow frontend access"
    Write-Host "   [SUCCESS] Firewall rules created" -ForegroundColor Green

    # Create MongoDB instance
    Write-Host "7. Creating MongoDB instance..." -ForegroundColor Yellow
    $mongoStartupScript = @'
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
'@

    $mongoStartupScript | Out-File -FilePath "mongo-startup.sh" -Encoding ASCII
    
    gcloud compute instances create opensign-mongo-instance `
        --zone=us-central1-a `
        --machine-type=e2-medium `
        --image-family=ubuntu-2004-lts `
        --image-project=ubuntu-os-cloud `
        --address=$mongoIP `
        --tags=opensign-mongo `
        --metadata-from-file startup-script=mongo-startup.sh
    Write-Host "   [SUCCESS] MongoDB instance creation initiated" -ForegroundColor Green

    # Create backend instance
    Write-Host "8. Creating backend instance..." -ForegroundColor Yellow
    $backendStartupScript = @"
#!/bin/bash
set -e
apt update && apt upgrade -y
apt install -y curl wget gnupg software-properties-common

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

# Clone OpenSign backend (you may need to adjust this based on your repository)
git clone https://github.com/OpenSignLabs/OpenSign.git .
cd backend/OpenSignServer
npm install

# Create environment file
cat > .env << EOF
APP_ID=opensign
MASTER_KEY='$masterKey'
MONGODB_URI=mongodb://$mongoIP:27017/OpenSignDB
SERVER_URL=http://$backendIP:8081/app
USE_LOCAL=true
PORT=8081
EOF

# Create PM2 configuration
cat > /opt/opensign/backend/ecosystem.config.js << EOF
module.exports = {
  apps : [{
    name   : 'opensign-backend',
    script : 'npm',
    args   : 'run dev',
    cwd    : '/opt/opensign/backend/OpenSignServer',
    env: {
      NODE_ENV: 'production'
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

    $backendStartupScript | Out-File -FilePath "backend-startup.sh" -Encoding ASCII
    
    gcloud compute instances create opensign-backend-instance `
        --zone=us-central1-a `
        --machine-type=e2-medium `
        --image-family=ubuntu-2004-lts `
        --image-project=ubuntu-os-cloud `
        --address=$backendIP `
        --tags=opensign-backend `
        --metadata-from-file startup-script=backend-startup.sh
    Write-Host "   [SUCCESS] Backend instance creation initiated" -ForegroundColor Green

    # Create frontend instance
    Write-Host "9. Creating frontend instance..." -ForegroundColor Yellow
    $frontendStartupScript = @"
#!/bin/bash
set -e
apt update && apt upgrade -y
apt install -y curl wget gnupg software-properties-common

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

# Clone OpenSign frontend (you may need to adjust this based on your repository)
git clone https://github.com/OpenSignLabs/OpenSign.git .
cd frontend/OpenSign
npm install
npm run build

# Create environment file
cat > .env << EOF
PUBLIC_URL=
GENERATE_SOURCEMAP=false
REACT_APP_SERVERURL=http://$backendIP:8081/app
REACT_APP_APPID=opensign
EOF

# Create PM2 configuration
cat > /opt/opensign/frontend/ecosystem.config.js << EOF
module.exports = {
  apps : [{
    name   : 'opensign-frontend',
    script : 'npm',
    args   : 'run start',
    cwd    : '/opt/opensign/frontend/OpenSign',
    env: {
      NODE_ENV: 'production'
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
cat > /etc/nginx/sites-available/opensign << EOF
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
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/opensign /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
"@

    $frontendStartupScript | Out-File -FilePath "frontend-startup.sh" -Encoding ASCII
    
    gcloud compute instances create opensign-frontend-instance `
        --zone=us-central1-a `
        --machine-type=e2-medium `
        --image-family=ubuntu-2004-lts `
        --image-project=ubuntu-os-cloud `
        --address=$frontendIP `
        --tags=opensign-frontend `
        --metadata-from-file startup-script=frontend-startup.sh
    Write-Host "   [SUCCESS] Frontend instance creation initiated" -ForegroundColor Green

    # Clean up temporary files
    Remove-Item -Path "mongo-startup.sh" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "backend-startup.sh" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "frontend-startup.sh" -Force -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "  Deployment completed successfully!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Access your application at:" -ForegroundColor Yellow
    Write-Host "  Frontend: http://$frontendIP" -ForegroundColor Gray
    Write-Host "  Backend API: http://$backendIP:8081" -ForegroundColor Gray
    Write-Host "  MongoDB: $mongoIP:27017 (internal access only)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "SSH Access:" -ForegroundColor Yellow
    Write-Host "  MongoDB: gcloud compute ssh opensign-mongo-instance --zone=us-central1-a" -ForegroundColor Gray
    Write-Host "  Backend: gcloud compute ssh opensign-backend-instance --zone=us-central1-a" -ForegroundColor Gray
    Write-Host "  Frontend: gcloud compute ssh opensign-frontend-instance --zone=us-central1-a" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Note: It may take 5-10 minutes for the instances to fully initialize." -ForegroundColor Yellow

} catch {
    Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   [ERROR] Deployment failed. Please check the error message above." -ForegroundColor Red
}