import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection
const mongoUri = process.env.DATABASE_URI || 'mongodb://localhost:27017/opensign';
const dbName = mongoUri.split('/').pop();

console.log('Connecting to MongoDB at:', mongoUri);

async function resetDatabase() {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    
    const db = client.db(dbName);
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    console.log('Existing collections:', collections.map(c => c.name));
    
    // Drop all collections
    for (const collection of collections) {
      console.log(`Dropping collection: ${collection.name}`);
      await db.dropCollection(collection.name);
    }
    
    console.log('All collections dropped successfully!');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await client.close();
    console.log('Database connection closed.');
  }
}

resetDatabase();