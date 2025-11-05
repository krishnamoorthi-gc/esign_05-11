<h1 align="center"><a href='https://www.opensignlabs.com'><img src=https://github.com/OpenSignLabs/OpenSign/assets/5486116/e518cc9c-5de3-47da-950b-f93336b9f14e></a>
</h1><div align="center">

[The free and open source alternative to DocuSign](https://www.opensignlabs.com)

[![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/opensignlabs/opensign.svg)](http://isitmaintained.com/project/opensignlabs/opensign "Average time to resolve an issue")
[![All Contributors](https://img.shields.io/github/all-contributors/opensignlabs/opensign?color=ee8449&style=flat-square)](#contributors)
![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/w/opensignlabs/opensign)
![GitHub last commit (by committer)](https://img.shields.io/github/last-commit/opensignlabs/opensign)


<a href="https://www.opensignlabs.com/">Website</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://docs.opensignlabs.com">Help Docs</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
    <a href="https://docs.opensignlabs.com/docs/API-docs/opensign-api-v-1">API Docs</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://www.opensignlabs.com/blog">Blog</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://discord.com/invite/xe9TDuyAyj">Discord</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://twitter.com/opensignlabs">Twitter</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://www.linkedin.com/company/opensign%E2%84%A2/about/">LinkedIn</a>


## The premier open source document signing solution(DocuSign alternative)

---
</div>

### Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Running the Project](#running-the-project)
6. [MongoDB Connectivity](#mongodb-connectivity)
7. [Webhook System](#webhook-system)
8. [Subscription Functionality](#subscription-functionality)
9. [Docker Deployment](#docker-deployment)
10. [Google Cloud Deployment](#google-cloud-deployment)
11. [Contribution Guidelines](#contribution-guidelines)
12. [License](#license)
13. [Acknowledgments](#acknowledgments)

---
Please star ⭐ the repo to support us! 😀

### Introduction

Welcome to OpenSign, the premier open source docusign alternative - document e-signing solution designed to provide a secure, reliable and free alternative to commercial esign platforms like DocuSign, PandaDoc, SignNow, Adobe Sign, Smartwaiver, SignRequest, HelloSign & Zoho sign. Our mission is to democratize the document signing process, making it accessible and straightforward for everyone.

---

### Features

- **Secure PDF E-Signing:** With the help of robust encryption algorithms, OpenSign™ ensures maximum security, privacy & compatibility. Now sign unlimited documents even on the [cloud hosted free version of OpenSign](https://www.opensignlabs.com/).
- **Subscription Management:** OpenSign™ now includes a comprehensive subscription system with trial periods and premium plans, allowing users to access advanced features after their trial expires.
- **Annotate Documents:** OpenSign™ allows you to annotate PDF documents with an advanced signing pad that allows hand drawn signatures, uploaded images, typed signatures & saved signatures for the simplest open source document signing experience ever.
- **User-Friendly Interface:** OpenSign™ was built while keeping Intuitive design in mind for ease of use. Features like "Sign yourself", "Templates", "One click signatures" and "OpenSign™ Drive" makes it stand out of the crowd and even makes it better than a lot of so-called industry leaders. OpenSign intends to provide the best document signing experience in the open source ecosystem.
- **Multi-signer Support:** OpenSign's ability to invite multiple signers for signing along with the ability to invite by sharing signing links & being able to enforce signing in a sequence makes it the only open source solution that is fully loaded and allows it to compete head-to-head with established players in e-signature space.
- **Email Unique Code(OTP) verification support for guest signers:** With OpenSign™, your documents are fully secure even when being signed by guest users. Guest signers can only sign the document after entering a unique code sent to their email address. 
- **"Expiring Docs" & "Rejection":** You can set documents to expire after certain number of days after which nobody will be able to sign. Not just this, OpenSign™ also allows signers to reject signing a document with a reason that will be promptly shared with the sender.
- **Beautiful email templates:** All document signing invitations, completion notifications & reminders are formatted using great looking email templates. Not just this, you are even allowed to customise the email templates making your free document signing invitations look the way you always wanted them to be.
- **PDF Template Creation:** OpenSign™ allows you to create and store PDF document templates for repeated use thereby saving you a lot of time & collect e-signatures seamlessly.
- **OpenSign™ Drive:** It is a centralised secure vault for your digital documents that makes storing, signing, organizing, sharing & archieving your docs a breeze.
- **Audit Trails & completion certificate:** Being a security focused solution, OpenSign™ makes it a top priority to save detailed logs for tracking document activities along with time-stamps, IP addresses, email IDs & phone numbers. A completion certificate is generated as soon as document is completed which contains all the document related logs for added safety.
- **API Support:** OpenSign™ API allows seamless integration into existing systems and software. You can generate an API key from the app and refer the [official API docs](https://docs.opensignlabs.com/docs/API-docs/opensign-api-v-1) to start integrating it in your existing applications.
- **Integrations:** The open source document signing experience becomes even more seamless because of integrations with various Cloud storage systems, CRMs & enterprise platforms. We also have a Zapier integration that allows you to integrate it with virtually any application.

---

### Deploy

Note: The default MongoDB instance used in deployment is not persistant and will be cleared on every restart. To retain your data, configure and supply your own MongoDB connection URL.

#### DigitalOcean
[![Deploy on DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/OpenSignLabs/Deploy-OpenSign-to-Digital-Ocean/tree/main&refcode=30db1c901ab0)

#### Docker
The simplest way to install OpenSign on your own server is using official docker images. Please refer to the [Installation Guide](https://docs.opensignlabs.com/docs/self-host/docker/run-locally/) for detailed instructions on how to install OpenSign on your system.

Make sure that you have `Docker` and `git` installed before you run the deployment command.

---

### Usage

For comprehensive guidelines on how to use OpenSign™, please consult our [User Manual](USAGE.md).

### Running the Project

There are several ways to run OpenSign™ on your local machine:

#### Prerequisites
Before you begin, ensure you have the following installed:
1. Node.js (v18 or higher)
2. MongoDB (v6.0 or higher)
3. LibreOffice (for DOCX to PDF conversions)

#### Method 1: Using npm script (Recommended)
From the root directory, run:
```bash
npm run dev
```
This will start both the backend and frontend services concurrently.

#### Method 2: Using batch files (Windows only)
- Double-click on `run_all.bat` to start both services in separate command windows.
- Alternatively, you can start services separately:
  - Double-click `run_backend.bat` to start the backend service
  - Double-click `run_frontend.bat` to start the frontend service

#### Method 3: Manual setup
1. **Backend Setup:**
   ```bash
   cd backend/OpenSignServer
   npm install
   npm run dev
   ```
   The server will start on http://localhost:8081

2. **Frontend Setup:**
   ```bash
   cd frontend/OpenSign
   npm install
   npm run dev
   ```
   The frontend will be available at http://localhost:3001

#### Method 4: Using the new batch files (Windows only)
- Double-click on `start_all.bat` to start both services in separate command windows.
- You can also start services separately:
  - Double-click `start_backend.bat` to start the backend service
  - Double-click `start_frontend.bat` to start the frontend service

For more detailed instructions, please refer to [RUNNING_INSTRUCTIONS.md](RUNNING_INSTRUCTIONS.md)

#### Accessing the Application
Once both services are running, open your browser and navigate to http://localhost:3001 to access the OpenSign™ application.

### Docker Deployment

This project includes Docker configuration for both development and production deployment.

#### Prerequisites
- Docker installed on your system
- Docker Compose installed on your system

#### Quick Start with Docker Compose

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/esign_new.git
   cd esign_new
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:8081/app

#### Production Deployment with Docker

1. Build the Docker images:
   ```bash
   # Build backend
   cd backend/OpenSignServer
   docker build -t opensign-backend .

   # Build frontend
   cd ../frontend/OpenSign
   docker build -t opensign-frontend .
   ```

2. Run the containers:
   ```bash
   # Run MongoDB
   docker run -d --name mongo -p 27017:27017 mongo:6.0

   # Run backend
   docker run -d --name backend -p 8081:8081 \
     -e APP_ID=opensign \
     -e SERVER_URL=http://localhost:8081/app \
     -e MASTER_KEY=your_master_key_here \
     -e DATABASE_URI=mongodb://host.docker.internal:27017/opensign \
     --link mongo:mongo \
     opensign-backend

   # Run frontend
   docker run -d --name frontend -p 80:80 \
     -e REACT_APP_SERVERURL=http://localhost:8081/app \
     -e REACT_APP_APPID=opensign \
     --link backend:backend \
     opensign-frontend
   ```

#### Deploying Without Docker on VPS Server

For production deployments on VPS servers without Docker, OpenSign provides automated deployment scripts that handle the installation of all prerequisites and configuration of the application to run as a service using PM2 process manager.

##### Prerequisites
- VPS server with either:
  - Ubuntu 20.04 LTS or newer (Linux)
  - Windows Server 2016 or newer (Windows)
- At least 4GB RAM and 2 vCPUs recommended
- Root/administrator access to the server

##### For Linux VPS (Ubuntu/Debian)

1. Copy the OpenSign application files to your server
2. Make the deployment script executable:
   ```bash
   chmod +x deploy-without-docker.sh
   ```
3. Run the deployment script with sudo privileges:
   ```bash
   sudo ./deploy-without-docker.sh
   ```

The script will automatically:
- Install Node.js v18, MongoDB v6.0+, LibreOffice, PM2, and Nginx
- Install backend and frontend dependencies
- Build the frontend for production
- Generate secure environment configuration files
- Configure PM2 to manage the applications
- Set up Nginx as a reverse proxy

##### For Windows VPS

1. Copy the OpenSign application files to your server
2. Right-click on `deploy-without-docker.bat` and select "Run as administrator"
3. Follow the on-screen instructions

The script will automatically:
- Install Node.js v18, MongoDB, LibreOffice, and PM2 using Chocolatey
- Install backend and frontend dependencies
- Build the frontend for production (using Windows-compatible build process)
- Generate secure environment configuration files
- Configure PM2 to manage the applications

##### Post-Deployment Configuration

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

##### Accessing Your Application

After deployment, your OpenSign application will be accessible at:
- Frontend: http://your-server-ip (or your domain)
- Backend API: http://your-server-ip/app (or your domain/app)

##### Managing the Application

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

For detailed manual deployment instructions without the automated scripts, please refer to [VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md).

#### Google Cloud Deployment with External IP Addresses (No Docker)

You can deploy OpenSign to Google Cloud Platform without using Docker containers and with dedicated external IP addresses for each service:

- For Linux/Unix systems: `deploy-to-gcp-external-ip.sh`
- For Windows systems: `deploy-to-gcp-external-ip.bat`

This deployment method creates separate virtual machines for MongoDB, backend, and frontend services, each with its own static external IP address.

For detailed instructions, please refer to [DEPLOY_TO_GCP_EXTERNAL_IP.md](DEPLOY_TO_GCP_EXTERNAL_IP.md).

#### Google Cloud Deployment

This project includes configuration files for deploying to Google Cloud Platform using Google Kubernetes Engine (GKE).

#### Prerequisites
- Google Cloud Account
- Google Cloud SDK installed
- Docker installed
- kubectl installed
- OpenSSL installed (for generating secure keys)

#### Quick Start

1. **Authentication**
   Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   ```

2. **Set Project**
   Set your Google Cloud project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Automated Deployment**
   Use the provided deployment scripts:
   
   For Linux/Mac:
   ```bash
   ./deploy-to-gcp.sh
   ```
   
   For Windows (Command Prompt):
   ```cmd
   deploy-to-gcp.bat
   ```
   
   For Windows (PowerShell):
   ```powershell
   .\deploy-to-gcp.ps1
   ```

4. **Manual Deployment**
   Refer to [GOOGLE_CLOUD_DEPLOYMENT.md](GOOGLE_CLOUD_DEPLOYMENT.md) for detailed manual deployment instructions.

#### Accessing the Application

After deployment, your application will be accessible at:
- Frontend: `http://[EXTERNAL_IP]` (IP provided after deployment)
- Backend API: `http://[EXTERNAL_IP]:8081`

#### Configuration

The deployment automatically generates a secure master key and configures the necessary environment variables.

### MongoDB Connectivity

OpenSign requires MongoDB v6.0 or higher for data storage. Here are the details for setting up MongoDB connectivity:

#### Default Configuration
By default, OpenSign connects to MongoDB using the following configuration:
- **Connection String:** `mongodb://localhost:27017/OpenSignDB`
- **Database Name:** `OpenSignDB`
- **Port:** `27017`

#### Environment Variables
To configure MongoDB connectivity, set the following environment variables in your backend `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/OpenSignDB
```

#### Using MongoDB Atlas (Cloud)
If you prefer to use MongoDB Atlas or another cloud MongoDB provider, update the `MONGODB_URI` variable with your connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/OpenSignDB?retryWrites=true&w=majority
```

#### MongoDB Setup Steps
1. Install MongoDB v6.0 or higher on your system
2. Start the MongoDB service:
   - **Windows:** `net start MongoDB`
   - **Mac/Linux:** `sudo systemctl start mongod` or `brew services start mongodb-community`
3. Verify MongoDB is running by connecting with the mongo shell: `mongosh`
4. Create the OpenSign database: `use OpenSignDB`

#### Troubleshooting
- Ensure MongoDB service is running before starting OpenSign
- Check that the MongoDB version is v6.0 or higher
- Verify firewall settings allow connections on port 27017 (if using default configuration)
- For connection issues, verify the `MONGODB_URI` in your `.env` file is correct

### Webhook System

OpenSign™ includes a comprehensive webhook system that allows you to receive real-time notifications about document events.

#### Supported Event Types
- `document.created` - Triggered when a new document is created
- `document.sent` - Triggered when a document is sent to recipients
- `document.viewed` - Triggered when a recipient views a document
- `document.signed` - Triggered when a document is signed by a recipient
- `document.completed` - Triggered when all required actions on a document are completed
- `document.declined` - Triggered when a recipient declines to sign a document

#### Webhook Management
Users can manage webhook subscriptions through the Webhook page in the dashboard, where they can:
- Create new webhook subscriptions
- Specify the URL to receive webhooks (must be HTTPS)
- Select which events to subscribe to
- Provide a secret token for HMAC signature verification
- View, edit, or delete existing subscriptions

#### Security
Each webhook request includes an `X-Webhook-Signature` header containing an HMAC SHA256 signature. Customers can verify the authenticity of webhook requests using their secret token.

For detailed technical documentation about the webhook system, please see [WEBHOOK_SYSTEM_DOCUMENTATION.md](WEBHOOK_SYSTEM_DOCUMENTATION.md).

### Subscription Functionality

OpenSign™ now includes a subscription system with the following features:

- **10-Day Free Trial:** All new users get a 10-day free trial to test premium features
- **Premium Plans:** After the trial expires, users can subscribe to continue using premium features

### Contribution Guidelines

We welcome contributions to the OpenSign project! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information on how to get started.

### License

OpenSign is licensed under the AGPL-3.0 License. See the [LICENSE](LICENSE) file for more information.

### Acknowledgments

We would like to thank all the contributors who have helped make OpenSign possible. Your contributions are greatly appreciated!