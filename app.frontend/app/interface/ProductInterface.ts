export interface ProductInterface {
    id: string;
    name: string;
    price: number;
    description: string;
    isbn: string;
    image?: string;
    images?: string[];
    category: string;
    stock?: number; // เพิ่มฟีลด์จำนวนสินค้า
    createdAt?: Date;
}


export interface Category {
    id: string;
    name: string;
    count: number; // จำนวนสินค้าในหมวดหมู่นี้
  }