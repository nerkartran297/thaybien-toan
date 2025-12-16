import Image from "next/image";
import Link from "next/link";

export interface Product {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  image: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  isNew: boolean;
  description: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={i}
          className="w-4 h-4 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg
          key="half"
          className="w-4 h-4 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            fill="url(#half)"
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg
          key={`empty-${i}`}
          className="w-4 h-4 text-gray-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
  };

  return (
    <div
      className="bg-white rounded-lg transition-shadow duration-300 overflow-hidden group h-full flex flex-col border border-gray-100"
      style={{
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 8px 12px -4px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow =
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
      }}
    >
      {/* Image Container */}
      <div
        className={`relative overflow-hidden ${
          product.category === "amplifier"
            ? "w-full h-48"
            : product.category === "accessories"
            ? "w-full h-32"
            : "aspect-[2/3]"
        }`}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className={`group-hover:scale-105 transition-transform duration-300 ${
            product.category === "amplifier"
              ? "object-contain"
              : product.category === "accessories"
              ? "object-contain"
              : "object-cover"
          }`}
        />

        {/* Sale Badge */}
        {product.originalPrice && (
          <div className="absolute top-2 left-2">
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              -
              {Math.round(
                ((product.originalPrice - product.price) /
                  product.originalPrice) *
                  100
              )}
              %
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute inset-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
            <button className="bg-white text-[#2c3e50] p-2 rounded-full hover:bg-[#D4A047] hover:text-white transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col h-[300px]">
        {/* Brand */}
        <p className="text-sm text-[#8B4513] font-medium mb-1">
          {product.brand}
        </p>

        {/* Name */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-[#2c3e50] mb-2 line-clamp-2 group-hover:text-[#D4A047] transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">{renderStars(product.rating)}</div>
          <span className="text-sm text-[#654321] ml-1">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-[#2c3e50]">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-[#654321] mb-4 line-clamp-2 flex-grow">
          {product.description}
        </p>

        {/* Action Button - Aligned to bottom */}
        <div className="mt-auto">
          <button
            disabled={!product.inStock}
            className="w-full bg-[#D4A047] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#B8860B] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {product.inStock ? "Thêm vào giỏ" : "Hết hàng"}
          </button>
        </div>
      </div>
    </div>
  );
}
