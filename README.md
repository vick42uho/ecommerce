# 🛒 E-Commerce Platform

ระบบ E-Commerce แบบครบวงจร พัฒนาด้วย **Next.js 15** สำหรับ Frontend และ **Elysia (Bun)** สำหรับ Backend พร้อม MongoDB เป็นฐานข้อมูล

![Version](https://img.shields.io/badge/version-1.0.50-blue)
![Node](https://img.shields.io/badge/Node-20+-green)
![Bun](https://img.shields.io/badge/Bun-latest-orange)

---

## 📁 โครงสร้างโปรเจค

```
ecommerce/
├── app.backend/          # Backend API Server
│   ├── prisma/           # Prisma Schema (MongoDB)
│   ├── src/
│   │   ├── controllers/  # API Controllers
│   │   └── index.ts      # Main Application Entry
│   ├── uploads/          # Uploaded Files Storage
│   └── generated/        # Prisma Generated Client
│
└── app.frontend/         # Frontend Web Application
    ├── app/
    │   ├── backoffice/   # Admin Dashboard
    │   ├── web/          # Customer Storefront
    │   └── interface/    # TypeScript Interfaces
    ├── components/       # Reusable UI Components
    └── public/           # Static Assets
```

---

## 🔧 Tech Stack

### Backend (`app.backend`)
| Technology | Description |
|------------|-------------|
| **Bun** | JavaScript Runtime (faster than Node.js) |
| **Elysia** | Fast & type-safe web framework |
| **Prisma** | Next-generation ORM |
| **MongoDB** | NoSQL Database |
| **JWT** | Authentication |
| **Swagger** | API Documentation |

### Frontend (`app.frontend`)
| Technology | Description |
|------------|-------------|
| **Next.js 15** | React Framework with Turbopack |
| **React 19** | UI Library |
| **TailwindCSS 4** | Utility-first CSS |
| **Radix UI** | Accessible UI Components |
| **Axios** | HTTP Client |
| **React Hook Form + Zod** | Form Validation |
| **Recharts** | Charts & Data Visualization |
| **SweetAlert2 & Sonner** | Notifications |

---

## 📦 Data Models (MongoDB)

```mermaid
erDiagram
    Product ||--o{ Cart : "has many"
    Product ||--o{ OrderDetail : "has many"
    Member ||--o{ Order : "has many"
    Order ||--o{ OrderDetail : "has many"
    
    Product {
        ObjectId id
        String name
        Int price
        String description
        String[] images
        String category
        Int stock
        Int viewCount
        Int salesCount
        Float rating
    }
    
    Member {
        ObjectId id
        String name
        String phone
        String email
        String username
        String password
        String address
        String status
    }
    
    Order {
        ObjectId id
        String orderNo
        String slipImage
        String status
        String trackCode
        String express
    }
    
    Category {
        ObjectId id
        String name
    }
    
    Admin {
        ObjectId id
        String name
        String username
        String password
        String role
        String status
    }
```

---

## 🚀 API Endpoints

### 👤 Admin Management (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | สร้าง Admin ใหม่ |
| POST | `/signin` | เข้าสู่ระบบ Admin |
| GET | `/info` | ดึงข้อมูล Admin |
| PUT | `/update` | อัพเดทข้อมูลตนเอง |
| GET | `/list` | รายการ Admin ทั้งหมด |
| PUT | `/update-data/:id` | อัพเดทข้อมูล Admin |
| DELETE | `/remove/:id` | ลบ Admin |

### 👥 Member Management (`/api/member`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sign-up` | สมัครสมาชิก |
| POST | `/sign-in` | เข้าสู่ระบบ |
| GET | `/info` | ดึงข้อมูลสมาชิก |
| GET | `/history` | ประวัติการสั่งซื้อ |

### 📦 Product Management (`/api/product`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | รายการสินค้า |
| POST | `/create` | เพิ่มสินค้าใหม่ |
| PUT | `/update/:id` | แก้ไขสินค้า |
| DELETE | `/remove/:id` | ลบสินค้า |
| GET | `/search` | ค้นหาสินค้า |
| GET | `/categories` | รายการหมวดหมู่ |
| GET | `/popular` | สินค้ายอดนิยม |
| PUT | `/view/:id` | เพิ่มจำนวนการเข้าชม |
| DELETE | `/remove-image/:id/:imageName` | ลบรูปภาพสินค้า |

### 🛒 Cart Management (`/api/cart`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/add` | เพิ่มสินค้าลงตะกร้า |
| PUT | `/update` | อัพเดทจำนวน |
| GET | `/list/:memberId` | ดูตะกร้า |
| DELETE | `/remove/:id` | ลบสินค้าจากตะกร้า |
| POST | `/confirm` | ยืนยันคำสั่งซื้อ |
| POST | `/uploadSlip` | อัพโหลดสลิป |
| POST | `/confirmOrder` | ยืนยันการสั่งซื้อ |
| PUT | `/confirm-received/:orderId` | ยืนยันรับสินค้า |

### 📋 Order Management (`/api/order`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | รายการคำสั่งซื้อ |
| PUT | `/send` | ส่งสินค้า (อัพเดท tracking) |
| PUT | `/paid/:id` | ยืนยันการชำระเงิน |
| PUT | `/cancel/:id` | ยกเลิกคำสั่งซื้อ |

### 📊 Dashboard (`/api/dashboard`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | สรุปข้อมูล Dashboard |
| GET | `/monthly-sales/:year` | ยอดขายรายเดือน |

---

## 🎨 Frontend Pages

### 🌐 Web Storefront (`/web`)
- **หน้าแรก** - แสดงสินค้าแนะนำ, สินค้ายอดนิยม
- **หมวดหมู่** (`/category`) - เรียกดูสินค้าตามหมวดหมู่
- **สินค้า** (`/product`, `/products`) - รายละเอียดสินค้า
- **ค้นหา** (`/search`) - ค้นหาสินค้า
- **สมาชิก** (`/member`) - ข้อมูลสมาชิก, ตะกร้า, ประวัติ

### 🔐 Backoffice Admin (`/backoffice`)
- **เข้าสู่ระบบ** (`/signin`) - หน้า Login Admin
- **Dashboard** (`/home/dashboard`) - สรุปยอดขาย, กราฟ
- **จัดการสินค้า** (`/home/product`) - CRUD สินค้า
- **จัดการคำสั่งซื้อ** (`/home/order`) - จัดการ Order
- **จัดการ Admin** (`/home/admin`) - CRUD Admin Users
- **แก้ไขโปรไฟล์** (`/home/edit-profile`) - แก้ไขข้อมูลส่วนตัว

---

## 🖥️ UI Components

โปรเจคใช้ **Radix UI** + **Shadcn/ui** components:

| Component | Description |
|-----------|-------------|
| `Accordion` | แสดง/ซ่อนเนื้อหา |
| `Avatar` | รูปโปรไฟล์ |
| `Badge` | ป้าย/แท็ก |
| `Button` | ปุ่มกด |
| `Card` | การ์ดแสดงข้อมูล |
| `Carousel` | Slider รูปภาพ |
| `Dialog` | Modal/Popup |
| `Dropdown Menu` | เมนูแบบ Dropdown |
| `Form` | ฟอร์มพร้อม Validation |
| `Input` / `Textarea` | ช่องกรอกข้อมูล |
| `Select` | ตัวเลือก |
| `Sheet` | Drawer จากด้านข้าง |
| `Sidebar` | เมนูด้านซ้าย |
| `Table` | ตารางข้อมูล |
| `Tabs` | แท็บ |
| `Tooltip` | คำอธิบายเมื่อ Hover |
| `ZoomDialog` | Zoom รูปภาพ |

---

## 🛠️ Installation & Setup

### Prerequisites
- **Bun** (สำหรับ Backend) - https://bun.sh
- **Node.js 20+** (สำหรับ Frontend)
- **MongoDB** (Local หรือ Atlas)

### 1. Clone Repository
```bash
git clone <repository-url>
cd ecommerce
```

### 2. Setup Backend
```bash
cd app.backend

# Install dependencies
bun install

# Setup .env file
cp .env.example .env
# แก้ไข DATABASE_URL ใน .env

# Generate Prisma Client
bunx prisma generate

# Push schema to database
bunx prisma db push

# Run development server
bun run dev
```

### 3. Setup Frontend
```bash
cd app.frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### 4. Access Application
- **Frontend (Web)**: http://localhost:3000/web
- **Frontend (Admin)**: http://localhost:3000/backoffice/signin
- **Backend API**: http://localhost:3001
- **API Docs (Swagger)**: http://localhost:3001/swagger

---

## 🔐 Environment Variables

### Backend (`.env`)
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/ecommerce"
JWT_SECRET="your-jwt-secret"
```

---

## 📝 Features Summary

### ✅ ระบบลูกค้า (Customer)
- [x] สมัครสมาชิก / เข้าสู่ระบบ
- [x] เรียกดูสินค้า / ค้นหา / กรองตามหมวดหมู่
- [x] ดูสินค้ายอดนิยม (ตามจำนวนการเข้าชม, ยอดขาย)
- [x] เพิ่มสินค้าลงตะกร้า
- [x] สั่งซื้อ / อัพโหลดสลิป
- [x] ติดตามสถานะ / รับสินค้า
- [x] ดูประวัติการสั่งซื้อ

### ✅ ระบบ Admin (Backoffice)
- [x] เข้าสู่ระบบ Admin
- [x] Dashboard แสดงยอดขาย / กราฟสถิติ
- [x] จัดการสินค้า (เพิ่ม/แก้ไข/ลบ/อัพโหลดรูป)
- [x] จัดการหมวดหมู่
- [x] จัดการคำสั่งซื้อ (ยืนยัน/ส่งสินค้า/ยกเลิก)
- [x] จัดการ Admin Users
- [x] แก้ไขโปรไฟล์

---

## 📄 License

This project is for educational purposes.
