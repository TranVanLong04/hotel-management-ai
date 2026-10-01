import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '@hooks/useTheme';

/**
 * Root component — khởi tạo trạng thái theme toàn cục
 * và render các nested layout / routes thông qua Outlet
 */
export function App() {
  const initTheme = useTheme((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return <Outlet />;
}
