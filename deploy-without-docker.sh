#!/bin/bash

# OpenSign Deployment Script - Without Docker
# This script automates the deployment of OpenSign to a Linux server without Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  OpenSign Deployment Script (No Docker) ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Please run as root or with sudo privileges${NC}"
  exit 1
fi

# Update system packages
echo -e "${YELLOW}Updating system packages...${NC}"
apt update && apt upgrade -y

# Install prerequisites
echo -e "${YELLOW}Installing prerequisites...${NC}"
apt install -y curl wget gnupg software-properties-common

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

# Create application directory
echo -e "${YELLOW}Creating application directory...${NC}"
mkdir -p /opt/opensign
cd /opt/opensign

# Here you would typically clone your repository or copy your files
# For this example, we'll assume the files are already in place
echo -e "${GREEN}Application files should be placed in /opt/opensign${NC}"
echo -e "${GREEN}Please copy your OpenSign files to this directory before proceeding${NC}"

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd /opt/opensign/backend/OpenSignServer
npm install

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd /opt/opensign/frontend/OpenSign
npm install

# Build frontend for production
echo -e "${YELLOW}Building frontend for production...${NC}"
npm run build

# Create environment files
echo -e "${YELLOW}Creating environment files...${NC}"

# Backend environment file
cat > /opt/opensign/backend/OpenSignServer/.env << EOF
APP_ID=opensign
MASTER_KEY=$(openssl rand -base64 32)
MONGODB_URI=mongodb://localhost:27017/OpenSignDB
SERVER_URL=http://localhost:8081/app
USE_LOCAL=true
PORT=8081
EOF

# Frontend environment file
cat > /opt/opensign/frontend/OpenSign/.env << EOF
PUBLIC_URL=
GENERATE_SOURCEMAP=false
REACT_APP_SERVERURL=http://localhost:8081/app
REACT_APP_APPID=opensign
EOF

# Create PM2 configuration
echo -e "${YELLOW}Creating PM2 configuration...${NC}"
cat > /opt/opensign/ecosystem.config.js << EOF
module.exports = {
  apps : [{
    name   : "opensign-backend",
    script : "npm",
    args   : "run dev",
    cwd    : "/opt/opensign/backend/OpenSignServer",
    env: {
      NODE_ENV: "production"
    }
  },
  {
    name   : "opensign-frontend",
    script : "npm",
    args   : "run start",
    cwd    : "/opt/opensign/frontend/OpenSign",
    env: {
      NODE_ENV: "production"
    }
  }]
}
EOF

# Start applications with PM2
echo -e "${YELLOW}Starting applications with PM2...${NC}"
cd /opt/opensign
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
apt install -y nginx

# Create Nginx configuration
echo -e "${YELLOW}Creating Nginx configuration...${NC}"
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

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!     ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Update the .env files in /opt/opensign/backend/OpenSignServer and /opt/opensign/frontend/OpenSign with your specific configuration"
echo -e "2. If you have a domain name, update the server_name in /etc/nginx/sites-available/opensign"
echo -e "3. For SSL, install certbot: sudo apt install certbot python3-certbot-nginx"
echo -e "4. Then run: sudo certbot --nginx -d your-domain.com"
echo -e ""
echo -e "${BLUE}Application will be accessible at:${NC}"
echo -e "  Frontend: http://your-server-ip"
echo -e "  Backend API: http://your-server-ip/app"
echo -e ""
echo -e "${BLUE}PM2 commands:${NC}"
echo -e "  pm2 status     - View application status"
echo -e "  pm2 logs       - View application logs"
echo -e "  pm2 restart    - Restart applications"