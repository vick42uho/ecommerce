import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();

export const DashboardController = {
    // สรุปข้อมูลสำหรับ Dashboard
    summary: async ({
        set
    }: {
        set: {
            status: number;
        };
    }) => {
        try {
            // 1. นับจำนวนออเดอร์ทั้งหมด
            const totalOrders = await prisma.order.count();

            // 2. นับจำนวนสมาชิกทั้งหมด
            const totalMembers = await prisma.member.count();

            // 3. นับจำนวนสินค้าทั้งหมด
            const totalProducts = await prisma.product.count();

            // 4. คำนวณยอดขายรวมทั้งหมด
            const salesData = await prisma.order.findMany({
                where: {
                    status: {
                        in: ["paid", "send", "completed"]
                    }
                },
                include: {
                    OrderDetail: true
                }
            });

            const totalSales = salesData.reduce((sum, order) => {
                const orderTotal = order.OrderDetail.reduce((orderSum, item) => {
                    return orderSum + (item.price * item.qty);
                }, 0);
                return sum + orderTotal;
            }, 0);

            // 5. สรุปจำนวนออเดอร์ตามสถานะ
            const ordersByStatus = await prisma.order.groupBy({
                by: ['status'],
                _count: {
                    id: true
                }
            });

            const statusCounts = {
                paid: 0,
                send: 0,
                completed: 0,
                cancel: 0
            };

            ordersByStatus.forEach(item => {
                const status = item.status as keyof typeof statusCounts;
                if (status in statusCounts) {
                    statusCounts[status] = item._count.id;
                }
            });

            // 6. ข้อมูลยอดขายรายวันในช่วง 7 วันล่าสุด
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentOrders = await prisma.order.findMany({
                where: {
                    createdAt: {
                        gte: sevenDaysAgo
                    },
                    status: {
                        in: ["paid", "send", "completed"]
                    }
                },
                include: {
                    OrderDetail: true
                }
            });

            // สร้าง map สำหรับเก็บยอดขายรายวัน
            const dailySalesMap = new Map();
            
            // สร้างข้อมูลสำหรับ 7 วันล่าสุด
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
                dailySalesMap.set(dateString, 0);
            }

            // คำนวณยอดขายรายวัน
            recentOrders.forEach(order => {
                const orderDate = order.createdAt.toISOString().split('T')[0];
                const orderTotal = order.OrderDetail.reduce((sum, item) => sum + (item.price * item.qty), 0);
                
                if (dailySalesMap.has(orderDate)) {
                    dailySalesMap.set(orderDate, dailySalesMap.get(orderDate) + orderTotal);
                }
            });

            // แปลง Map เป็น Array สำหรับส่งกลับ
            const dailySales = Array.from(dailySalesMap).map(([date, amount]) => ({
                date,
                amount
            })).sort((a, b) => a.date.localeCompare(b.date));

            // 7. สินค้าขายดี 5 อันดับแรก
            const topProducts = await prisma.orderDetail.groupBy({
                by: ['productId'],
                _sum: {
                    qty: true
                }
            });

            const topProductsWithDetails = await Promise.all(
                topProducts
                    .sort((a, b) => (b._sum.qty || 0) - (a._sum.qty || 0))
                    .slice(0, 5)
                    .map(async (item) => {
                        const product = await prisma.product.findUnique({
                            where: { id: item.productId || '' }
                        });
                        return {
                            id: item.productId,
                            name: product?.name || 'Unknown Product',
                            image: product?.image,
                            totalSold: item._sum.qty || 0
                        };
                    })
            );

            // ส่งข้อมูลทั้งหมดกลับไป
            return {
                totalOrders,
                totalMembers,
                totalProducts,
                totalSales,
                statusCounts,
                dailySales,
                topProducts: topProductsWithDetails
            };

        } catch (error) {
            console.error('Dashboard summary error:', error);
            return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard' };
        }
    },

    // ข้อมูลการขายรายเดือน
    monthlySales: async ({
        set,
        params
    }: {
        set: {
            status: number;
        };
        params: {
            year: number;
        };
    }) => {
        try {
            const year = params.year || new Date().getFullYear();
            
            // ดึงข้อมูลออเดอร์ในปีที่ระบุ
            const startDate = new Date(year, 0, 1); // 1 มกราคม
            const endDate = new Date(year, 11, 31); // 31 ธันวาคม
            
            const orders = await prisma.order.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    },
                    status: {
                        in: ["paid", "send", "completed"]
                    }
                },
                include: {
                    OrderDetail: true
                }
            });

            // สร้างข้อมูลยอดขายรายเดือน
            const monthlySales = Array(12).fill(0);

            orders.forEach(order => {
                const month = order.createdAt.getMonth(); // 0-11
                const orderTotal = order.OrderDetail.reduce((sum, item) => sum + (item.price * item.qty), 0);
                monthlySales[month] += orderTotal;
            });

            // แปลงเป็นรูปแบบที่ใช้งานง่าย
            const monthNames = [
                "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
                "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
            ];

            const result = monthNames.map((month, index) => ({
                month,
                amount: monthlySales[index]
            }));

            return {
                year,
                monthlySales: result
            };

        } catch (error) {
            // console.error('Monthly sales error:', error);
            set.status = 500;
            return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลยอดขายรายเดือน' };
        }
    }
};