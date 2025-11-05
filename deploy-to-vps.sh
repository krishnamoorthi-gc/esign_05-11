#!/bin/bash

# OpenSign Automated VPS Deployment Script
# Target: gcsign.medjooldatesindia.com (31.97.49.4)
# This script automates the complete deployment of OpenSign to your VPS server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="gcsign.medjooldatesindia.com"
IP="31.97.49.4"
APP_DIR="/opt/opensign"
REPO_URL="https://github.com/krishnamoorthi-gc/esign_05-11.git"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  OpenSign Automated VPS Deployment     ${NC}"
echo -e "${BLUE}  Target: $DOMAIN ($IP)                 ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root or with sudo privileges${NC}"
  exit 1
fi

# Update system packages
echo -e "${YELLOW}Updating system packages...${NC}"
apt update && apt upgrade -y

# Install prerequisites
echo -e "${YELLOW}Installing prerequisites...${NC}"
apt install -y curl wget gnupg software-properties-common ufw

# Install Node.js (v18)
echo -e "${YELLOW}Installing Node.js v18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install MongoDB
echo -e "${YELLOW}Installing MongoDB...${NC}"
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install LibreOffice
echo -e "${YELLOW}Installing LibreOffice...${NC}"
apt install -y libreoffice

# Install PM2 for process management
echo -e "${YELLOW}Installing PM2...${NC}"
npm install -g pm2

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
apt install -y nginx

# Create application directory
echo -e "${YELLOW}Creating application directory...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository
echo -e "${YELLOW}Cloning OpenSign repository...${NC}"
git clone $REPO_URL .
# If Git LFS is needed for large files
if command -v git-lfs &> /dev/null; then
    echo -e "${YELLOW}Initializing Git LFS...${NC}"
    git lfs install
    git lfs pull
else
    echo -e "${YELLOW}Git LFS not found, skipping LFS pull...${NC}"
fi

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd $APP_DIR/backend/OpenSignServer
npm install

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd $APP_DIR/frontend/OpenSign
npm install

# Build frontend for production
echo -e "${YELLOW}Building frontend for production...${NC}"
npm run build

# Generate secure master key
MASTER_KEY=$(openssl rand -base64 32)

# Create environment files
echo -e "${YELLOW}Creating environment files...${NC}"

# Backend environment file
cat > $APP_DIR/backend/OpenSignServer/.env << EOF
APP_ID=opensign
MASTER_KEY=$MASTER_KEY
MONGODB_URI=mongodb://localhost:27017/OpenSignDB
SERVER_URL=http://localhost:8081/app
USE_LOCAL=true
PORT=8081
EOF

# Frontend environment file
cat > $APP_DIR/frontend/OpenSign/.env << EOF
PUBLIC_URL=
GENERATE_SOURCEMAP=false
REACT_APP_SERVERURL=http://localhost:8081/app
REACT_APP_APPID=opensign
EOF

# Create PM2 configuration
echo -e "${YELLOW}Creating PM2 configuration...${NC}"
cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps : [{
    name   : "opensign-backend",
    script : "./index.js",
    cwd    : "$APP_DIR/backend/OpenSignServer",
    env: {
      NODE_ENV: "production"
    }
  },
  {
    name   : "opensign-frontend",
    script : "node",
    args   : "server.js",
    cwd    : "$APP_DIR/frontend/OpenSign",
    env: {
      NODE_ENV: "production"
    }
  }]
}
EOF

# Create Nginx configuration
echo -e "${YELLOW}Creating Nginx configuration...${NC}"
cat > /etc/nginx/sites-available/opensign << EOF
server {
    listen 80;
    server_name $DOMAIN $IP;

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

    location /app {
        proxy_pass http://localhost:8081;
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

# Start applications with PM2
echo -e "${YELLOW}Starting applications with PM2...${NC}"
cd $APP_DIR
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow 22  # SSH
ufw allow 80  # HTTP
ufw allow 443 # HTTPS
ufw --force enable

# Install Certbot for SSL
echo -e "${YELLOW}Installing Certbot for SSL...${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!     ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Obtain SSL certificate by running:"
echo -e "   ${BLUE}sudo certbot --nginx -d $DOMAIN${NC}"
echo -e ""
echo -e "${BLUE}Application will be accessible at:${NC}"
echo -e "  Frontend: http://$DOMAIN (use HTTPS after SSL setup)"
echo -e "  Backend API: http://$DOMAIN/app (use HTTPS after SSL setup)"
echo -e ""
echo -e "${BLUE}PM2 commands:${NC}"
echo -e "  pm2 status     - View application status"
echo -e "  pm2 logs       - View application logs"
echo -e "  pm2 restart    - Restart applications"
echo -e ""
echo -e "${YELLOW}Note: For production use, you should:${NC}"
echo -e "  1. Set up SSL certificate with Certbot"
echo -e "  2. Update environment variables with production values"
echo -e "  3. Configure email settings for production"
echo -e "  4. Set up automated backups for MongoDB"