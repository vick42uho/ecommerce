import { OrderInterface } from "./OrderInterface";
import { ProductInterface } from "./ProductInterface";

export interface OrderDetailInterface {
    id:string;
    order:OrderInterface;
    Product:ProductInterface;
    price:number;
    qty:number;
}