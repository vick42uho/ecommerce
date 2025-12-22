import { PrismaClient } from "../../generated/prisma";
import { ProductInterface } from "../../interface/ProductInterface";
const prisma = new PrismaClient();

export const ProductController = {
  create: async ({ body }: { body: ProductInterface }) => {
    try {
      // ตรวจสอบว่ามี ISBN ซ้ำหรือไม่
      const existingProduct = await prisma.product.findFirst({
        where: {
          isbn: body.isbn
        }
      });

      if (existingProduct) {
        return { error: "ISBN นี้มีอยู่ในระบบแล้ว กรุณาใช้ ISBN อื่น" };
      }

      // จัดการรูปภาพหลัก (เพื่อความเข้ากันได้กับโค้ดเดิม)
      let mainImageName = "";
      if (body.image && typeof body.image !== 'string' && (body.image as File).name) {
        const timestamp = Date.now();
        mainImageName = `${timestamp}_${(body.image as File).name}`;
        await Bun.write("uploads/" + mainImageName, body.image as File);
      }

      // จัดการรูปภาพหลายรูป (สูงสุด 10 รูป)
      const imageNames: string[] = [];
      
      // เพิ่มรูปหลักเข้าไปในอาร์เรย์รูปภาพด้วย (ถ้ามี)
      if (mainImageName) {
        imageNames.push(mainImageName);
      }
      
      // ตรวจสอบว่ามีรูปภาพเพิ่มเติมหรือไม่
      if (body.images && Array.isArray(body.images)) {
        // จำกัดจำนวนรูปภาพสูงสุด 10 รูป (รวมรูปหลัก)
        const remainingSlots = 10 - imageNames.length;
        const additionalImages = body.images.slice(0, remainingSlots);
        
        // บันทึกรูปภาพเพิ่มเติม
        for (const img of additionalImages) {
          if (typeof img !== 'string' && (img as File).name) {
            const timestamp = Date.now() + Math.floor(Math.random() * 1000); // เพิ่มความสุ่มเพื่อป้องกันชื่อซ้ำ
            const imgName = `${timestamp}_${(img as File).name}`;
            await Bun.write("uploads/" + imgName, img as File);
            imageNames.push(imgName);
          }
        }
      }

      // สร้างข้อมูลสินค้า
      const product = await prisma.product.create({
        data: {
          name: body.name,
          price: parseInt(body.price.toString()),
          stock: parseInt(body.stock?.toString() || "0"), // เพิ่มฟีลด์ stock
          isbn: body.isbn,
          description: body.description,
          category: body.category,
          image: mainImageName, // รูปภาพหลัก (เพื่อความเข้ากันได้กับโค้ดเดิม)
          images: imageNames, // รายการรูปภาพทั้งหมด
          viewCount: 0,
          salesCount: 0,
          rating: 0
        },
      });

      return product;
    } catch (error) {
      return { error: error };
    }
  },
  list: async () => {
    try {
      return await prisma.product.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      return { error: error };
    }
  },
  update: async ({
    params,
    body,
  }: {
    params: {
      id: string;
    };
    body: ProductInterface;
  }) => {
    try {
      const oldProduct = await prisma.product.findUnique({
        where: {
          id: params.id,
        },
      });
      if (!oldProduct) {
        return { message: "Product not found" };
      }

      // ตรวจสอบว่ามี ISBN ซ้ำหรือไม่ (ยกเว้นรายการปัจจุบัน)
      const existingProduct = await prisma.product.findFirst({
        where: {
          isbn: body.isbn,
          id: { not: params.id }
        }
      });

      if (existingProduct) {
        return { error: "ISBN นี้มีอยู่ในระบบแล้ว กรุณาใช้ ISBN อื่น" };
      }

      // จัดการรูปภาพหลัก (เพื่อความเข้ากันได้กับโค้ดเดิม)
      let mainImageName = oldProduct.image || ""; // เริ่มต้นด้วยภาพเดิม

      // ตรวจสอบว่ามีการส่งรูปภาพใหม่มาหรือไม่
      if (body.image && typeof body.image !== 'string' && (body.image as File).name) {
        const timestamp = Date.now();
        const imageName = `${timestamp}_${(body.image as File).name}`;

        // ลบรูปภาพเก่า (ถ้ามี)
        if (oldProduct.image) {
          const oldFile = Bun.file(`uploads/${oldProduct.image}`);
          if (await oldFile.exists()) {
            await oldFile.delete();
          }
        }

        // บันทึกรูปภาพใหม่
        await Bun.write(`uploads/${imageName}`, body.image as File);
        mainImageName = imageName; // อัปเดตชื่อรูปภาพที่จะบันทึก
      }

      // จัดการรูปภาพหลายรูป (สูงสุด 10 รูป)
      // เริ่มต้นด้วยรูปภาพเดิมที่มีอยู่แล้ว (ถ้ามี)
      let imageNames: string[] = oldProduct.images || [];
      
      // ถ้ามีการเปลี่ยนรูปหลัก ให้อัปเดตในรายการรูปภาพด้วย
      if (mainImageName !== oldProduct.image) {
        // ถ้ามีการเปลี่ยนรูปหลัก ให้ลบรูปเก่าออกจากรายการรูปภาพ
        if (oldProduct.image && imageNames.includes(oldProduct.image)) {
          imageNames = imageNames.filter(img => img !== oldProduct.image);
        }
        
        // เพิ่มรูปหลักใหม่เข้าไปในรายการรูปภาพ
        if (mainImageName) {
          imageNames.unshift(mainImageName); // เพิ่มรูปหลักไว้ที่ตำแหน่งแรก
        }
      }
      
      // ตรวจสอบว่ามีรูปภาพเพิ่มเติมหรือไม่
      if (body.images && Array.isArray(body.images)) {
        // ตรวจสอบว่ามีการอัพโหลดรูปภาพใหม่จริงๆ หรือไม่
        const hasNewImages = body.images.some(img => typeof img !== 'string' && (img as File).name);
        
        if (hasNewImages) {
          // มีการอัพโหลดรูปภาพใหม่จริงๆ จึงลบรูปเก่า
          // ยกเว้นรูปหลักที่เพิ่งอัปเดต
          for (const oldImg of oldProduct.images || []) {
            // ไม่ลบรูปหลักที่เพิ่งอัปเดต
            if (oldImg !== mainImageName) {
              const oldFile = Bun.file(`uploads/${oldImg}`);
              if (await oldFile.exists()) {
                await oldFile.delete();
              }
            }
          }
          
          // รีเซ็ตรายการรูปภาพให้เหลือแค่รูปหลัก (ถ้ามี)
          imageNames = mainImageName ? [mainImageName] : [];
          
          // จำกัดจำนวนรูปภาพสูงสุด 10 รูป (รวมรูปหลัก)
          const remainingSlots = 10 - imageNames.length;
          const additionalImages = body.images.slice(0, remainingSlots);
          
          // บันทึกรูปภาพเพิ่มเติม
          for (const img of additionalImages) {
            if (typeof img !== 'string' && (img as File).name) {
              const timestamp = Date.now() + Math.floor(Math.random() * 1000); // เพิ่มความสุ่มเพื่อป้องกันชื่อซ้ำ
              const imgName = `${timestamp}_${(img as File).name}`;
              await Bun.write("uploads/" + imgName, img as File);
              imageNames.push(imgName);
            }
          }
        }
        // ถ้าไม่มีรูปภาพใหม่ จะใช้รูปภาพเดิมทั้งหมด (ยกเว้นกรณีมีการเปลี่ยนรูปหลัก)
      }

      // อัปเดตข้อมูลสินค้า
      const product = await prisma.product.update({
        where: {
          id: params.id,
        },
        data: {
          name: body.name,
          price: parseInt(body.price.toString()),
          stock: parseInt(body.stock?.toString() || "0"), // เพิ่มฟีลด์ stock
          isbn: body.isbn,
          description: body.description,
          category: body.category,
          image: mainImageName, // ใช้ชื่อรูปภาพที่กำหนด (เก่าหรือใหม่)
          images: imageNames, // รายการรูปภาพทั้งหมด
        },
      });
      return product;
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
      const oldProduct = await prisma.product.findUnique({
        where: {
          id: params.id,
        },
      });

      if (oldProduct?.image != null) {
        const filePath = "uploads/" + oldProduct?.image;
        const file = Bun.file(filePath);

        if (await file.exists()) {
          await file.delete();
        }
      }
      await prisma.product.delete({
        where: {
          id: params.id,
        },
      });
      return { message: "Product deleted successfully" };
    } catch (error) {
      return { error: error };
    }
  },
  search: async ({
    query,
    set,
  }: {
    query: { 
      q?: string;
      category?: string;
      page?: string;
      limit?: string;
    };
    set: any;
  }) => {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 12;
      const skip = (page - 1) * limit;
      
      // สร้างเงื่อนไขการค้นหา
      const where: any = {};
      
      // ถ้ามีคำค้นหา
      if (query.q) {
        where.name = {
          contains: query.q,
        };
      }
      
      // ถ้ามีการกรองตามหมวดหมู่
      if (query.category) {
        where.category = query.category;
      }
      
      // ดึงข้อมูลและจำนวนทั้งหมดพร้อมกัน
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.product.count({ where })
      ]);
      
      return {
        data: products,
        meta: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          limit
        }
      };
    } catch (error) {
      set.status = 500;
      return { 
        success: false, 
        message: "เกิดข้อผิดพลาดในการค้นหาสินค้า",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },

  // ดึงรายการหมวดหมู่ทั้งหมดพร้อมจำนวนสินค้า
  getCategories: async () => {
    try {
      // ดึงข้อมูลสินค้าทั้งหมด
      const products = await prisma.product.findMany({
        select: {
          category: true,
        }
      });
      
      // นับจำนวนสินค้าในแต่ละหมวดหมู่
      const categoryMap = new Map<string, number>();
      
      products.forEach(product => {
        if (product.category) {
          const count = categoryMap.get(product.category) || 0;
          categoryMap.set(product.category, count + 1);
        }
      });
      
      // แปลงเป็นรูปแบบที่ต้องการส่งกลับ
      const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count
      }));
      
      return categories;
    } catch (error) {
      return { 
        success: false, 
        message: "ไม่สามารถดึงข้อมูลหมวดหมู่ได้",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
  
  // ดึงสินค้ายอดนิยมตามเงื่อนไขที่กำหนด
  getPopularProducts: async ({
    query,
    set,
  }: {
    query: { 
      limit?: string;
      criteria?: string; // viewCount, salesCount, rating
    };
    set: any;
  }) => {
    try {
      const limit = Number(query.limit) || 8;
      const criteria = query.criteria || 'viewCount'; // ค่าเริ่มต้นคือ viewCount
      
      // ตรวจสอบว่า criteria ถูกต้องหรือไม่
      if (!['viewCount', 'salesCount', 'rating'].includes(criteria)) {
        set.status = 400;
        return {
          success: false,
          message: "เกณฑ์ไม่ถูกต้อง กรุณาใช้ viewCount, salesCount หรือ rating"
        };
      }
      
      // ดึงสินค้าตามเกณฑ์ที่กำหนด
      const products = await prisma.product.findMany({
        take: limit,
        orderBy: {
          [criteria]: 'desc' // เรียงจากมากไปน้อย
        }
      });
      
      return {
        success: true,
        data: products
      };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้ายอดนิยม",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
  
  // อัปเดตจำนวนการเข้าชมสินค้า
  updateViewCount: async ({
    params,
  }: {
    params: {
      id: string;
    };
  }) => {
    try {
      const product = await prisma.product.update({
        where: {
          id: params.id,
        },
        data: {
          viewCount: {
            increment: 1
          }
        },
      });
      
      return {
        success: true,
        message: "อัปเดตจำนวนการเข้าชมสำเร็จ"
      };
    } catch (error) {
      return {
        success: false,
        message: "เกิดข้อผิดพลาดในการอัปเดตจำนวนการเข้าชม",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },

  // ลบรูปภาพสินค้า
  removeImage: async ({
    params,
  }: {
    params: {
      id: string;
      imageName: string;
    };
  }) => {
    try {
      // ค้นหาสินค้า
      const product = await prisma.product.findUnique({
        where: {
          id: params.id,
        },
      });

      if (!product) {
        return {
          success: false,
          message: "ไม่พบสินค้า"
        };
      }

      // ตรวจสอบว่ารูปภาพที่จะลบอยู่ในรายการรูปภาพของสินค้าหรือไม่
      if (!product.images || !product.images.includes(params.imageName)) {
        return {
          success: false,
          message: "ไม่พบรูปภาพที่ต้องการลบ"
        };
      }

      // ลบไฟล์รูปภาพ
      const imageFile = Bun.file(`uploads/${params.imageName}`);
      if (await imageFile.exists()) {
        await imageFile.delete();
      }

      // ลบรูปภาพออกจากรายการรูปภาพของสินค้า
      const updatedImages = product.images.filter(img => img !== params.imageName);
      
      // ตรวจสอบว่าเป็นรูปหลักหรือไม่
      let updatedMainImage = product.image;
      if (product.image === params.imageName) {
        // ถ้าเป็นรูปหลัก ให้ใช้รูปแรกในรายการที่เหลือเป็นรูปหลักแทน (ถ้ามี)
        updatedMainImage = updatedImages.length > 0 ? updatedImages[0] : "";
      }

      // อัปเดตข้อมูลสินค้า
      await prisma.product.update({
        where: {
          id: params.id,
        },
        data: {
          image: updatedMainImage,
          images: updatedImages,
        },
      });

      return {
        success: true,
        message: "ลบรูปภาพสำเร็จ",
        mainImage: updatedMainImage,
        images: updatedImages
      };
    } catch (error) {
      return {
        success: false,
        message: "เกิดข้อผิดพลาดในการลบรูปภาพ",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
};
