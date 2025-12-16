"use client";

interface Filters {
  category: string;
  subcategory: string;
  brand: string;
  priceRange: string;
  inStock: boolean;
  isNew: boolean;
  rating: number;
}

interface FilterSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: Filters;
  onFilterChange: (key: string, value: string | boolean | number) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export default function FilterSidebar({
  isOpen,
  onToggle,
  filters,
  onFilterChange,
  onClearFilters,
  activeFiltersCount,
}: FilterSidebarProps) {
  const categories = [
    { value: "guitar", label: "Đàn guitar" },
    { value: "amplifier", label: "Ampli" },
    { value: "accessories", label: "Phụ kiện" },
  ];

  const subcategories = {
    guitar: [
      { value: "all", label: "Tất cả loại guitar" },
      { value: "electric", label: "Guitar điện" },
      { value: "acoustic", label: "Guitar thùng" },
    ],
    amplifier: [
      { value: "all", label: "Tất cả loại ampli" },
      { value: "tube", label: "Ampli đèn" },
      { value: "solid-state", label: "Ampli bán dẫn" },
      { value: "modeling", label: "Ampli mô phỏng" },
    ],
    accessories: [
      { value: "all", label: "Tất cả phụ kiện" },
      { value: "strings", label: "Dây đàn" },
      { value: "picks", label: "Pick" },
      { value: "cases", label: "Bao đàn" },
      { value: "capos", label: "Capo" },
      { value: "straps", label: "Dây đeo" },
      { value: "lines", label: "Dây line" },
    ],
  };

  const brands = [
    { value: "all", label: "Tất cả thương hiệu" },
    { value: "Fender", label: "Fender" },
    { value: "Gibson", label: "Gibson" },
    { value: "Martin", label: "Martin" },
    { value: "Taylor", label: "Taylor" },
    { value: "Yamaha", label: "Yamaha" },
    { value: "Ibanez", label: "Ibanez" },
    { value: "Marshall", label: "Marshall" },
    { value: "Boss", label: "Boss" },
    { value: "Orange", label: "Orange" },
    { value: "Vox", label: "Vox" },
    { value: "Line 6", label: "Line 6" },
    { value: "D'Addario", label: "D'Addario" },
    { value: "Ernie Ball", label: "Ernie Ball" },
    { value: "Kyser", label: "Kyser" },
    { value: "Gator", label: "Gator" },
  ];

  const priceRanges = [
    { value: "all", label: "Tất cả mức giá" },
    { value: "under-5m", label: "Dưới 5 triệu" },
    { value: "5m-10m", label: "5 - 10 triệu" },
    { value: "10m-20m", label: "10 - 20 triệu" },
    { value: "over-20m", label: "Trên 20 triệu" },
  ];

  const ratings = [
    { value: 0, label: "Tất cả đánh giá" },
    { value: 4, label: "4 sao trở lên" },
    { value: 4.5, label: "4.5 sao trở lên" },
    { value: 4.8, label: "4.8 sao trở lên" },
  ];

  const currentSubcategories =
    subcategories[filters.category as keyof typeof subcategories] ||
    subcategories.guitar;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-auto
        w-80 h-full lg:h-auto
        bg-white border-r border-[#FACE84] shadow-lg lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        lg:block
      `}
      >
        <div className="p-6 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#2c3e50]">Bộ lọc</h2>
              {activeFiltersCount > 0 && (
                <span className="bg-[#D4A047] text-white rounded-full px-2 py-1 text-xs font-semibold">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={onClearFilters}
                  className="p-1 hover:bg-gray-100 rounded text-[#654321] hover:text-[#2c3e50] transition-colors"
                  title="Xóa tất cả bộ lọc"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={onToggle}
                className="lg:hidden p-1 hover:bg-gray-100 rounded"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Danh mục
            </h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <label key={category.value} className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value={category.value}
                    checked={filters.category === category.value}
                    onChange={(e) => onFilterChange("category", e.target.value)}
                    className="w-4 h-4 text-[#D4A047] border-gray-300 focus:ring-[#D4A047]"
                  />
                  <span className="ml-2 text-[#654321]">{category.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Subcategory Filter */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Loại sản phẩm
            </h3>
            <div className="space-y-2">
              {currentSubcategories.map((subcategory) => (
                <label key={subcategory.value} className="flex items-center">
                  <input
                    type="radio"
                    name="subcategory"
                    value={subcategory.value}
                    checked={filters.subcategory === subcategory.value}
                    onChange={(e) =>
                      onFilterChange("subcategory", e.target.value)
                    }
                    className="w-4 h-4 text-[#D4A047] border-gray-300 focus:ring-[#D4A047]"
                  />
                  <span className="ml-2 text-[#654321]">
                    {subcategory.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Thương hiệu
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brands.map((brand) => (
                <label key={brand.value} className="flex items-center">
                  <input
                    type="radio"
                    name="brand"
                    value={brand.value}
                    checked={filters.brand === brand.value}
                    onChange={(e) => onFilterChange("brand", e.target.value)}
                    className="w-4 h-4 text-[#D4A047] border-gray-300 focus:ring-[#D4A047]"
                  />
                  <span className="ml-2 text-[#654321]">{brand.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Mức giá
            </h3>
            <div className="space-y-2">
              {priceRanges.map((range) => (
                <label key={range.value} className="flex items-center">
                  <input
                    type="radio"
                    name="priceRange"
                    value={range.value}
                    checked={filters.priceRange === range.value}
                    onChange={(e) =>
                      onFilterChange("priceRange", e.target.value)
                    }
                    className="w-4 h-4 text-[#D4A047] border-gray-300 focus:ring-[#D4A047]"
                  />
                  <span className="ml-2 text-[#654321]">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">
              Đánh giá
            </h3>
            <div className="space-y-2">
              {ratings.map((rating) => (
                <label key={rating.value} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    value={rating.value}
                    checked={filters.rating === rating.value}
                    onChange={(e) =>
                      onFilterChange("rating", parseFloat(e.target.value))
                    }
                    className="w-4 h-4 text-[#D4A047] border-gray-300 focus:ring-[#D4A047]"
                  />
                  <span className="ml-2 text-[#654321]">{rating.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">Khác</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => onFilterChange("inStock", e.target.checked)}
                  className="w-4 h-4 text-[#D4A047] border-gray-300 rounded focus:ring-[#D4A047]"
                />
                <span className="ml-2 text-[#654321]">
                  Chỉ sản phẩm còn hàng
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isNew}
                  onChange={(e) => onFilterChange("isNew", e.target.checked)}
                  className="w-4 h-4 text-[#D4A047] border-gray-300 rounded focus:ring-[#D4A047]"
                />
                <span className="ml-2 text-[#654321]">Chỉ sản phẩm mới</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
