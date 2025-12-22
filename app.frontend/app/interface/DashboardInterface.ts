// ประเภทข้อมูลสำหรับ API response
export interface DashboardSummary {
  totalOrders: number
  totalMembers: number
  totalProducts: number
  totalSales: number
  statusCounts: {
    paid: number
    send: number
    completed: number
    cancel: number
  }
  dailySales: Array<{
    date: string
    amount: number
  }>
  topProducts: Array<{
    id: string
    name: string
    image: string | null
    totalSold: number
  }>
}

export interface MonthlySalesData {
  year: number
  monthlySales: Array<{
    month: string
    amount: number
  }>
}