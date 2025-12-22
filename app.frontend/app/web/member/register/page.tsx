"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { Config } from "@/app/config";
import { Toaster } from "@/components/ui/sonner";

// Define schema outside the component
const registerSchema = z
  .object({
    name: z.string().min(3, "ชื่อต้องมีความยาวอย่างน้อย 3 ตัวอักษร"),
    phone: z
      .string()
      .min(10, "เบอร์โทรศัพท์ต้องมีความยาว 10 ตัวอักษร")
      .regex(/^[0-9]+$/, "กรุณาใส่เฉพาะตัวเลขเท่านั้น"),
    username: z.string().min(3, "ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร"),
    email: z.string().min(0, "กรุณาใส่อีเมลให้ถูกต้อง"),
    password: z
      .string()
      .min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร")
      .regex(/[A-Z]/, "ต้องมีตัวอักษรภาษาอังกฤษตัวใหญ่อย่างน้อย 1 ตัว")
      .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว"),
    confirmPassword: z.string(),
    address: z.string().min(0),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  
  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...userData } = data;
  
      const response = await axios.post(
        `${Config.apiURL}/api/member/sign-up`,
        userData
      );
  
      const result = response.data;
  
      // ตรวจสอบ status code ที่ถูกต้อง
      if (response.status === 200 || response.status === 201) {
        // เช็คว่ามี error จาก backend หรือไม่
        if (result.error) {
          toast.error(result.error, { duration: 3000 });
          return; // หยุดการทำงานถ้ามี error
        }
  
        // ถ้าไม่มี error แสดงว่าสำเร็จ
        toast.success("ลงทะเบียนสำเร็จ", {
          duration: 2000,
        });
  
        // Redirect หลังจาก 2 วินาที
        setTimeout(() => {
          router.push("/web/member/sign-in");
        }, 2000);
        
      } else {
        throw new Error(
          result.message || result.error || "การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง"
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      if (axios.isAxiosError(error)) {
        // Handle API error response
        if (error.response) {
          const errorData = error.response.data;
          const errorMessage = errorData?.error || errorData?.message || "เกิดข้อผิดพลาดในการลงทะเบียน";
          toast.error(errorMessage, { duration: 3000 });
        } else if (error.request) {
          // Network error
          toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต", { 
            duration: 3000 
          });
        } else {
          toast.error("เกิดข้อผิดพลาดในการส่งข้อมูล", { duration: 3000 });
        }
      } else {
        // Handle other types of errors
        toast.error(
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง",
          { duration: 3000 }
        );
      }
    }
  };


  return (
    <>
    <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-gradient-to-br py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">

          <Card className="shadow-lg">
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-2xl font-bold text-center">
                สมัครสมาชิก
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                กรอกข้อมูลของคุณเพื่อสร้างบัญชีใหม่
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      ชื่อ-นามสกุล
                    </Label>
                    <span className="text-xs text-red-500">* จำเป็น</span>
                  </div>
                  <Input
                    id="name"
                    placeholder="เช่น สมชาย ใจดี"
                    {...register("name")}
                    className={`h-11 ${
                      errors.name
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-gray-300"
                    } focus-visible:ring-2 focus-visible:ring-offset-2`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    กรุณากรอกชื่อ-นามสกุลจริงของคุณ
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-medium text-gray-700"
                    >
                      เบอร์โทรศัพท์
                    </Label>
                    <span className="text-xs text-red-500">* จำเป็น</span>
                  </div>
                  <Input
                    id="phone"
                    placeholder="เช่น 0812345678"
                    {...register("phone")}
                    className={`h-11 ${
                      errors.phone
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-gray-300"
                    } focus-visible:ring-2 focus-visible:ring-offset-2`}
                  />
                  {errors.phone ? (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.phone.message}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      กรุณากรอกเบอร์โทรศัพท์มือถือ 10 หลัก
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      อีเมล
                    </Label>
                    {/* <span className="text-xs text-red-500">* จำเป็น</span> */}
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="เช่น example@email.com"
                    {...register("email")}
                    className={`h-11 ${
                      errors.email
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-gray-300"
                    } focus-visible:ring-2 focus-visible:ring-offset-2`}
                  />
                  {errors.email ? (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.email.message}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      กรุณากรอกอีเมลที่ใช้งานได้
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="username"
                      className="text-sm font-medium text-gray-700"
                    >
                      ชื่อผู้ใช้
                    </Label>
                    <span className="text-xs text-red-500">* จำเป็น</span>
                  </div>
                  <Input
                    id="username"
                    placeholder="เช่น somchai123"
                    {...register("username")}
                    className={`h-11 ${
                      errors.username
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-gray-300"
                    } focus-visible:ring-2 focus-visible:ring-offset-2`}
                  />
                  {errors.username ? (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.username.message}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      รหัสผ่าน
                    </Label>
                    <span className="text-xs text-red-500">* จำเป็น</span>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className={`h-11 ${
                      errors.password
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-gray-300"
                    } focus-visible:ring-2 focus-visible:ring-offset-2`}
                  />
                  {errors.password ? (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.password.message}
                    </p>
                  ) : (
                    <div className="text-xs text-gray-500 space-y-1 mt-1">
                      <p>• ต้องมีความยาวอย่างน้อย 6 ตัวอักษร</p>
                      <p>• ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว</p>
                      <p>• ต้องมีตัวเลขอย่างน้อย 1 ตัว</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-gray-700"
                    >
                      ยืนยันรหัสผ่าน
                    </Label>
                    <span className="text-xs text-red-500">* จำเป็น</span>
                  </div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    className={`h-11 ${
                      errors.confirmPassword
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-gray-300"
                    } focus-visible:ring-2 focus-visible:ring-offset-2`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="address"
                      className="text-sm font-medium text-gray-700"
                    >
                      ที่อยู่
                    </Label>
                    {/* <span className="text-xs text-red-500">* จำเป็น</span> */}
                  </div>
                  <textarea
                    id="address"
                    placeholder="ที่อยู่บ้านเลขที่ หมู่บ้าน อาคาร ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                    rows={3}
                    {...register("address")}
                    className={`flex w-full rounded-md border ${
                      errors.address
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-gray-300"
                    } bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                  />
                  {errors.address ? (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.address.message}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      กรุณากรอกที่อยู่ให้ครบถ้วน
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium text-base mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    "สมัครสมาชิก"
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      หรือ
                    </span>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600">
                  มีบัญชีอยู่แล้ว?{" "}
                  <Link
                    href="/web/member/sign-in"
                    className="font-medium text-primary hover:underline"
                  >
                    เข้าสู่ระบบ
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

    </>
  );
}
