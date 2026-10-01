import { createBrowserRouter } from 'react-router-dom';
import { App } from '@/App';
import { PublicRoute } from './PublicRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { PATHS } from './paths';

/**
 * Router chính của ứng dụng
 * Phase 2: Bổ sung các route xác thực (Login, Register) bọc bởi PublicRoute
 */
export const router = createBrowserRouter([
  {
    path: PATHS.HOME,
    element: <App />,
  },
  {
    path: PATHS.LOGIN,
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: PATHS.REGISTER,
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
]);

