#!/bin/bash

# Deployment script for OpenSign to Google Cloud Platform without Docker and with external IP addresses

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}  OpenSign Deployment to GCP (No Docker + External IPs) ${NC}"
echo -e "${BLUE}===============================================${NC}"

# Check if required tools are installed
echo -e "${YELLOW}Checking for required tools...${NC}"
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Google Cloud SDK is not installed. Please install it first.${NC}"
    echo -e "${YELLOW}Visit https://cloud.google.com/sdk/docs/install for installation instructions.${NC}"
    exit 1
fi

if ! command -v openssl &> /dev/null; then
    echo -e "${RED}OpenSSL is not installed. Please install it first.${NC}"
    exit 1
fi

# Set your Google Cloud project ID
read -p "Enter your Google Cloud Project ID: " PROJECT_ID

# Set your desired region and zone
read -p "Enter your desired region (default: us-central1): " REGION
REGION=${REGION:-us-central1}
ZONE="${REGION}-a"

# Generate secure master key
MASTER_KEY=$(openssl rand -base64 32)
echo -e "${YELLOW}Generated secure master key${NC}"

# Set Google Cloud project
echo -e "${YELLOW}Setting Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required services
echo -e "${YELLOW}Enabling required Google Cloud services...${NC}"
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

# Reserve static external IP addresses
echo -e "${YELLOW}Reserving static external IP addresses...${NC}"
gcloud compute addresses create opensign-mongo-ip --region=$REGION
gcloud compute addresses create opensign-backend-ip --region=$REGION
gcloud compute addresses create opensign-frontend-ip --region=$REGION

# Get the reserved IP addresses
MONGO_EXTERNAL_IP=$(gcloud compute addresses describe opensign-mongo-ip --region=$REGION --format="value(address)")
BACKEND_EXTERNAL_IP=$(gcloud compute addresses describe opensign-backend-ip --region=$REGION --format="value(address)")
FRONTEND_EXTERNAL_IP=$(gcloud compute addresses describe opensign-frontend-ip --region=$REGION --format="value(address)")

echo -e "${GREEN}Reserved IP addresses:${NC}"
echo -e "  MongoDB: ${MONGO_EXTERNAL_IP}"
echo -e "  Backend: ${BACKEND_EXTERNAL_IP}"
echo -e "  Frontend: ${FRONTEND_EXTERNAL_IP}"

# Create firewall rules
echo -e "${YELLOW}Creating firewall rules...${NC}"
gcloud compute firewall-rules create opensign-mongo-firewall \
    --allow tcp:27017 \
    --source-ranges=${BACKEND_EXTERNAL_IP}/32 \
    --description="Allow MongoDB access from backend"

gcloud compute firewall-rules create opensign-backend-firewall \
    --allow tcp:8081 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow backend API access"

gcloud compute firewall-rules create opensign-frontend-firewall \
    --allow tcp:80,tcp:443 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow frontend access"

# Create MongoDB instance
echo -e "${YELLOW}Creating MongoDB instance...${NC}"
gcloud compute instances create opensign-mongo-instance \
    --zone=$ZONE \
    --machine-type=e2-medium \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --address=$MONGO_EXTERNAL_IP \
    --tags=opensign-mongo \
    --metadata startup-script='#!/bin/bash
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
        systemctl restart mongod'

# Create backend instance
echo -e "${YELLOW}Creating backend instance...${NC}"
gcloud compute instances create opensign-backend-instance \
    --zone=$ZONE \
    --machine-type=e2-medium \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --address=$BACKEND_EXTERNAL_IP \
    --tags=opensign-backend \
    --metadata startup-script='#!/bin/bash
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
# Production environment configuration for OpenSign
# Backend ExpressJS config
appName=open_sign_server
MASTER_KEY='"$MASTER_KEY"'
MONGODB_URI=mongodb://'"$MONGO_EXTERNAL_IP"':27017/OpenSignDB
SERVER_URL=http://'"$BACKEND_EXTERNAL_IP"':8081/app
PARSE_MOUNT=/app
PORT=8081
# Storage config
USE_LOCAL=true
# Email configuration
SMTP_ENABLE=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER_EMAIL=vatgcbs15@gmail.com
SMTP_PASS="eacb ytol wvvz nzcu"
SMTP_FROM_NAME=OpenSign
SMTP_REPLY_TO_EMAIL=vatgcbs15@gmail.com
# Document signing certificate
PFX_BASE64='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
3pXAXxZuvVvv9tsb4bdrBAhyb+KCIjp/gAICCAA='
PASS_PHRASE=opensign
APP_ID=opensign
EOF
        
        # Create PM2 configuration
        cat > /opt/opensign/backend/ecosystem.config.js << EOF
module.exports = {
  apps : [{
    name   : "opensign-backend",
    script : "npm",
    args   : "run dev",
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
        pm2 startup'

# Create frontend instance
echo -e "${YELLOW}Creating frontend instance...${NC}"
gcloud compute instances create opensign-frontend-instance \
    --zone=$ZONE \
    --machine-type=e2-medium \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --address=$FRONTEND_EXTERNAL_IP \
    --tags=opensign-frontend \
    --metadata startup-script='#!/bin/bash
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
REACT_APP_SERVERURL=http://'"$BACKEND_EXTERNAL_IP"':8081/app
REACT_APP_APPID=opensign
EOF
        
        # Create PM2 configuration
        cat > /opt/opensign/frontend/ecosystem.config.js << EOF
module.exports = {
  apps : [{
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
        proxy_set_header Connection "upgrade";
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
        nginx -t && systemctl reload nginx'

# Wait for instances to be ready
echo -e "${YELLOW}Waiting for instances to initialize (this may take several minutes)...${NC}"
sleep 120

# Check instance statuses
echo -e "${YELLOW}Checking instance statuses...${NC}"
gcloud compute instances list --filter="name~'opensign-'"

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!             ${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "${BLUE}Your OpenSign application is now deployed to Google Cloud Platform without Docker!${NC}"
echo -e ""
echo -e "${BLUE}Access your application at:${NC}"
echo -e "  Frontend: http://${FRONTEND_EXTERNAL_IP}"
echo -e "  Backend API: http://${BACKEND_EXTERNAL_IP}:8081"
echo -e "  MongoDB: ${MONGO_EXTERNAL_IP}:27017 (internal access only)"
echo -e ""
echo -e "${BLUE}Important Notes:${NC}"
echo -e "1. You may need to SSH into each instance to verify the services are running correctly"
echo -e "2. For production use, consider setting up SSL certificates"
echo -e "3. You may need to adjust the firewall rules based on your security requirements"
echo -e "4. The MongoDB instance is configured to accept connections from the backend only"
echo -e ""
echo -e "${BLUE}SSH Access:${NC}"
echo -e "  MongoDB: gcloud compute ssh opensign-mongo-instance --zone=${ZONE}"
echo -e "  Backend: gcloud compute ssh opensign-backend-instance --zone=${ZONE}"
echo -e "  Frontend: gcloud compute ssh opensign-frontend-instance --zone=${ZONE}"