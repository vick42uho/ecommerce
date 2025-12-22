"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Config } from "@/app/config";
import { ProductInterface } from "@/app/interface/ProductInterface";
import { toast } from "sonner";
import { useCart } from "@/app/contexts/CartContext";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Eye } from "lucide-react";

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryName = decodeURIComponent(params.name as string);
  const { addToCart } = useCart(); // ใช้ addToCart จาก CartContext
  
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [addingToCart, setAddingToCart] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${Config.apiURL}/api/product/search`, {
          params: {
            category: categoryName,
            page: currentPage,
            limit: 12
          }
        });

        if (response.data) {
          setProducts(response.data.data);
          setTotalPages(response.data.meta.totalPages);
          setTotalProducts(response.data.meta.total);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("ไม่สามารถโหลดข้อมูลสินค้าได้", { duration: 3000 });
      } finally {
        setLoading(false);
      }
    };

    fetchProductsByCategory();
  }, [categoryName, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = async (product: ProductInterface) => {
    try {
      // เพิ่มสถานะกำลังเพิ่มลงตะกร้าสำหรับสินค้านี้
      setAddingToCart(prev => ({ ...prev, [product.id]: true }));
      
      // ใช้ addToCart จาก CartContext แทนการเรียก API โดยตรง
      await addToCart(product.id, 1); // เพิ่มทีละ 1 ชิ้นในหน้ารายการสินค้า
      
      // แสดง toast แจ้งเตือนเพิ่มสินค้าสำเร็จ
      toast.success(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, {
        duration: 3000,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      // ไม่ต้องแสดง toast error เพราะ CartContext จะจัดการให้แล้ว
      // กรณีไม่ได้ล็อกอิน CartContext จะแสดง toast และ redirect ไปยังหน้าล็อกอินให้อัตโนมัติ
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">หมวดหมู่: {categoryName}</h1>
        <p className="text-muted-foreground">พบ {totalProducts} รายการ</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-square relative bg-gray-100">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">ไม่พบสินค้าในหมวดหมู่นี้</h2>
          <p className="text-muted-foreground mb-6">ลองค้นหาในหมวดหมู่อื่น หรือกลับไปยังหน้าหลัก</p>
          <Button asChild>
            <Link href="/web">กลับไปยังหน้าหลัก</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square relative bg-gray-100">
                  {product.image && (
                    <Image
                      src={`${Config.apiURL}/uploads/${product.image}`}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                    />
                  )}
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                </CardHeader>
                <CardFooter className="p-4 pt-0 flex flex-col space-y-3">
                  <div className="flex justify-between items-center w-full">
                    <p className="font-bold text-lg">{product.price.toLocaleString()} บาท</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/web/product/${product.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        ดูรายละเอียด
                      </Link>
                    </Button>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCart[product.id]}
                  >
                    {addingToCart[product.id] ? (
                      <>กำลังเพิ่ม...</>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        เพิ่มลงตะกร้า
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-10">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ก่อนหน้า
                </Button>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <Button
                    key={index}
                    variant={currentPage === index + 1 ? "default" : "outline"}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
