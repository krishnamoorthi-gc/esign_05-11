# OpenSign Project - Quick Start Guide

## Prerequisites
1. Node.js (version 18, 20, or 22)
2. Docker (for running MongoDB)
3. Git

## Setup Instructions

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend/OpenSign
npm install
cd ../..

# Install backend dependencies
cd backend/OpenSignServer
npm install
cd ../..
```

### 2. Start MongoDB
Make sure Docker is running, then:
```bash
# If you don't have a MongoDB container yet:
docker run -d -p 27017:27017 --name mongodb mongo:latest

# If you already have a MongoDB container:
docker start mongodb
```

### 3. Run the Application
You can start the application in several ways:

#### Option 1: Use the batch file (Windows)
Double-click on `start-project.bat` or run:
```bash
start-project.bat
```

#### Option 2: Use npm scripts
```bash
# Run both frontend and backend together
npm run dev
```

#### Option 3: Run frontend and backend separately
```bash
# In one terminal, run the backend
npm run dev:backend

# In another terminal, run the frontend
npm run dev:frontend
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8081

## Environment Configuration
The project already includes properly configured `.env` files:
- Root directory: `.env`
- Frontend directory: `frontend/OpenSign/.env`
- Backend directory: `backend/OpenSignServer/.env`

## Troubleshooting
1. If you get connection errors, make sure MongoDB is running on port 27017
2. If the frontend can't connect to the backend, check that both are running on their respective ports
3. If you see any missing dependency errors, run `npm install` in the root, frontend, and backend directories