"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import ProductCard, { Product as ProductCardProduct } from "../../components/ProductCard";
import FilterSidebar from "../../components/FilterSidebar";
import Navigation from "../../components/Navigation";
// import { products } from "../data/products"; // Will be replaced with API calls

type Product = {
  id: number;
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
  [key: string]: unknown;
};

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "guitar",
    subcategory: "all",
    brand: "all",
    priceRange: "all",
    inStock: false,
    isNew: false,
    rating: 0,
  });
  const [sortBy, setSortBy] = useState("name");

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched products from API:", data.length, "products");
          setProducts(data);
        } else {
          console.error("Failed to fetch products");
          // Fallback to static data if API fails
          const { products: staticProducts } = await import("../../data/products");
          setProducts(staticProducts as Product[]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        // Fallback to static data if API fails
        const { products: staticProducts } = await import("../../data/products");
        setProducts(staticProducts as unknown as Array<{ id: number; [key: string]: unknown }>);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Initialize filters from URL parameters
  useEffect(() => {
    const category = (searchParams.get("category") || "guitar").replace(
      /\?$/,
      ""
    ); // Remove trailing ?
    const subcategory = (searchParams.get("subcategory") || "all").replace(
      /\?$/,
      ""
    );
    const brand = (searchParams.get("brand") || "all").replace(/\?$/, "");
    const priceRange = (searchParams.get("priceRange") || "all").replace(
      /\?$/,
      ""
    );
    const inStock = searchParams.get("inStock") === "true";
    const isNew = searchParams.get("isNew") === "true";
    const rating = parseFloat(searchParams.get("rating") || "0");

    console.log("URL parameters:", {
      category,
      subcategory,
      brand,
      priceRange,
      inStock,
      isNew,
      rating,
    });

    setFilters({
      category,
      subcategory,
      brand,
      priceRange,
      inStock,
      isNew,
      rating,
    });

    // If no URL params, update URL to show guitar as default
    if (!searchParams.get("category")) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("category", "guitar");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    console.log("Filtering products:", products.length, "products");
    console.log("Current filters:", filters);
    console.log("Search term:", searchTerm);

    // If no products loaded yet, return empty array
    if (products.length === 0) {
      console.log("No products loaded yet");
      return [];
    }

    const filtered = products.filter((product) => {
      // Search filter
      const matchesSearch =
        (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = (product.category || '') === filters.category;
      console.log(
        `Product ${product.name || ''}: category=${product.category || ''}, filter=${filters.category}, matches=${matchesCategory}`
      );

      // Subcategory filter
      const matchesSubcategory =
        filters.subcategory === "all" ||
        product.subcategory === filters.subcategory ||
        (filters.subcategory === "acoustic" &&
          (product.subcategory === "acoustic" ||
            product.subcategory === "classic"));
      console.log(
        `Product ${product.name || ''}: subcategory=${product.subcategory || ''}, filter=${filters.subcategory}, matches=${matchesSubcategory}`
      );

      // Brand filter
      const matchesBrand =
        filters.brand === "all" || (product.brand || '') === filters.brand;

      // Price range filter
      const productPrice = product.price || 0;
      const matchesPrice =
        filters.priceRange === "all" ||
        (filters.priceRange === "under-5m" && productPrice < 5000000) ||
        (filters.priceRange === "5m-10m" &&
          productPrice >= 5000000 &&
          productPrice < 10000000) ||
        (filters.priceRange === "10m-20m" &&
          productPrice >= 10000000 &&
          productPrice < 20000000) ||
        (filters.priceRange === "over-20m" && productPrice >= 20000000);

      // Stock filter
      const matchesStock = !filters.inStock || (product.inStock ?? false);

      // New filter
      const matchesNew = !filters.isNew || (product.isNew ?? false);

      // Rating filter
      const matchesRating = (product.rating || 0) >= filters.rating;

      const finalMatch =
        matchesSearch &&
        matchesCategory &&
        matchesSubcategory &&
        matchesBrand &&
        matchesPrice &&
        matchesStock &&
        matchesNew &&
        matchesRating;
      console.log(`Product ${product.name || ''}: final match=${finalMatch}`);
      return finalMatch;
    });

    console.log("Filtered products count:", filtered.length);
    console.log(
      "Filtered products:",
      filtered.map((p) => ({ id: p.id, name: p.name, category: p.category }))
    );

    // Sort products
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || '').localeCompare(b.name || '');
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "newest":
          return b.id - a.id;
        default:
          return 0;
      }
    });
  }, [products, searchTerm, filters, sortBy]);

  const handleFilterChange = (
    key: string,
    value: string | boolean | number
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    // Update URL to reflect filter changes
    const newUrl = new URL(window.location.href);
    if (value === "all" || value === false || value === 0) {
      newUrl.searchParams.delete(key);
    } else {
      newUrl.searchParams.set(key, value.toString());
    }
    window.history.replaceState({}, "", newUrl.toString());
  };

  const clearFilters = () => {
    setFilters({
      category: "guitar",
      subcategory: "all",
      brand: "all",
      priceRange: "all",
      inStock: false,
      isNew: false,
      rating: 0,
    });
    setSearchTerm("");

    // Update URL to reflect guitar as default
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("category", "guitar");
    newUrl.searchParams.delete("subcategory");
    newUrl.searchParams.delete("brand");
    newUrl.searchParams.delete("priceRange");
    newUrl.searchParams.delete("inStock");
    newUrl.searchParams.delete("isNew");
    newUrl.searchParams.delete("rating");
    window.history.replaceState({}, "", newUrl.toString());
  };

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) =>
      key !== "category" && value !== "all" && value !== false && value !== 0
  ).length;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section with Wallpaper */}
      <div className="relative h-96 overflow-hidden">
        {/* Wallpaper Background */}
        <div className="absolute inset-0">
          <Image
            src="/wallpaper-1.jpg"
            alt="Guitar Wallpaper"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        {/* Centered Content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Sản phẩm
            </h1>
            <p className="text-xl text-white/90 drop-shadow-md">
              Khám phá bộ sưu tập đàn guitar và ampli chất lượng cao
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-[#EFEBDF] border-b border-[#FACE84] px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-[#D4A047]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[#D4A047] rounded-lg focus:ring-2 focus:ring-[#D4A047] focus:border-transparent bg-white text-[#2c3e50] placeholder-[#8B4513]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <FilterSidebar
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#D4A047] text-white rounded-lg hover:bg-[#B8860B] transition-colors lg:hidden"
                >
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
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                    />
                  </svg>
                  Bộ lọc
                  {activeFiltersCount > 0 && (
                    <span className="bg-white text-[#D4A047] rounded-full px-2 py-1 text-xs font-semibold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <p className="text-[#654321]">
                  Hiển thị {filteredProducts.length} sản phẩm
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[#654321] font-medium">Sắp xếp:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-[#D4A047] rounded-lg bg-white text-[#2c3e50] focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                >
                  <option value="name">Tên A-Z</option>
                  <option value="price-low">Giá thấp đến cao</option>
                  <option value="price-high">Giá cao đến thấp</option>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="newest">Mới nhất</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4A047] mx-auto mb-4"></div>
                <p className="text-[#654321]">Đang tải sản phẩm...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                   <ProductCard key={product.id} product={product as unknown as ProductCardProduct} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-[#654321] mb-2">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-[#8B4513] mb-4">
                  Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-[#D4A047] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang tải...</p>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
