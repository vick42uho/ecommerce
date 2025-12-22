import { MemberInterface } from "./MemberInterface";
import { OrderDetailInterface } from "./OrderDetailInterface";

export interface OrderInterface {
    id: string;
    createdAt: string;
    member: MemberInterface;
    trackCode: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    slipImage: string;
    status: string;
    express: string;
    remark: string;
    OrderDetail: OrderDetailInterface[];
    orderNo: string;
}
