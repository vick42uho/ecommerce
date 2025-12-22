import axios from "axios"
import { Config } from "@/app/config"
import { toast } from "sonner"
import { Category, ProductInterface } from "@/app/interface/ProductInterface"
import { useEffect, useState } from "react"

/**
 * Fetches product list from the API
 * @returns Promise with product data or null if error occurs
 */
export const fetchDataProduct = async (): Promise<ProductInterface[] | null> => {
  try {
    const response = await axios.get(`${Config.apiURL}/api/product/list`);
    if (response.status === 200) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    console.error("Error fetching products:", error);
    toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า", {
      duration: 3000,
    });
    return null;
  }
};

/**
 * Custom hook to fetch and manage product data
 * @returns Object containing products, loading state, and error state
 */
export const useProductData = () => {
    const [products, setProducts] = useState<ProductInterface[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const loadProducts = async () => {
        try {
          setLoading(true);
          const data = await fetchDataProduct();
          if (data) {
            setProducts(data);
            
            // สร้างรายการหมวดหมู่จากสินค้าทั้งหมด
            const categoryMap = new Map<string, number>();
            
            data.forEach(product => {
              if (product.category) {
                const count = categoryMap.get(product.category) || 0;
                categoryMap.set(product.category, count + 1);
              }
            });
  
            // แปลง Map เป็น Array ของ Category
            const categoryList = Array.from(categoryMap.entries()).map(([name], index) => ({
              id: `cat-${index}`,
              name,
              count: categoryMap.get(name) || 0
            }));
  
            setCategories(categoryList);
          }
        } catch (err) {
          setError("ไม่สามารถโหลดข้อมูลสินค้าได้");
          console.error(err);
          toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า", { duration: 3000 });
        } finally {
          setLoading(false);
        }
      };
  
      loadProducts();
    }, []);
  
    // ฟังก์ชันสำหรับกรองสินค้าตามหมวดหมู่
    const getProductsByCategory = (categoryName: string) => {
      return products.filter(product => product.category === categoryName);
    };
  
    return { 
      products, 
      categories, 
      loading, 
      error,
      getProductsByCategory 
    };
  };