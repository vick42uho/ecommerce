"use client";

import { LayoutDashboard, Settings, ShoppingBag, Store } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Config } from "@/app/config";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// Menu items.
const allItems = [
  {
    title: "Dashboard",
    url: "/backoffice/home/dashboard",
    icon: LayoutDashboard,
    roles: ['admin']
  },
  {
    title: "สินค้า",
    url: "/backoffice/home/product",
    icon: Store,
    roles: ['user']
  },  
  {
    title: "รายการสั่งซื้อ",
    url: "/backoffice/home/order",
    icon: ShoppingBag,
    roles: ['user']
  },
  {
    title: "ผู้ดูแลระบบ",
    url: "/backoffice/home/admin",
    icon: Settings,
    roles: ['admin']
  },
];

export function AppSidebar() {
  const { setTheme } = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  // Filter menu items based on user role
  const items = useMemo(() => {
    return allItems.filter(item => 
      item.roles.includes(role) || role === 'admin'
    );
  }, [role]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const url = `${Config.apiURL}/api/admin/info`;
      const token = localStorage.getItem(Config.tokenAdmin);

      if (!token) {
        router.push("/backoffice/signin");
      } else {
        const hearchs = {
          Authorization: `Bearer ${token}`,
        };

        const res = await axios.get(url, { headers: hearchs });

        if (res.data.name !== undefined) {
          setName(res.data.name);
          setRole(res.data.role);
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด", {
        duration: 9000, // แสดงข้อความเป็นเวลา 3 วินาที
      });
      console.log(error);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem(Config.tokenAdmin);
    router.push("/backoffice/signin");
    toast.success("Sign out successfully", {
      duration: 9000, // แสดงข้อความเป็นเวลา 3 วินาที
    });
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <Sidebar>
        <SidebarHeader className="border-b pb-4">
          <SidebarGroup>
            <div className="flex flex-col space-y-4">
              <SidebarGroupLabel className="text-xl font-bold text-primary">
                Back Office
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setTheme("light")}>
                            Light
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTheme("dark")}>
                            Dark
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTheme("system")}>
                            System
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <SidebarGroupLabel className="text-sm font-medium">
                        {name} {role}
                      </SidebarGroupLabel>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Link
                      href="/backoffice/home/edit-profile"
                      className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <i className="fa fa-user-edit mr-2"></i>
                      แก้ไข
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                      onClick={handleSignOut}
                    >
                      <i className="fa fa-sign-out mr-2"></i>
                      ออกจากระบบ
                    </Button>
                  </div>
                </div>
              </SidebarGroupContent>
            </div>
          </SidebarGroup>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
