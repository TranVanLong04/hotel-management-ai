import { Link } from 'react-router-dom';
import { Sparkles, BedDouble, ScanFace, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import { PATHS } from '@routes/paths';
import { useAuthStore } from '@stores/authStore';

/**
 * Trang chủ chính của khách sạn (hiển thị trong MainLayout)
 * Giới thiệu các tiện ích nổi bật và công nghệ AI Face ID
 */
export function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-gray-900 p-8 text-white shadow-2xl sm:p-12 lg:p-16">
          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Khách sạn thông minh tích hợp AI</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-tight">
              Trải nghiệm nghỉ dưỡng đẳng cấp cùng công nghệ AI
            </h1>

            <p className="text-base text-gray-200 sm:text-lg">
              Check-in không chạm bằng khuôn mặt trong 3 giây. Đặt phòng nhanh chóng, bảo mật tuyệt đối với tiêu chuẩn 5 sao.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={PATHS.ROOMS}
                className="btn bg-white text-primary-900 hover:bg-gray-100 px-6 py-3 text-sm font-bold shadow-lg"
              >
                <BedDouble className="mr-2 h-4 w-4" />
                Khám phá phòng ngay
              </Link>
              {!isAuthenticated ? (
                <Link
                  to={PATHS.REGISTER}
                  className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20 px-6 py-3 text-sm font-bold backdrop-blur-md"
                >
                  Đăng ký thành viên
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to={PATHS.MY_BOOKINGS}
                  className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20 px-6 py-3 text-sm font-bold backdrop-blur-md"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Phòng của tôi
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Tiện ích vượt trội
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Kết hợp dịch vụ nghỉ dưỡng cao cấp cùng giải pháp công nghệ tiên tiến
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
              <ScanFace className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              AI Face Check-in
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nhận diện khuôn mặt tức thì tại quầy lễ tân. Không cần xếp hàng chờ đợi làm thủ tục thủ công.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Bảo mật tuyệt đối
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Dữ liệu sinh trắc học được mã hóa theo vector và lưu trữ bảo mật cao, không lưu giữ ảnh thô.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <BedDouble className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Phòng nghỉ sang trọng
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hệ thống phòng ốc đa dạng phong cách, trang thiết bị thông minh hiện đại và view biển tuyệt đẹp.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
