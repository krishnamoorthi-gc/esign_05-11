# Final corrected deployment script for OpenSign to GCP

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  OpenSign GCP Deployment (Final Corrected Version)" -ForegroundColor Cyan
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
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $keyBytes = New-Object byte[] 32
    $rng.GetBytes($keyBytes)
    $masterKey = [Convert]::ToBase64String($keyBytes)
    $rng.Dispose()
    Write-Host "   [SUCCESS] Master key generated" -ForegroundColor Green

    # Clean up existing resources if they exist
    Write-Host "4. Cleaning up existing resources (if any)..." -ForegroundColor Yellow
    try {
        gcloud compute firewall-rules delete opensign-mongo-firewall opensign-backend-firewall opensign-frontend-firewall --quiet 2>$null
        Write-Host "   [SUCCESS] Existing firewall rules deleted" -ForegroundColor Green
    } catch {
        Write-Host "   [INFO] No existing firewall rules to delete" -ForegroundColor Gray
    }
    
    try {
        gcloud compute addresses delete opensign-mongo-ip opensign-backend-ip opensign-frontend-ip --region=us-central1 --quiet 2>$null
        Write-Host "   [SUCCESS] Existing IP addresses deleted" -ForegroundColor Green
    } catch {
        Write-Host "   [INFO] No existing IP addresses to delete" -ForegroundColor Gray
    }
    
    try {
        gcloud compute instances delete opensign-mongo-instance opensign-backend-instance opensign-frontend-instance --zone=us-central1-a --quiet 2>$null
        Write-Host "   [SUCCESS] Existing compute instances deleted" -ForegroundColor Green
    } catch {
        Write-Host "   [INFO] No existing compute instances to delete" -ForegroundColor Gray
    }

    # Reserve static external IP addresses
    Write-Host "5. Reserving static external IP addresses..." -ForegroundColor Yellow
    gcloud compute addresses create opensign-mongo-ip --region=us-central1
    gcloud compute addresses create opensign-backend-ip --region=us-central1
    gcloud compute addresses create opensign-frontend-ip --region=us-central1
    Write-Host "   [SUCCESS] IP addresses reserved" -ForegroundColor Green

    # Get the reserved IP addresses
    Write-Host "6. Getting reserved IP addresses..." -ForegroundColor Yellow
    $mongoIP = gcloud compute addresses describe opensign-mongo-ip --region=us-central1 --format="value(address)"
    $backendIP = gcloud compute addresses describe opensign-backend-ip --region=us-central1 --format="value(address)"
    $frontendIP = gcloud compute addresses describe opensign-frontend-ip --region=us-central1 --format="value(address)"
    
    Write-Host "   Reserved IP addresses:" -ForegroundColor Gray
    Write-Host "     MongoDB: $mongoIP" -ForegroundColor Gray
    Write-Host "     Backend: $backendIP" -ForegroundColor Gray
    Write-Host "     Frontend: $frontendIP" -ForegroundColor Gray

    # Create firewall rules with correct syntax
    Write-Host "7. Creating firewall rules..." -ForegroundColor Yellow
    gcloud compute firewall-rules create opensign-mongo-firewall `
        --allow=tcp:27017 `
        --source-ranges="$backendIP/32" `
        --description="Allow MongoDB access from backend"
        
    gcloud compute firewall-rules create opensign-backend-firewall `
        --allow=tcp:8081 `
        --source-ranges=0.0.0.0/0 `
        --description="Allow backend API access"
        
    gcloud compute firewall-rules create opensign-frontend-firewall `
        --allow=tcp:80 `
        --allow=tcp:443 `
        --source-ranges=0.0.0.0/0 `
        --description="Allow frontend access"
    Write-Host "   [SUCCESS] Firewall rules created" -ForegroundColor Green

    # Create startup scripts
    Write-Host "8. Creating startup scripts..." -ForegroundColor Yellow
    
    # MongoDB startup script
    $mongoStartupScript = @'
#!/bin/bash
set -e
echo "Starting MongoDB setup..."
apt-get update && apt-get upgrade -y
apt-get install -y wget gnupg
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod
# Configure MongoDB to accept connections from external IPs
sed -i "s/bindIp: 127.0.0.1/bindIp: 0.0.0.0/" /etc/mongod.conf
systemctl restart mongod
echo "MongoDB setup completed."
'@

    $mongoStartupScript | Out-File -FilePath "mongo-startup.sh" -Encoding ASCII
    
    # Backend startup script
    $backendStartupScript = @"
#!/bin/bash
set -e
echo "Starting backend setup..."
apt-get update && apt-get upgrade -y
apt-get install -y curl wget gnupg software-properties-common

# Install Node.js (v18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install LibreOffice
apt-get install -y libreoffice

# Create application directory
mkdir -p /opt/opensign
cd /opt/opensign

# Clone OpenSign backend
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
echo "Backend setup completed."
"@

    $backendStartupScript | Out-File -FilePath "backend-startup.sh" -Encoding ASCII
    
    # Frontend startup script
    $frontendStartupScript = @"
#!/bin/bash
set -e
echo "Starting frontend setup..."
apt-get update && apt-get upgrade -y
apt-get install -y curl wget gnupg software-properties-common

# Install Node.js (v18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install Nginx
apt-get install -y nginx

# Create application directory
mkdir -p /opt/opensign
cd /opt/opensign

# Clone OpenSign frontend
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
echo "Frontend setup completed."
"@

    $frontendStartupScript | Out-File -FilePath "frontend-startup.sh" -Encoding ASCII
    
    Write-Host "   [SUCCESS] Startup scripts created" -ForegroundColor Green

    # Create instances with correct parameters
    Write-Host "9. Creating VM instances..." -ForegroundColor Yellow
    
    # Create MongoDB instance
    gcloud compute instances create opensign-mongo-instance `
        --zone=us-central1-a `
        --machine-type=e2-medium `
        --image-family=ubuntu-2004-lts `
        --image-project=ubuntu-os-cloud `
        --address=$mongoIP `
        --tags=opensign-mongo `
        --metadata-from-file=startup-script=mongo-startup.sh
        
    # Create Backend instance
    gcloud compute instances create opensign-backend-instance `
        --zone=us-central1-a `
        --machine-type=e2-medium `
        --image-family=ubuntu-2004-lts `
        --image-project=ubuntu-os-cloud `
        --address=$backendIP `
        --tags=opensign-backend `
        --metadata-from-file=startup-script=backend-startup.sh
        
    # Create Frontend instance
    gcloud compute instances create opensign-frontend-instance `
        --zone=us-central1-a `
        --machine-type=e2-medium `
        --image-family=ubuntu-2004-lts `
        --image-project=ubuntu-os-cloud `
        --address=$frontendIP `
        --tags=opensign-frontend `
        --metadata-from-file=startup-script=frontend-startup.sh
        
    Write-Host "   [SUCCESS] VM instances creation initiated" -ForegroundColor Green

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
    Write-Host "Note: It may take 10-15 minutes for the instances to fully initialize." -ForegroundColor Yellow
    Write-Host "You can monitor the startup progress by SSHing into each instance and checking the logs:" -ForegroundColor Yellow
    Write-Host "  sudo journalctl -u google-startup-scripts.service -f" -ForegroundColor Gray

} catch {
    Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   [ERROR] Deployment failed. Please check the error message above." -ForegroundColor Red
}