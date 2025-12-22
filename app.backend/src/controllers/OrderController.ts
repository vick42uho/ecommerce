import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();

export const OrderController = {
  list: async ({ set }: { set: any }) => {
    try {
      return prisma.order.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          OrderDetail: {
            select: {
              id: true,
              qty: true,
              price: true,
              Product: {
                select: {
                  name: true,
                  isbn: true,
                  image: true,
                },
              },
            },
          },
          Member: true,
          id: true,
          createdAt: true,
          trackCode: true,
          customerName: true,
          customerPhone: true,
          customerAddress: true,
          slipImage: true,
          status: true,
          express: true,
          remark: true,
          orderNo: true
        },
      });
    } catch (error) {
      set.status = 500;
      return { error: error };
    }
  },

  cancel: async ({
    set,
    params,
    body,
  }: {
    set: any;
    params: {
      id: string;
    };
    body: {
      memberId?: string; // Optional for admin cancellation
      remark?: string;
    };
  }) => {
    try {
      // Get order with details
      const order = await prisma.order.findFirst({
        where: {
          id: params.id,
          ...(body.memberId && { memberId: body.memberId }), // Only check memberId if provided (customer cancellation)
        },
        include: {
          OrderDetail: {
            include: {
              Product: true,
            },
          },
        },
      });

      if (!order) {
        set.status = 404;
        return { error: "ไม่พบคำสั่งซื้อหรือไม่มีสิทธิ์ในการยกเลิก" };
      }

      // Check if order can be cancelled
      if (["send", "complete", "cancel"].includes(order.status)) {
        set.status = 400;
        return { error: "ไม่สามารถยกเลิกคำสั่งซื้อที่มีสถานะ send, complete หรือ cancel ได้" };
      }

      // Use transaction to restore stock and update order status
      const result = await prisma.$transaction(async (tx) => {
        // Restore product stock
        for (const detail of order.OrderDetail) {
          await tx.product.update({
            where: { id: detail.productId },
            data: {
              stock: {
                increment: detail.qty,
              },
            },
          });
        }

        // Update order status
        const updatedOrder = await tx.order.update({
          where: { id: params.id },
          data: {
            status: "cancel",
            remark: body.remark || "คำสั่งซื้อถูกยกเลิก",
          },
        });

        return updatedOrder;
      });

      return {
        message: "ยกเลิกคำสั่งซื้อสำเร็จ",
        order: result,
      };
    } catch (error) {
      set.status = 500;
      return { error: "เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ" };
    }
  },
  paid: async ({
    set,
    params,
  }: {
    set: any;
    params: {
      id: string;
    };
  }) => {
    try {
      const order = await prisma.order.update({
        where: {
          id: params.id,
        },
        data: {
          status: "paid",
          remark: "",
        },
      });
      return order;
    } catch (error) {
      set.status = 500;
      return { error: error };
    }
  },
  send: async ({
    set,
    body,
  }: {
    set: {
      status: number;
    };
    body: {
      trackCode: string;
      express: string;
      remark: string;
      orderId: string;
    };
  }) => {
    try {
      // Only allow send if current status is 'paid'
      const order = await prisma.order.findUnique({ where: { id: body.orderId } });
      if (!order) {
        set.status = 404;
        return { error: 'ไม่พบคำสั่งซื้อ' };
      }
      if (order.status !== 'paid') {
        set.status = 400;
        return { error: 'สถานะคำสั่งซื้อต้องเป็น "paid" ก่อนจัดส่ง' };
      }
      await prisma.order.update({
        where: {
          id: body.orderId,
        },
        data: {
          trackCode: body.trackCode,
          express: body.express,
          remark: body.remark,
          status: "send",
        },
      });
    } catch (error) {
      set.status = 500;
      return { error: error };
    }
  },



  /**
   * Auto-complete orders: set status to 'complete' if 15 days have passed since createdAt and status is 'send'.
   * To be called by scheduled job or admin trigger.
   */
  autoCompleteOrders: async () => {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    try {
      const toComplete = await prisma.order.findMany({
        where: {
          status: 'send',
          createdAt: { lte: fifteenDaysAgo },
        },
      });
      for (const order of toComplete) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'complete' },
        });
      }
      return { updated: toComplete.length };
    } catch (error) {
      return { error };
    }
  },
};
