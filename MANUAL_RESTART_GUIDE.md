# Manual Restart Guide for OpenSign Application

## Prerequisites

1. Make sure MongoDB is running
2. Make sure you have Node.js installed
3. Make sure you have the required environment files

## Step-by-Step Restart Instructions

### Step 1: Start MongoDB

1. Press `Windows Key + R` to open the Run dialog
2. Type `services.msc` and press Enter
3. In the Services window, find "MongoDB Server" (or similar)
4. Right-click on it and select "Start"
5. If it's already running, select "Restart"

### Step 2: Start Backend Server

1. Open a new Command Prompt or PowerShell window
2. Navigate to the backend directory:
   ```
   cd "C:\Users\GC-IT\Documents\Backups\backup 0710\backend\OpenSignServer"
   ```
3. Install dependencies (if not already done):
   ```
   npm install
   ```
4. Start the backend server:
   ```
   npm run dev
   ```
5. Wait for the server to start (you should see a message like "opensign-server running on port 8081")

### Step 3: Start Frontend Server

1. Open another new Command Prompt or PowerShell window
2. Navigate to the frontend directory:
   ```
   cd "C:\Users\GC-IT\Documents\Backups\backup 0710\frontend\OpenSign"
   ```
3. Install dependencies (if not already done):
   ```
   npm install
   ```
4. Start the frontend server:
   ```
   npm run dev
   ```
5. Wait for the server to start (you should see a message with the local address)

### Step 4: Access the Application

1. Open your web browser
2. Navigate to http://localhost:3001
3. The OpenSign application should load

## Troubleshooting

### If you get "Connection Refused" errors:

1. Make sure MongoDB is running
2. Check that both backend and frontend servers are running
3. Verify the ports in the .env files:
   - Backend: Should be port 8081
   - Frontend: Should point to backend at http://localhost:8081/app

### If document previews don't work:

1. Ensure the backend server is running on port 8081
2. Check that the REACT_APP_SERVERURL in frontend/.env points to http://localhost:8081/app
3. Verify that uploaded files exist in the backend files directory

### Port Conflicts:

If port 8081 is already in use, you can change it:
1. Edit backend/.env and change the PORT value
2. Update the SERVER_URL to reflect the new port
3. Update frontend/.env to point to the new backend port

## Environment Files

Make sure these files exist with the correct content:

### backend\OpenSignServer\.env
```
MONGODB_URI=mongodb://localhost:27017/OpenSignDB
SERVER_URL=http://127.0.0.1:8081/app
USE_LOCAL=true
APP_ID=opensign
MASTER_KEY=your_master_key_here
PORT=8081
```

### frontend\OpenSign\.env
```
REACT_APP_SERVERURL=http://localhost:8081/app
REACT_APP_APPID=opensign
GENERATE_SOURCEMAP=false
PUBLIC_URL=http://localhost:3001
```