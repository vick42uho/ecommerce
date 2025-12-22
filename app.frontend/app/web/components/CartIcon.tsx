"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCart } from "@/app/contexts/CartContext";

export const CartIcon = () => {
  // ใช้ CartContext แทนการดึงข้อมูลโดยตรง
  const { cartCount } = useCart();

  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/web/member/cart" className="relative">
        <ShoppingCart className="h-5 w-5" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
        <span className="sr-only">ตะกร้าสินค้า</span>
      </Link>
    </Button>
  );
};

export default CartIcon;
