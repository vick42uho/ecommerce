export interface MemberInterface {
    id: string;
    name: string;
    phone: string;
    username: string;
    password: string;
    email?: string;
    address?: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}