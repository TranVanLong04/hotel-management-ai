import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  hasRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isCustomer: () => boolean;
}

/**
 * Store quản lý trạng thái xác thực
 * Persist user + token vào localStorage
 * isAuthenticated được tính lại từ token khi rehydrate
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      /** Đăng nhập — lưu thông tin user và token */
      login: (user: User, token: string) =>
        set({ user, token, isAuthenticated: true }),

      /** Đăng xuất — xóa toàn bộ thông tin xác thực */
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      /** Cập nhật thông tin user (ví dụ: sau khi sửa profile) */
      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      /** Kiểm tra user có role nằm trong danh sách cho phép */
      hasRole: (roles: UserRole[]) => {
        const user = get().user;
        return user !== null && roles.includes(user.role);
      },

      isAdmin: () => get().user?.role === 'admin',
      isStaff: () => get().user?.role === 'staff',
      isCustomer: () => get().user?.role === 'customer',
    }),
    {
      name: 'auth-storage',
      // Chỉ persist user và token — isAuthenticated tự tính lại
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.token !== null,
      }),
    }
  )
);
