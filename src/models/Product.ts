import { ObjectId } from 'mongodb';

export interface Product {
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateProductData {
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  originalPrice?: number | null;
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

export interface UpdateProductData extends Partial<CreateProductData> {
  updatedAt?: Date;
}
