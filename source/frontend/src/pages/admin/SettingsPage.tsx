import { useState } from 'react';
import {
  Hotel,
  User,
  Shield,
  Bell,
  Palette,
  Save,
  Moon,
  Sun,
  Info,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useAuthStore } from '@stores/authStore';
import { useTheme } from '@hooks/useTheme';
import { userApi } from '@/api/user.api';

type SettingsTab = 'general' | 'profile' | 'security' | 'notifications' | 'appearance';

export function SettingsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const theme = useTheme((state) => state.theme);
  const toggleTheme = useTheme((state) => state.toggleTheme);

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Form Profile State
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Form General State
  const [hotelName] = useState('Khách sạn Grand Luxury Da Nang');
  const [hotelAddress] = useState('54 Nguyễn Văn Linh, Hải Châu, Đà Nẵng');
  const [hotelHotline] = useState('1900 6868');
  const [hotelEmail] = useState('contact@grandluxury.vn');
  const [checkinTime] = useState('14:00');
  const [checkoutTime] = useState('12:00');

  // Lưu thông tin hồ sơ Admin hiện tại qua API
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!fullName.trim()) {
      toast.error('Họ tên không được để trống');
      return;
    }

    setProfileSaving(true);
    try {
      await userApi.update(currentUser.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      toast.success('Cập nhật hồ sơ quản trị viên thành công');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật hồ sơ';
      toast.error(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Cài đặt Hệ thống & Tài khoản
        </h1>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Tùy chỉnh thông tin khách sạn, bảo mật tài khoản và giao diện hiển thị
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Navigation Tabs (Sidebar style) */}
        <Card className="p-2 md:col-span-1">
          <nav className="space-y-1">
            {[
              { id: 'general', label: 'Thông tin Khách sạn', icon: Hotel },
              { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
              { id: 'security', label: 'Bảo mật & Phiên', icon: Shield },
              { id: 'notifications', label: 'Thông báo', icon: Bell },
              { id: 'appearance', label: 'Giao diện', icon: Palette },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Content Area */}
        <div className="md:col-span-3">
          {activeTab === 'general' && (
            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    Thông tin Khách sạn & Quy định
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Thông số niêm yết của khách sạn dùng trong hóa đơn và email xác nhận
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <strong className="font-semibold">Lưu ý cơ sở dữ liệu:</strong>
                      <p className="mt-0.5 text-[11px]">
                        Theo kiến trúc DB 10 bảng của đồ án tốt nghiệp, thông tin khách sạn được cấu hình cố định trên máy chủ (Backend environment) để đảm bảo toàn vẹn dữ liệu cho toàn bộ hệ thống hóa đơn và thanh toán.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                      Tên thương hiệu khách sạn
                    </label>
                    <input
                      type="text"
                      disabled
                      value={hotelName}
                      className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-800 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                      Hotline liên hệ
                    </label>
                    <input
                      type="text"
                      disabled
                      value={hotelHotline}
                      className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-800 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                    Địa chỉ trụ sở
                  </label>
                  <input
                    type="text"
                    disabled
                    value={hotelAddress}
                    className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-800 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-200"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                      Email hỗ trợ
                    </label>
                    <input
                      type="text"
                      disabled
                      value={hotelEmail}
                      className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-800 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                      Giờ Check-in tiêu chuẩn
                    </label>
                    <input
                      type="text"
                      disabled
                      value={checkinTime}
                      className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-800 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                      Giờ Check-out tiêu chuẩn
                    </label>
                    <input
                      type="text"
                      disabled
                      value={checkoutTime}
                      className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-800 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-200"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'profile' && (
            <Card className="p-6">
              <div className="mb-5 border-b border-gray-100 pb-4 dark:border-gray-800">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Hồ sơ Cá nhân Quản trị viên
                </h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Cập nhật họ tên và thông tin liên lạc cho tài khoản của bạn
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                    Email tài khoản (Không thể thay đổi)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || ''}
                    className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" size="sm" loading={profileSaving} className="gap-1.5">
                    <Save className="h-4 w-4" />
                    <span>Lưu thay đổi</span>
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6">
              <div className="mb-5 border-b border-gray-100 pb-4 dark:border-gray-800">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Bảo mật & Phiên làm việc
                </h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Thông tin cơ chế xác thực JWT và kiểm soát quyền truy cập
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Xác thực Token JWT an toàn
                    </h4>
                    <p className="mt-0.5 text-gray-500 dark:text-gray-400">
                      Phiên đăng nhập được mã hóa theo chuẩn JWT HMAC-SHA256 với thời hạn 7 ngày. Khi hết hạn, hệ thống sẽ tự động yêu cầu xác thực lại để bảo vệ dữ liệu khách sạn.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <Shield className="h-5 w-5 text-primary-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Phân quyền theo vai trò (RBAC)
                    </h4>
                    <p className="mt-0.5 text-gray-500 dark:text-gray-400">
                      Tài khoản của bạn đang có vai trò{' '}
                      <strong className="text-primary-600">Quản trị viên (Admin)</strong>, được toàn quyền truy cập các báo cáo doanh thu, quản lý nhân sự, buồng phòng và bảng giá.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6">
              <div className="mb-5 border-b border-gray-100 pb-4 dark:border-gray-800">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Cấu hình Thông báo
                </h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Quản lý kênh thông báo tự động cho các sự kiện đặt phòng
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Email xác nhận đặt phòng tự động
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400">
                      Gửi email kèm mã đặt phòng ngay khi khách hàng hoàn tất thanh toán
                    </p>
                  </div>
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    Đang kích hoạt
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Cảnh báo phòng đến hạn check-out
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400">
                      Hiển thị nhắc nhở cho nhân viên lễ tân khi đến khung giờ trả phòng 12:00
                    </p>
                  </div>
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    Đang kích hoạt
                  </span>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="p-6">
              <div className="mb-5 border-b border-gray-100 pb-4 dark:border-gray-800">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Tùy chỉnh Giao diện
                </h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Chuyển đổi chế độ màu Sáng / Tối và hiển thị bảng điều khiển
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                      {theme === 'dark' ? (
                        <Moon className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Sun className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Chế độ giao diện (Dark / Light Mode)
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400">
                        Hiện đang sử dụng:{' '}
                        <strong>{theme === 'dark' ? 'Giao diện tối' : 'Giao diện sáng'}</strong>
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleTheme}
                    className="gap-1.5"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="h-4 w-4 text-amber-400" />
                        <span>Chuyển sang Sáng</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4 text-gray-700" />
                        <span>Chuyển sang Tối</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

