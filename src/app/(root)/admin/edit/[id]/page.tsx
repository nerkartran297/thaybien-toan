"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Navigation from "@/app/components/Navigation";

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

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "guitar",
    subcategory: "electric",
    brand: "",
    price: 0,
    originalPrice: 0,
    image: "",
    images: [] as string[],
    rating: 0,
    reviews: 0,
    inStock: true,
    isNew: false,
    description: "",
    specifications: {} as { [key: string]: string },
    features: [] as string[],
    accessories: [] as { name: string; image: string }[],
  });

  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newAccessoryName, setNewAccessoryName] = useState("");
  const [newAccessoryImage, setNewAccessoryImage] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productId = params.id as string;
        const response = await fetch(`/api/products/${productId}`);

        if (response.ok) {
          const productData = await response.json();
          setProduct(productData);
          setFormData({
            name: productData.name || "",
            category: productData.category || "guitar",
            subcategory: productData.subcategory || "electric",
            brand: productData.brand || "",
            price: productData.price || 0,
            originalPrice: productData.originalPrice || 0,
            image: productData.image || "",
            images: productData.images || [],
            rating: productData.rating || 0,
            reviews: productData.reviews || 0,
            inStock: productData.inStock ?? true,
            isNew: productData.isNew ?? false,
            description: productData.description || "",
            specifications: productData.specifications || {},
            features: productData.features || [],
            accessories: productData.accessories || [],
          });
        } else {
          console.error("Failed to fetch product");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? Number(value)
          : value,
    }));
  };

  const handleArrayChange = (field: string, value: string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSpecification = () => {
    if (newSpecKey && newSpecValue) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpecKey]: newSpecValue,
        },
      }));
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData((prev) => ({ ...prev, specifications: newSpecs }));
  };

  const addFeature = () => {
    if (newFeature) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addAccessory = () => {
    if (newAccessoryName && newAccessoryImage) {
      setFormData((prev) => ({
        ...prev,
        accessories: [
          ...prev.accessories,
          {
            name: newAccessoryName,
            image: newAccessoryImage,
          },
        ],
      }));
      setNewAccessoryName("");
      setNewAccessoryImage("");
    }
  };

  const removeAccessory = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      accessories: prev.accessories.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Sản phẩm đã được cập nhật thành công!");
        router.push("/admin");
      } else {
        alert("Có lỗi xảy ra khi cập nhật sản phẩm");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Có lỗi xảy ra khi cập nhật sản phẩm");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">Loadingggggg</div>
            <h2 className="text-2xl font-bold text-[#654321] mb-2">
              Đang tải...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-[#654321] mb-2">
              Không tìm thấy sản phẩm
            </h2>
            <button
              onClick={() => router.push("/admin")}
              className="px-6 py-2 bg-[#D4A047] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
            >
              Quay lại admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/wallpaper-1.jpg"
            alt="Edit Product Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-white/95 bg-opacity-50"></div>
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Chỉnh Sửa Sản Phẩm
            </h1>
            <p className="text-xl text-white/90 drop-shadow-md">
              Cập nhật thông tin sản phẩm
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-6">
              Thông Tin Cơ Bản
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                  Thương hiệu *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                  Danh mục *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                >
                  <option value="guitar">Đàn guitar</option>
                  <option value="amplifier">Ampli</option>
                  <option value="accessories">Phụ kiện</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                  Loại sản phẩm *
                </label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                >
                  {formData.category === "guitar" && (
                    <>
                      <option value="electric">Guitar điện</option>
                      <option value="acoustic">Guitar thùng</option>
                      <option value="classic">Guitar cổ điển</option>
                    </>
                  )}
                  {formData.category === "amplifier" && (
                    <>
                      <option value="tube">Ampli đèn</option>
                      <option value="solid-state">Ampli bán dẫn</option>
                      <option value="modeling">Ampli mô phỏng</option>
                    </>
                  )}
                  {formData.category === "accessories" && (
                    <>
                      <option value="strings">Dây đàn</option>
                      <option value="picks">Pick</option>
                      <option value="cases">Bao đàn</option>
                      <option value="capos">Capo</option>
                      <option value="straps">Dây đeo</option>
                      <option value="lines">Dây line</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                  Giá bán (VND) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                  Giá gốc (VND)
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                  Đánh giá (0-5)
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                  Số đánh giá
                </label>
                <input
                  type="number"
                  name="reviews"
                  value={formData.reviews}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                Mô tả sản phẩm *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
              />
            </div>

            <div className="mt-6 flex gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={formData.inStock}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#D4A047] border-gray-300 rounded focus:ring-[#D4A047]"
                />
                <span className="ml-2 text-[#654321]">Còn hàng</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isNew"
                  checked={formData.isNew}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#D4A047] border-gray-300 rounded focus:ring-[#D4A047]"
                />
                <span className="ml-2 text-[#654321]">Sản phẩm mới</span>
              </label>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-6">Hình Ảnh</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                  Hình ảnh chính *
                </label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  required
                  placeholder="/path/to/image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c3e50] mb-2">
                  Thư viện hình ảnh (mỗi dòng một URL)
                </label>
                <textarea
                  value={formData.images.join("\n")}
                  onChange={(e) =>
                    handleArrayChange(
                      "images",
                      e.target.value.split("\n").filter((url) => url.trim())
                    )
                  }
                  rows={4}
                  placeholder="/path/to/image1.jpg
/path/to/image2.jpg
/path/to/image3.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-6">
              Thông Số Kỹ Thuật
            </h2>

            <div className="space-y-4">
              {Object.entries(formData.specifications).map(([key, value]) => (
                <div key={key} className="flex gap-4 items-center">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const newSpecs = { ...formData.specifications };
                      delete newSpecs[key];
                      newSpecs[e.target.value] = value;
                      setFormData((prev) => ({
                        ...prev,
                        specifications: newSpecs,
                      }));
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                  />
                  <span className="text-[#654321]">:</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        specifications: {
                          ...prev.specifications,
                          [key]: e.target.value,
                        },
                      }));
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecification(key)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              ))}

              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                  placeholder="Tên thông số"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
                <span className="text-[#654321]">:</span>
                <input
                  type="text"
                  value={newSpecValue}
                  onChange={(e) => setNewSpecValue(e.target.value)}
                  placeholder="Giá trị"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addSpecification}
                  className="px-4 py-2 bg-[#D4A047] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-6">
              Tính Năng Nổi Bật
            </h2>

            <div className="space-y-4">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...formData.features];
                      newFeatures[index] = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        features: newFeatures,
                      }));
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              ))}

              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Tính năng mới"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-[#D4A047] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>

          {/* Accessories */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-6">
              Phụ Kiện Đi Kèm
            </h2>

            <div className="space-y-4">
              {formData.accessories.map((accessory, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <input
                    type="text"
                    value={accessory.name}
                    onChange={(e) => {
                      const newAccessories = [...formData.accessories];
                      newAccessories[index].name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        accessories: newAccessories,
                      }));
                    }}
                    placeholder="Tên phụ kiện"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={accessory.image}
                    onChange={(e) => {
                      const newAccessories = [...formData.accessories];
                      newAccessories[index].image = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        accessories: newAccessories,
                      }));
                    }}
                    placeholder="/path/to/accessory.jpg"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeAccessory(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              ))}

              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  value={newAccessoryName}
                  onChange={(e) => setNewAccessoryName(e.target.value)}
                  placeholder="Tên phụ kiện"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
                <input
                  type="text"
                  value={newAccessoryImage}
                  onChange={(e) => setNewAccessoryImage(e.target.value)}
                  placeholder="/path/to/accessory.jpg"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A047] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addAccessory}
                  className="px-4 py-2 bg-[#D4A047] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="px-6 py-3 border border-gray-300 text-[#654321] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#D4A047] text-white rounded-lg hover:bg-[#B8860B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
