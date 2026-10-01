import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Phone, Mail, ShieldCheck, Clock } from 'lucide-react';
import { PATHS } from '@routes/paths';

/**
 * Footer chính của website cho khách hàng và khách vãng lai
 * Hiển thị thông tin khách sạn, liên kết nhanh, địa chỉ liên hệ và bản quyền
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white transition-colors dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="space-y-4">
            <Link to={PATHS.HOME} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Grand Luxury Hotel
              </span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hệ thống khách sạn thông minh tích hợp công nghệ AI nhận diện khuôn mặt tiên tiến, mang lại trải nghiệm check-in không chạm và tiện nghi đẳng cấp.
            </p>
            <div className="flex items-center gap-2 text-xs text-primary-700 dark:text-primary-300">
              <ShieldCheck className="h-4 w-4" />
              <span>Bảo mật dữ liệu sinh trắc học chuẩn quốc tế</span>
            </div>
          </div>

          {/* Cột 2: Khám phá & Dịch vụ */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Khám phá
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link to={PATHS.HOME} className="transition-colors hover:text-primary-600 dark:hover:text-primary-400">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to={PATHS.ROOMS} className="transition-colors hover:text-primary-600 dark:hover:text-primary-400">
                  Danh sách hạng phòng
                </Link>
              </li>
              <li>
                <Link to={PATHS.MY_BOOKINGS} className="transition-colors hover:text-primary-600 dark:hover:text-primary-400">
                  Tra cứu phòng đã đặt
                </Link>
              </li>
              <li>
                <Link to={PATHS.FACE_REGISTER} className="transition-colors hover:text-primary-600 dark:hover:text-primary-400">
                  Đăng ký Face ID nhận diện
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ & Chính sách */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Hỗ trợ khách hàng
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <span>Phục vụ 24/7 mọi ngày trong tuần</span>
              </li>
              <li>
                <span className="text-gray-500">Giờ Check-in:</span> 14:00
              </li>
              <li>
                <span className="text-gray-500">Giờ Check-out:</span> 12:00
              </li>
              <li>
                <span className="text-gray-500">Quy định hủy phòng:</span> Linh hoạt
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Liên hệ
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                <span>566 Núi Thành, Hải Châu, Đà Nẵng</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                <a href="tel:02361234567" className="hover:text-primary-600 dark:hover:text-primary-400">
                  (+84) 236 123 4567
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
                <a href="mailto:contact@grandluxuryhotel.com" className="hover:text-primary-600 dark:hover:text-primary-400">
                  contact@grandluxuryhotel.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Dòng copyright & đồ án tốt nghiệp */}
        <div className="mt-10 border-t border-gray-100 pt-6 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-500">
          <p>© {currentYear} Grand Luxury Hotel Management. Tất cả quyền được bảo lưu.</p>
          <p className="mt-1">
            Đồ án tốt nghiệp: Website Quản lý Khách sạn tích hợp AI nhận diện khuôn mặt — Đại học Kiến trúc Đà Nẵng
          </p>
        </div>
      </div>
    </footer>
  );
}
