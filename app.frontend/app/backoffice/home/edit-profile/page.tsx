"use client"

import { Config } from "@/app/config";
import { FormInputs } from "@/app/interface/AdminInterface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Toaster, toast } from "sonner";



export default function EditProfile() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>();
  
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const url = Config.apiURL + '/api/admin/info'
      const token = localStorage.getItem(Config.tokenName)
      
      if (!token) {
        toast.error("กรุณาเข้าสู่ระบบก่อน", {
          duration: 9000,
        })
        return
      }
      
      const headers = {
        'Authorization': 'Bearer ' + token
      }
      
      const response = await axios.get(url, { headers })
      
      if (response.status === 200) {
        const userData = response.data
        setName(userData.name)
        setUsername(userData.username)
        
        // อัปเดตค่าในฟอร์ม
        setValue("name", userData.name)
        setValue("username", userData.username)
      }
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล", {
        duration: 9000,
      })
      console.log(err)
    }
  }

  const onSubmit = async (data: FormInputs) => {
    try {
      setIsLoading(true)
      
      if (data.password !== confirmPassword) {
        toast.error("รหัสผ่านไม่ตรงกัน", {
          duration: 9000,
        })
        setIsLoading(false)
        return
      }
      
      const token = localStorage.getItem(Config.tokenName)
      
      if (!token) {
        toast.error("กรุณาเข้าสู่ระบบก่อน", {
          duration: 9000,
        })
        setIsLoading(false)
        return
      }
      
      const url = `${Config.apiURL}/api/admin/update`
      const payload = {
        name: data.name,
        username: data.username,
        password: data.password
      }

      const headers = {
        'Authorization': 'Bearer ' + token
      }

      const response = await axios.put(url, payload, { headers })
      
      if (response.status === 200) {
        toast.success("แก้ไขข้อมูลสำเร็จ", {
          duration: 9000,
        })
        // รีเฟรชข้อมูลหลังจากอัปเดตสำเร็จ
        fetchData()
        // รีเซ็ตฟิลด์รหัสผ่าน
        setPassword('')
        setConfirmPassword('')
        setValue("password", "")
        setValue("confirmPassword", "")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล", {
        duration: 9000,
      })
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="container mx-auto py-10 px-4 max-w-3xl">
        <div className="rounded-lg p-6 shadow-lg border border-gray-200">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">แก้ไขข้อมูลส่วนตัว</h1>
            <p className="text-gray-500">แก้ไขข้อมูลส่วนตัวและรหัสผ่านของคุณ</p>
          </div>
          
          <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อ</Label>
                  <Input 
                    id="name"
                    placeholder="ชื่อ" 
                    {...register("name", { required: "กรุณากรอกชื่อ" })} 
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setValue("name", e.target.value)
                    }}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">ชื่อผู้ใช้</Label>
                  <Input 
                    id="username"
                    placeholder="ชื่อผู้ใช้" 
                    {...register("username", { required: "กรุณากรอกชื่อผู้ใช้" })} 
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      setValue("username", e.target.value)
                    }}
                  />
                  {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="รหัสผ่าน" 
                    {...register("password")} 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setValue("password", e.target.value)
                    }}
                  />
                  <p className="text-xs text-gray-500">เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                  <Input 
                    id="confirmPassword"
                    type="password" 
                    placeholder="ยืนยันรหัสผ่าน" 
                    {...register("confirmPassword")} 
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setValue("confirmPassword", e.target.value)
                    }}
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || isLoading}
                >
                  {isLoading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}