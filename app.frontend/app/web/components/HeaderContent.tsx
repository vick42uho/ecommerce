"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { useProductData } from "./FetchDataProduct";

export function HeaderContent() {
  // ใช้ hook ที่เราสร้างไว้
  const { products, loading, error } = useProductData();
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  );

  // แสดงหน้าโหลดข้อมูล
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  // แสดงข้อผิดพลาดถ้ามี
  if (error) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-red-500">
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </div>
    );
  }

  // แสดงข้อความเมื่อไม่มีข้อมูล
  if (!products || products.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        ไม่พบข้อมูลสินค้า
      </div>
    );
  }

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full max-w-4xl mx-auto"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {products.map((product) => (
          <CarouselItem key={product.id}>
            <div className="p-1">
              <Card className="overflow-hidden">
                <CardContent className="flex aspect-video items-center justify-center p-0 relative">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={1200}
                    height={630}
                    className="w-full h-full object-cover"
                    priority
                  />
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
  );
}