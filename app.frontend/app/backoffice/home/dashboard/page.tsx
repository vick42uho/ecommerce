'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Config } from '@/app/config'
import { useRouter } from 'next/navigation'
import { DashboardSummary, MonthlySalesData } from '../../../interface/DashboardInterface'

export default function DashboardPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  
  // ดึงข้อมูลสรุป Dashboard
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem(Config.tokenAdmin)
        
        // ตรวจสอบว่ามี token หรือไม่
        if (!token) {
          toast.error('กรุณาเข้าสู่ระบบ')
          router.push('/backoffice/signin')
          return
        }
        
        const url = Config.apiURL + '/api/dashboard'
        const headers = {
          'Authorization': `Bearer ${token}`
        }
        
        const response = await fetch(url, { headers })
        
        // ตรวจสอบสถานะ response
        if (response.status === 401) {
          // Token หมดอายุหรือไม่ถูกต้อง
          toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่')
          localStorage.removeItem(Config.tokenAdmin)
          router.push('/backoffice/signin')
          return
        }
        
        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลได้')
        }
        
        const data = await response.json()
        
        // ตรวจสอบว่าข้อมูลมี error หรือไม่
        if (data.error) {
          throw new Error(data.error)
        }
        
        setSummary(data)
      } catch (error: any) {
        console.error('Error fetching dashboard summary:', error)
        toast.error(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard')
      }
    }

    fetchSummary()
  }, [router])

  // ดึงข้อมูลยอดขายรายเดือน
  useEffect(() => {
    const fetchMonthlySales = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem(Config.tokenAdmin)
        
        // ตรวจสอบว่ามี token หรือไม่
        if (!token) {
          // ไม่แสดง toast ซ้ำเพราะ fetchSummary จะแสดงแล้ว
          return
        }
        
        const headers = {
          'Authorization': `Bearer ${token}`
        }
        
        const response = await fetch(Config.apiURL + `/api/dashboard/monthly-sales/${year}`, {
          headers
        })
        
        // ตรวจสอบสถานะ response
        if (response.status === 401) {
          // ไม่แสดง toast ซ้ำเพราะ fetchSummary จะจัดการแล้ว
          return
        }
        
        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลได้')
        }

        const data = await response.json()
        
        // ตรวจสอบว่าข้อมูลมี error หรือไม่
        if (data.error) {
          throw new Error(data.error)
        }
        
        setMonthlySales(data)
      } catch (error: any) {
        console.error('Error fetching monthly sales:', error)
        toast.error(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลยอดขายรายเดือน')
      } finally {
        setLoading(false)
      }
    }

    fetchMonthlySales()
  }, [year, router])

  // ฟังก์ชันสำหรับเปลี่ยนปีที่ต้องการดูข้อมูล
  const handleYearChange = (selectedYear: number) => {
    setYear(selectedYear)
  }

  // สร้างตัวเลือกปีย้อนหลัง 5 ปี
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // แปลงสถานะเป็นภาษาไทย
  const statusMapping = {
    paid: 'ชำระเงินแล้ว',
    send: 'จัดส่งแล้ว',
    completed: 'รับสินค้าแล้ว',
    cancel: 'ยกเลิก'
  }

  // สีสำหรับสถานะ
  const statusColors = {
    paid: 'bg-blue-100 text-blue-800',
    send: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancel: 'bg-red-100 text-red-800'
  }

  // ฟอร์แมตตัวเลขเป็นเงินบาท
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading && !summary) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">แดชบอร์ด</h1>
      
      {/* สรุปข้อมูล */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">ออเดอร์ทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalOrders || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">สมาชิกทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalMembers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">สินค้าทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalProducts || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">ยอดขายรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.totalSales || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* สถานะออเดอร์ */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">สถานะออเดอร์</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summary?.statusCounts && Object.entries(summary.statusCounts).map(([status, count]) => (
            <Card key={status}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">สถานะ</p>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${statusColors[status as keyof typeof statusColors]}`}>
                      {statusMapping[status as keyof typeof statusMapping]}
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* สินค้าขายดี */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">สินค้าขายดี 5 อันดับแรก</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สินค้า</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนที่ขายได้</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary?.topProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.image && (
                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                          <img className="h-10 w-10 rounded-full object-cover" src={`${Config.apiURL}/uploads/${product.image}`} alt={product.name} />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.totalSold} ชิ้น
                  </td>
                </tr>
              ))}
              {(!summary?.topProducts || summary.topProducts.length === 0) && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                    ไม่พบข้อมูลสินค้าขายดี
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* กราฟยอดขาย */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">ยอดขายรายเดือน</h2>
          <select 
            value={year}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            {monthlySales ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlySales.monthlySales}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${formatCurrency(value as number)}`, 'ยอดขาย']}
                    />
                    <Legend />
                    <Bar dataKey="amount" name="ยอดขาย" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* กราฟยอดขายรายวัน 7 วันล่าสุด */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">ยอดขายรายวัน (7 วันล่าสุด)</h2>
        <Card>
          <CardContent className="pt-6">
            {summary?.dailySales ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.dailySales}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        const d = new Date(date)
                        return `${d.getDate()}/${d.getMonth() + 1}`
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${formatCurrency(value as number)}`, 'ยอดขาย']}
                      labelFormatter={(label) => {
                        const d = new Date(label)
                        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
                      }}
                    />
                    <Legend />
                    <Bar dataKey="amount" name="ยอดขาย" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}