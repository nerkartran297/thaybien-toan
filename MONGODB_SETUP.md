# MongoDB Setup Guide

## 🍃 **MongoDB Integration Complete!**

### **1. Environment Setup**

Tạo file `.env.local` trong root directory:

```bash
MONGODB_URI=mongodb://localhost:27017/phucnguyenguitar
```

Hoặc sử dụng MongoDB Atlas (cloud):

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/phucnguyenguitar?retryWrites=true&w=majority
```

### **2. Install MongoDB (Local)**

**Windows:**

```bash
# Download từ https://www.mongodb.com/try/download/community
# Hoặc sử dụng Chocolatey:
choco install mongodb
```

**macOS:**

```bash
brew install mongodb-community
```

**Linux (Ubuntu):**

```bash
sudo apt-get install mongodb
```

### **3. Start MongoDB**

**Windows:**

```bash
net start MongoDB
```

**macOS/Linux:**

```bash
mongod
```

### **4. Migrate Data**

Chạy script migration:

```bash
node scripts/migrate-to-mongodb.js
```

### **5. Access Admin Panel**

Truy cập: `http://localhost:3001/admin`

## 🎯 **Features Available:**

### **API Endpoints:**

- `GET /api/products` - Lấy tất cả sản phẩm
- `GET /api/products/[id]` - Lấy sản phẩm theo ID
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/[id]` - Cập nhật sản phẩm
- `DELETE /api/products/[id]` - Xóa sản phẩm

### **Admin Panel Features:**

- ✅ Xem danh sách sản phẩm
- ✅ Thêm sản phẩm mới
- ✅ Sửa sản phẩm hiện có
- ✅ Xóa sản phẩm
- ✅ Upload hình ảnh
- ✅ Quản lý specifications
- ✅ Quản lý accessories

### **Database Schema:**

```typescript
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
  specifications?: { [key: string]: string };
  features?: string[];
  accessories?: { name: string; image: string }[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 🚀 **Next Steps:**

1. **Setup MongoDB** (local hoặc Atlas)
2. **Create .env.local** với MONGODB_URI
3. **Run migration script**
4. **Access admin panel** để quản lý sản phẩm
5. **Test API endpoints**

## 🔧 **Troubleshooting:**

**MongoDB connection error:**

- Kiểm tra MongoDB đang chạy
- Kiểm tra MONGODB_URI trong .env.local
- Kiểm tra firewall/network settings

**API errors:**

- Kiểm tra console logs
- Kiểm tra MongoDB connection
- Kiểm tra data format

**Admin panel không load:**

- Kiểm tra API endpoints
- Kiểm tra browser console
- Kiểm tra network requests

## 📝 **Notes:**

- Data sẽ được lưu trong MongoDB collection `products`
- Fallback về static data nếu API fails
- Admin panel có thể được bảo mật thêm (authentication)
- Có thể thêm image upload functionality
- Có thể thêm bulk operations (import/export)
