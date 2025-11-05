const { MongoClient } = require("mongodb");

async function testConnection() {
  const uri = "mongodb://127.0.0.1:27017/OpenSignDB";
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log("Connected successfully to MongoDB");

    // Get database info
    const db = client.db();
    const stats = await db.stats();
    console.log("Database stats:", stats);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await client.close();
  }
}

testConnection();
