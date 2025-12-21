import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface Product {
  _id?: ObjectId;
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
}

interface UpdateProductData {
  name?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  price?: number;
  originalPrice?: number | null;
  image?: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  isNew?: boolean;
  description?: string;
  specifications?: {
    [key: string]: string;
  };
  features?: string[];
  accessories?: {
    name: string;
    image: string;
  }[];
}

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    
    // Try to find by numeric ID first (since our products use numeric IDs)
    let product = await db.collection('products').findOne({
      id: parseInt(id)
    }) as Product | null;
    
    // If not found by numeric ID, try by MongoDB _id
    if (!product) {
      try {
        product = await db.collection('products').findOne({
          _id: new ObjectId(id)
        }) as Product | null;
      } catch {
        // Invalid ObjectId, skip
      }
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data: UpdateProductData = await request.json();
    
    const db = await getDatabase();
    
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    
    // Try to update by numeric ID first
    let result = await db.collection('products').updateOne(
      { id: parseInt(id) },
      { $set: updateData }
    );
    
    // If not found by numeric ID, try by MongoDB _id
    if (result.matchedCount === 0 && true) {
      result = await db.collection('products').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
    }
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Find and return updated product
    let updatedProduct = await db.collection('products').findOne({
      id: parseInt(id)
    }) as Product | null;
    
    if (!updatedProduct && true) {
      updatedProduct = await db.collection('products').findOne({
        _id: new ObjectId(id)
      }) as Product | null;
    }
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    
    // Try to delete by numeric ID first
    let result = await db.collection('products').deleteOne({
      id: parseInt(id)
    });
    
    // If not found by numeric ID, try by MongoDB _id
    if (result.deletedCount === 0 && true) {
      result = await db.collection('products').deleteOne({
        _id: new ObjectId(id)
      });
    }
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
