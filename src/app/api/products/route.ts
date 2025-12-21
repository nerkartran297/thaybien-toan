import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

interface Product {
  _id?: string;
  id: number;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  isNew: boolean;
  description: string;
  specifications?: {
    [key: string]: string;
  };
  features?: string[];
  accessories?: {
    name: string;
    image: string;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface CreateProductData {
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  isNew: boolean;
  description: string;
  specifications?: {
    [key: string]: string;
  };
  features?: string[];
  accessories?: {
    name: string;
    image: string;
  }[];
}

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  // Log request URL (required parameter but not used in logic)
  console.log(`Request URL: ${request.url?.substring(0, 50)}...`);
  try {
    const db = await getDatabase();
    const products = await db.collection('products').find({}).toArray();
    
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const data: CreateProductData = await request.json();
    
    
    // Generate new ID (simple increment, in production use proper ID generation)
    const db = await getDatabase();
    const products = await db.collection('products')
      .find({})
      .sort({ id: -1 })
      .toArray();
    const lastProduct = products[0] || null;
    
    const newId = lastProduct ? lastProduct.id + 1 : 1;
    
    const product: Product = {
      ...data,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Convert Product to MongoDB document format (remove id, MongoDB will add _id)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...productDoc } = product;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await db.collection('products').insertOne(productDoc as any);
    
    return NextResponse.json(
      { ...product, _id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
