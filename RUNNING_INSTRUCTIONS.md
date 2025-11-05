# Running OpenSign Locally

## Prerequisites

1. Node.js (v18 or higher)
2. MongoDB (v6.0 or higher) - Must be running
3. LibreOffice (for DOCX to PDF conversions)

## Starting the Application

### Method 1: Using Batch Files (Recommended)

1. Double-click `start_all.bat` to start both backend and frontend servers
2. Wait for both servers to initialize (this may take a minute or two)
3. Access the application at:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8081/app

### Method 2: Manual Start

1. Start MongoDB service:
   - Open Services (services.msc)
   - Find MongoDB service
   - Right-click and select "Start"

2. Start Backend Server:
   ```
   cd backend\OpenSignServer
   npm run dev
   ```

3. Start Frontend Server (in a new terminal):
   ```
   cd frontend\OpenSign
   npm run dev
   ```

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