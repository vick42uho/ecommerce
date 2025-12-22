"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Config } from "@/app/config";
import { Toaster, toast } from "sonner";

interface SignInProps {
  username: string;
  password: string;
}

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export default function SignIn() {
  const router = useRouter();
  const [values, setValues] = useState<SignInProps>({
    username: "",
    password: "",
  });
  
  // Define your form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Define a submit handler
  async function handleSignIn(values: z.infer<typeof formSchema>) {
    try {
      // Update state values from form values
      const username = values.username;
      const password = values.password;
      
      const url = Config.apiURL + '/api/admin/signin';
      const payload = {
        username: username,
        password: password
      };

      const result = await axios.post(url, payload);

      if (result.data.token != null) {
        localStorage.setItem(Config.tokenAdmin, result.data.token);
        
        const role = result.data.role;
        console.log('Role received from API:', role);
        console.log('Role type:', typeof role);
        console.log('Role === "admin":', role === 'admin');

        // ตรวจสอบว่า role มีค่าหรือไม่ ถ้าไม่มีให้ใช้ค่า default
        if (!role) {
          console.warn('Role is undefined, using default role: user');
          router.push('/backoffice/home/order');
          toast.warning('Role information not found, redirected to default page', {
            duration: 5000,
          });
        } else if (role === 'admin') {
          console.log('Redirecting to dashboard');
          router.push('/backoffice/home/dashboard');
        } else {
          console.log('Redirecting to order page');
          router.push('/backoffice/home/order');
        }
        toast.success("Sign in successfully", {
          duration: 9000, // แสดงข้อความเป็นเวลา 3 วินาที
        });
      }
    } catch (error) {
      toast.error("Sign in failed", {
        duration: 9000, // แสดงข้อความเป็นเวลา 3 วินาที
      });
      console.log(error);
    }
  }

  return (
    <>
      <Toaster position="top-right" richColors/>
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-900">Sign in to your account</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="username" 
                        {...field} 
                        onChange={(e) => {
                          setValues({ ...values, username: e.target.value });
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="password" 
                        {...field} 
                        onChange={(e) => {
                          setValues({ ...values, password: e.target.value });
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
