import { ProductInterface } from "./ProductInterface";


export interface CartInterface {
    id: string;
    memberId: string;
    productId: string;
    qty: number;
    product: ProductInterface  // เชื่อมต่อกับ ProductInterface
}