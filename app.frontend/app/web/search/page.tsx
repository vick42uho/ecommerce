"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Config } from "@/app/config";
import { ProductInterface } from "@/app/interface/ProductInterface";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Eye } from "lucide-react";
import { ApiError } from "@/app/interface/ErrorInterface";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [addingToCart, setAddingToCart] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${Config.apiURL}/api/product/search`, {
          params: {
            q: query,
            category: category,
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

    if (query || category) {
      fetchProducts();
    } else {
      setLoading(false);
      setProducts([]);
      setTotalProducts(0);
    }
  }, [query, category, currentPage]);

  // ฟังก์ชันสำหรับการค้นหาแบบ real-time
  useEffect(() => {
    // ใช้ debounce เพื่อไม่ให้ส่ง request บ่อยเกินไป
    const debounceTimeout = setTimeout(() => {
      if (searchQuery !== query) {
        const url = new URL(window.location.href);
        url.searchParams.set("q", searchQuery);
        window.history.pushState({}, "", url.toString());
        
        // Trigger the search
        const event = new Event("popstate");
        window.dispatchEvent(event);
      }
    }, 500); // รอ 500ms หลังจากพิมพ์เสร็จก่อนค้นหา
    
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, query]);
  
  // สำหรับการกด Enter ที่ฟอร์ม
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // ไม่ต้องทำอะไรเพิ่มเติม เพราะ useEffect จะจัดการให้
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = async (product: ProductInterface) => {
    try {
      // เพิ่มสถานะกำลังเพิ่มลงตะกร้าสำหรับสินค้านี้
      setAddingToCart(prev => ({ ...prev, [product.id]: true }));
      
      // ในอนาคตจะเชื่อมต่อกับ API เพื่อเพิ่มสินค้าลงตะกร้า
      // สำหรับตอนนี้แค่จำลองการเพิ่มสินค้า
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, {
        duration: 3000,
      });
    } catch (error) {
      toast.error("ไม่สามารถเพิ่มสินค้าลงตะกร้าได้", { duration: 3000 });
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        {/* <h1 className="text-3xl font-bold mb-6">ค้นหาสินค้า</h1>
        
        <form onSubmit={handleSearch} className="flex w-full max-w-lg mb-8 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="พิมพ์เพื่อค้นหาสินค้า..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>
        </form> */}
        
        {query && (
          <p className="text-muted-foreground mb-4">
            ผลการค้นหาสำหรับ: <span className="font-medium text-foreground">"{query}"</span>
            {category && <span> ในหมวดหมู่ <span className="font-medium text-foreground">{category}</span></span>}
            {totalProducts > 0 && <span> - พบ {totalProducts} รายการ</span>}
          </p>
        )}
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
      ) : !query && !category ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-4">กรุณาใส่คำค้นหาเพื่อเริ่มต้นค้นหาสินค้า</h2>
          <p className="text-muted-foreground">คุณสามารถค้นหาตามชื่อสินค้าหรือเลือกดูตามหมวดหมู่ได้</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">ไม่พบสินค้าที่ตรงกับคำค้นหา</h2>
          <p className="text-muted-foreground mb-6">ลองใช้คำค้นหาอื่น หรือกลับไปยังหน้าหลัก</p>
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
