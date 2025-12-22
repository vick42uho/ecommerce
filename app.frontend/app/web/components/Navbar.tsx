"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Config } from "@/app/config";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Sun,
  Moon,
  MailOpen,
  LogOut,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Category } from "@/app/interface/ProductInterface";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CartIcon from "./CartIcon";
import { Badge } from "@/components/ui/badge";

export const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [username, setUsername] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [memberId, setMemberId] = useState("");

  const fetchData = async () => {
    try {
      const token = localStorage.getItem(Config.tokenMember);
      if (token != undefined) {
        const headers = {
          Authorization: "Bearer " + token,
        };
        const url = Config.apiURL + "/api/member/info";
        const response = await axios.get(url, { headers });
        if (response.status === 200) {
          setUsername(response.data.username);
          setMemberId(response.data.id);
        }
      }
      return username;
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด:" + error, {
        duration: 9000,
      });
    }
  };

  // ดึงข้อมูลหมวดหมู่จาก API
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await axios.get(
        `${Config.apiURL}/api/product/categories`
      );
      if (response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลหมวดหมู่ได้", { duration: 3000 });
      console.error("Error fetching categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  // ฟังก์ชันสำหรับการค้นหาแบบ real-time
  useEffect(() => {
    // ใช้ debounce เพื่อไม่ให้ส่ง request บ่อยเกินไป
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        router.push(`/web/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }, 500); // รอ 500ms หลังจากพิมพ์เสร็จก่อนค้นหา

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, router]);

  // สำหรับการกด Enter ที่ฟอร์ม
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // ไม่ต้องทำอะไรเพิ่มเติม เพราะ useEffect จะจัดการให้
  };

  const handleSignOut = () => {
    localStorage.removeItem(Config.tokenMember);
    toast.success("ออกจากระบบเรียบร้อย", { duration: 3000 });
    window.location.href = "/web";
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo และชื่อร้าน */}
            <div className="flex items-center">
              <Link href="/web" className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
                  WickShop
                </span>
              </Link>
            </div>

            {/* เมนูสำหรับหน้าจอขนาดใหญ่ */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/web"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                หน้าหลัก
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    หมวดหมู่
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {categoriesLoading ? (
                    <DropdownMenuItem disabled>กำลังโหลด...</DropdownMenuItem>
                  ) : categories.length === 0 ? (
                    <DropdownMenuItem disabled>ไม่พบหมวดหมู่</DropdownMenuItem>
                  ) : (
                    categories.map((category) => (
                      <DropdownMenuItem key={category.name} asChild>
                        <Link
                          href={`/web/category/${encodeURIComponent(
                            category.name
                          )}`}
                        >
                          {category.name} ({category.count})
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {username && (
                <Link
                  href="/web/member/history"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  ประวัติการสั่งซื้อ
                </Link>
              )}
            </nav>

            {/* ช่องค้นหาสำหรับหน้าจอขนาดใหญ่ */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center w-1/3 relative"
            >
              <Input
                type="search"
                placeholder="ค้นหาสินค้า..."
                className="w-full pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-0"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            {/* ไอคอนต่างๆ สำหรับหน้าจอขนาดใหญ่ */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              <CartIcon />
              
              {username ? ( // ถ้ามี username (login แล้ว)
                <>
                  <Avatar>
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="@shadcn"
                    />
                    <AvatarFallback>{username}</AvatarFallback>
                  </Avatar>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="cursor-pointer">
                        <LogOut className="h-5 w-5 mr-2" />
                        ออกจากระบบ
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>ออกจากระบบ?</DialogTitle>
                        <DialogDescription>
                          คุณต้องการออกจากระบบหรือไม่
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">ยกเลิก</Button>
                        </DialogClose>
                        <Button onClick={handleSignOut}>ออกจากระบบ</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                // ถ้ายังไม่ login
                <>
                  <Link href="/web/member/register">สมัครสมาชิก</Link>
                  <Link href="/web/member/sign-in">เข้าสู่ระบบ</Link>
                </>
              )}
            </div>

            {/* เมนูสำหรับหน้าจอขนาดเล็ก */}
            <div className="flex md:hidden items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              <CartIcon />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">เมนู</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="text-left">เมนู</SheetTitle>
                    {username ? ( // ถ้ามี username (login แล้ว)
                <>
                  <Avatar>
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="@shadcn"
                    />
                    <AvatarFallback>{username}</AvatarFallback>
                  </Avatar>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Badge className="cursor-pointer">
                        <LogOut className="h-5 w-5 mr-2" />
                        ออกจากระบบ
                      </Badge>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>ออกจากระบบ?</DialogTitle>
                        <DialogDescription>
                          คุณต้องการออกจากระบบหรือไม่
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">ยกเลิก</Button>
                        </DialogClose>
                        <Button onClick={handleSignOut}>ออกจากระบบ</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                // ถ้ายังไม่ login
                <>
                  <Link href="/web/member/register">สมัครสมาชิก</Link>
                  <Link href="/web/member/sign-in">เข้าสู่ระบบ</Link>
                </>
              )}
                  </SheetHeader>
                  <nav className="flex flex-col gap-4 pl-4 pr-4">
                    <form
                      onSubmit={handleSearch}
                      className="flex items-center w-full relative mb-4"
                    >
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="search"
                          placeholder="พิมพ์เพื่อค้นหาสินค้า..."
                          className="w-full pl-10 pr-10"
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
                    </form>
                    <Link
                      href="/web"
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      หน้าหลัก
                    </Link>
                    <div className="flex flex-col space-y-3">
                      <p className="text-lg font-medium">หมวดหมู่</p>
                      {categoriesLoading ? (
                        <div className="flex space-x-2">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-6 w-24 bg-gray-200 rounded animate-pulse"
                            />
                          ))}
                        </div>
                      ) : categories.length === 0 ? (
                        <p className="text-sm pl-4 text-muted-foreground">
                          ไม่พบหมวดหมู่
                        </p>
                      ) : (
                        categories.map((category) => (
                          <Link
                            key={category.name}
                            href={`/web/category/${encodeURIComponent(
                              category.name
                            )}`}
                            className="text-sm pl-4 hover:text-primary transition-colors flex justify-between items-center"
                          >
                            <span>{category.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                              {category.count}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                    {username && (
                      <Link
                        href="/web/member/history"
                        className="text-lg font-medium hover:text-primary transition-colors"
                      >
                        ประวัติการสั่งซื้อ
                      </Link>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
