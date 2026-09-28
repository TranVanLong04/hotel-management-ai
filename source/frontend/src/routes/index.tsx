import { createBrowserRouter } from 'react-router-dom';
import { App } from '@/App';

/**
 * Router chính của ứng dụng
 * Phase 1: Cấu trúc cơ bản — các route sẽ được thêm trong phase sau
 *
 * Kiến trúc dự kiến:
 * - Public routes: /, /login, /register, /rooms
 * - Protected routes (nested dưới MainLayout)
 * - Admin routes (nested dưới AdminLayout)
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    // TODO: Phase sau sẽ thêm children routes với lazy loading
    // children: [
    //   { index: true, lazy: () => import('@pages/HomePage') },
    //   { path: 'login', lazy: () => import('@pages/LoginPage') },
    // ]
  },
]);
