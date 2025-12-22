"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Config } from "@/app/config";
import { toast } from "sonner";
import { useCart } from "@/app/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Trash, MinusCircle, PlusCircle, AlertCircle, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

export default function Cart() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [myFile, setMyFile] = useState<File | null>(null);
  // ใช้ CartContext แทนการจัดการ state เอง
  const { cartItems, loading, updateCartItem, removeFromCart, clearCart } = useCart();
  const [removingItem, setRemovingItem] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [updatingQuantity, setUpdatingQuantity] = useState<{
    [key: string]: boolean;
  }>({});

  // คำนวณราคารวม
  const totalPrice = cartItems.reduce((total, item) => {
    return total + (item.product?.price || 0) * item.qty;
  }, 0);

  // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบหรือไม่
  useEffect(() => {
    const token = localStorage.getItem(Config.tokenMember);
    if (!token) {
      toast.error("กรุณาเข้าสู่ระบบก่อนดูตะกร้าสินค้า", { duration: 3000 });
      router.push("/web/member/sign-in");
    }
  }, [router]);

  // ลบสินค้าออกจากตะกร้า
  const handleRemoveItem = async (cartId: string) => {
    try {
      setRemovingItem((prev) => ({ ...prev, [cartId]: true }));
      await removeFromCart(cartId);
    } catch (error) {
      console.error("Error removing item from cart:", error);
    } finally {
      setRemovingItem((prev) => ({ ...prev, [cartId]: false }));
    }
  };

  // อัปเดตจำนวนสินค้า
  const handleUpdateQuantity = async (
    cartId: string,
    productId: string,
    newQty: number
  ) => {
    if (newQty < 1) return; // ไม่อนุญาตให้จำนวนน้อยกว่า 1

    try {
      setUpdatingQuantity((prev) => ({ ...prev, [cartId]: true }));

      if (newQty === 0) {
        // ถ้าจำนวนเป็น 0 ให้ลบออกจากตะกร้า
        await handleRemoveItem(cartId);
      } else {
        // อัปเดตจำนวนสินค้าโดยใช้ CartContext
        await updateCartItem(cartId, productId, newQty);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setUpdatingQuantity((prev) => ({ ...prev, [cartId]: false }));
    }
  };

  // ดึง api สร้าง QR CODE
  const fetchQRCode = useCallback(async () => {
    if (totalPrice <= 0) return;

    try {
      setQrLoading(true);
      setQrError(false);
      
      // เรียก API เพื่อดึงข้อมูล QR Code ในรูปแบบ JSON ที่มี qrImage เป็น base64 string
      const url = `https://www.pp-qr.com/api/0924452492/${totalPrice}`;
      const response = await axios.get<{ qrImage: string }>(url);
      
      if (response.status === 200) {
        // ตรวจสอบว่ามีข้อมูล qrImage ใน response
        if (response.data && response.data.qrImage) {
          setQrImage(response.data.qrImage); // เก็บ base64 string ของรูปภาพ
          console.log("QR Code loaded successfully");
        } else {
          throw new Error('ไม่พบข้อมูล QR Code ในการตอบกลับ');
        }
      } else {
        throw new Error(`เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
      setQrError(true);
      toast.error("ไม่สามารถสร้าง QR Code ได้ กรุณาลองใหม่อีกครั้ง", { duration: 3000 });
    } finally {
      setQrLoading(false);
    }
  }, [totalPrice]);

  // Update QR code when total amount changes
  useEffect(() => {
    if (totalPrice > 0) {
      fetchQRCode();
    }
  }, [fetchQRCode, totalPrice]);

  // เพิ่ม useEffect เพื่อทำความสะอาด URL object เมื่อ component unmount
  useEffect(() => {
    return () => {
      // ถ้า qrImage เป็น URL object ที่สร้างจาก URL.createObjectURL
      if (qrImage && qrImage.startsWith('blob:')) {
        URL.revokeObjectURL(qrImage);
      }
    };
  }, [qrImage]);

  const handleChooseFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setMyFile(files[0]);
    }
  }, []);


  // อัปโหลดไฟล์และคืนชื่อไฟล์ที่ปลอดภัย
  const handleUploadFile = useCallback(async () => {
    if (!myFile) return null;
    const form = new FormData();
    form.append("myFile", myFile as Blob);
    const url = `${Config.apiURL}/api/cart/uploadSlip`;
    const res = await axios.post(url, form);
    return res.data.fileName; // ใช้ชื่อไฟล์ที่ backend คืนมา
  }, [myFile]);

  const handleUpdateMember = useCallback(async () => {
    const url = `${Config.apiURL}/api/cart/confirm`;
    const token = localStorage.getItem(Config.tokenMember);
    if (!token) return;
    
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const payload = {
      name,
      address,
      phone,
    };
    await axios.post(url, payload, { headers });
  }, [name, address, phone]);

  // สร้าง order โดยใช้ชื่อไฟล์ slip ที่ปลอดภัย
  const handleSaveOrder = useCallback(async (safeFileName: string | null) => {
    if (!myFile || !safeFileName) return;
    const token = localStorage.getItem(Config.tokenMember);
    if (!token) return;
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const payload = {
      slipName: safeFileName, // ใช้ชื่อไฟล์ที่ backend คืนมา
    };
    const url = `${Config.apiURL}/api/cart/confirmOrder`;
    await axios.post(url, payload, { headers });
  }, [myFile]);

  // ฟังก์ชันสำหรับดำเนินการสั่งซื้อจริง (หลังยืนยัน)
  const processOrder = useCallback(async () => {
    try {
      setProcessing(true);
      await handleUpdateMember();
      const safeFileName = await handleUploadFile();
      await handleSaveOrder(safeFileName);
      clearCart();
      toast.success("บันทึกคำสั่งซื้อสำเร็จ", {
        duration: 3000,
        position: "top-right",
        richColors: true,
      });
      setTimeout(() => {
        router.push("/web/member/cart/success");
      }, 600); // เล็กน้อยเพื่อให้ toast โผล่ก่อน
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ", {
        duration: 3000,
        position: "top-right",
        richColors: true,
      });
    } finally {
      setProcessing(false);
      setConfirmOpen(false);
    }
  }, [handleUpdateMember, handleUploadFile, handleSaveOrder, clearCart, router]);

  // ฟังก์ชัน handleSave สำหรับแสดง dialog
  const handleSave = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOpen(true);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">ตะกร้าสินค้า</h1>

      {loading ? (
        // แสดง loading state
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-24 w-24 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/5" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cartItems.length === 0 ? (
        // แสดงเมื่อไม่มีสินค้าในตะกร้า
        <div className="text-center py-12">
          <div className="mb-6">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">
            ตะกร้าสินค้าของคุณว่างเปล่า
          </h2>
          <p className="text-muted-foreground mb-6">
            เริ่มช้อปปิ้งและเพิ่มสินค้าลงในตะกร้าเพื่อดำเนินการต่อ
          </p>
          <Button asChild>
            <Link href="/web/products">เลือกซื้อสินค้า</Link>
          </Button>
        </div>
      ) : (
        // แสดงรายการสินค้าในตะกร้า
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="lg:w-full md:w-1/2 sm:w-full">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    {/* รูปสินค้า */}
                    <div className="relative w-50 h-50 bg-gray-100 rounded lg:w-32 lg:h-32 md:w-24 md:h-24 sm:w-16 sm:h-16">
                      {item.product?.image ? (
                        <Image
                          src={`${Config.apiURL}/uploads/${item.product.image}`}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>

                    {/* รายละเอียดสินค้า */}
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.product?.category}
                      </p>
                      <p className="font-medium mt-1">
                        {item.product?.price?.toLocaleString()} บาท
                      </p>
                    </div>

                    {/* ปุ่มเพิ่ม/ลดจำนวน */}
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.id,
                              item.productId,
                              item.qty - 1
                            )
                          }
                          disabled={updatingQuantity[item.id] || item.qty <= 1}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.id,
                              item.productId,
                              item.qty + 1
                            )
                          }
                          disabled={updatingQuantity[item.id]}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={removingItem[item.id]}
                      >
                        {removingItem[item.id] ? (
                          "กำลังลบ..."
                        ) : (
                          <>
                            <Trash className="h-4 w-4 mr-1" />
                            ลบ
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* สรุปคำสั่งซื้อ */}
          <div className="lg:col-span-1 md:col-span-2 sm:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>สรุปคำสั่งซื้อ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="items-center justify-center flex flex-col">
                  <span>สแกน QR Code เพื่อชำระเงิน</span>
                  {qrLoading ? (
                    <div className="h-[300px] w-[300px] flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p className="text-sm text-gray-500">กำลังโหลด QR Code...</p>
                      </div>
                    </div>
                  ) : qrImage ? (
                    <Image
                      className="object-cover rounded-md shadow-lg border-2 border-gray-200"
                      src={qrImage}
                      alt="QR Code สำหรับชำระเงิน"
                      width={300}
                      height={300}
                    />
                  ) : (
                    <div className="h-[300px] w-[300px] flex flex-col items-center justify-center border-2 border-gray-200 rounded-md p-4">
                      <AlertCircle className="h-12 w-12 text-yellow-500 mb-2" />
                      <p className="text-gray-500 text-center">ไม่สามารถโหลด QR Code ได้</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4" 
                        onClick={fetchQRCode}
                        disabled={qrLoading}
                      >
                        ลองใหม่อีกครั้ง
                      </Button>
                    </div>
                  )}
                </div>

                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ยืนยันคำสั่งซื้อ</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 text-base">คุณต้องการยืนยันการสั่งซื้อใช่หรือไม่?</div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={processing}>
                        ยกเลิก
                      </Button>
                      <Button onClick={processOrder} disabled={processing}>
                        {processing ? "กำลังดำเนินการ..." : "ยืนยันสั่งซื้อ"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                  <form className="space-y-3 mt-4" onSubmit={(e) => handleSave(e)}>
                    <div className="grid w-full items-center gap-3">
                      <Label htmlFor="name">ชื่อผู้รับสินค้า <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="กรอกชื่อ-นามสกุล"
                        className="focus:ring-2 focus:ring-blue-400"
                      />
                      {!name && <span className="text-xs text-red-500 mt-1">กรุณากรอกชื่อผู้รับสินค้า</span>}
                    </div>
                    <div className="grid w-full items-center gap-3">
                      <Label htmlFor="phone">เบอร์โทรศัพท์ <span className="text-red-500">*</span></Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="เช่น 0812345678"
                        className="focus:ring-2 focus:ring-blue-400"
                        pattern="[0-9]{9,15}"
                      />
                      {!phone && <span className="text-xs text-red-500 mt-1">กรุณากรอกเบอร์โทรศัพท์</span>}
                      {phone && !/^\d{9,15}$/.test(phone) && <span className="text-xs text-red-500 mt-1">กรุณากรอกเฉพาะตัวเลข 9-15 หลัก</span>}
                      <span className="text-xs text-gray-500">จะใช้สำหรับติดต่อการจัดส่ง</span>
                    </div>
                    <div className="grid w-full items-center gap-3">
                      <Label htmlFor="address">ที่อยู่ <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        placeholder="บ้านเลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์"
                        className="focus:ring-2 focus:ring-blue-400 min-h-[60px]"
                      />
                      {!address && <span className="text-xs text-red-500 mt-1">กรุณากรอกที่อยู่สำหรับจัดส่ง</span>}
                      <span className="text-xs text-gray-500">โปรดระบุที่อยู่ให้ครบถ้วนเพื่อป้องกันการจัดส่งผิดพลาด</span>
                    </div>
                    <div className="grid w-full items-center gap-3">
                      <Label htmlFor="slip-upload">สลิปการโอนเงิน <span className="text-red-500">*</span></Label>
                      <Input
                        id="slip-upload"
                        type="file"
                        onChange={handleChooseFile}
                        accept="image/*"
                        required
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
                      />
                      {myFile && (
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-gray-700 text-sm truncate max-w-[180px]">{myFile.name}</span>
                          <span className="text-gray-400 text-xs">({(myFile.size/1024).toFixed(1)} KB)</span>
                          <div className="border rounded bg-gray-50 p-1">
                            <img
                              src={URL.createObjectURL(myFile)}
                              alt="slip preview"
                              className="h-14 w-auto object-contain rounded shadow"
                              onLoad={e => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                            />
                          </div>
                        </div>
                      )}
                      <p className="text-gray-500 text-xs mt-1">อัปโหลดเฉพาะไฟล์รูปภาพ เช่น .jpg, .png, .jpeg ขนาดไม่เกิน 5MB</p>
                    </div>
                    <div className="flex justify-between">
                      <span>จำนวนสินค้า</span>
                      <span>
                        {cartItems.reduce((total, item) => total + item.qty, 0)}{" "}
                        ชิ้น
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>ราคารวม</span>
                      <span>{totalPrice.toLocaleString()} บาท</span>
                    </div>
                    <Button type="submit" className="grid w-full items-center gap-3" size="lg" disabled={processing}>
                      {processing ? "กำลังดำเนินการ..." : "ดำเนินการสั่งซื้อ"}
                    </Button>
                  </form>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

      
