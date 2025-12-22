import type { CartInterface } from "../../interface/CartInterface";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();

export const CartController = {
  add: async ({ body }: { body: CartInterface }) => {
    try {
      // ตรวจสอบว่ามีการส่งจำนวนสินค้ามาหรือไม่
      const quantity = body.qty || 1;

      // ตรวจสอบสต็อกก่อนเพิ่มลงตะกร้า
      const product = await prisma.product.findUnique({
        where: { id: body.productId }
      });

      if (!product) {
        return { error: "ไม่พบสินค้าที่ระบุ" };
      }

      // ตรวจสอบว่ามีสินค้านี้ในตะกร้าอยู่แล้วหรือไม่
      const cart = await prisma.cart.findFirst({
        where: {
          memberId: body.memberId,
          productId: body.productId,
        },
      });

      // คำนวณจำนวนรวมที่จะมีในตะกร้า
      let totalQuantityInCart = quantity;
      if (cart && !body.id) {
        totalQuantityInCart = cart.qty + quantity;
      } else if (body.id && cart) {
        totalQuantityInCart = quantity;
      }

      // ตรวจสอบสต็อกเทียบกับจำนวนรวม
      if (product.stock < totalQuantityInCart) {
        return { error: `สินค้าไม่เพียงพอ มีสต็อกเหลือ ${product.stock} ชิ้น` };
      }

      // ถ้ามี id ของสินค้าในตะกร้ามาด้วย ให้อัปเดตตาม id ที่ส่งมา
      if (body.id) {
        await prisma.cart.update({
          where: {
            id: body.id,
          },
          data: {
            qty: quantity,
          },
        });
        return { message: "อัปเดตจำนวนสินค้าแล้ว" };
      }

      // ถ้าไม่มี id มา ให้ตรวจสอบว่ามีสินค้านี้ในตะกร้าหรือไม่
      if (cart != null) {
        // ถ้ามีสินค้านี้ในตะกร้าอยู่แล้ว ให้บวกเพิ่ม
        await prisma.cart.update({
          where: {
            id: cart.id,
          },
          data: {
            qty: cart.qty + quantity,
          },
        });
      } else {
        // ถ้ายังไม่มีสินค้านี้ในตะกร้า ให้สร้างใหม่ด้วยจำนวนที่ส่งมา
        await prisma.cart.create({
          data: {
            memberId: body.memberId,
            productId: body.productId,
            qty: quantity,
          },
        });
      }
      return { message: "เพิ่มสินค้าลงตะกร้าแล้ว" };
    } catch (error) {
      return { error: error };
    }
  },
  update: async ({ body }: { body: CartInterface }) => {
    try {
      // ตรวจสอบว่ามีการส่งจำนวนสินค้ามาหรือไม่ ค่าเริ่มต้นเป็น 1
      const quantity = body.qty || 1;

      // ถ้ามี id ส่งมา ให้ตั้งค่าจำนวนเป็นค่าที่ส่งมาโดยตรง
      if (body.id) {
        const existingCart = await prisma.cart.findUnique({
          where: { id: body.id },
          include: { product: true }
        });
        if (!existingCart) {
          throw new Error("ไม่พบรายการตะกร้าที่ระบุ");
        }

        // ตรวจสอบสต็อกก่อนอัปเดต
        if (existingCart.product.stock < quantity) {
          return { error: `สินค้าไม่เพียงพอ มีสต็อกเหลือ ${existingCart.product.stock} ชิ้น` };
        }

        // ตั้งค่าจำนวนเป็นค่าที่ส่งมาโดยตรง ไม่ใช่บวกเพิ่ม
        await prisma.cart.update({
          where: { id: body.id },
          data: { qty: quantity },
        });
        return { message: `อัปเดตจำนวนสินค้าเป็น ${quantity} ชิ้น` };
      }

      // ตรวจสอบสินค้าและสต็อก
      const product = await prisma.product.findUnique({
        where: { id: body.productId }
      });

      if (!product) {
        return { error: "ไม่พบสินค้าที่ระบุ" };
      }

      if (product.stock < quantity) {
        return { error: `สินค้าไม่เพียงพอ มีสต็อกเหลือ ${product.stock} ชิ้น` };
      }

      // ตรวจสอบว่ามีสินค้านี้ในตะกร้าของผู้ใช้หรือไม่
      const cart = await prisma.cart.findFirst({
        where: {
          memberId: body.memberId,
          productId: body.productId,
        },
      });

      // ถ้ามีสินค้านี้ในตะกร้าอยู่แล้ว ตั้งค่าจำนวนเป็นค่าที่ส่งมาโดยตรง
      if (cart) {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { qty: quantity },
        });
        return { message: `อัปเดตจำนวนสินค้าเป็น ${quantity} ชิ้น` };
      }

      // ถ้ายังไม่มีสินค้านี้ในตะกร้า สร้างใหม่ด้วยจำนวนที่ส่งมา
      await prisma.cart.create({
        data: {
          memberId: body.memberId,
          productId: body.productId,
          qty: quantity,
        },
      });
      return { message: `เพิ่มสินค้าลงตะกร้า ${quantity} ชิ้น` };
    } catch (error: any) {
      return {
        error: error.message || "เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า",
      };
    }
  },
  list: async ({
    params,
  }: {
    params: {
      memberId: string;
    };
  }) => {
    try {
      const cart = await prisma.cart.findMany({
        where: {
          memberId: params.memberId,
        },
        select: {
          id: true,
          qty: true,
          product: true,
        },
      });
      return cart;
    } catch (error) {
      return { error: error };
    }
  },
  remove: async ({
    params,
  }: {
    params: {
      id: string;
    };
  }) => {
    try {
      const cart = await prisma.cart.delete({
        where: {
          id: params.id,
        },
      });
      return cart;
    } catch (error) {
      return { error: error };
    }
  },
  cartConfirm: async ({
    body,
    jwt,
    request,
    set,
  }: {
    body: {
      name: string;
      address: string;
      phone: string;
    };
    jwt: any;
    request: any;
    set: {
      status: number;
    };
  }) => {
    try {
      const token = request.headers.get('Authorization').replace('Bearer ', '');
      const payload = await jwt.verify(token);
      return await prisma.member.update({
        where: {
          id: payload.id,
        },
        data: {
          name: body.name,
          address: body.address,
          phone: body.phone,
        },
      });
    } catch (error) {
      set.status = 500;
      return { error: error };
    }
  },
  uploadSlip: async ({
    body,
  }: {
    body: {
      myFile: File;
    };
  }) => {
    try {
      const safeName = body.myFile.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const path = 'uploads/slip/' + safeName;
      await Bun.write(path, body.myFile);
      return { message: 'อัปโหลดสลิปแล้ว', fileName: safeName };
    } catch (error) {
      return { error: error }
    }
  },
  confirmOrder: async ({
    jwt,
    request,
    set,
    body

  }: {
    jwt: any;
    request: any;
    set: {
      status: number;
    };
    body: {
      slipName: string;
    }
  }) => {
    try {
      const token = request.headers.get('Authorization').replace('Bearer ', '');
      const payload = await jwt.verify(token);
      const memberId = payload.id;

      const cart = await prisma.cart.findMany({
        where: {
          memberId: memberId,
        },
        select: {
          id: true,
          qty: true,
          product: true,
        },
      });

      if (cart.length === 0) {
        set.status = 400;
        return { error: "ตะกร้าสินค้าว่างเปล่า" };
      }

      const member = await prisma.member.findUnique({
        where: {
          id: memberId,
        },
      });

      if (!member) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      // ตรวจสอบสต็อกทั้งหมดก่อนสร้างออเดอร์
      for (const cartItem of cart) {
        if (cartItem.product.stock < cartItem.qty) {
          set.status = 400;
          return { 
            error: `สินค้า "${cartItem.product.name}" มีสต็อกไม่เพียงพอ (เหลือ ${cartItem.product.stock} ชิ้น ต้องการ ${cartItem.qty} ชิ้น)` 
          };
        }
      }

      // ใช้ Transaction เพื่อความปลอดภัย
      const result = await prisma.$transaction(async (tx) => {
        // Generate orderNo: ORDYYYYMMDD-xxxx
        const now = new Date();
        const y = now.getFullYear();
        const m = (now.getMonth() + 1).toString().padStart(2, '0');
        const d = now.getDate().toString().padStart(2, '0');
        const dateStr = `${y}${m}${d}`;
        
        // Find latest orderNo for today
        const latestOrder = await tx.order.findFirst({
          where: {
            orderNo: {
              startsWith: `ORD${dateStr}`
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        
        let running = 1;
        if (latestOrder && latestOrder.orderNo) {
          const parts = latestOrder.orderNo.split('-');
          if (parts.length === 2) {
            const num = parseInt(parts[1]);
            if (!isNaN(num)) running = num + 1;
          }
        }
        
        const orderNo = `ORD${dateStr}-${running.toString().padStart(4, '0')}`;
        
        // สร้างออเดอร์
        const order = await tx.order.create({
          data: {
            createdAt: now,
            trackCode: '',
            customerName: member.name ?? '',
            customerPhone: member.phone ?? '',
            customerAddress: member.address ?? '',
            memberId: memberId,
            slipImage: body.slipName,
            orderNo: orderNo
          }
        });

        // สร้าง OrderDetail และตัดสต็อกพร้อมกัน
        for (const cartItem of cart) {
          // สร้าง OrderDetail
          await tx.orderDetail.create({
            data: {
              price: cartItem.product.price,
              qty: cartItem.qty,
              productId: cartItem.product.id,
              orderId: order.id
            }
          });

          // ตัดสต็อกสินค้า
          await tx.product.update({
            where: { id: cartItem.product.id },
            data: {
              stock: {
                decrement: cartItem.qty
              }
            }
          });
        }

        // ลบตะกร้าสินค้า
        await tx.cart.deleteMany({
          where: {
            memberId: memberId,
          },
        });

        return { order, message: "สร้างออเดอร์สำเร็จและตัดสต็อกแล้ว" };
      });

      return result;
    } catch (error: any) {
      set.status = 500;
      return { error: error.message || "เกิดข้อผิดพลาดในการสร้างออเดอร์" };
    }
  },
  confirmReceived: async ({
    jwt,
    request,
    set,
    params
  }: {
    jwt: any;
    request: any;
    set: {
      status: number;
    };
    params: {
      orderId: string;
    };
  }) => {
    try {
      const token = request.headers.get('Authorization').replace('Bearer ', '');
      const payload = await jwt.verify(token);
      const memberId = payload.id;

      // ตรวจสอบว่าออเดอร์นี้เป็นของสมาชิกคนนี้หรือไม่
      const order = await prisma.order.findFirst({
        where: {
          id: params.orderId,
          memberId: memberId,
        },
      });

      if (!order) {
        set.status = 404;
        return { error: "ไม่พบคำสั่งซื้อหรือคุณไม่มีสิทธิ์เข้าถึง" };
      }

      // ตรวจสอบสถานะปัจจุบัน - ต้องเป็น "จัดส่งแล้ว" เท่านั้น
      if (order.status !== "จัดส่งแล้ว" && order.status !== "delivered" && order.status !== "send") {
        set.status = 400;
        return { error: "ไม่สามารถยืนยันรับสินค้าได้ เนื่องจากสถานะคำสั่งซื้อไม่ถูกต้อง" };
      }

      // อัปเดตสถานะเป็น "รับสินค้าแล้ว"
      await prisma.order.update({
        where: {
          id: params.orderId,
        },
        data: {
          status: "completed",
        },
      });

      return { message: "ยืนยันการรับสินค้าเรียบร้อยแล้ว" };
    } catch (error: any) {
      set.status = 500;
      return { error: error.message || "เกิดข้อผิดพลาดในการยืนยันการรับสินค้า" };
    }
  },
  cancelOrder: async ({
    jwt,
    request,
    set,
    params
  }: {
    jwt: any;
    request: any;
    set: {
      status: number;
    };
    params: {
      orderId: string;
    };
  }) => {
    try {
      const token = request.headers.get('Authorization').replace('Bearer ', '');
      const payload = await jwt.verify(token);
      const memberId = payload.id;

      // ตรวจสอบว่าออเดอร์นี้เป็นของสมาชิกคนนี้หรือไม่
       const order = await prisma.order.findFirst({
         where: {
           id: params.orderId,
           memberId: memberId,
         },
         include: {
           OrderDetail: {
             include: {
               Product: true
             }
           }
         }
       });

      if (!order) {
        set.status = 404;
        return { error: "ไม่พบคำสั่งซื้อหรือคุณไม่มีสิทธิ์เข้าถึง" };
      }

      // ตรวจสอบสถานะปัจจุบัน - สามารถยกเลิกได้เฉพาะออเดอร์ที่ยังไม่จัดส่ง
      if (order.status === "completed" || order.status === "จัดส่งแล้ว" || order.status === "delivered" || order.status === "send") {
        set.status = 400;
        return { error: "ไม่สามารถยกเลิกออเดอร์ได้ เนื่องจากสินค้าถูกจัดส่งแล้ว" };
      }

      if (order.status === "cancelled") {
        set.status = 400;
        return { error: "ออเดอร์นี้ถูกยกเลิกแล้ว" };
      }

      // ใช้ Transaction เพื่อคืนสต็อกและอัปเดตสถานะ
       const result = await prisma.$transaction(async (tx) => {
         // คืนสต็อกสินค้า
         for (const orderDetail of order.OrderDetail) {
           await tx.product.update({
             where: { id: orderDetail.productId },
             data: {
               stock: {
                 increment: orderDetail.qty
               }
             }
           });
         }

        // อัปเดตสถานะออเดอร์เป็น cancelled
        await tx.order.update({
          where: {
            id: params.orderId,
          },
          data: {
            status: "cancelled",
          },
        });

        return { message: "ยกเลิกออเดอร์และคืนสต็อกสินค้าเรียบร้อยแล้ว" };
      });

      return result;
    } catch (error: any) {
      set.status = 500;
      return { error: error.message || "เกิดข้อผิดพลาดในการยกเลิกออเดอร์" };
    }
  }
};
