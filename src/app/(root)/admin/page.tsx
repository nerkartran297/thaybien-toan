"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Product, CreateProductData } from "@/models/Product";

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchProducts();
        }
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const productData: CreateProductData = {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      subcategory: formData.get("subcategory") as string,
      brand: formData.get("brand") as string,
      price: parseInt(formData.get("price") as string),
      originalPrice: formData.get("originalPrice")
        ? parseInt(formData.get("originalPrice") as string)
        : null,
      image: formData.get("image") as string,
      images: (formData.get("images") as string)
        .split(",")
        .map((img) => img.trim()),
      rating: parseFloat(formData.get("rating") as string),
      reviews: parseInt(formData.get("reviews") as string),
      inStock: formData.get("inStock") === "on",
      isNew: formData.get("isNew") === "on",
      description: formData.get("description") as string,
    };

    try {
      if (editingProduct) {
        // Update existing product
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        if (response.ok) {
          fetchProducts();
          setShowForm(false);
          setEditingProduct(null);
        }
      } else {
        // Create new product
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        if (response.ok) {
          fetchProducts();
          setShowForm(false);
        }
      }
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4A047] mx-auto mb-4"></div>
          <p className="text-[#654321]">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#2c3e50]">
            Quản lý sản phẩm
          </h1>
          <a
            href="/admin/new"
            className="px-6 py-2 bg-[#D4A047] text-white rounded-lg hover:bg-[#B8860B] transition-colors inline-block"
          >
            Thêm sản phẩm mới
          </a>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <Image
                          className="h-10 w-10 rounded-full object-cover"
                          src={product.image}
                          alt={product.name}
                          width={40}
                          height={40}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.brand}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category} - {product.subcategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      minimumFractionDigits: 0,
                    }).format(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {product.inStock && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Còn hàng
                        </span>
                      )}
                      {product.isNew && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Mới
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a
                      href={`/admin/edit/${product.id}`}
                      className="text-[#D4A047] hover:text-[#B8860B] mr-4 transition-colors"
                    >
                      Sửa
                    </a>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit/Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-white/95 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-[#2c3e50] mb-6">
                {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên sản phẩm
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingProduct?.name || ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A047]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thương hiệu
                    </label>
                    <input
                      type="text"
                      name="brand"
                      defaultValue={editingProduct?.brand || ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A047]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Danh mục
                    </label>
                    <select
                      name="category"
                      defaultValue={editingProduct?.category || "guitar"}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A047]"
                    >
                      <option value="guitar">Đàn guitar</option>
                      <option value="amplifier">Ampli</option>
                      <option value="accessories">Phụ kiện</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại sản phẩm
                    </label>
                    <input
                      type="text"
                      name="subcategory"
                      defaultValue={editingProduct?.subcategory || ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A047]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá (VND)
                    </label>
                    <input
                      type="number"
                      name="price"
                      defaultValue={editingProduct?.price || ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A047]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá gốc (VND)
                    </label>
                    <input
                      type="number"
                      name="originalPrice"
                      defaultValue={editingProduct?.originalPrice || ""}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A047]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hình ảnh chính
                  </label>
                  <input
                    type="url"
                    name="image"
                    defaultValue={editingProduct?.image || ""}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A047]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingProduct?.description || ""}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A047]"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="inStock"
                      defaultChecked={editingProduct?.inStock || false}
                      className="w-4 h-4 text-[#D4A047] border-gray-300 rounded focus:ring-[#D4A047]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Còn hàng</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isNew"
                      defaultChecked={editingProduct?.isNew || false}
                      className="w-4 h-4 text-[#D4A047] border-gray-300 rounded focus:ring-[#D4A047]"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Sản phẩm mới
                    </span>
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingProduct(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#D4A047] text-white rounded-md hover:bg-[#B8860B] transition-colors"
                  >
                    {editingProduct ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
