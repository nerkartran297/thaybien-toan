const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phucnguyenguitar';

// Import all products from JSON file
const products = require('./products-data.json');

async function importProducts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('phucnguyenguitar');
    const collection = db.collection('products');
    
    // Clear existing products
    await collection.deleteMany({});
    console.log('🗑️  Cleared existing products');
    
    // Add timestamps to each product
    const productsWithTimestamps = products.map(product => ({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    // Insert products
    const result = await collection.insertMany(productsWithTimestamps);
    console.log(`✅ Inserted ${result.insertedCount} products`);
    
    // Verify import
    const count = await collection.countDocuments();
    console.log(`📊 Total products in database: ${count}`);
    
    console.log('🎉 Migration completed successfully!');
    console.log('🌐 You can now access:');
    console.log('   - Products page: http://localhost:3001/products');
    console.log('   - Admin panel: http://localhost:3001/admin');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

importProducts();
