"use client";

import { Config } from "@/app/config";
import { Category } from "@/app/interface/ProductInterface";
import axios from "axios";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Footer = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${Config.apiURL}/api/product/categories`
      );
      if (response.data) {
        // แสดงแค่ 5 หมวดหมู่แรก
        setCategories(response.data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching categories for footer:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">WickShop</h3>
            <p className="text-sm">
              ร้านค้าออนไลน์ที่มีสินค้าคุณภาพดี ราคาถูก บริการประทับใจ
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Links Section 1 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">หมวดหมู่</h4>
            <ul className="space-y-2 text-sm">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/web/category/${encodeURIComponent(category.name)}`} className="hover:text-foreground transition-colors">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Section 2 */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">บริการ</h4>
            <ul className="space-y-2 text-sm">
              <li key="how-to-order"><Link href="#" className="hover:text-foreground transition-colors">วิธีการสั่งซื้อ</Link></li>
              <li key="shipping"><Link href="#" className="hover:text-foreground transition-colors">การจัดส่ง</Link></li>
              <li key="payment"><Link href="#" className="hover:text-foreground transition-colors">การชำระเงิน</Link></li>
              <li key="return-policy"><Link href="#" className="hover:text-foreground transition-colors">นโยบายการคืนสินค้า</Link></li>
              <li key="faq"><Link href="#" className="hover:text-foreground transition-colors">คำถามที่พบบ่อย</Link></li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">ติดต่อเรา</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 shrink-0" />
                <span>02-123-4567</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 shrink-0" />
                <span>contact@wickshop.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 shrink-0 mt-1" />
                <span>กรุงเทพฯ 10330</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-muted-foreground/20 pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm">&copy; 2025 WickShop. สงวนลิขสิทธิ์ทั้งหมด</p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="#" className="hover:text-foreground transition-colors">นโยบายความเป็นส่วนตัว</Link>
            <Link href="#" className="hover:text-foreground transition-colors">ข้อกำหนดการใช้งาน</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;