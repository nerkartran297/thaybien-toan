const { MongoClient } = require('mongodb');
const products = require('../src/app/data/products.ts');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phucnguyenguitar';

async function migrateProducts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('phucnguyenguitar');
    const collection = db.collection('products');
    
    // Clear existing products
    await collection.deleteMany({});
    console.log('Cleared existing products');
    
    // Import products from the TypeScript file
    // Note: This is a simplified approach. In production, you'd want to use a proper migration tool
    const { products: productData } = require('../src/app/data/products.ts');
    
    // Add timestamps to each product
    const productsWithTimestamps = productData.map(product => ({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    // Insert products
    const result = await collection.insertMany(productsWithTimestamps);
    console.log(`Inserted ${result.insertedCount} products`);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateProducts();
