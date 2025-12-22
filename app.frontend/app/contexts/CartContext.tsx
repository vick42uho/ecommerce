"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { Config } from "@/app/config";
import { CartInterface } from "@/app/interface/CartInterface";
import { toast } from "sonner";

interface CartContextType {
  cartItems: CartInterface[];
  cartCount: number;
  loading: boolean;
  fetchCartData: () => Promise<void>;
  addToCart: (productId: string, qty: number) => Promise<void>;
  updateCartItem: (cartId: string, productId: string, qty: number) => Promise<void>;
  removeFromCart: (cartId: string) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartInterface[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState("");

  // ดึงข้อมูล token และ memberId
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem(Config.tokenMember);
      if (!token) {
        return null;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(`${Config.apiURL}/api/member/info`, { headers });
      if (response.data && response.data.id) {
        setMemberId(response.data.id);
        return { token, memberId: response.data.id, headers };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return null;
    }
  };

  // ดึงข้อมูลตะกร้าสินค้า
  const fetchCartData = async () => {
    try {
      setLoading(true);
      
      const userInfo = await fetchUserInfo();
      if (!userInfo) {
        setCartItems([]);
        setCartCount(0);
        setLoading(false);
        return;
      }
      
      const { memberId, headers } = userInfo;
      
      const response = await axios.get(`${Config.apiURL}/api/cart/list/${memberId}`, { headers });
    
    if (response.data) {
      // ตรวจสอบและแก้ไขข้อมูลที่ได้จาก API
      const validCartItems = response.data.map((item: any) => {
        // ตรวจสอบว่ามี productId หรือไม่
        if (!item.productId && item.product?.id) {
          // ถ้าไม่มี productId แต่มี product.id ให้ใช้ product.id แทน
          console.log(`พบรายการที่ไม่มี productId ใช้ product.id แทน:`, item.product.id);
          return {
            ...item,
            productId: item.product.id
          };
        }
        return item;
      });
      
      console.log("ข้อมูลตะกร้าหลังแก้ไข:", validCartItems);
      setCartItems(validCartItems);
    } 
    } catch (error) {
      console.error("Error fetching cart data:", error);
      toast.error("ไม่สามารถดึงข้อมูลตะกร้าสินค้าได้", { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มสินค้าลงตะกร้า
  const addToCart = async (productId: string, qty: number) => {
    try {
      const userInfo = await fetchUserInfo();
      if (!userInfo) {
        toast.error("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า", { duration: 3000 });
        return;
      }
      
      const { memberId, headers } = userInfo;
      
      // แปลงค่าเป็น string ก่อนเปรียบเทียบเพื่อให้แน่ใจว่าจะตรงกัน
      const productIdString = String(productId);
      
      // แสดงข้อมูลเพื่อดีบัก
      console.log("ค้นหาสินค้า ID:", productIdString, "type:", typeof productIdString);
      console.log("รายการในตะกร้า (ละเอียด):", cartItems);
      
      // แสดงข้อมูลแต่ละรายการในตะกร้าพร้อมประเภทข้อมูล
      cartItems.forEach((item, index) => {
        console.log(`รายการที่ ${index}:`, {
          id: item.id,
          productId: item.productId,
          productIdType: typeof item.productId,
          isEqual: String(item.productId).trim() === productIdString.trim(),
          stringComparison: `'${String(item.productId).trim()}' === '${productIdString.trim()}'`
        });
      });
      
      // ใช้ trim() เพื่อตัดช่องว่างที่อาจมีอยู่
      const existingItemIndex = cartItems.findIndex(item => String(item.productId).trim() === productIdString.trim());
      
      if (existingItemIndex >= 0) {
        // ถ้ามีสินค้านี้อยู่แล้ว ให้เพิ่มจำนวน
        const updatedItems = [...cartItems];
        const newQty = updatedItems[existingItemIndex].qty + qty;
        const cartId = cartItems[existingItemIndex].id;
        
        // อัปเดต UI ก่อน (optimistic update)
        setCartItems(prev => {
          const newItems = [...prev];
          newItems[existingItemIndex].qty = newQty;
          return newItems;
        });
        
        try {
          // ถ้ามีสินค้านี้อยู่แล้ว ใช้ update เพื่อบวกจำนวนเพิ่ม
          await axios.put(`${Config.apiURL}/api/cart/update`, {
            id: cartId,
            memberId,
            productId: productIdString,
            qty: newQty // ส่งจำนวนรวมทั้งหมดที่ต้องการ
          }, { headers });
          
          // toast.success("เพิ่มจำนวนสินค้าในตะกร้าแล้ว", { duration: 3000 });
        } catch (error) {
          console.error("Error updating cart item:", error);
          toast.error("ไม่สามารถอัปเดตจำนวนสินค้าได้", { duration: 3000 });
          fetchCartData(); // รีเฟรชข้อมูลเฉพาะเมื่อเกิดข้อผิดพลาด
        }
      } else {
        // ถ้ายังไม่มีสินค้านี้ ให้เพิ่มเข้าไปใหม่
        const tempId = `temp-${Date.now()}`;
        
        // อัปเดต UI ก่อน (optimistic update)
        setCartItems(prev => [...prev, {
          id: tempId,
          memberId,
          productId: productIdString,
          qty,
          product: {
            id: productIdString,
            name: "กำลังโหลด...", // ข้อมูลชั่วคราว
            price: 0,
            image: "",
            description: "",
            isbn: "",
            category: ""
          }
        }]);
        
        try {
          // ถ้ายังไม่มีสินค้านี้ ใช้ add เพื่อสร้างใหม่
          await axios.post(`${Config.apiURL}/api/cart/add`, {
            memberId,
            productId: productIdString,
            qty
          }, { headers });
          
          // toast.success("เพิ่มสินค้าลงตะกร้าแล้ว", { duration: 3000 });
          
          // อัปเดตข้อมูลตะกร้าเพื่อให้ได้ข้อมูลที่ถูกต้องจากเซิร์ฟเวอร์
          setTimeout(() => {
            fetchCartData();
          }, 300);
        } catch (error) {
          console.error("Error adding to cart:", error);
          toast.error("ไม่สามารถเพิ่มสินค้าลงตะกร้าได้", { duration: 3000 });
          fetchCartData(); // รีเฟรชข้อมูลเมื่อเกิดข้อผิดพลาด
        }
      }
    } catch (error) {
      console.error("Error in addToCart function:", error);
      toast.error("เกิดข้อผิดพลาดในการจัดการตะกร้าสินค้า", { duration: 3000 });
      fetchCartData();
    }
  };

  // อัปเดตจำนวนสินค้าในตะกร้า
  const updateCartItem = async (cartId: string, productId: string, qty: number) => {
    try {
      const userInfo = await fetchUserInfo();
      if (!userInfo) {
        toast.error("กรุณาเข้าสู่ระบบก่อนอัปเดตจำนวนสินค้า", { duration: 3000 });
        return;
      }
      
      const { memberId, headers } = userInfo;
      
      if (qty === 0) {
        await removeFromCart(cartId);
        return;
      }
      
      // อัปเดตข้อมูลในหน้าจอทันที (optimistic update)
      setCartItems(prev => prev.map(item => 
        item.id === cartId ? { ...item, qty } : item
      ));
      
      // ส่งข้อมูลไปยัง API - ใช้ PUT method แทน POST
      // ส่งค่า qty เป็นค่าที่ต้องการตั้ง ไม่ใช่ค่าที่จะเพิ่มเข้าไป
      await axios.put(`${Config.apiURL}/api/cart/update`, {
        id: cartId,
        memberId,
        productId,
        qty: qty // ส่งค่า qty ที่ต้องการตั้งเป็นค่าใหม่ ไม่ใช่ค่าที่จะบวกเพิ่ม
      }, { headers });
      
      // ไม่ต้องเรียก fetchCartData ทันที เพราะเราได้ทำ optimistic update แล้ว
      
      // toast.success("อัปเดตจำนวนสินค้าแล้ว", { duration: 3000 });
    } catch (error) {
      console.error("Error updating cart item:", error);
      toast.error("ไม่สามารถอัปเดตจำนวนสินค้าได้", { duration: 3000 });
      fetchCartData(); // รีเฟรชข้อมูลเฉพาะเมื่อเกิดข้อผิดพลาด
    }
  };

  // ลบสินค้าออกจากตะกร้า
  const removeFromCart = async (cartId: string) => {
    try {
      const userInfo = await fetchUserInfo();
      if (!userInfo) {
        toast.error("กรุณาเข้าสู่ระบบก่อนลบสินค้า", { duration: 3000 });
        return;
      }
      
      const { headers } = userInfo;
      
      await axios.delete(`${Config.apiURL}/api/cart/remove/${cartId}`, { headers });
      
      // อัปเดตข้อมูลในหน้าจอทันที (optimistic update)
      setCartItems(prev => prev.filter(item => item.id !== cartId));
      
      toast.success("ลบสินค้าออกจากตะกร้าแล้ว", { duration: 3000 });
    } catch (error) {
      console.error("Error removing item from cart:", error);
      toast.error("ไม่สามารถลบสินค้าออกจากตะกร้าได้", { duration: 3000 });
      fetchCartData(); // รีเฟรชข้อมูลเพื่อให้แน่ใจว่าข้อมูลถูกต้อง
    }
  };

  // คำนวณจำนวนสินค้าเมื่อ cartItems เปลี่ยนแปลง
  useEffect(() => {
    const totalItems = cartItems.reduce((total, item) => total + item.qty, 0);
    setCartCount(totalItems);
  }, [cartItems]);

  // ดึงข้อมูลตะกร้าเมื่อโหลดหน้า
  useEffect(() => {
    fetchCartData();
    
    // ตั้งเวลาให้รีเฟรชข้อมูลทุก 2 นาที แทนที่จะเป็นทุก 30 วินาที
    const interval = setInterval(fetchCartData, 120000);
    
    return () => clearInterval(interval);
  }, []);

  // เพิ่มฟังก์ชันล้างตะกร้า
  const clearCart = () => {
    setCartItems([]);
    setCartCount(0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        loading,
        fetchCartData,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
