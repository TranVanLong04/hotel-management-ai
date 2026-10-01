import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@components/layout/Header';
import { Footer } from '@components/layout/Footer';
import { useTheme } from '@hooks/useTheme';

/**
 * Layout chính cho khách hàng và khách vãng lai (Public / Customer routes)
 * Bao gồm Header cố định ở trên, nội dung trang thông qua Outlet, và Footer ở cuối
 */
export function MainLayout() {
  const initTheme = useTheme((state) => state.initTheme);

  // Đảm bảo theme được đồng bộ class 'dark' khi layout mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
