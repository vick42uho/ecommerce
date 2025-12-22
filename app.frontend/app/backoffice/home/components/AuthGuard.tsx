'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Config } from '@/app/config';
import { toast } from 'sonner';

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(Config.tokenAdmin);
      if (!token) {
        toast.error('กรุณาเข้าสู่ระบบ', {
          duration: 3000,
          position: 'top-right'
        });
        router.push('/backoffice/signin');
        setIsAuthenticated(false);
        return;
      }
      
      setIsAuthenticated(true);
    };

    checkAuth();
  }, [router]);

  // ถ้ากำลังตรวจสอบการ authenticate จะแสดง loading
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ถ้าไม่ได้ authenticate จะไม่แสดงเนื้อหา
  if (isAuthenticated === false) {
    return null;
  }

  // ถ้า authenticate แล้วจะแสดงเนื้อหา
  return <>{children}</>;
}
