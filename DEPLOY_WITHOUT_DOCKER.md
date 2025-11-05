# Deploying OpenSign Without Docker

This guide explains how to deploy OpenSign to a server without using Docker containers. Two deployment approaches are provided:

1. **Automated Deployment** - Using provided scripts that automatically install and configure everything
2. **Manual Deployment** - Following step-by-step instructions for complete control

## Prerequisites

Before deploying, ensure you have:

1. A server or VM with:
   - For Linux: Ubuntu 20.04 LTS or newer recommended
   - For Windows: Windows Server 2016 or newer, or Windows 10/11 Pro
2. Sufficient resources (at least 4GB RAM and 2 vCPUs recommended)
3. Internet connectivity for downloading dependencies
4. Root/administrator access to the server

## Automated Deployment (Recommended)

OpenSign provides automated deployment scripts that handle the installation of all prerequisites and configuration of the application.

### For Linux/Unix Systems

1. Copy your OpenSign application files to the server
2. Make the deployment script executable:
   ```bash
   chmod +x deploy-without-docker.sh
   ```
3. Run the deployment script with sudo privileges:
   ```bash
   sudo ./deploy-without-docker.sh
   ```
4. Follow the on-screen instructions

### For Windows Systems

1. Copy your OpenSign application files to the server
2. Right-click on `deploy-without-docker.bat` and select "Run as administrator"
3. Follow the on-screen instructions

## Manual Deployment Steps

If you prefer to manually deploy OpenSign without Docker, follow these steps:

### For Linux VPS (Ubuntu/Debian)

#### Step 1: Install Prerequisites

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

#### Step 2: Deploy Application Files

```bash
# Create application directory
sudo mkdir -p /opt/opensign
cd /opt/opensign

# Copy your OpenSign files to this directory
# The structure should be:
# /opt/opensign/backend/OpenSignServer/
# /opt/opensign/frontend/OpenSign/
```

#### Step 3: Install Dependencies and Build

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

#### Step 4: Configure Environment Files

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

#### Step 5: Configure PM2 Process Manager

Create PM2 configuration:
```bash
cat > /opt/opensign/ecosystem.config.js << EOF
module.exports = {
  apps : [{
    name   : "opensign-backend",
    script : "./index.js",
    cwd    : "/opt/opensign/backend/OpenSignServer",
    env: {
      NODE_ENV: "production"
    }
  },
  {
    name   : "opensign-frontend",
    script : "node",
    args   : "server.js",
    cwd    : "/opt/opensign/frontend/OpenSign",
    env: {
      NODE_ENV: "production"
    }
  }]
}
EOF
```

#### Step 6: Configure Web Server (Nginx)

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

#### Step 7: Start Applications

```bash
# Start applications with PM2
cd /opt/opensign
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
sudo pm2 startup
```

### For Windows VPS

#### Step 1: Install Prerequisites

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

#### Step 2: Deploy Application Files

```cmd
# Create application directory
mkdir "C:\opensign"
cd "C:\opensign"

# Copy your OpenSign files to this directory
# The structure should be:
# C:\opensign\backend\OpenSignServer\
# C:\opensign\frontend\OpenSign\
```

#### Step 3: Install Dependencies and Build

```cmd
# Install backend dependencies
cd "C:\opensign\backend\OpenSignServer"
npm install

# Install frontend dependencies
cd "C:\opensign\frontend\OpenSign"
npm install

# Build frontend for production (Windows-specific command)
npm run build-win
```

#### Step 4: Configure Environment Files

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

#### Step 5: Configure PM2 Process Manager

Create PM2 configuration at `C:\opensign\ecosystem.config.js`:
```javascript
{
  "apps": [
    {
      "name": "opensign-backend",
      "script": "index.js",
      "cwd": "C:/opensign/backend/OpenSignServer",
      "env": {
        "NODE_ENV": "production"
      }
    },
    {
      "name": "opensign-frontend",
      "script": "node",
      "args": "server.js",
      "cwd": "C:/opensign/frontend/OpenSign",
      "env": {
        "NODE_ENV": "production"
      }
    }
  ]
}
```

#### Step 6: Start Applications

```cmd
# Start MongoDB service
net start MongoDB

# Start applications with PM2
cd "C:\opensign"
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
```

## What the Scripts Do

The deployment scripts will automatically:

1. Install all necessary prerequisites:
   - Node.js v18
   - MongoDB
   - LibreOffice
   - PM2 (process manager)
   - Nginx (Linux only)

2. Set up the application:
   - Install backend and frontend dependencies
   - Build the frontend for production
   - Create environment configuration files with secure keys
   - Configure PM2 to manage the applications
   - Set up Nginx as a reverse proxy (Linux only)

3. Start the services:
   - MongoDB database
   - OpenSign backend server
   - OpenSign frontend server

## Post-Deployment Configuration

After running the deployment script, you should:

1. Update the generated `.env` files with your specific configuration:
   - Backend: `/opt/opensign/backend/OpenSignServer/.env` (Linux) or `C:\opensign\backend\OpenSignServer\.env` (Windows)
   - Frontend: `/opt/opensign/frontend/OpenSign/.env` (Linux) or `C:\opensign\frontend\OpenSign\.env` (Windows)

2. For production use, consider:
   - Setting up SSL certificates (Let's Encrypt recommended)
   - Configuring a custom domain
   - Adjusting firewall settings
   - Setting up automated backups for MongoDB
   - Monitoring and log management

## Accessing Your Application

After deployment, your OpenSign application will be accessible at:

- Frontend: http://your-server-ip (or http://localhost:3000 on the server)
- Backend API: http://your-server-ip/app (or http://localhost:8081/app on the server)

## Managing the Application

The applications are managed using PM2. You can use these commands:

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

## Troubleshooting

If you encounter issues:

1. Check PM2 logs: `pm2 logs`
2. Verify MongoDB is running: `systemctl status mongod` (Linux) or `net start MongoDB` (Windows)
3. Check Nginx configuration: `nginx -t` (Linux only)
4. Ensure all environment variables are correctly set in the .env files
5. Verify that ports 8081 (backend) and 3000 (frontend) are not blocked by firewall

## Security Considerations

For production deployments, consider:

1. Using strong, unique passwords and keys
2. Restricting access to the server with firewalls
3. Setting up SSL/TLS certificates
4. Regularly updating the system and application dependencies
5. Implementing proper backup strategies
6. Monitoring logs for suspicious activity

For detailed manual deployment instructions, please refer to [VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md).