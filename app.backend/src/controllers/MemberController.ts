import { PrismaClient } from "../../generated/prisma";
import { MemberInterface } from "../../interface/MemberInterface";

const prisma = new PrismaClient();

export const MemberController = {
  signup: async ({ body }: { body: MemberInterface }) => {
    try {
      // สร้างเงื่อนไขสำหรับการเช็คซ้ำ
      const orConditions: Array<{
        username?: string;
        phone?: string;
        email?: string;
      }> = [{ username: body.username }, { phone: body.phone }];

      // เพิ่มเงื่อนไขอีเมลเฉพาะเมื่อมีค่า
      if (body.email && body.email.trim() !== "") {
        orConditions.push({ email: body.email });
      }

      // เช็คซ้ำทั้งหมดในครั้งเดียว
      const existingMember = await prisma.member.findFirst({
        where: {
          OR: orConditions,
        },
      });

      if (existingMember) {
        // ตรวจสอบว่าซ้ำอันไหน
        if (existingMember.username === body.username) {
          return {
            error: "Username นี้มีอยู่ในระบบแล้ว กรุณาใช้ Username อื่น",
          };
        }
        if (existingMember.phone === body.phone) {
          return {
            error: "เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว กรุณาใช้เบอร์โทรศัพท์อื่น",
          };
        }
        // เช็คอีเมลเฉพาะเมื่อมีการส่งอีเมลมา
        if (
          body.email &&
          body.email.trim() !== "" &&
          existingMember.email === body.email
        ) {
          return { error: "อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่น" };
        }
      }

      // สร้างสมาชิกใหม่
      const member = await prisma.member.create({
        data: {
          name: body.name,
          phone: body.phone,
          username: body.username,
          password: body.password,
          email: body.email || null,
          address: body.address || null,
          status: "active",
        },
      });

      return member;
    } catch (error) {
      return { error: error };
    }
  },
  signin: async ({
    body,
    jwt,
  }: {
    body: {
      username: string;
      password: string;
    };
    jwt: any;
  }) => {
    try {
      const member = await prisma.member.findUnique({
        where: {
          username: body.username,
          password: body.password,
          status: "active",
        },
        select: {
          id: true,
        },
      });
      if (!member) {
        return new Response("User Not Fond", { status: 401 });
      }
      const token = await jwt.sign(member);
      return { token: token };
    } catch (error) {
      return { error: error };
    }
  },
  info: async ({
    request,
    jwt,
  }: {
    request: {
      headers: any;
    };
    jwt: any;
  }) => {
    try {
      const token = request.headers.get("Authorization").split(" ")[1];
      const payload = await jwt.verify(token);
      const member = await prisma.member.findUnique({
        where: {
          id: payload.id,
        },
        select: {
          id: true,
          username: true,
          name: true,
          // phone: true,
          // email: true,
          // address: true,
        },
      });
      return member;
    } catch (error) {
      return { error: error };
    }
  },
  history: async ({
    request,
    jwt,
    set,
  }: {
    request: any;
    jwt: any;
    set: {
      status: number;
    };
  }) => {
    try {
      const token = request.headers.get("Authorization").split(" ")[1];
      const payload = await jwt.verify(token);

      return await prisma.order.findMany({
        where: {
          memberId: payload.id,
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
          createdAt: true,
          customerName: true,
          customerAddress: true,
          customerPhone: true,
          trackCode: true,
          status: true,
          remark: true,
          express: true,
          id: true,
          orderNo: true
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      set.status = 500;
      return { error: error };
    }
  },
};
