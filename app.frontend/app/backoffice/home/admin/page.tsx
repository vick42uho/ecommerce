"use client";

import { Config } from "@/app/config";
import { AdminInterface } from "@/app/interface/AdminInterface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";


// กำหนด schema ด้านนอกคอมโพเนนต์
const createAdminSchema = z.object({
  name: z.string().min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร"),
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string().min(6, "ยืนยันรหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  role: z.enum(['admin', 'user'], {
    errorMap: () => ({ message: "กรุณาเลือกสิทธิ์" })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"]
});

// Schema สำหรับการแก้ไข - รหัสผ่านเป็นตัวเลือก
const updateAdminSchema = z.object({
  name: z.string().min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร"),
  username: z.string().min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  role: z.enum(['admin', 'user'], {
    errorMap: () => ({ message: "กรุณาเลือกสิทธิ์" })
  })
}).refine((data) => {
  // ตรวจสอบรหัสผ่านตรงกันเฉพาะเมื่อมีการกรอกรหัสผ่าน
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"]
});

// เราจะใช้ schema แยกกันตามสถานะการแก้ไข

type CreateAdminValues = z.infer<typeof createAdminSchema>;
type UpdateAdminValues = z.infer<typeof updateAdminSchema>;
type AdminFormValues = CreateAdminValues | UpdateAdminValues;




export default function AdminPage() {
  const [adminList, setAdminList] = useState<AdminInterface[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminInterface | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roles] = useState([
    { label: 'ผู้ดูแลระบบ', value: 'admin' },
    { label: 'ผู้ใช้งานทั่วไป', value: 'user' }
  ]);

  // ใช้ useForm กับ zod resolver
  const form = useForm<CreateAdminValues | UpdateAdminValues>({
    resolver: zodResolver(editingId ? updateAdminSchema : createAdminSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    }
  });

  
  const fetchData = async () => {
    try {
      const response = await axios.get(`${Config.apiURL}/api/admin/list`);
      if (response.status === 200) {
        setAdminList(response.data);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด", {
        duration: 9000,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



const handleSave = async (data: CreateAdminValues | UpdateAdminValues) => {
  try {
    // สร้าง payload ตามสถานะการแก้ไข
    const payload = {
      name: data.name,
      username: data.username,
      role: data.role
    };
    
    // เพิ่มรหัสผ่านเฉพาะเมื่อมีการกรอก
    if (data.password && data.password.trim() !== '') {
      (payload as any).password = data.password;
    }
    
    let response: any;
    const url = editingId 
      ? `${Config.apiURL}/api/admin/update-data/${editingId}`
      : `${Config.apiURL}/api/admin/create`;
    
    response = editingId 
      ? await axios.put(url, payload)
      : await axios.post(url, payload);

    if (response.status === 200) {
      toast.success(editingId ? "อัปเดตสำเร็จ" : "บันทึกสำเร็จ", { duration: 9000 });
      fetchData();
      setShowModal(false);
      form.reset();
      setEditingId(null);
    }
  } catch (error) {
    console.error('Error saving admin:', error);
    toast.error("เกิดข้อผิดพลาด", { duration: 9000 });
  }
};

const handleEdit = (admin: AdminInterface) => {
  setShowModal(true);
  setEditingId(admin.id);
  form.reset({
    name: admin.name,
    username: admin.username,
    password: admin.password,
    confirmPassword: admin.password,
    role: admin.role as 'admin' | 'user'
  });
}


const confirmDelete = (admin: AdminInterface) => {
  setAdminToDelete(admin)
  setShowDeleteDialog(true)
}

const handleDelete = async () => {
  if (!adminToDelete) return
  
  try {
    const response = await axios.delete(`${Config.apiURL}/api/admin/remove/${adminToDelete.id}`)
    if (response.status === 200) {
      toast.success("ลบสำเร็จ", {
        duration: 9000,
      })
      fetchData()
      setShowDeleteDialog(false)
      setAdminToDelete(null)
    }
  } catch (error) {
    toast.error("เกิดข้อผิดพลาด", {
      duration: 9000,
    });
  }
}



  return (
    <div className="h-full w-full flex flex-col px-5">
      <Toaster position="top-right" richColors />
      <div className="px-2 mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ผู้ใช้งานระบบ</h1>
        <Dialog open={showModal} onOpenChange={(open) => {
          if (!open) {
            form.reset();
            setEditingId(null);
          }
          setShowModal(open);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              form.reset({
                name: '',
                username: '',
                password: '',
                confirmPassword: '',
                role: 'user'
              });
              setEditingId(null);
            }}>เพิ่มผู้ใช้งาน</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน'}
              </DialogTitle>
              <DialogDescription>
                {editingId ? 'แก้ไขรายละเอียดผู้ใช้งาน' : 'กรุณากรอกรายละเอียดเพื่อเพิ่มผู้ใช้งาน'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
              {/* ชื่อ */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  ชื่อ
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="name"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
              </div>
              
              {/* ชื่อผู้ใช้ */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  ชื่อผู้ใช้
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="username"
                    {...form.register("username")}
                  />
                  {form.formState.errors.username && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.username.message}
                    </p>
                  )}
                </div>
              </div>
              
              {/* รหัสผ่าน */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  {editingId ? 'รหัสผ่าน' : 'รหัสผ่าน'}
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    type="password"
                    id="password"
                    {...form.register("password")}
                    placeholder={editingId ? 'เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยนรหัสผ่าน' : ''}
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
              </div>
              
              {/* ยืนยันรหัสผ่าน */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirmPassword" className="text-right">
                  {editingId ? 'ยืนยันรหัสผ่าน' : 'ยืนยันรหัสผ่าน'}
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    type="password"
                    id="confirmPassword"
                    {...form.register("confirmPassword")}
                    placeholder={editingId ? 'เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยนรหัสผ่าน' : ''}
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              
              {/* สิทธิ์ */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  สิทธิ์
                </Label>
                <div className="col-span-3 space-y-1">
                  <Controller
                    name="role"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกสิทธิ์" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.role && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.role.message}
                    </p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit">
                  {editingId ? 'อัปเดต' : 'บันทึก'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 w-full overflow-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>ชื่อผู้ใช้</TableHead>
              <TableHead>สิทธิ์</TableHead>
              <TableHead className="text-center">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminList.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>{admin.name}</TableCell>
                <TableCell>{admin.username}</TableCell>
                <TableCell>{admin.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งานทั่วไป'}</TableCell>
                <TableCell className="flex gap-1 justify-center">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => confirmDelete(admin)}
                  >
                    ลบ
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleEdit(admin)}
                  >
                    แก้ไข
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog ยืนยันการลบ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณต้องการลบผู้ใช้งาน {adminToDelete?.name} ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <DialogClose asChild>
              <Button variant="outline">ยกเลิก</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>ยืนยันการลบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
