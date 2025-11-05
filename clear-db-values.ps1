# Script to clear database values for OpenSign deployment
# This script connects to the MongoDB instance and clears all data from the OpenSignDB database

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  OpenSign Database Clear Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Get the MongoDB instance IP address
    Write-Host "1. Getting MongoDB IP address..." -ForegroundColor Yellow
    $mongoIP = gcloud compute addresses describe opensign-mongo-ip --region=us-central1 --format="value(address)"
    
    if (-not $mongoIP) {
        Write-Host "   [ERROR] Could not retrieve MongoDB IP address" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   [SUCCESS] MongoDB IP: $mongoIP" -ForegroundColor Green

    # Create a temporary Node.js script to clear the database
    Write-Host "2. Creating database clear script..." -ForegroundColor Yellow
    
    $clearDbScript = @"
const { MongoClient } = require('mongodb');

async function clearDatabase() {
    // Connect to MongoDB
    const uri = 'mongodb://$mongoIP:27017/OpenSignDB';
    const client = new MongoClient(uri, { useUnifiedTopology: true });

    try {
        await client.connect();
        console.log('Connected to MongoDB at $mongoIP:27017');
        
        const db = client.db('OpenSignDB');
        
        // Get list of collections
        const collections = await db.listCollections().toArray();
        console.log('Found collections:', collections.map(c => c.name));
        
        // Drop all collections
        for (const collection of collections) {
            console.log('Dropping collection:', collection.name);
            await db.collection(collection.name).drop();
        }
        
        console.log('All collections dropped successfully');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

clearDatabase();
"@

    $clearDbScript | Out-File -FilePath "clear-db.js" -Encoding ASCII
    Write-Host "   [SUCCESS] Database clear script created" -ForegroundColor Green

    # Install MongoDB driver if not already installed
    Write-Host "3. Installing MongoDB driver..." -ForegroundColor Yellow
    npm install mongodb@latest --no-save | Out-Null
    Write-Host "   [SUCCESS] MongoDB driver installed" -ForegroundColor Green

    # Run the database clear script
    Write-Host "4. Clearing database values..." -ForegroundColor Yellow
    node clear-db.js
    
    # Clean up temporary files
    Remove-Item -Path "clear-db.js" -Force -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "  Database values cleared successfully!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "All data has been removed from the OpenSignDB database." -ForegroundColor Gray
    Write-Host "The database structure will be recreated when the application restarts." -ForegroundColor Gray

} catch {
    Write-Host "   [ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   [ERROR] Failed to clear database values." -ForegroundColor Red
    
    # Clean up temporary files
    Remove-Item -Path "clear-db.js" -Force -ErrorAction SilentlyContinue
    
    exit 1
}