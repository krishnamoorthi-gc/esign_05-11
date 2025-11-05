import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { authenticateAPI } from './apiMiddleware.js';
import { saveFile } from '../parsefunction/saveFile.js';

dotenv.config({ quiet: true });

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// API route for uploading documents
router.post('/v1/upload', authenticateAPI, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    // Prepare file data for saving
    const fileData = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    };
    
    // Save the file using the existing saveFile function
    const result = await saveFile(fileData, req.userId);
    
    return res.status(200).json({
      message: 'File uploaded successfully',
      fileId: result.fileId,
      url: result.url
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

// API route for getting user info
router.get('/v1/user', authenticateAPI, async (req, res) => {
  try {
    // Get user info
    const userQuery = new Parse.Query(Parse.User);
    const user = await userQuery.get(req.userId, { useMasterKey: true });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({
      userId: user.id,
      username: user.get('username'),
      email: user.get('email')
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

export default router;