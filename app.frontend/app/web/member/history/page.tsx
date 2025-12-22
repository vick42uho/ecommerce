"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag,
  Package,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import { OrderInterface } from "@/app/interface/OrderInterface";
import axios from "axios";
import { Config } from "@/app/config";
import { toast } from "sonner";

const History = () => {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(
    {}
  );
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [confirmingOrders, setConfirmingOrders] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: "", endDate: "" });
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    try {
      const url = Config.apiURL + "/api/member/history";
      const headers = {
        Authorization: "Bearer " + localStorage.getItem(Config.tokenMember),
      };
      const response = await axios.get(url, { headers });
      if (response.status === 200) {
        setOrders(response.data);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการสั่งซื้อ", {
        duration: 3000,
      });
    }
  };

  // ฟังก์ชันยืนยันการรับสินค้า
  const confirmReceived = async (orderId: string) => {
    try {
      setConfirmingOrders(prev => ({ ...prev, [orderId]: true }));
      
      const url = Config.apiURL + `/api/cart/confirm-received/${orderId}`;
      const headers = {
        Authorization: "Bearer " + localStorage.getItem(Config.tokenMember),
      };
      
      const response = await axios.put(url, {}, { headers });
      
      if (response.status === 200) {
        toast.success("ยืนยันการรับสินค้าเรียบร้อยแล้ว", {
          duration: 3000,
        });
        // รีเฟรชข้อมูลออเดอร์
        await fetchData();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "เกิดข้อผิดพลาดในการยืนยันการรับสินค้า";
      toast.error(errorMessage, {
        duration: 3000,
      });
    } finally {
      setConfirmingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // สถานะการแสดงรายละเอียดของแต่ละออเดอร์
  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // คำนวณยอดรวมต่อออเดอร์
  const getOrderTotal = (order: OrderInterface) => {
    if (!order.OrderDetail) return 0;
    return order.OrderDetail.reduce((sum, od) => sum + od.price * od.qty, 0);
  };

  // แสดงสถานะของออเดอร์ด้วยสีที่แตกต่างกัน
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            ชำระเงินแล้ว
          </Badge>
        );
      case "send":
        return (
          <Badge
            variant="outline"
            className="bg-indigo-50 text-indigo-700 border-indigo-200"
          >
            จัดส่งแล้ว
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            รับสินค้าแล้ว
          </Badge>
        );
      case "cancel":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            ยกเลิก
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // แปลงตัวเลขเป็นรูปแบบเงินบาทไทย
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // ฟังก์ชันกรองข้อมูลตามการค้นหาและวันที่
  const getFilteredOrders = () => {
    let filtered = orders;

    // กรองตามคำค้นหา
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNo?.toLowerCase().includes(searchLower) ||
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.customerPhone?.includes(searchTerm) ||
        order.trackCode?.toLowerCase().includes(searchLower)
      );
    }

    // กรองตามวันที่
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

        if (startDate && endDate) {
          return orderDate >= startDate && orderDate <= endDate;
        } else if (startDate) {
          return orderDate >= startDate;
        } else if (endDate) {
          return orderDate <= endDate;
        }
        return true;
      });
    }

    return filtered;
  };

  // ฟังก์ชันล้างตัวกรอง
  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter({ startDate: "", endDate: "" });
    setShowDateFilter(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold">ประวัติการสั่งซื้อ</h1>

        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="ค้นหาเลขที่คำสั่งซื้อ, ชื่อ, เบอร์โทร, รหัสติดตาม"
              className="pl-8 w-full sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowDateFilter(!showDateFilter)}
            >
              <Calendar className="h-4 w-4" />
              <span>กรองตามวันที่</span>
            </Button>
            
            {(searchTerm || dateFilter.startDate || dateFilter.endDate) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Date Filter Panel */}
      {showDateFilter && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                วันที่เริ่มต้น
              </Label>
              <Input
                id="startDate"
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                วันที่สิ้นสุด
              </Label>
              <Input
                id="endDate"
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setDateFilter({ startDate: "", endDate: "" })}
              className="whitespace-nowrap"
            >
              ล้างวันที่
            </Button>
          </div>
        </div>
      )}

      {/* แสดงสรุปผลการค้นหา/กรอง */}
      {(searchTerm || dateFilter.startDate || dateFilter.endDate) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-medium text-blue-800">ผลการค้นหา</h3>
              <p className="text-sm text-blue-700">
                {searchTerm && <span>คำค้นหา: <strong>"{searchTerm}"</strong></span>}
                {searchTerm && (dateFilter.startDate || dateFilter.endDate) && <span> | </span>}
                {dateFilter.startDate && <span>วันที่เริ่มต้น: <strong>{dateFilter.startDate}</strong></span>}
                {dateFilter.startDate && dateFilter.endDate && <span> - </span>}
                {dateFilter.endDate && <span>วันที่สิ้นสุด: <strong>{dateFilter.endDate}</strong></span>}
              </p>
              <p className="text-sm mt-1">
                พบทั้งหมด <strong className="text-blue-800">{getFilteredOrders().length}</strong> รายการ
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearFilters}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              ล้างตัวกรองทั้งหมด
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value="paid">ชำระเงินแล้ว</TabsTrigger>
          <TabsTrigger value="send">จัดส่งแล้ว</TabsTrigger>
          <TabsTrigger value="completed">รับสินค้าแล้ว</TabsTrigger>
          <TabsTrigger value="cancel">ยกเลิก</TabsTrigger>
        </TabsList>

        {/* Helper function for filtering orders by status */}
        {[
          { key: "all", label: "ทั้งหมด", filter: (o: any) => true },
          { key: "paid", label: "ชำระเงินแล้ว", filter: (o: any) => o.status === "paid" || o.status === "ชำระเงินแล้ว" },
          { key: "send", label: "จัดส่งแล้ว", filter: (o: any) => o.status === "send" || o.status === "จัดส่งแล้ว" },
          { key: "completed", label: "รับสินค้าแล้ว", filter: (o: any) => o.status === "completed" || o.status === "รับสินค้าแล้ว" },
          { key: "cancel", label: "ยกเลิก", filter: (o: any) => o.status === "cancel" || o.status === "ยกเลิก" },
        ].map(tab => (
          <TabsContent key={tab.key} value={tab.key} className="space-y-6">
            {getFilteredOrders().filter(tab.filter).length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">ไม่มีคำสั่งซื้อในหมวด{tab.label}</p>
              </Card>
            ) : (
              getFilteredOrders().filter(tab.filter).map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 py-4 border-b">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-400">เลขที่คำสั่งซื้อ</span>
                        <span className="text-base font-bold tracking-wide text-blue-700 bg-blue-50 rounded px-2 py-1 mb-1 inline-block">{order.orderNo || '-'}</span>
                        <CardDescription>
                          <span className="font-medium">วันที่สั่งซื้อ:</span>{" "}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2 md:mt-0">
                        {getStatusBadge(order.status)}
                        <span className="font-bold text-lg text-green-700">
                          {formatCurrency(getOrderTotal(order))}
                        </span>
                        {/* ปุ่มยืนยันการรับสินค้า - แสดงเฉพาะเมื่อสถานะเป็น "จัดส่งแล้ว" */}
                        {(order.status === "send") && (
                          <Button
                            onClick={() => confirmReceived(order.id)}
                            disabled={confirmingOrders[order.id]}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
                          >
                            {confirmingOrders[order.id] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                กำลังยืนยัน...
                              </>
                            ) : (
                              "ยืนยันได้รับสินค้าแล้ว"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="font-medium mb-2">ข้อมูลผู้รับ</h3>
                        <div className="text-gray-700">
                          <p>
                            <span className="font-medium">ชื่อผู้รับ:</span>{" "}
                            {order.customerName}
                          </p>
                          <p>
                            <span className="font-medium">เบอร์โทรศัพท์:</span>{" "}
                            {order.customerPhone}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">ข้อมูลการจัดส่ง</h3>
                        <div className="text-gray-700">
                          <p>
                            <span className="font-medium">รหัสติดตามพัสดุ:</span>{" "}
                            {order.trackCode} {order.express}
                          </p>
                          <p>
                            <span>ที่อยู่:</span>
                            {order.customerAddress}
                          </p>
                          {order.remark && (
                            <p className="mt-2">
                              <span className="font-medium">หมายเหตุ:</span>{" "}
                              <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-sm">
                                {order.remark}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-center py-2 mt-2"
                      onClick={() => toggleOrderDetails(order.id)}
                    >
                      {expandedOrders[order.id] ? (
                        <>
                          <span>ซ่อนรายการสินค้า</span>
                          <ChevronUp className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <span>
                            ดูรายการสินค้า ({order.OrderDetail?.length || 0})
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    {expandedOrders[order.id] && (
                      <div className="mt-4">
                        <Separator className="my-4" />
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-left text-gray-500 text-sm">
                                <th className="pb-2">รหัสสินค้า</th>
                                <th className="pb-2">สินค้า</th>
                                <th className="pb-2 text-right">ราคา</th>
                                <th className="pb-2 text-right">จำนวน</th>
                                <th className="pb-2 text-right">ยอดรวม</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {order.OrderDetail && order.OrderDetail.length > 0 ? (
                                order.OrderDetail.map((orderDetail) => (
                                  <tr
                                    key={orderDetail.id}
                                    className="text-gray-700"
                                  >
                                    <td className="py-4">
                                      {orderDetail.Product?.isbn || "-"}
                                    </td>
                                    <td className="py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden relative">
                                          {/* ใช้รูปจำลองแทนไปก่อน */}
                                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                            {orderDetail.Product?.image ? (
                                              <Image
                                                src={`${Config.apiURL}/uploads/${orderDetail.Product.image}`}
                                                alt={orderDetail.Product.name}
                                                fill
                                                className="object-cover rounded"
                                              />
                                            ) : (
                                              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                                No image
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <span>{orderDetail.Product?.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-4 text-right">
                                      {orderDetail.price.toLocaleString()}
                                    </td>
                                    <td className="py-4 text-right">
                                      {orderDetail.qty}
                                    </td>
                                    <td className="py-4 text-right font-medium">
                                      {formatCurrency(
                                        orderDetail.price * orderDetail.qty
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="text-center text-gray-400 py-4"
                                  >
                                    ไม่มีรายการสินค้า
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot>
                              <tr className="font-bold">
                                <td colSpan={4} className="pt-4 text-right">
                                  ยอดรวมทั้งสิ้น:
                                </td>
                                <td className="pt-4 text-right">
                                  {formatCurrency(getOrderTotal(order))}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default History;
