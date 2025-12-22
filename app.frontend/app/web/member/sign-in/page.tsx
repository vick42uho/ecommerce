"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { Config } from "@/app/config";
import { useState } from "react";
import { toast } from "sonner";

const signInSchema = z.object({
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร"),
  password: z.string().min(6, "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${Config.apiURL}/api/member/sign-in`, {
        username: data.username,
        password: data.password,
      });

      console.log('Response:', response);

      if (response.status === 200) {
        // เช็คว่ามี error จาก backend หรือไม่
        if (response.data.error) {
          toast.error(response.data.error, { duration: 3000 });
          setError('root', {
            type: 'manual',
            message: response.data.error,
          });
          return;
        }

        // ถ้ามี token
        if (response.data.token) {
          localStorage.setItem(Config.tokenMember, response.data.token);
          toast.success('เข้าสู่ระบบสำเร็จ', { duration: 2000 });
          
          setTimeout(() => {
            window.location.href = '/web';
          }, 1000);
        } else {
          throw new Error('ไม่พบ token ในการตอบกลับ');
        }
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      
      let errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorData = error.response.data;
          errorMessage = errorData?.error || errorData?.message || errorMessage;
        } else if (error.request) {
          errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError('root', {
        type: 'manual',
        message: errorMessage,
      });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setIsLoading(false);
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
                เข้าสู่ระบบ
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                กรอกข้อมูลของคุณเพื่อเข้าสู่ระบบ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    ชื่อผู้ใช้
                  </Label>
                  <Input
                    id="username"
                    placeholder="เช่น user123"
                    className={`h-11 ${errors.username ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300'}`}
                    {...register('username')}
                    disabled={isLoading}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    รหัสผ่าน
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="กรุณากรอกรหัสผ่าน"
                    className={`h-11 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300'}`}
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  {errors.root && (
                    <p className="text-sm text-red-600 mb-4 text-center">
                      {errors.root.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังดำเนินการ...
                      </>
                    ) : (
                      'เข้าสู่ระบบ'
                    )}
                  </Button>
                </div>
                <div className="text-center text-sm text-gray-600 mt-4">
                  ยังไม่มีบัญชี?{' '}
                  <Link href="/web/member/register" className="font-medium text-primary hover:underline">
                    สมัครสมาชิก
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