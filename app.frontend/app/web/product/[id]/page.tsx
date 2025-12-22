"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Config } from "@/app/config";
import { ProductInterface } from "@/app/interface/ProductInterface";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  ShoppingCart, 
  Heart, 
  Share, 
  Check,
  MinusCircle,
  PlusCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/app/contexts/CartContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<ProductInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductInterface[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");
  
  const { addToCart, updateCartItem, cartItems, fetchCartData } = useCart();

  // อัปเดตจำนวนการเข้าชมสินค้า
  const updateViewCount = async (id: string) => {
    try {
      // เพิ่ม flag ลงใน localStorage เพื่อตรวจสอบว่าได้อัปเดตการเข้าชมแล้วหรือไม่
      const viewKey = `product_viewed_${id}`;
      const hasViewed = localStorage.getItem(viewKey);
      
      // ถ้ายังไม่เคยอัปเดตในเซสชันนี้ ให้อัปเดต
      if (!hasViewed) {
        await axios.put(`${Config.apiURL}/api/product/view/${id}`);
        console.log("อัปเดตจำนวนการเข้าชมสำเร็จ");
        
        // บันทึกลง localStorage ว่าได้อัปเดตแล้ว (เก็บไว้ 1 วัน)
        const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 ชั่วโมง
        localStorage.setItem(viewKey, expiryTime.toString());
      } else {
        console.log("ข้ามการอัปเดตเนื่องจากเคยเข้าชมแล้ว");
      }
    } catch (error) {
      console.error("Error updating view count:", error);
      // ไม่แสดง toast เพื่อไม่รบกวนผู้ใช้
    }
  };

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${Config.apiURL}/api/product/list`);
        
        if (response.data) {
          // หาสินค้าที่ตรงกับ ID
          const foundProduct = response.data.find((p: ProductInterface) => p.id === productId);
          
          if (foundProduct) {
            setProduct(foundProduct);
            
            // ตั้งค่ารูปภาพเริ่มต้น (รูปแรกจากอาร์เรย์ images หรือรูปหลัก)
            if (foundProduct.images && foundProduct.images.length > 0) {
              setSelectedImage(foundProduct.images[0]);
            } else if (foundProduct.image) {
              setSelectedImage(foundProduct.image);
            }
            
            // หาสินค้าที่เกี่ยวข้อง (สินค้าในหมวดหมู่เดียวกัน)
            const related = response.data
              .filter((p: ProductInterface) => 
                p.category === foundProduct.category && p.id !== productId
              )
              .slice(0, 4); // แสดงแค่ 4 รายการ
              
            setRelatedProducts(related);
            
            // อัปเดตจำนวนการเข้าชม
            updateViewCount(productId);
          } else {
            toast.error("ไม่พบสินค้าที่ค้นหา", { duration: 3000 });
            router.push("/web");
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("ไม่สามารถโหลดข้อมูลสินค้าได้", { duration: 3000 });
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetail();
    }
  }, [productId, router]);


  // เพิ่มสินค้าลงตะกร้าตามจำนวนที่เลือก
  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      
      // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบหรือไม่
      const token = localStorage.getItem(Config.tokenMember);
      if (!token) {
        toast.error("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า", { duration: 3000 });
        router.push("/web/member/sign-in");
        return;
      }
      
      // ตรวจสอบให้แน่ใจว่า productId เป็น string
      const productIdString = String(productId);
      console.log("ตรวจสอบ productId:", productIdString, "type:", typeof productIdString);
      
      // ดึงข้อมูลตะกร้าล่าสุดก่อน
      await fetchCartData();
      
      // แสดงข้อมูลแต่ละรายการในตะกร้าพร้อมประเภทข้อมูล
      console.log("รายการในตะกร้าทั้งหมด:", cartItems);
      cartItems.forEach((item, index) => {
        console.log(`รายการที่ ${index}:`, {
          id: item.id,
          productId: item.productId,
          productIdType: typeof item.productId,
          isEqual: String(item.productId) === productIdString,
          stringComparison: `'${String(item.productId)}' === '${productIdString}'`
        });
      });
      
      // ใช้วิธีเปรียบเทียบด้วย ObjectId โดยตรง
      const existingItem = cartItems.find(item => {
        // เปรียบเทียบด้วยค่า string ที่แปลงแล้ว
        return String(item.productId).trim() === productIdString.trim();
      });
      
      if (existingItem) {
        // ถ้ามีสินค้านี้อยู่แล้ว ให้เพิ่มจำนวนเข้าไปในจำนวนที่มีอยู่
        console.log("พบสินค้าในตะกร้า:", existingItem);
        const newQty = existingItem.qty + quantity;
        await updateCartItem(existingItem.id, productIdString, newQty);
        
        toast.success(`เพิ่ม ${product?.name} อีก ${quantity} ชิ้น รวมเป็น ${newQty} ชิ้น`, {
          duration: 3000,
        });
      } else {
        // ถ้ายังไม่มีสินค้านี้ ให้เพิ่มใหม่
        console.log("ไม่พบสินค้าในตะกร้า productId:", productIdString);
        console.log("รายการในตะกร้าปัจจุบัน:", cartItems);
        await addToCart(productIdString, quantity);
        toast.success(`เพิ่ม ${product?.name} จำนวน ${quantity} ชิ้นลงตะกร้าแล้ว`, {
          duration: 3000,
        });
      }
      
      setQuantity(1); // รีเซ็ตจำนวนใน UI
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("ไม่สามารถเพิ่มสินค้าลงตะกร้าได้", { duration: 3000 });
    } finally {
      setAddingToCart(false);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  if (loading) {
    return (
      
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square relative bg-gray-100">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-20 rounded-md" />
            ))}
          </div>
        </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="pt-4">
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">ไม่พบสินค้า</h1>
        <p className="text-muted-foreground mb-6">สินค้าที่คุณกำลังค้นหาอาจถูกลบหรือย้ายไปแล้ว</p>
        <Button asChild>
          <Link href="/web">กลับไปยังหน้าหลัก</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* ปุ่มกลับ */}
      <Button 
        variant="ghost" 
        className="mb-6 pl-0" 
        onClick={() => router.back()}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        กลับ
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* รูปภาพสินค้า */}
        <div className="space-y-4">
          <div className="aspect-square relative bg-gray-50 rounded-lg overflow-hidden border">
            {selectedImage || product.image ? (
              <Image
                src={`${Config.apiURL}/uploads/${selectedImage || product.image}`}
                alt={product.name}
                fill
                className="object-contain p-4"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-100">
                <span className="text-gray-400 text-4xl">🖼️</span>
              </div>
            )}
          </div>
          
          {/* แกลเลอรี่รูปภาพขนาดเล็ก */}
          {product.images && product.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, index) => (
                <div 
                  key={index} 
                  className={`relative w-20 h-20 rounded-md overflow-hidden border cursor-pointer transition-all ${(selectedImage === img || (!selectedImage && index === 0 && img === product.image)) ? 'border-black ring-2 ring-black' : 'border-gray-200 hover:border-gray-400'}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <Image
                    src={`${Config.apiURL}/uploads/${img}`}
                    alt={`${product.name} - รูปที่ ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* รายละเอียดสินค้า */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="outline">{product.category}</Badge>
              <span className="text-sm text-muted-foreground">รหัสสินค้า: {product.isbn}</span>
            </div>
            <p className="text-3xl font-bold text-primary">{product.price.toLocaleString()} บาท</p>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-2">รายละเอียด</h2>
            <p className="text-muted-foreground">{product.description}</p>
          </div>
          
          {/* ตัวเลือกจำนวน */}
          <div className="pt-4">
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-sm font-medium">จำนวน:</span>
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full" 
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full" 
                  onClick={increaseQuantity}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* ปุ่มเพิ่มลงตะกร้า */}
            <div className="flex space-x-4">
              <Button 
                className="flex-1 bg-black hover:bg-gray-800 text-white" 
                size="lg" 
                onClick={() => handleAddToCart()}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <>กำลังเพิ่ม...</>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5"/>
                    เพิ่มลงตะกร้า
                  </>
                )}
              </Button>
              {/* <Button variant="outline" size="lg" className="border-gray-300">
                <Heart className="h-5 w-5" />
              </Button> */}
            </div>
          </div>
        </div>
      </div>
      
      {/* สินค้าที่เกี่ยวข้อง */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">สินค้าที่เกี่ยวข้อง</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Card key={relatedProduct.id} className="overflow-hidden">
                <div className="aspect-square relative bg-gray-100">
                  {relatedProduct.image && (
                    <Image
                      src={`${Config.apiURL}/uploads/${relatedProduct.image}`}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                    />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-1">{relatedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{relatedProduct.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="font-bold">{relatedProduct.price.toLocaleString()} บาท</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/web/product/${relatedProduct.id}`}>ดูรายละเอียด</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
