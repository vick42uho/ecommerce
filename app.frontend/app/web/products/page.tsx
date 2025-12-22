"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from 'next/navigation';
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
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ShoppingCart, 
  Eye, 
  Filter, 
  ChevronDown,
  SlidersHorizontal,
  Check
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/app/interface/ProductInterface";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  
  // เพิ่มการใช้ CartContext
  const { addToCart } = useCart();
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products, setProducts] = useState<ProductInterface[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductInterface[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortOption, setSortOption] = useState("latest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [addingToCart, setAddingToCart] = useState<{[key: string]: boolean}>({});
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // ดึงข้อมูลสินค้าและหมวดหมู่
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // ดึงข้อมูลสินค้าทั้งหมด
        const productsResponse = await axios.get(`${Config.apiURL}/api/product/list`);
        
        // ดึงข้อมูลหมวดหมู่
        const categoriesResponse = await axios.get(`${Config.apiURL}/api/product/categories`);
        
        if (productsResponse.data) {
          setProducts(productsResponse.data);
        }
        
        if (categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("ไม่สามารถโหลดข้อมูลสินค้าได้", { duration: 3000 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // กรองและจัดเรียงสินค้า
  useEffect(() => {
    let result = [...products];
    
    // กรองตามคำค้นหา
    if (searchQuery) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // กรองตามหมวดหมู่
    if (selectedCategory) {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    // กรองตามช่วงราคา
    result = result.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // จัดเรียง
    switch (sortOption) {
      case "latest":
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    
    setFilteredProducts(result);
    setTotalPages(Math.ceil(result.length / itemsPerPage));
    setCurrentPage(1); // รีเซ็ตหน้าเมื่อมีการเปลี่ยนแปลงการกรอง
  }, [products, searchQuery, selectedCategory, priceRange, sortOption, itemsPerPage]);

  // คำนวณสินค้าที่จะแสดงในหน้าปัจจุบัน
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

// ฟังก์ชันเพิ่มสินค้าลงตะกร้าที่แก้ไขแล้ว
const handleAddToCart = async (product: ProductInterface) => {
  // 1. ตรวจสอบก่อนเลยว่าล็อกอินหรือยัง (Guard Clause)
  const token = localStorage.getItem(Config.tokenMember);
  if (!token) {
    toast.error("กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า", { duration: 3000 });
    router.push("/web/member/sign-in"); // <-- ใช้ router.push
    return; // จบการทำงานทันที
  }

  // 2. ถ้าล็อกอินแล้ว ถึงจะเข้ากระบวนการหลัก
  try {
    setAddingToCart(prev => ({ ...prev, [product.id]: true }));
    const productIdString = String(product.id);
    await addToCart(productIdString, 1);
    toast.success(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`, {
      duration: 3000,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    toast.error("ไม่สามารถเพิ่มสินค้าลงตะกร้าได้", { duration: 3000 });
  } finally {
    setAddingToCart(prev => ({ ...prev, [product.id]: false }));
  }
};

  // ฟังก์ชันเปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ฟังก์ชันล้างตัวกรอง
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setPriceRange([0, 100000]);
    setSortOption("latest");
  };

  // ฟังก์ชันค้นหา
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // หาราคาต่ำสุดและสูงสุดของสินค้า
  const minPrice = products.length > 0 ? Math.min(...products.map(p => p.price)) : 0;
  const maxPrice = products.length > 0 ? Math.max(...products.map(p => p.price)) : 100000;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">สินค้าทั้งหมด</h1>
        <p className="text-muted-foreground">
          พบ {filteredProducts.length} รายการ
          {selectedCategory && <span> ในหมวดหมู่ <span className="font-medium">{selectedCategory}</span></span>}
          {searchQuery && <span> สำหรับคำค้นหา <span className="font-medium">"{searchQuery}"</span></span>}
        </p>
      </div>

      {/* แถบค้นหาและกรอง */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="ค้นหาสินค้า..."
            className="pl-10 pr-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
        </form>

        <div className="flex gap-2">
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="เรียงตาม" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">ล่าสุด</SelectItem>
              <SelectItem value="price-low">ราคาต่ำ-สูง</SelectItem>
              <SelectItem value="price-high">ราคาสูง-ต่ำ</SelectItem>
              <SelectItem value="name-asc">ตามชื่อ A-Z</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            className="md:hidden"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            ตัวกรอง
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ตัวกรองด้านข้าง (แสดงบนจอใหญ่) */}
        <div className="hidden md:block space-y-6">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">ตัวกรอง</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                ล้างทั้งหมด
              </Button>
            </div>

            <Accordion type="single" collapsible defaultValue="category">
              <AccordionItem value="category">
                <AccordionTrigger>หมวดหมู่</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div 
                      className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent ${!selectedCategory ? 'bg-accent' : ''}`}
                      onClick={() => setSelectedCategory("")}
                    >
                      <span>ทั้งหมด</span>
                      {!selectedCategory && <Check className="h-4 w-4" />}
                    </div>
                    {categories.map(category => (
                      <div 
                        key={category.name}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent ${selectedCategory === category.name ? 'bg-accent' : ''}`}
                        onClick={() => setSelectedCategory(category.name)}
                      >
                        <span>{category.name}</span>
                        <span className="text-xs text-muted-foreground">({category.count})</span>
                        {selectedCategory === category.name && <Check className="h-4 w-4" />}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="price">
                <AccordionTrigger>ช่วงราคา</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>฿{priceRange[0].toLocaleString()}</span>
                      <span>฿{priceRange[1].toLocaleString()}</span>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        min={minPrice}
                        max={maxPrice}
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                        className="w-full"
                      />
                      <input
                        type="range"
                        min={minPrice}
                        max={maxPrice}
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-full"
                        min={0}
                      />
                      <span className="flex items-center">-</span>
                      <Input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                        className="w-full"
                        min={0}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* ตัวกรองบนมือถือ */}
        {isMobileFilterOpen && (
          <div className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50 p-4">
            <div className="bg-card rounded-lg border p-4 max-w-md mx-auto mt-16">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">ตัวกรอง</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsMobileFilterOpen(false)}>
                  ✕
                </Button>
              </div>

              <Accordion type="single" collapsible defaultValue="category">
                <AccordionItem value="category">
                  <AccordionTrigger>หมวดหมู่</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <div 
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent ${!selectedCategory ? 'bg-accent' : ''}`}
                        onClick={() => setSelectedCategory("")}
                      >
                        <span>ทั้งหมด</span>
                        {!selectedCategory && <Check className="h-4 w-4" />}
                      </div>
                      {categories.map(category => (
                        <div 
                          key={category.name}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent ${selectedCategory === category.name ? 'bg-accent' : ''}`}
                          onClick={() => setSelectedCategory(category.name)}
                        >
                          <span>{category.name}</span>
                          <span className="text-xs text-muted-foreground">({category.count})</span>
                          {selectedCategory === category.name && <Check className="h-4 w-4" />}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="price">
                  <AccordionTrigger>ช่วงราคา</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>฿{priceRange[0].toLocaleString()}</span>
                        <span>฿{priceRange[1].toLocaleString()}</span>
                      </div>
                      <div className="px-1">
                        <input
                          type="range"
                          min={minPrice}
                          max={maxPrice}
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                          className="w-full"
                        />
                        <input
                          type="range"
                          min={minPrice}
                          max={maxPrice}
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                          className="w-full"
                          min={0}
                        />
                        <span className="flex items-center">-</span>
                        <Input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                          className="w-full"
                          min={0}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={clearFilters}>
                  ล้างตัวกรอง
                </Button>
                <Button className="flex-1" onClick={() => setIsMobileFilterOpen(false)}>
                  ดูผลลัพธ์
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* รายการสินค้า */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
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
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">ไม่พบสินค้า</h2>
              <p className="text-muted-foreground mb-6">ลองปรับเปลี่ยนตัวกรองหรือคำค้นหา</p>
              <Button onClick={clearFilters}>ล้างตัวกรอง</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {getCurrentPageItems().map((product) => (
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
                      <Badge className="absolute top-2 right-2 bg-primary/90">{product.category}</Badge>
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
                        className={index >= currentPage + 3 || index < currentPage - 3 ? 'hidden sm:flex' : ''}
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
      </div>
    </div>
  );
}
