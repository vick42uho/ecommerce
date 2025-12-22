"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface PageBreadcrumbProps {
  items?: {
    title: string
    href: string
  }[]
}

export function PageBreadcrumb({ items }: PageBreadcrumbProps) {
  const pathname = usePathname()
  
  // ถ้าไม่มี items ที่ส่งมา ให้สร้างจาก pathname
  const breadcrumbItems = items || generateBreadcrumbItems(pathname)

  return (
    <Breadcrumb className="mb-4 px-4 py-2">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/backoffice/home/dashboard">หน้าหลัก</BreadcrumbLink>
        </BreadcrumbItem>
        
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === breadcrumbItems.length - 1 ? (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

// ฟังก์ชันสำหรับสร้าง breadcrumb items จาก pathname
function generateBreadcrumbItems(pathname: string) {
  const segments = pathname
    .split('/')
    .filter(segment => segment && segment !== 'backoffice' && segment !== 'home')
  
  const breadcrumbItems = []
  let path = '/backoffice/home'
  
  for (const segment of segments) {
    path += `/${segment}`
    
    // แปลงชื่อเส้นทางเป็นชื่อที่อ่านง่าย
    let title = segment.charAt(0).toUpperCase() + segment.slice(1)
    
    // แปลงชื่อเฉพาะ
    switch (segment) {
      case 'dashboard':
        title = 'แดชบอร์ด'
        break
      case 'product':
        title = 'สินค้า'
        break
      case 'order':
        title = 'รายการสั่งซื้อ'
        break
      case 'admin':
        title = 'ผู้ดูแลระบบ'
        break
      case 'edit-profile':
        title = 'แก้ไขข้อมูลส่วนตัว'
        break
    }
    
    breadcrumbItems.push({
      title,
      href: path,
    })
  }
  
  return breadcrumbItems
}
