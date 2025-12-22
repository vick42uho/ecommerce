"use client";

import { Config } from "@/app/config";
import { OrderInterface } from "@/app/interface/OrderInterface";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
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
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { ZoomDialog } from "@/components/ui/ZoomDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/app/interface/ErrorInterface";

const OrderPage = () => {
  const [zoomOpen, setZoomOpen] = useState(false);
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderInterface | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filter states
  const [filteredOrders, setFilteredOrders] = useState<OrderInterface[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);

  // Form states
  const [trackCode, setTrackCode] = useState("");
  const [express, setExpress] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // --- เพิ่ม useEffect นี้เข้าไป ---
  useEffect(() => {
    // เริ่มต้นด้วยข้อมูลทั้งหมดจาก State `orders`
    let result = orders;

    // 1. กรองด้วยคำค้นหา (searchQuery)
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          order.customerName.toLowerCase().includes(lowercasedQuery) ||
          order.customerPhone.includes(lowercasedQuery) ||
          order.orderNo.toLowerCase().includes(lowercasedQuery) ||
          order.id.toLowerCase().includes(lowercasedQuery) // ค้นหาจาก Order ID ด้วย
      );
    }

    // 2. กรองด้วยสถานะ (selectedStatus)
    if (selectedStatus && selectedStatus !== "all") {
      result = result.filter((order) => order.status === selectedStatus);
    }

    // 3. นำผลลัพธ์สุดท้ายไปเก็บใน state `filteredOrders` เพื่อแสดงผล
    setFilteredOrders(result);

    // 4. คำนวณจำนวนหน้าทั้งหมดจากข้อมูลที่กรองแล้ว
    setTotalPages(Math.ceil(result.length / itemsPerPage));

    // 5. รีเซ็ตหน้าปัจจุบันเป็น 1 เมื่อมีการกรองข้อมูลใหม่
    setCurrentPage(1);
  }, [orders, searchQuery, selectedStatus, itemsPerPage]); // useEffect นี้จะทำงานทุกครั้งที่ค่าในวงเล็บนี้เปลี่ยนไป
  // --- สิ้นสุดส่วนที่เพิ่ม ---

  const fetchData = async () => {
    try {
      const { data } = await axios.get(`${Config.apiURL}/api/order/list`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(Config.tokenAdmin)}`,
        },
      });
      setOrders(data);
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.message);
    }
  };

  // ฟังก์ชันสำหรับคำนวณข้อมูลที่จะแสดงในหน้าปัจจุบัน
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  // ฟังก์ชันสำหรับเปลี่ยนหน้า
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ฟังก์ชันสำหรับสร้างปุ่มหน้า
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // แสดงทุกหน้าถ้าจำนวนหน้าไม่เกิน maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // แสดงหน้าแบบมี ellipsis
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const openDialog = (order: OrderInterface) => {
    setSelectedOrder(order);
    setTrackCode(order.trackCode || "");
    setExpress(order.express || "");
    setRemark(order.remark || "");
    setIsDialogOpen(true);
  };

  const handleSend = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      await axios.put(
        `${Config.apiURL}/api/order/send`,
        {
          orderId: selectedOrder.id,
          trackCode,
          express,
          remark,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(Config.tokenAdmin)}`,
          },
        }
      );
      toast.success("บันทึกข้อมูลจัดส่งสำเร็จ");
      fetchData();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaid = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      await axios.put(
        `${Config.apiURL}/api/order/paid/${selectedOrder.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(Config.tokenAdmin)}`,
          },
        }
      );
      toast.success("ยืนยันได้รับเงินแล้ว");
      fetchData();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder) return;
    if (!remark) {
      toast.error("กรุณาระบุหมายเหตุสำหรับการยกเลิก");
      return;
    }
    setLoading(true);
    try {
      const url = Config.apiURL + "/api/order/cancel/" + selectedOrder.id;
      const token = localStorage.getItem(Config.tokenAdmin);
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      const response = await axios.put(url, { remark }, { headers });
      if (response.status === 200) {
        toast.success("ยกเลิกรายการสำเร็จ");
        fetchData();
        setIsDialogOpen(false);
      }
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="destructive">รอชำระเงิน</Badge>;
      case "paid":
        return <Badge className="bg-yellow-500">ได้รับเงินแล้ว</Badge>;
      case "send":
        return <Badge className="bg-green-500">จัดส่งแล้ว</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">สำเร็จ</Badge>;
      case "cancel":
        return (
          <Badge variant="outline" className="bg-red-200 text-red-600">
            ยกเลิก
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const statusLabels: { [key: string]: string } = {
    "all": "ทั้งหมด",
    pending: "รอชำระเงิน",
    paid: "ได้รับเงินแล้ว",
    send: "จัดส่งแล้ว",
    completed: "สำเร็จ",
    cancel: "ยกเลิก",
  };

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-6">
      <Toaster position="top-right" richColors />
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">รายการสั่งซื้อ</h1>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            {/* <Label htmlFor="search">ค้นหา</Label> */}
            <Input
              id="search"
              placeholder="ค้นหาชื่อ, เบอร์โทร, หรือเลขคำสั่งซื้อ"
              value={searchQuery} // <-- เพิ่ม value
              onChange={(e) => setSearchQuery(e.target.value)} // <-- เพิ่ม onChange
            />
          </div>

          <div className="space-y-2">
            {/* <Label htmlFor="status">สถานะ</Label> */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // <-- เพิ่ม onClick
                setSearchQuery("");
                setSelectedStatus("");
                setCurrentPage(1);
              }}
            >
              ล้างการค้นหา
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full overflow-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>วันที่</TableHead>
              <TableHead>ผู้รับ</TableHead>
              <TableHead>ที่อยู่</TableHead>
              <TableHead>เบอร์โทร</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-center">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getCurrentPageData().map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  {new Date(order.createdAt).toLocaleDateString("th-TH")}
                </TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {order.customerAddress}
                </TableCell>
                <TableCell>{order.customerPhone}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openDialog(order)}
                  >
                    รายละเอียด
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 px-2">
            <div className="text-sm text-gray-600">
              แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} จาก {filteredOrders.length} รายการ
            </div>

            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ก่อนหน้า
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
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
              </div>

              {/* Next Button */}
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



      {selectedOrder && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                หมายเลขคำสั่งซื้อ #{selectedOrder.orderNo}
              </DialogTitle>
            </DialogHeader>
            <form className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    ข้อมูลลูกค้า
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border ml-2">
                      สถานะ: {getStatusBadge(selectedOrder.status)}
                    </span>
                  </h3>
                  <p>
                    <strong>ชื่อ:</strong> {selectedOrder.customerName}
                  </p>
                  <p>
                    <strong>ที่อยู่:</strong> {selectedOrder.customerAddress}
                  </p>
                  <p>
                    <strong>โทร:</strong> {selectedOrder.customerPhone}
                  </p>
                  <h3 className="font-semibold mt-4">สลิปชำระเงิน</h3>
                  {selectedOrder.slipImage ? (
                    <div className="relative inline-block group">
                      <Image
                        src={`${Config.apiURL}/uploads/slip/${selectedOrder.slipImage}`}
                        alt="สลิปชำระเงิน"
                        width={200}
                        height={300}
                        className="rounded-md border"
                      />
                      <button
                        type="button"
                        className="absolute bottom-2 right-2 bg-white/80 rounded-full p-1 shadow-md border border-gray-200 hover:bg-white z-10 group-hover:scale-110 transition"
                        onClick={() => setZoomOpen(true)}
                        aria-label="ขยายดูรูปใหญ่"
                      >
                        {/* ใช้ XIcon เป็น placeholder, สามารถเปลี่ยนเป็นไอคอนขยายได้ถ้ามี */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-zoom-in"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="M21 21l-4.3-4.3" />
                          <path d="M11 8v6" />
                          <path d="M8 11h6" />
                        </svg>
                      </button>
                      <ZoomDialog
                        open={zoomOpen}
                        onOpenChange={setZoomOpen}
                        imageUrl={`${Config.apiURL}/uploads/slip/${selectedOrder.slipImage}`}
                        alt="สลิปชำระเงิน"
                      />
                    </div>
                  ) : (
                    <p>ไม่มีสลิป</p>
                  )}
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">อัปเดตข้อมูลจัดส่ง</h3>
                  <div className="bg-slate-50 rounded-md p-3 space-y-3 border">
                    <div>
                      <Label htmlFor="trackCode">
                        รหัสติดตามพัสดุ <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="trackCode"
                        value={trackCode}
                        onChange={(e) => setTrackCode(e.target.value)}
                        placeholder="กรอกรหัสพัสดุ"
                        className="mt-1"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        จำเป็นสำหรับการจัดส่ง
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="express">
                        บริษัทขนส่ง <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="express"
                        value={express}
                        onChange={(e) => setExpress(e.target.value)}
                        placeholder="เช่น Kerry, Flash, ไปรษณีย์ไทย ฯลฯ"
                        className="mt-1"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        จำเป็นสำหรับการจัดส่ง
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="remark">
                        หมายเหตุ <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="remark"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="ระบุหมายเหตุ เช่น เหตุผลการยกเลิก หรือข้อมูลเพิ่มเติม"
                        className="mt-1"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        จำเป็นสำหรับการยกเลิก หรือใช้บันทึกข้อมูลอื่น ๆ
                      </div>
                      {/* Error message for cancel without remark will be shown via toast */}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">รายการสินค้า</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>สินค้า</TableHead>
                      <TableHead>ราคา</TableHead>
                      <TableHead>จำนวน</TableHead>
                      <TableHead className="text-right">รวม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.OrderDetail.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="flex items-center gap-2">
                          <Image
                            src={`${Config.apiURL}/uploads/${item.Product.image}`}
                            alt={item.Product.name}
                            width={40}
                            height={40}
                            className="rounded-md"
                          />
                          {item.Product.name}
                        </TableCell>
                        <TableCell>
                          {item.price.toLocaleString("th-TH")} บาท
                        </TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell className="text-right">
                          {(item.price * item.qty).toLocaleString("th-TH")} บาท
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="flex-col md:flex-row gap-2 mt-4">
                <div className="flex flex-wrap gap-2 w-full justify-between">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={
                        loading ||
                        selectedOrder.status === "paid" ||
                        selectedOrder.status === "send" ||
                        selectedOrder.status === "completed" ||
                        selectedOrder.status === "cancel"
                      }
                    >
                      ยกเลิกคำสั่งซื้อ
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePaid}
                      disabled={
                        loading ||
                        selectedOrder.status === "paid" ||
                        selectedOrder.status === "send" ||
                        selectedOrder.status === "completed" ||
                        selectedOrder.status === "cancel"
                      }
                    >
                      {selectedOrder.status === "paid" ||
                        selectedOrder.status === "send"
                        ? "ได้รับเงินแล้ว"
                        : "ยืนยันได้รับเงินแล้ว"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSend}
                      disabled={
                        loading ||
                        !trackCode ||
                        !express ||
                        selectedOrder.status !== "paid"
                      }
                    >
                      บันทึกข้อมูลจัดส่ง
                    </Button>
                  </div>
                  <div className="flex-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={loading}
                    >
                      ปิดหน้าต่าง
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
export default OrderPage;
