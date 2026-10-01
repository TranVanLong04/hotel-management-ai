import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@layouts/MainLayout';
import { AdminLayout } from '@layouts/AdminLayout';
import { PublicRoute } from './PublicRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { HomePage } from '@/pages/HomePage';
import { RoomListPage } from '@/features/room/pages/RoomListPage';
import { RoomDetailPage } from '@/features/room/pages/RoomDetailPage';
import { BookingPage } from '@/features/booking/pages/BookingPage';
import { MyBookingsPage } from '@/features/booking/pages/MyBookingsPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { PATHS } from './paths';

/**
 * Cấu hình toàn bộ hệ thống Routes của ứng dụng
 * - MainLayout: Dành cho các trang công khai & khách hàng (Home, Rooms, RoomDetail, Bookings, Profile)
 * - AdminLayout: Dành cho trang quản trị & lễ tân (Staff, Admin)
 * - PublicRoute: Chặn user đã login vào các trang auth (Login, Register)
 * - RoleRoute & ProtectedRoute: Bảo vệ các trang nhạy cảm theo phân quyền
 */
export const router = createBrowserRouter([
  // === Layout chính (Khách vãng lai & Khách hàng) ===
  {
    path: PATHS.HOME,
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      // Danh sách phòng nghỉ (Phase 4)
      {
        path: PATHS.ROOMS,
        element: <RoomListPage />,
      },
      // Chi tiết phòng nghỉ (Phase 4)
      {
        path: PATHS.ROOM_DETAIL,
        element: <RoomDetailPage />,
      },
      // Các trang yêu cầu khách hàng đăng nhập
      {
        element: <ProtectedRoute />,
        children: [
          // Đặt phòng (Phase 5)
          {
            path: PATHS.BOOKING,
            element: <BookingPage />,
          },
          // Danh sách đặt phòng cá nhân (Phase 5)
          {
            path: PATHS.MY_BOOKINGS,
            element: <MyBookingsPage />,
          },
          {
            path: PATHS.MY_PROFILE,
            element: <HomePage />,
          },
          {
            path: PATHS.FACE_REGISTER,
            element: <HomePage />,
          },
        ],
      },
    ],
  },

  // === Xác thực tài khoản (Chỉ dành cho người chưa đăng nhập) ===
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

  // === Layout Quản trị & Lễ tân (Staff & Admin) ===
  {
    element: <RoleRoute allowedRoles={['admin', 'staff']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          // Route chuyển hướng mặc định cho staff/admin
          {
            path: '/admin',
            element: <Navigate to={PATHS.ADMIN_DASHBOARD} replace />,
          },
          {
            path: '/staff',
            element: <Navigate to={PATHS.STAFF_CHECKIN} replace />,
          },

          // Nghiệp vụ Admin
          {
            path: PATHS.ADMIN_DASHBOARD,
            element: (
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleRoute>
            ),
          },
          {
            path: PATHS.ADMIN_ROOMS,
            element: (
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleRoute>
            ),
          },
          {
            path: PATHS.ADMIN_ROOM_TYPES,
            element: (
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleRoute>
            ),
          },
          {
            path: PATHS.ADMIN_SERVICES,
            element: (
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleRoute>
            ),
          },
          {
            path: PATHS.ADMIN_USERS,
            element: (
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleRoute>
            ),
          },
          {
            path: PATHS.ADMIN_REPORTS,
            element: (
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleRoute>
            ),
          },

          // Nghiệp vụ Lễ tân (Staff & Admin)
          {
            path: PATHS.STAFF_CHECKIN,
            element: <AdminDashboardPage />,
          },
          {
            path: PATHS.STAFF_CHECKOUT,
            element: <AdminDashboardPage />,
          },
          {
            path: PATHS.STAFF_BOOKINGS,
            element: <AdminDashboardPage />,
          },
        ],
      },
    ],
  },

  // === Error Pages ===
  {
    path: PATHS.FORBIDDEN,
    element: <ForbiddenPage />,
  },
  {
    path: PATHS.NOT_FOUND,
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
