export interface ProductInterface {
    id: string
    name: string
    price: number
    stock: number
    description: string
    isbn: string
    image?: string | File  // รูปภาพหลัก (เก็บไว้เพื่อความเข้ากันได้กับโค้ดเดิม)
    images?: string[] | File[]  // รายการรูปภาพทั้งหมด (สูงสุด 10 รูป)
    category: string
    viewCount?: number
    salesCount?: number
    rating?: number
    createdAt: Date
    updatedAt?: Date
}