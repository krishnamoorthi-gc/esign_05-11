# OpenSign VPS Deployment Guide

This guide provides detailed steps for manually deploying OpenSign on a VPS server without Docker.

## Prerequisites

1. A VPS server with either:
   - Ubuntu 20.04 LTS or newer (for Linux)
   - Windows Server 2016 or newer (for Windows)
2. At least 4GB RAM and 2 vCPUs
3. Root/administrator access to the server

## For Linux VPS (Ubuntu/Debian)

### Step 1: Install Prerequisites

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js v18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB v6.0+
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install LibreOffice
sudo apt install -y libreoffice

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (web server)
sudo apt install -y nginx
```

### Step 2: Deploy Application Files

```bash
# Create application directory
sudo mkdir -p /opt/opensign
cd /opt/opensign

# Copy your OpenSign files to this directory
# The structure should be:
# /opt/opensign/backend/OpenSignServer/
# /opt/opensign/frontend/OpenSign/
```

### Step 3: Install Dependencies and Build

```bash
# Install backend dependencies
cd /opt/opensign/backend/OpenSignServer
npm install

# Install frontend dependencies
cd /opt/opensign/frontend/OpenSign
npm install

# Build frontend for production
npm run build
```

### Step 4: Configure Environment Files

Create backend environment file:
```bash
cat > /opt/opensign/backend/OpenSignServer/.env << EOF
APP_ID=opensign
MASTER_KEY=your-secure-master-key-here
MONGODB_URI=mongodb://localhost:27017/OpenSignDB
SERVER_URL=http://localhost:8081/app
USE_LOCAL=true
PORT=8081
EOF
```

Create frontend environment file:
```bash
cat > /opt/opensign/frontend/OpenSign/.env << EOF
PUBLIC_URL=
GENERATE_SOURCEMAP=false
REACT_APP_SERVERURL=http://localhost:8081/app
REACT_APP_APPID=opensign
EOF
```

### Step 5: Configure PM2 Process Manager

Create PM2 configuration:
```bash
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
```

### Step 6: Configure Web Server (Nginx)

Create Nginx configuration:
```bash
sudo cat > /etc/nginx/sites-available/opensign << EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or server IP

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
```

Enable the site:
```bash
sudo ln -sf /etc/nginx/sites-available/opensign /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Step 7: Start Applications

```bash
# Start applications with PM2
cd /opt/opensign
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
sudo pm2 startup
```

## For Windows VPS

### Step 1: Install Prerequisites

1. Run PowerShell as Administrator
2. Install Chocolatey (package manager):
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

3. Install required software:
```cmd
choco install nodejs --version 18.17.0 -y
choco install mongodb -y
choco install libreoffice -y
```

4. Install PM2 globally:
```cmd
npm install -g pm2
```

### Step 2: Deploy Application Files

```cmd
# Create application directory
mkdir "C:\opensign"
cd "C:\opensign"

# Copy your OpenSign files to this directory
# The structure should be:
# C:\opensign\backend\OpenSignServer\
# C:\opensign\frontend\OpenSign\
```

### Step 3: Install Dependencies and Build

```cmd
# Install backend dependencies
cd "C:\opensign\backend\OpenSignServer"
npm install

# Install frontend dependencies
cd "C:\opensign\frontend\OpenSign"
npm install

# Build frontend for production
npm run build-win
```

### Step 4: Configure Environment Files

Create backend environment file at `C:\opensign\backend\OpenSignServer\.env`:
```
APP_ID=opensign
MASTER_KEY=your-secure-master-key-here
MONGODB_URI=mongodb://localhost:27017/OpenSignDB
SERVER_URL=http://localhost:8081/app
USE_LOCAL=true
PORT=8081
```

Create frontend environment file at `C:\opensign\frontend\OpenSign\.env`:
```
PUBLIC_URL=
GENERATE_SOURCEMAP=false
REACT_APP_SERVERURL=http://localhost:8081/app
REACT_APP_APPID=opensign
```

### Step 5: Configure PM2 Process Manager

Create PM2 configuration at `C:\opensign\ecosystem.config.js`:
```javascript
{
  "apps": [
    {
      "name": "opensign-backend",
      "script": "npm",
      "args": "run dev",
      "cwd": "C:/opensign/backend/OpenSignServer",
      "env": {
        "NODE_ENV": "production"
      }
    },
    {
      "name": "opensign-frontend",
      "script": "npm",
      "args": "run start",
      "cwd": "C:/opensign/frontend/OpenSign",
      "env": {
        "NODE_ENV": "production"
      }
    }
  ]
}
```

### Step 6: Start Applications

```cmd
# Start MongoDB service
net start MongoDB

# Start applications with PM2
cd "C:\opensign"
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
```

## Post-Deployment Configuration

### For Production Use:

1. **Set up SSL certificates**:
   - For Linux: Use Let's Encrypt with Certbot
   - For Windows: Use Windows Certificate Store or Let's Encrypt Windows client

2. **Configure Firewall**:
   - Allow traffic on ports 80 (HTTP) and 443 (HTTPS)
   - For Linux: Use `ufw` or `iptables`
   - For Windows: Use Windows Firewall

3. **Update Environment Variables**:
   - Set your domain in `PUBLIC_URL` in the frontend .env file
   - Update email configuration for production use
   - Set strong passwords and keys

4. **Set up Automated Backups**:
   - Configure MongoDB backups
   - Set up regular backup schedules

## Access Your Application

After deployment, your OpenSign application will be accessible at:
- Frontend: http://your-server-ip (or your domain)
- Backend API: http://your-server-ip/app (or your domain/app)

## Managing the Application

Use these PM2 commands to manage your application:
```bash
# View application status
pm2 status

# View application logs
pm2 logs

# Restart applications
pm2 restart all

# Stop applications
pm2 stop all

# Start applications
pm2 start all
```