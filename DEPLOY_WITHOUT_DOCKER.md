# Deploying OpenSign Without Docker

This guide explains how to deploy OpenSign to a server without using Docker containers. Two deployment scripts are provided:
1. `deploy-without-docker.sh` - For Linux/Unix systems
2. `deploy-without-docker.bat` - For Windows systems

## Prerequisites

Before running the deployment scripts, ensure you have:

1. A server or VM with:
   - For Linux: Ubuntu 20.04 LTS or newer recommended
   - For Windows: Windows Server 2016 or newer, or Windows 10/11 Pro
2. Sufficient resources (at least 4GB RAM and 2 vCPUs recommended)
3. Internet connectivity for downloading dependencies

## Deployment Steps

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
   - Create environment configuration files
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
   - Setting up SSL certificates
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

## Security Considerations

For production deployments, consider:

1. Using strong, unique passwords and keys
2. Restricting access to the server with firewalls
3. Setting up SSL/TLS certificates
4. Regularly updating the system and application dependencies
5. Implementing proper backup strategies