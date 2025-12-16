"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Navigation from "../../../components/Navigation";
import ProductImageGallery from "../../../components/ProductImageGallery";

interface Product {
  _id: string;
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAccessories, setShowAccessories] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productId = params.id as string;
        const response = await fetch(`/api/products/${productId}`);

        if (response.ok) {
          const productData = await response.json();
          setProduct(productData);
        } else {
          console.error("Failed to fetch product");
          // Fallback to static data if API fails
          const { products: staticProducts } = await import(
            "../../../data/products"
          );
          const foundProduct = staticProducts.find(
            (p) => p.id === parseInt(productId)
          );
          if (foundProduct) {
            setProduct({ ...foundProduct, _id: foundProduct.id.toString() });
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        // Fallback to static data if API fails
        try {
          const { products: staticProducts } = await import(
            "../../../data/products"
          );
          const foundProduct = staticProducts.find(
            (p) => p.id === parseInt(params.id as string)
          );
          if (foundProduct) {
            setProduct({ ...foundProduct, _id: foundProduct.id.toString() });
          }
        } catch (importError) {
          console.error("Failed to load static data:", importError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

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
          className="w-5 h-5 text-yellow-400"
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
          className="w-5 h-5 text-yellow-400"
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
          className="w-5 h-5 text-gray-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-[#654321]">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-[#654321] mb-2">
              Không tìm thấy sản phẩm
            </h2>
            <p className="text-[#8B4513] mb-4">
              Sản phẩm bạn tìm kiếm không tồn tại.
            </p>
            <button
              onClick={() => router.push("/products")}
              className="px-6 py-2 bg-[#D4A047] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-[#654321] mb-6">
          <button
            onClick={() => router.push("/")}
            className="hover:text-[#D4A047] transition-colors"
          >
            Trang chủ
          </button>
          <span>/</span>
          <button
            onClick={() => router.push("/products")}
            className="hover:text-[#D4A047] transition-colors"
          >
            Sản phẩm
          </button>
          <span>/</span>
          <button
            onClick={() =>
              router.push(`/products?category=${product.category}`)
            }
            className="hover:text-[#D4A047] transition-colors"
          >
            {product.category === "guitar"
              ? "Đàn guitar"
              : product.category === "amplifier"
              ? "Ampli"
              : product.category === "accessories"
              ? "Phụ kiện"
              : "Sản phẩm"}
          </button>
          <span>/</span>
          <span className="text-[#8B4513]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images & Accessories */}
          <div className="space-y-6">
            {/* Product Image Gallery */}
            <ProductImageGallery
              images={product.images}
              productName={product.name}
              category={product.category}
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand & Name */}
            <div>
              <p className="text-lg text-[#8B4513] font-medium mb-2">
                {product.brand}
              </p>
              <h1 className="text-3xl font-bold text-[#2c3e50] mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">{renderStars(product.rating)}</div>
                <span className="text-[#654321]">
                  {product.rating} ({product.reviews} đánh giá)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-[#2c3e50]">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded">
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
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-[#2c3e50] mb-2">
                Mô tả sản phẩm
              </h3>
              <p className="text-[#654321] leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
                  {product.category === "accessories"
                    ? "Đặc điểm nổi bật"
                    : "Tính năng nổi bật"}
                </h3>
                <ul className="space-y-2">
                  {product.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-[#D4A047] mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-[#654321]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications */}
            {product.specifications &&
              Object.keys(product.specifications).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
                    {product.category === "accessories"
                      ? "Thông số kỹ thuật"
                      : "Thông tin sản phẩm"}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="space-y-2">
                      {Object.entries(product.specifications).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <dt className="font-medium text-[#654321]">
                              {key}:
                            </dt>
                            <dd className="text-[#8B4513] text-right max-w-xs">
                              {value as string}
                            </dd>
                          </div>
                        )
                      )}
                    </dl>
                  </div>
                </div>
              )}

            {/* Accessories Dropdown - Only show for guitars and amplifiers */}
            {product.category !== "accessories" &&
              product.accessories &&
              product.accessories.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowAccessories(!showAccessories)}
                    className="w-full flex items-center justify-between cursor-pointer p-4 pl-0 text-left rounded-lg"
                  >
                    <h3 className="text-lg font-semibold text-[#2c3e50]">
                      Phụ kiện đi kèm
                    </h3>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">
                        {product.accessories.length} phụ kiện
                      </span>
                      <svg
                        className={`w-5 h-5 text-[#D4A047] transition-transform duration-200 ${
                          showAccessories ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      showAccessories
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {product.accessories.map((accessory, index) => (
                          <div
                            key={index}
                            className={`bg-gray-50 rounded-lg p-3 text-center transition-all duration-300 ease-in-out ${
                              showAccessories
                                ? "transform translate-y-0 opacity-100"
                                : "transform -translate-y-2 opacity-0"
                            }`}
                            style={{
                              transitionDelay: showAccessories
                                ? `${index * 50}ms`
                                : "0ms",
                            }}
                          >
                            <div className="aspect-square w-16 h-16 mx-auto mb-2 rounded-lg overflow-hidden">
                              <Image
                                src={accessory.image}
                                alt={accessory.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs font-medium text-[#2c3e50]">
                              {accessory.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button className="flex-1 bg-[#D4A047] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#B8860B] transition-colors text-lg">
                {product.category === "accessories"
                  ? "Thêm vào giỏ"
                  : "Thêm vào giỏ hàng"}
              </button>
              {product.category !== "accessories" && (
                <button className="bg-white border-2 border-[#D4A047] text-[#D4A047] py-3 px-6 rounded-lg font-medium hover:bg-[#D4A047] hover:text-white transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
