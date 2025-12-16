# Hướng Dẫn Authentication

## Account Admin/Teacher Mặc Định

Sau khi setup database, chạy script để tạo account teacher mặc định:

```bash
npm run seed:teacher
```

### Thông tin đăng nhập mặc định:

- **Email**: `teacher@phucnguyenguitar.com`
- **Password**: `teacher123`
- **Role**: `teacher`

⚠️ **QUAN TRỌNG**: Đổi mật khẩu ngay sau lần đăng nhập đầu tiên!

## Seed Data

### Tạo Teacher Account

```bash
npm run seed:teacher
```

### Tạo Courses (6 loại khóa học)

```bash
npm run seed:courses
```

### Tạo tất cả (Teacher + Courses)

```bash
npm run seed:all
```

## Tạo Student Account

Có 2 cách:

### 1. Qua API (từ trang admin)

- Đăng nhập với tài khoản teacher
- Vào trang quản lý học sinh
- Tạo học sinh mới

### 2. Qua Script (development)

Tạo file `scripts/create-student.js`:

```javascript
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function createStudent() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("phucnguyenguitar");

  const hashedPassword = await bcrypt.hash("student123", 10);

  await db.collection("users").insertOne({
    email: "student@example.com",
    password: hashedPassword,
    role: "student",
    fullName: "Học Sinh Test",
    phone: "0123456789",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("Student created!");
  await client.close();
}

createStudent();
```

## Environment Variables

Thêm vào `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/phucnguyenguitar
JWT_SECRET=your-super-secret-key-change-in-production
```

## Phân Quyền

### Teacher (Giáo viên)

- Tạo, sửa, xóa lớp học
- Hủy lớp học (cộng buổi học bù)
- Điểm danh học sinh
- Xem tất cả lớp học
- Quản lý học sinh

### Student (Học sinh)

- Xem lịch học của mình
- Xin vắng (trước 6 tiếng)
- Xin học bù (trước 1 ngày)
- Chỉ thấy các lớp cùng khóa học

## Routes

- `/login` - Trang đăng nhập
- `/teacher/calendar` - Lịch học (giáo viên)
- `/student/calendar` - Lịch học (học sinh)

## API Endpoints

- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại
