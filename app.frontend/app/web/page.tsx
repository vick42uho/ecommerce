"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductInterface } from "@/app/interface/ProductInterface";
import axios from "axios";
import { Config } from "@/app/config";
import { toast, Toaster } from "sonner";
import { ArrowRight, Tag, TrendingUp, Star } from "lucide-react";
import Link from "next/link";

export default function Member() {
  const [productList, setProductList] = useState<ProductInterface[]>([]);
  const [popularProducts, setPopularProducts] = useState<ProductInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Config.apiURL}/api/product/list`);
      if (response.status === 200) {
        setProductList(response.data);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า", {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // ดึงข้อมูลสินค้ายอดนิยม
  const fetchPopularProducts = async (criteria: string = 'viewCount') => {
    try {
      setPopularLoading(true);
      const response = await axios.get(`${Config.apiURL}/api/product/popular`, {
        params: {
          limit: 8,
          criteria
        }
      });
      
      if (response.status === 200 && response.data.success) {
        setPopularProducts(response.data.data);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้ายอดนิยม", {
        duration: 3000,
      });
    } finally {
      setPopularLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPopularProducts();
  }, []);

  // กลุ่มหมวดหมู่สินค้าที่แสดงในหน้าหลัก
  const categories = [
    { name: "อาหารและเครื่องดื่ม", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&h=200&auto=format&fit=crop", color: "from-orange-500 to-red-500" },
    { name: "สุขภาพและความงาม", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=200&h=200&auto=format&fit=crop", color: "from-pink-500 to-purple-500" },
    { name: "แฟชั่น", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=200&h=200&auto=format&fit=crop", color: "from-blue-500 to-indigo-500" },
    { name: "อิเล็กทรอนิกส์", image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=200&h=200&auto=format&fit=crop", color: "from-green-500 to-teal-500" },
  ];

  // โปรโมชั่นพิเศษ
  const promotions = [
    { title: "ส่วนลด 20% สำหรับสินค้าใหม่", description: "เฉพาะสินค้าที่เพิ่งเข้ามาในร้าน", color: "bg-blue-100 dark:bg-blue-950" },
    { title: "ส่งฟรีเมื่อซื้อครบ 500 บาท", description: "ทั่วประเทศไทย", color: "bg-green-100 dark:bg-green-950" },
    { title: "รับเพิ่ม 10% เมื่อสั่งซื้อผ่านแอพ", description: "ดาวน์โหลดแอพวันนี้", color: "bg-purple-100 dark:bg-purple-950" },
  ];

  // แสดงสินค้าตามหมวดหมู่
  const getProductsByCategory = (category: string) => {
    return productList.filter(product => product.category === category).slice(0, 4);
  };

  // แสดงสินค้าล่าสุด
  const getLatestProducts = () => {
    return [...productList].sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }).slice(0, 8);
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      {/* Hero section */}
      <section className="rounded-lg overflow-hidden bg-gradient-to-r from-purple-600 to-blue-500 text-white">
        <div className="container py-12 px-4 md:px-6 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">สินค้าคุณภาพดี ราคาเป็นมิตร</h1>
              <p className="text-lg opacity-90">ค้นพบสินค้าหลากหลายประเภทที่คัดสรรมาเพื่อคุณโดยเฉพาะ</p>
              <div className="pt-4">
                <Button asChild size="lg" variant="secondary">
                  <Link href="/web/products">ช้อปเลย</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-64 md:h-auto">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-lg transform rotate-3"></div>
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-lg transform -rotate-3"></div>
              <div className="relative bg-white/20 backdrop-blur-md rounded-lg p-6 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  {productList.slice(0, 4).map((product) => (
                    <div key={product.id} className="bg-white/20 backdrop-blur-md rounded-lg overflow-hidden">
                      <div className="h-24 relative">
                        {product.image ? (
                          <img 
                            src={`${Config.apiURL}/uploads/${product.image}`} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400">🖼️</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* หมวดหมู่ยอดนิยม */}
      {/* <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">หมวดหมู่ยอดนิยม</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/web/categories" className="flex items-center gap-1">
              ดูทั้งหมด <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link href={`/web/category/${category.name}`} key={category.name}>
              <div className="relative overflow-hidden rounded-lg group h-40">
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-80 group-hover:opacity-90 transition-opacity`}></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white">
                  <h3 className="text-xl font-bold text-center">{category.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section> */}

      {/* โปรโมชั่น */}
      {/* <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">โปรโมชั่นพิเศษ</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/web/promotions" className="flex items-center gap-1">
              ดูทั้งหมด <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promotions.map((promo, index) => (
            <Card key={index} className={`${promo.color} border-0`}>
              <CardContent className="p-6">
                <Tag className="h-10 w-10 mb-4" />
                <h3 className="text-xl font-bold mb-2">{promo.title}</h3>
                <p className="text-muted-foreground">{promo.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section> */}

      {/* สินค้าแนะนำ */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">สินค้าแนะนำ</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/web/products" className="flex items-center gap-1">
              ดูทั้งหมด <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="latest" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="latest" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> ล่าสุด
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center gap-1">
              <Star className="h-4 w-4" /> ยอดนิยม
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="latest" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {loading ? (
                // แสดง skeleton loading
                Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden border-0 shadow-sm">
                    <div className="h-48 bg-muted animate-pulse"></div>
                    <CardContent className="p-4">
                      <div className="h-4 w-2/3 bg-muted animate-pulse mb-2"></div>
                      <div className="h-4 w-1/3 bg-muted animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                getLatestProducts().map((product) => (
                  <Link href={`/web/product/${product.id}`} key={product.id}>
                    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative h-48 bg-muted">
                        {product.image ? (
                          <img
                            src={`${Config.apiURL}/uploads/${product.image}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-gray-100">
                            <span className="text-gray-400 text-4xl">🖼️</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium truncate">{product.name}</h3>
                        <p className="text-primary font-semibold mt-1">{product.price.toLocaleString()} บาท</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="popular" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popularLoading ? (
                // แสดง skeleton loading
                Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden border-0 shadow-sm">
                    <div className="h-48 bg-muted animate-pulse"></div>
                    <CardContent className="p-4">
                      <div className="h-4 w-2/3 bg-muted animate-pulse mb-2"></div>
                      <div className="h-4 w-1/3 bg-muted animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                popularProducts.map((product) => (
                  <Link href={`/web/product/${product.id}`} key={product.id}>
                    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative h-48 bg-muted">
                        {product.image ? (
                          <img
                            src={`${Config.apiURL}/uploads/${product.image}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-gray-100">
                            <span className="text-gray-400 text-4xl">🖼️</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium truncate">{product.name}</h3>
                        <p className="text-primary font-semibold mt-1">{product.price.toLocaleString()} บาท</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}