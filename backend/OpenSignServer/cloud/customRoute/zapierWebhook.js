/**
 * Zapier Webhook Handler
 * Handle incoming requests from Zapier
 */

import express from 'express';
import { validateZapierKey } from '../parsefunction/ZapierController.js';

const router = express.Router();

// Middleware to validate Zapier API key
const validateApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

    const isValid = await validateZapierKey(apiKey);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get document by ID
router.get('/document/:id', validateApiKey, async (req, res) => {
  try {
    const { id } = req.params;

    const query = new Parse.Query('contracts_Document');
    query.equalTo('objectId', id);

    const document = await query.first({ useMasterKey: true });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Return document data
    return res.json({
      id: document.id,
      name: document.get('Name'),
      note: document.get('Note'),
      description: document.get('Description'),
      createdAt: document.get('createdAt'),
      updatedAt: document.get('updatedAt'),
      status: document.get('Status'),
      expirationDate: document.get('ExpiryDate'),
      // Add other relevant fields as needed
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new document
router.post('/document', validateApiKey, async (req, res) => {
  try {
    const { name, note, description, expiryDate } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Document name is required' });
    }

    const Document = Parse.Object.extend('contracts_Document');
    const document = new Document();

    document.set('Name', name);
    if (note) document.set('Note', note);
    if (description) document.set('Description', description);
    if (expiryDate) document.set('ExpiryDate', new Date(expiryDate));

    // Set default status
    document.set('Status', 'Draft');

    const savedDocument = await document.save(null, { useMasterKey: true });

    return res.status(201).json({
      id: savedDocument.id,
      name: savedDocument.get('Name'),
      note: savedDocument.get('Note'),
      description: savedDocument.get('Description'),
      status: savedDocument.get('Status'),
      createdAt: savedDocument.get('createdAt'),
      updatedAt: savedDocument.get('updatedAt'),
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update document status
router.patch('/document/:id', validateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const query = new Parse.Query('contracts_Document');
    query.equalTo('objectId', id);

    const document = await query.first({ useMasterKey: true });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    document.set('Status', status);
    const updatedDocument = await document.save(null, { useMasterKey: true });

    return res.json({
      id: updatedDocument.id,
      name: updatedDocument.get('Name'),
      status: updatedDocument.get('Status'),
      updatedAt: updatedDocument.get('updatedAt'),
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
