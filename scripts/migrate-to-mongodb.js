const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phucnguyenguitar';

// Import products data (simplified approach)
const products = [
  {
    id: 1,
    name: "Fender Stratocaster American Professional II",
    category: "guitar",
    subcategory: "electric",
    brand: "Fender",
    price: 15990000,
    originalPrice: 17990000,
    image: "/electric/electric-guitar.jpg",
    images: [
      "/electric/electric-guitar.jpg",
      "/wallpaper-1.jpg",
      "/wallpaper-2.jpg",
      "/wallpaper-3.jpg"
    ],
    rating: 4.8,
    reviews: 124,
    inStock: true,
    isNew: true,
    description: "Classic American electric guitar with modern features",
    specifications: {
      "Thương hiệu": "Fender",
      "Dáng đàn": "Stratocaster",
      "Chất liệu phần thân": "Alder",
      "Finish": "3-Color Sunburst",
      "Cần đàn": "Maple",
      "Mặt phím": "Rosewood",
      "Khóa đàn": "Fender Deluxe",
      "Kiểu pickup": "Single Coil",
      "Pickups": "3x V-Mod II Single-Coil",
      "Màu sắc": "3-Color Sunburst"
    },
    features: [
      "American Professional II pickups",
      "Deep C neck profile",
      "2-point tremolo system",
      "Locking tuners",
      "Premium hardware"
    ],
    accessories: [
      { name: "Bao đàn", image: "/electric/acc/case.jpg" },
      { name: "Dây đàn", image: "/electric/acc/electric-string.jpg" },
      { name: "Pick", image: "/electric/acc/pick.jpg" },
      { name: "Cáp", image: "/electric/acc/cable.jpg" },
      { name: "Hướng dẫn sử dụng", image: "/electric/acc/document.jpg" }
    ]
  },
  // Add more products as needed...
];

async function migrateToMongoDB() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('phucnguyenguitar');
    const collection = db.collection('products');
    
    // Clear existing products
    await collection.deleteMany({});
    console.log('Cleared existing products');
    
    // Add timestamps to each product
    const productsWithTimestamps = products.map(product => ({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    // Insert products
    const result = await collection.insertMany(productsWithTimestamps);
    console.log(`Inserted ${result.insertedCount} products`);
    
    console.log('Migration completed successfully!');
    console.log('You can now access the admin panel at: http://localhost:3001/admin');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateToMongoDB();
