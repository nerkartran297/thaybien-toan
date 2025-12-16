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
  try {
    const db = await getDatabase();
    const products = await db.collection<Product>('products').find({}).toArray();
    
    
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
    const lastProduct = await db.collection<Product>('products')
      .findOne({}, { sort: { id: -1 } });
    
    const newId = lastProduct ? lastProduct.id + 1 : 1;
    
    const product: Product = {
      ...data,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection<Product>('products').insertOne(product);
    
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
