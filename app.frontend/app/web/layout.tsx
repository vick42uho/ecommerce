"use client";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "./components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/app/contexts/CartContext";
import Footer from "./components/Footer";


export default function MemberLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <Toaster position="top-right" duration={3000} />
            <Navbar />
            <main className="flex-grow">
              <div className="container mx-auto py-8 px-4">
                {children}
              </div>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </ThemeProvider>
    </>
  );
}
