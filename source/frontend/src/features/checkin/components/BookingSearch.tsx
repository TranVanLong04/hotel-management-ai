import React, { useState } from 'react';
import { Search, Loader2, QrCode, AlertCircle } from 'lucide-react';
import { bookingApi } from '@/api/booking.api';
import type { Booking } from '@/types';
import toast from 'react-hot-toast';

interface BookingSearchProps {
  onFound: (booking: Booking) => void;
  isLoading?: boolean;
}

export const BookingSearch: React.FC<BookingSearchProps> = ({ onFound, isLoading = false }) => {
  const [bookingCode, setBookingCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = bookingCode.trim().toUpperCase();
    if (!query) {
      toast.error('Vui lòng nhập mã đặt phòng (VD: BK...)');
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      // Tìm kiếm booking theo booking_code hoặc search query
      const res = await bookingApi.list({ search: query, limit: 1 });
      const foundBooking = res?.data?.[0];

      if (!foundBooking) {
        setSearchError(`Không tìm thấy đơn đặt phòng nào với mã "${query}"`);
        toast.error('Không tìm thấy thông tin đặt phòng');
        setSearching(false);
        return;
      }

      // Kiểm tra trạng thái booking
      if (foundBooking.status === 'checked_in') {
        setSearchError('Đơn đặt phòng này đã được thực hiện Check-in trước đó.');
        toast.error('Khách đã check-in');
        setSearching(false);
        return;
      }

      if (foundBooking.status === 'checked_out') {
        setSearchError('Đơn đặt phòng này đã hoàn tất Check-out.');
        toast.error('Khách đã check-out');
        setSearching(false);
        return;
      }

      if (foundBooking.status === 'cancelled') {
        setSearchError('Đơn đặt phòng này đã bị hủy.');
        toast.error('Đơn đặt phòng đã bị hủy');
        setSearching(false);
        return;
      }

      if (foundBooking.status !== 'confirmed') {
        setSearchError(`Đơn đặt phòng đang ở trạng thái "${foundBooking.status}". Chỉ có thể check-in đơn đã xác nhận (confirmed).`);
        toast.error('Đơn đặt phòng chưa được xác nhận');
        setSearching(false);
        return;
      }

      toast.success(`Tìm thấy đơn đặt phòng: ${foundBooking.booking_code}`);
      onFound(foundBooking);
    } catch (err) {
      setSearchError('Đã xảy ra lỗi khi tra cứu đơn đặt phòng. Vui lòng thử lại.');
      toast.error('Lỗi tra cứu đơn đặt phòng');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <QrCode className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Tra cứu Đơn đặt phòng Check-in
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nhập mã đặt phòng (Booking Code) của khách hàng để bắt đầu nhận diện AI
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={bookingCode}
            onChange={(e) => {
              setBookingCode(e.target.value);
              if (searchError) setSearchError(null);
            }}
            placeholder="VD: BK20261020001 hoặc số điện thoại khách"
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium text-lg tracking-wide uppercase"
            disabled={searching || isLoading}
            autoFocus
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {searchError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={searching || isLoading || !bookingCode.trim()}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {searching || isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang tra cứu dữ liệu...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Tìm kiếm đơn đặt phòng</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
