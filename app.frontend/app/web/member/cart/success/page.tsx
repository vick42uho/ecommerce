"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Config } from "@/app/config";

const Success = () => {
  const router = useRouter();

  // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบหรือไม่
  useEffect(() => {
    const token = localStorage.getItem(Config.tokenMember);
    if (!token) {
      router.push("/web/member/sign-in");
    }
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-2xl shadow-lg border-green-100 bg-gradient-to-b from-white to-green-50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-3 w-24 h-24 flex items-center justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-green-700">สั่งซื้อสำเร็จ</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4 pt-2 pb-6">
          <p className="text-xl font-medium">ขอบคุณสำหรับการสั่งซื้อ</p>
          <p className="text-gray-600">
            คำสั่งซื้อของคุณได้รับการบันทึกเรียบร้อยแล้ว เราจะจัดส่งสินค้าให้คุณโดยเร็วที่สุด
          </p>
          <div className="bg-white p-4 rounded-lg border border-green-100 mt-4">
            <p className="text-gray-700">ทางร้านจะติดต่อกลับไปเพื่อยืนยันคำสั่งซื้อ</p>
            <p className="text-gray-700 mt-2">คุณสามารถตรวจสอบสถานะคำสั่งซื้อได้ในหน้าประวัติการสั่งซื้อ</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/web/products" className="flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4" />
              เลือกซื้อสินค้าเพิ่มเติม
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
            <Link href="/web" className="flex items-center">
              <Home className="mr-2 h-4 w-4" />
              กลับสู่หน้าหลัก
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Success;