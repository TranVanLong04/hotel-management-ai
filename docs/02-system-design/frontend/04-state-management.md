# State Management (Zustand)

## Cài đặt
`pnpm add zustand`

## Khi nào dùng gì

| Case | Solution |
|------|----------|
| Local UI (modal open) | `useState` |
| Form state | `react-hook-form` |
| Server cache (fetched data) | Custom hook + `useState` |
| Global client state | Zustand |
| URL params | `useSearchParams` |

## Store pattern

**`authStore.js`** — Persist vào localStorage:
- State: `user`, `token`, `isAuthenticated`
- Actions: `login(user, token)`, `logout()`, `updateUser(updates)`
- Selectors: `hasRole(roles)`, `isAdmin()`, `isStaff()`, `isCustomer()`
- Middleware: `persist` với `partialize` chỉ lưu user + token

**`bookingStore.js`** — Không persist:
- State wizard: `checkInDate`, `checkOutDate`, `selectedRoom`, `numberOfGuests`, `faceImage`, `currentStep`
- Actions: `setDates`, `setRoom`, `setGuests`, `nextStep`, `prevStep`, `reset`
- Getters: `getNights()`, `getTotalPrice()`

**`uiStore.js`** — Sidebar state:
- `sidebarOpen`, `openSidebar()`, `closeSidebar()`, `toggleSidebar()`

**`useTheme.js`** — Light/Dark mode:
- `theme` ('light' | 'dark'), `toggleTheme()`, `initTheme()`
- Persist vào localStorage
- Apply class `dark` lên `<html>`

## Cách dùng đúng

```javascript
// ✅ Chỉ lấy field cần → không re-render thừa
const user = useAuthStore((s) => s.user);
const login = useAuthStore((s) => s.login);

// ❌ Lấy cả store → re-render khi bất kỳ field đổi
const store = useAuthStore();

// Dùng nhiều field (cần useShallow để tránh re-render)
const { user, token } = useAuthStore(
  useShallow((s) => ({ user: s.user, token: s.token }))
);
```

## Persist

```javascript
persist(
  (set, get) => ({ /* state */ }),
  {
    name: 'auth-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ user: state.user, token: state.token }),
  }
)
```

**Không persist** dữ liệu nhạy cảm như password, OTP.

## Best practices
- 1 store = 1 domain
- Dùng selector thay vì `useStore()` full
- Persist chỉ những gì cần
- Reset state sau khi flow kết thúc
- Action đặt tên rõ nghĩa (`login` không phải `setAuth`)