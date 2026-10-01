import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarCheck, AlertTriangle } from 'lucide-react';
import { BookingStatusTabs, type BookingTabValue } from '../components/BookingStatusTabs';
import { BookingList } from '../components/BookingList';
import { Pagination } from '@components/ui/Pagination';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { useMyBookings } from '../hooks/useMyBookings';
import { bookingApi } from '@/api/booking.api';
import { getErrorMessage } from '@utils/errorHandler';
import type { Booking, BookingStatus } from '@/types';

/**
 * Trang Đơn đặt phòng của tôi (My Bookings)
 * Cho phép khách hàng theo dõi, lọc theo trạng thái và hủy đơn đặt phòng
 */
export function MyBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc params từ URL
  const activeStatus = (searchParams.get('status') as BookingTabValue) || 'all';
  const currentPage = Number(searchParams.get('page')) || 1;

  // Quản lý trạng thái Modal hủy đặt phòng
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Chuẩn bị query params cho API
  const filterParams = useMemo(() => {
    return {
      page: currentPage,
      limit: 10,
      status: activeStatus !== 'all' ? (activeStatus as BookingStatus) : undefined,
    };
  }, [activeStatus, currentPage]);

  const { data: bookings, pagination, loading, error, refetch } = useMyBookings(filterParams);

  // Chuyển tab trạng thái -> Cập nhật URL & Reset về page 1
  const handleTabChange = (tab: BookingTabValue) => {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === 'all') {
      nextParams.delete('status');
    } else {
      nextParams.set('status', tab);
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  // Chuyển trang
  const handlePageChange = (page: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(page));
    setSearchParams(nextParams);
  };

  // Mở Modal xác nhận hủy
  const handleOpenCancelModal = (booking: Booking) => {
    setSelectedBookingToCancel(booking);
    setCancelReason('');
  };

  // Đóng Modal hủy
  const handleCloseCancelModal = () => {
    if (!cancelling) {
      setSelectedBookingToCancel(null);
      setCancelReason('');
    }
  };

  // Xác nhận thực hiện hủy đơn đặt phòng
  const handleConfirmCancel = async () => {
    if (!selectedBookingToCancel) return;

    setCancelling(true);
    try {
      await bookingApi.cancel(
        selectedBookingToCancel.id,
        cancelReason.trim() || undefined
      );

      toast.success('Hủy đơn đặt phòng thành công');
      handleCloseCancelModal();
      refetch();
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Không thể hủy đơn đặt phòng');
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Header trang */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <span>Đơn đặt phòng của tôi</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý và theo dõi trạng thái các kỳ nghỉ của bạn tại khách sạn
          </p>
        </div>
      </div>

      {/* Tabs lọc trạng thái */}
      <div className="rounded-2xl bg-white p-2 shadow-card dark:bg-gray-850">
        <BookingStatusTabs activeTab={activeStatus} onChange={handleTabChange} />
      </div>

      {/* Danh sách Bookings */}
      <div>
        <BookingList
          bookings={bookings}
          loading={loading}
          error={error}
          onCancel={handleOpenCancelModal}
          onRetry={refetch}
        />
      </div>

      {/* Phân trang */}
      {pagination && pagination.totalPages > 1 && !loading && (
        <div className="pt-4 flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modal xác nhận Hủy đặt phòng */}
      <Modal
        open={Boolean(selectedBookingToCancel)}
        onClose={handleCloseCancelModal}
        title="Xác nhận hủy đặt phòng"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-danger-50 p-4 text-sm text-danger-800 dark:bg-danger-950/50 dark:text-danger-300">
            <AlertTriangle className="h-5 w-5 shrink-0 text-danger-600 dark:text-danger-400 mt-0.5" />
            <div>
              <p className="font-semibold">Bạn có chắc chắn muốn hủy đơn đặt phòng này?</p>
              <p className="mt-1 text-xs text-danger-700 dark:text-danger-400">
                Mã đơn: <strong className="font-mono">{selectedBookingToCancel?.booking_code}</strong>.
                Hành động này không thể hoàn tác sau khi thực hiện.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="cancel-reason"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Lý do hủy (Tùy chọn)
            </label>
            <textarea
              id="cancel-reason"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do bạn muốn hủy đơn..."
              disabled={cancelling}
              className="input resize-none"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              type="button"
              disabled={cancelling}
              onClick={handleCloseCancelModal}
            >
              Đóng
            </Button>
            <Button
              variant="danger"
              size="md"
              type="button"
              loading={cancelling}
              onClick={handleConfirmCancel}
            >
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
