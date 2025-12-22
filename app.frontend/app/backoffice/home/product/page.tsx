"use client";

import { Config } from "@/app/config";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ProductInterface } from "@/app/interface/ProductInterface";
import { categories } from "../components/Utils";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/app/interface/ErrorInterface";

// กำหนด schema ด้านนอกคอมโพเนนต์
const createProductSchema = z.object({
  name: z.string().min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร"),
  price: z.string().min(1, "กรุณาระบุราคา"),
  isbn: z.string().min(3, "ISBN ต้องมีอย่างน้อย 3 ตัวอักษร"),
  description: z.string().min(3, "คำอธิบายต้องมีอย่างน้อย 3 ตัวอักษร"),
  category: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  stock: z.string().min(1, "กรุณาระบุจำนวนสินค้า"),
});

// Schema สำหรับการแก้ไข
const updateProductSchema = z.object({
  name: z.string().min(3, "ชื่อต้องมีอย่างน้อย 3 ตัวอักษร"),
  price: z.string().min(1, "กรุณาระบุราคา"),
  isbn: z.string().min(3, "ISBN ต้องมีอย่างน้อย 3 ตัวอักษร"),
  description: z.string().min(3, "คำอธิบายต้องมีอย่างน้อย 3 ตัวอักษร"),
  category: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  stock: z.string().min(1, "กรุณาระบุจำนวนสินค้า"),
});

// เราจะใช้ schema แยกกันตามสถานะการแก้ไข

type CreateProductValues = z.infer<typeof createProductSchema>;
type UpdateProductValues = z.infer<typeof updateProductSchema>;

export default function ProductPage() {
  const [productList, setProductList] = useState<ProductInterface[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [currentProductImage, setCurrentProductImage] = useState<string>("");
  const [currentProductImages, setCurrentProductImages] = useState<string[]>(
    []
  );
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] =
    useState<ProductInterface | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter states
  const [filteredProducts, setFilteredProducts] = useState<ProductInterface[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);



  // ใช้ useForm กับ zod resolver
  const form = useForm<CreateProductValues | UpdateProductValues>({
    resolver: zodResolver(
      editingId ? updateProductSchema : createProductSchema
    ),
    defaultValues: {
      name: "",
      price: "",
      isbn: "",
      description: "",
      category: "",
      stock: "",
    },
  });

  const fetchData = async () => {
    try {
      const response = await axios.get(`${Config.apiURL}/api/product/list`);
      if (response.status === 200) {
        setProductList(response.data);
        setFilteredProducts(response.data);
      }
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.message, {
        duration: 9000,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  // --- เพิ่ม useEffect นี้เข้าไป ---
  useEffect(() => {
    // เริ่มต้นด้วยข้อมูลทั้งหมดจาก State `orders`
    let result = productList;

    // 1. กรองด้วยคำค้นหา (searchQuery)
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(lowercasedQuery) ||
          product.isbn.toLowerCase().includes(lowercasedQuery) ||
          product.category.toLowerCase().includes(lowercasedQuery) ||
          product.id.toLowerCase().includes(lowercasedQuery) // ค้นหาจาก Order ID ด้วย
      );
    }

    // console.log(result);

    // 2. กรองด้วยหมวดหมู่ (selectedCategory)
    if (selectedCategory && selectedCategory !== "all" && selectedCategory !== "") {
      result = result.filter((product) => product.category === selectedCategory);
    }

    // 3. นำผลลัพธ์สุดท้ายไปเก็บใน state `filteredProducts` เพื่อแสดงผล
    setFilteredProducts(result);

    // 4. คำนวณจำนวนหน้าทั้งหมดจากข้อมูลที่กรองแล้ว
    setTotalPages(Math.ceil(result.length / itemsPerPage));

    // 5. รีเซ็ตหน้าปัจจุบันเป็น 1 เมื่อมีการกรองข้อมูลใหม่
    setCurrentPage(1);
  }, [productList, searchQuery, selectedCategory, itemsPerPage]); // useEffect นี้จะทำงานทุกครั้งที่ค่าในวงเล็บนี้เปลี่ยนไป
  // --- สิ้นสุดส่วนที่เพิ่ม ---

  // ฟังก์ชันสำหรับแบ่งข้อมูลตามหน้า
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };

  // ฟังก์ชันสำหรับเปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // ฟังก์ชันสำหรับสร้างปุ่มตัวเลขหน้า
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };




  const handleSave = async (
    formData: CreateProductValues | UpdateProductValues
  ) => {
    try {
      if (!image && !editingId && images.length === 0) {
        toast.error("กรุณาเลือกรูปภาพอย่างน้อย 1 รูป", { duration: 3000 });
        return;
      }

      const data = new FormData();
      if (image) {
        data.append("image", image);
      }

      // เพิ่มรูปภาพเพิ่มเติม (ถ้ามี)
      if (images.length > 0) {
        images.forEach((img) => {
          data.append("images", img);
        });
      }

      data.append("name", formData.name);
      data.append("price", formData.price);
      data.append("isbn", formData.isbn);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("stock", formData.stock);

      if (editingId) {
        data.append("id", editingId);
      }

      const url = editingId
        ? `${Config.apiURL}/api/product/update/${editingId}`
        : `${Config.apiURL}/api/product/create`;

      const response = editingId
        ? await axios.put(url, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        : await axios.post(url, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

      // ตรวจสอบว่ามี error จากการ response หรือไม่
      if (response.data.error) {
        toast.error(response.data.error, { duration: 3000 });
        return;
      }

      if (response.status === 200) {
        toast.success(editingId ? "อัปเดตสำเร็จ" : "บันทึกสำเร็จ", {
          duration: 3000,
        });
        fetchData();
        setShowModal(false);
        form.reset();
        setEditingId(null);
      }
    } catch (error: unknown) {
      // console.error("Error saving product:", error);
      // ตรวจสอบว่ามี error message จาก response หรือไม่
      const err = error as ApiError;
      if (err.message) {
        toast.error(err.message, { duration: 3000 });
      } else {
        toast.error("เกิดข้อผิดพลาด", { duration: 3000 });
      }
    }
  };

  const handleEdit = (product: ProductInterface) => {
    setShowModal(true);
    setEditingId(product.id);
    setCurrentProductImage(product.image || "");
    setCurrentProductImages(product.images || []);
    form.reset({
      name: product.name,
      price: product.price.toString(),
      isbn: product.isbn || "",
      description: product.description || "",
      category: product.category || "",
      stock: product.stock !== undefined ? product.stock.toString() : "0",
    });
  };

  const confirmDelete = (product: ProductInterface) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await axios.delete(
        `${Config.apiURL}/api/product/remove/${productToDelete.id}`
      );
      if (response.status === 200) {
        toast.success("ลบสำเร็จ", {
          duration: 3000,
        });
        fetchData();
        setShowDeleteDialog(false);
        setProductToDelete(null);
      }
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.message, {
        duration: 3000,
      });
    }
  };

  // ฟังก์ชันสำหรับลบรูปภาพแต่ละรูป
  const handleDeleteImage = async (imageName: string) => {
    if (!editingId) return;

    try {
      const response = await axios.delete(
        `${Config.apiURL}/api/product/remove-image/${editingId}/${imageName}`
      );

      if (response.status === 200 && response.data.success) {
        toast.success("ลบรูปภาพสำเร็จ", {
          duration: 3000,
        });

        // อัปเดตรายการรูปภาพใน state
        setCurrentProductImages(response.data.images || []);
        setCurrentProductImage(response.data.mainImage || "");
      } else {
        toast.error(response.data.message || "เกิดข้อผิดพลาดในการลบรูปภาพ", {
          duration: 3000,
        });
      }
    } catch (error: unknown) {
      // console.error("Error deleting image:", error);
      const err = error as ApiError;
      toast.error(
        err.message || "เกิดข้อผิดพลาดในการลบรูปภาพ",
        { duration: 3000 }
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setImage(file);
    }
  };

  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // จำกัดจำนวนรูปภาพทั้งหมดไม่เกิน 10 รูป (รวมรูปหลัก)
      const maxAdditionalImages = 9; // 10 - 1 (รูปหลัก)
      const selectedFiles = Array.from(files).slice(0, maxAdditionalImages);
      setImages(selectedFiles);
    }
  };

  return (
    <div className="h-full w-full flex flex-col px-5">
      <Toaster position="top-right" richColors />
      <div className="px-2 mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">สินค้า</h1>
        <Dialog
          open={showModal}
          onOpenChange={(open) => {
            if (!open) {
              form.reset();
              setEditingId(null);
            }
            setShowModal(open);
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                form.reset({
                  name: "",
                  price: "",
                  isbn: "",
                  description: "",
                  category: "",
                  stock: "",
                });
                setEditingId(null);
              }}
            >
              เพิ่มสินค้า
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "แก้ไขรายละเอียดผู้ใช้งาน"
                  : "กรุณากรอกรายละเอียดเพื่อเพิ่มผู้ใช้งาน"}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(handleSave)}
              className="space-y-4 py-4"
            >
              {/* isbn */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isbn" className="text-right">
                  isbn
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input id="isbn" {...form.register("isbn")} />
                  {form.formState.errors.isbn && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.isbn.message}
                    </p>
                  )}
                </div>
              </div>

              {/* ชื่อ */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  ชื่อ
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input id="name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
              </div>

              {/* ราคา */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  ราคา
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input id="price" type="number" {...form.register("price")} />
                  {form.formState.errors.price && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>
              </div>

              {/* จำนวนสินค้า */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">
                  จำนวนสินค้า
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input id="stock" type="number" min="0" {...form.register("stock")} />
                  {form.formState.errors.stock && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.stock.message}
                    </p>
                  )}
                </div>
              </div>

              {/* รายละเอียด */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  รายละเอียด
                </Label>
                <div className="col-span-3 space-y-1">
                  <Textarea
                    id="description"
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              {/* หมวดหมู่ */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  หมวดหมู่
                </Label>
                <div className="col-span-3 space-y-1">
                  <Controller
                    name="category"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกหมวดหมู่" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>
              </div>

              {/* รูปภาพหลัก */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                  รูปภาพหลัก
                </Label>
                <div className="col-span-3 space-y-1">
                  {editingId && currentProductImage && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">
                        รูปภาพหลักปัจจุบัน:
                      </p>
                      <div className="relative w-[100px] h-[100px] rounded-md overflow-hidden">
                        <img
                          src={`${Config.apiURL}/uploads/${currentProductImage}`}
                          alt="รูปภาพสินค้า"
                          className="object-cover w-full h-full rounded-md"
                          onError={(e) => {
                            // ถ้าโหลดรูปไม่สำเร็จให้แสดงไอคอนแทน
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            e.currentTarget.parentElement!.innerHTML =
                              '<div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-md"><span className="text-gray-400 text-2xl">🖼️</span></div>';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <Input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {editingId
                      ? image
                        ? "เลือกรูปใหม่แล้ว"
                        : "ไม่ต้องเลือกรูปหากไม่ต้องการเปลี่ยน"
                      : "กรุณาเลือกรูปภาพหลักของสินค้า"}
                  </p>
                </div>
              </div>



              {/* รูปภาพเพิ่มเติม */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="additionalImages" className="text-right">
                  รูปภาพเพิ่มเติม
                </Label>
                <div className="col-span-3 space-y-1">
                  {editingId &&
                    currentProductImages &&
                    currentProductImages.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-500 mb-1">
                          รูปภาพปัจจุบัน ({currentProductImages.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {currentProductImages.map((img, index) => (
                            <div
                              key={index}
                              className="relative w-[80px] h-[80px] rounded-md overflow-hidden group"
                            >
                              <img
                                src={`${Config.apiURL}/uploads/${img}`}
                                alt={`รูปภาพสินค้า ${index + 1}`}
                                className="object-cover w-full h-full rounded-md"
                                onError={(e) => {
                                  // ถ้าโหลดรูปไม่สำเร็จให้แสดงไอคอนแทน
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                  e.currentTarget.parentElement!.innerHTML =
                                    '<div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-md"><span className="text-gray-400 text-sm">🖼️</span></div>';
                                }}
                              />
                              {/* ปุ่มลบรูปภาพ */}
                              <button
                                type="button"
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteImage(img);
                                }}
                                title="ลบรูปภาพนี้"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  <Input
                    type="file"
                    id="additionalImages"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleFileChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {images.length > 0
                      ? `เลือกรูปเพิ่มเติม ${images.length} รูป`
                      : "เลือกรูปภาพเพิ่มเติมได้สูงสุด 9 รูป"}
                  </p>
                  <p className="text-xs text-amber-600">
                    {editingId
                      ? "หากเลือกรูปภาพเพิ่มเติมใหม่ รูปภาพเพิ่มเติมเดิมทั้งหมดจะถูกแทนที่"
                      : "สามารถเลือกได้หลายรูปพร้อมกัน (สูงสุด 9 รูป)"}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">{editingId ? "อัปเดต" : "บันทึก"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div>


        <div className="flex items-end gap-0 mb-6">
          <div className="flex-1">
            <Input
              id="search"
              placeholder="ค้นหารหัส หรือ ชื่อสินค้า"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-r-none border-r-0 focus:z-10"
            />
          </div>

          <div className="flex-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger
                id="category"
                className="rounded-none border-r-0 focus:z-10"
              >
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-l-none"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
                setCurrentPage(1);
              }}
            >
              ล้างการค้นหา
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full overflow-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>รูปภาพ</TableHead>
              <TableHead>isbn</TableHead>
              <TableHead>ชื่อ</TableHead>
              <TableHead>ราคา</TableHead>
              <TableHead>จำนวน</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead>รายละเอียด</TableHead>
              <TableHead className="text-center">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getCurrentPageData().map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.image != null ? (
                    <div className="relative w-[50px] h-[50px] rounded-md overflow-hidden">
                      <img
                        src={`${Config.apiURL}/uploads/${product.image}`}
                        alt={product.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // ถ้าโหลดรูปไม่สำเร็จให้แสดงไอคอนแทน
                          (e.target as HTMLImageElement).style.display = "none";
                          e.currentTarget.parentElement!.innerHTML =
                            '<div className="flex items-center justify-center w-full h-full bg-gray-100"><span className="text-gray-400">🖼️</span></div>';
                        }}
                      />
                      {product.images && product.images.length > 1 && (
                        <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded-tl-sm">
                          +{product.images.length - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-[50px] h-[50px] bg-gray-100 rounded-md">
                      <span className="text-gray-400">🖼️</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>{product.isbn}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.stock !== undefined ? product.stock : 0}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell className="flex gap-1 justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => confirmDelete(product)}
                  >
                    ลบ
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    แก้ไข
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} จาก {filteredProducts.length} รายการ
            </div>

            <div className="flex items-center space-x-2">
              {/* ปุ่มก่อนหน้า */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ก่อนหน้า
              </Button>

              {/* ปุ่มตัวเลขหน้า */}
              {generatePageNumbers().map((page, index) => (
                <div key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-1 text-gray-500">...</span>
                  ) : (
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page as number)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  )}
                </div>
              ))}

              {/* ปุ่มถัดไป */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        )}
      </div>



      {/* Dialog ยืนยันการลบ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณต้องการลบสินค้า {productToDelete?.name} ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <DialogClose asChild>
              <Button variant="outline">ยกเลิก</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              ยืนยันการลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
