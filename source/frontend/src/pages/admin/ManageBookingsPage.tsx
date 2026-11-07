import { useState, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  User,
  BedDouble,
  ScanFace,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { DataTable } from '@components/common/DataTable';
import { TableToolbar } from '@components/common/TableToolbar';
import { ActionsMenu } from '@components/common/ActionsMenu';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { useDataTable } from '@hooks/useDataTable';
import { bookingApi } from '@/api/booking.api';
import { formatCurrency, formatDate, formatDateTime } from '@utils/format';
import type {
  Booking,
  BookingStatus,
  Column,
  BookingFilterParams,
} from '@/types';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/types';

type TabStatus = 'all' | BookingStatus;

const TABS: { id: TabStatus; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ duyệt' },
  { id: 'confirmed', label: 'Đã xác nhận' },
  { id: 'checked_in', label: 'Đang ở' },
  { id: 'checked_out', label: 'Đã trả phòng' },
  { id: 'cancelled', label: 'Đã hủy' },
];

export function ManageBookingsPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>('all');

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Dialog actions
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [targetBooking, setTargetBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // useDataTable hook quản lý filters và search tập trung
  const {
    data: bookings,
    loading,
    pagination,
    search,
    setSearch,
    filters,
    updateFilter,
    resetFilters,
    refetch,
  } = useDataTable<Booking, BookingFilterParams>({
    fetchFn: (params) => bookingApi.list(params),
    initialLimit: 10,
  });

  // Khi click chuyển tab trạng thái
  const handleTabChange = (tabId: TabStatus) => {
    setActiveTab(tabId);
    updateFilter('status', tabId === 'all' ? undefined : (tabId as BookingStatus));
  };

  // Reset tất cả lọc
  const handleResetFilters = () => {
    setActiveTab('all');
    resetFilters();
  };

  // Xử lý xác nhận booking
  const handleConfirmBooking = async () => {
    if (!targetBooking) return;
    setActionLoading(true);
    try {
      await bookingApi.confirm(targetBooking.id);
      toast.success(`Đã xác nhận đơn đặt phòng ${targetBooking.booking_code}`);
      setConfirmDialogOpen(false);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xác nhận đơn đặt phòng';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Xử lý hủy booking
  const handleCancelBooking = async () => {
    if (!targetBooking) return;
    setActionLoading(true);
    try {
      await bookingApi.cancel(targetBooking.id, cancelReason);
      toast.success(`Đã hủy đơn đặt phòng ${targetBooking.booking_code}`);
      setCancelDialogOpen(false);
      setCancelReason('');
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi hủy đơn đặt phòng';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Booking>[] = useMemo(
    () => [
      {
        key: 'booking_code',
        label: 'Mã đơn',
        width: '140px',
        render: (b) => (
          <div>
            <span className="font-bold text-gray-900 dark:text-white">
              {b.booking_code}
            </span>
            <div className="text-[10px] text-gray-400">
              {formatDateTime(b.created_at)}
            </div>
          </div>
        ),
      },
      {
        key: 'customer',
        label: 'Khách hàng',
        render: (b) => {
          const name = b.customers?.full_name ?? b.customer?.full_name ?? '—';
          const phone = b.customers?.phone ?? b.customer?.phone ?? '—';
          return (
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{name}</div>
              <div className="text-[11px] text-gray-400">{phone}</div>
            </div>
          );
        },
      },
      {
        key: 'room',
        label: 'Phòng',
        render: (b) => {
          const roomNum = b.rooms?.room_number ?? b.room?.room_number ?? '—';
          const roomTypeName =
            b.rooms?.room_types?.name ?? b.room?.room_type?.name ?? 'Phòng tiêu chuẩn';
          return (
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">
                P.{roomNum}
              </span>
              <div className="text-[11px] text-gray-400">{roomTypeName}</div>
            </div>
          );
        },
      },
      {
        key: 'dates',
        label: 'Thời gian',
        render: (b) => (
          <div className="text-gray-700 dark:text-gray-300">
            <div>
              {formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}
            </div>
            <div className="text-[10px] text-gray-400">
              {b.number_of_nights || 1} đêm • {b.number_of_guests} khách
            </div>
          </div>
        ),
      },
      {
        key: 'total',
        label: 'Tổng tiền',
        align: 'right',
        render: (b) => (
          <span className="font-bold text-gray-900 dark:text-white">
            {formatCurrency(b.room_subtotal || b.room_price || 0)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Trạng thái',
        align: 'center',
        render: (b) => {
          const status = b.status as BookingStatus;
          const variant =
            (BOOKING_STATUS_COLORS[status] as
              | 'default'
              | 'primary'
              | 'success'
              | 'warning'
              | 'danger'
              | 'info') || 'default';
          return (
            <Badge variant={variant} size="sm">
              {BOOKING_STATUS_LABELS[status] || status}
            </Badge>
          );
        },
      },
      {
        key: 'face_status',
        label: 'AI Face',
        align: 'center',
        render: (b) => {
          const isVerified = b.face_verification_status === 'verified';
          return isVerified ? (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
              title="Đã xác thực khuôn mặt AI"
            >
              <ScanFace className="h-3.5 w-3.5" />
              <span>Khớp</span>
            </span>
          ) : (
            <span className="text-[11px] text-gray-400">Chưa</span>
          );
        },
      },
      {
        key: 'actions',
        label: 'Thao tác',
        align: 'right',
        width: '80px',
        render: (b) => {
          const canConfirm = b.status === 'pending';
          const canCancel = b.status === 'pending' || b.status === 'confirmed';

          return (
            <ActionsMenu
              actions={[
                {
                  label: 'Xem chi tiết',
                  icon: Eye,
                  onClick: () => {
                    setSelectedBooking(b);
                    setDetailModalOpen(true);
                  },
                },
                ...(canConfirm
                  ? [
                      {
                        label: 'Duyệt đơn',
                        icon: CheckCircle,
                        onClick: () => {
                          setTargetBooking(b);
                          setConfirmDialogOpen(true);
                        },
                      },
                    ]
                  : []),
                ...(canCancel
                  ? [
                      {
                        label: 'Hủy đơn',
                        icon: XCircle,
                        danger: true,
                        divider: true,
                        onClick: () => {
                          setTargetBooking(b);
                          setCancelDialogOpen(true);
                        },
                      },
                    ]
                  : []),
              ]}
            />
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Quản lý Đặt phòng
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Theo dõi, duyệt đơn và quản lý toàn bộ quá trình đặt phòng của khách
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex space-x-2 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`cursor-pointer whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-xs dark:bg-primary-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Toolbar */}
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm kiếm theo mã đơn đặt phòng (BK...)"
        hasActiveFilters={activeTab !== 'all' || !!filters.from || !!filters.to || !!search}
        onResetFilters={handleResetFilters}
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => updateFilter('from', e.target.value || undefined)}
            className="h-9 rounded-xl border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            title="Từ ngày nhận phòng"
          />
          <span className="text-gray-400">→</span>
          <input
            type="date"
            value={filters.to || ''}
            onChange={(e) => updateFilter('to', e.target.value || undefined)}
            className="h-9 rounded-xl border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            title="Đến ngày nhận phòng"
          />
        </div>
      </TableToolbar>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        rowKey={(b) => b.id}
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          total: pagination.total,
          onPageChange: (p) => pagination.setPage(p),
        }}
      />

      {/* Modal Xem chi tiết Booking */}
      {selectedBooking && (
        <Modal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Chi tiết đơn: ${selectedBooking.booking_code}`}
          size="lg"
        >
          <div className="space-y-5 text-xs">
            {/* Header thông tin chung */}
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
              <div>
                <span className="text-gray-400">Trạng thái đơn:</span>
                <div className="mt-1">
                  <Badge
                    variant={
                      (BOOKING_STATUS_COLORS[
                        selectedBooking.status as BookingStatus
                      ] as 'default' | 'primary' | 'success' | 'warning' | 'danger') ||
                      'default'
                    }
                  >
                    {BOOKING_STATUS_LABELS[
                      selectedBooking.status as BookingStatus
                    ] || selectedBooking.status}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-gray-400">Xác minh AI Face:</span>
                <div className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {selectedBooking.face_verification_status === 'verified'
                    ? 'Đã xác minh thành công'
                    : 'Chưa thực hiện'}
                </div>
              </div>
            </div>

            {/* Thông tin Khách hàng */}
            <Card className="p-4">
              <h4 className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                <User className="h-4 w-4 text-primary-600" />
                <span>Thông tin khách hàng</span>
              </h4>
              <div className="mt-3 grid grid-cols-2 gap-3 text-gray-600 dark:text-gray-300">
                <div>
                  Họ tên:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {selectedBooking.customers?.full_name ??
                      selectedBooking.customer?.full_name ??
                      '—'}
                  </strong>
                </div>
                <div>
                  SĐT:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {selectedBooking.customers?.phone ??
                      selectedBooking.customer?.phone ??
                      '—'}
                  </strong>
                </div>
                <div>
                  Số CCCD/CMND:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {selectedBooking.customers?.identity_number ??
                      selectedBooking.customer?.identity_number ??
                      'Chưa cung cấp'}
                  </strong>
                </div>
                <div>
                  Số lượng khách:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {selectedBooking.number_of_guests} người
                  </strong>
                </div>
              </div>
            </Card>

            {/* Thông tin Phòng */}
            <Card className="p-4">
              <h4 className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                <BedDouble className="h-4 w-4 text-primary-600" />
                <span>Thông tin phòng & lịch trình</span>
              </h4>
              <div className="mt-3 grid grid-cols-2 gap-3 text-gray-600 dark:text-gray-300">
                <div>
                  Phòng:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    Phòng {selectedBooking.rooms?.room_number ?? selectedBooking.room?.room_number ?? '—'}
                  </strong>
                </div>
                <div>
                  Hạng phòng:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {selectedBooking.rooms?.room_types?.name ??
                      selectedBooking.room?.room_type?.name ??
                      'Tiêu chuẩn'}
                  </strong>
                </div>
                <div>
                  Ngày nhận phòng:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {formatDate(selectedBooking.check_in_date)}
                  </strong>
                </div>
                <div>
                  Ngày trả phòng:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {formatDate(selectedBooking.check_out_date)}
                  </strong>
                </div>
                <div>
                  Giá phòng mỗi đêm:{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {formatCurrency(selectedBooking.room_price)}
                  </strong>
                </div>
                <div>
                  Tổng tiền phòng:{' '}
                  <strong className="text-primary-600 dark:text-primary-400">
                    {formatCurrency(
                      selectedBooking.room_subtotal || selectedBooking.room_price || 0
                    )}
                  </strong>
                </div>
              </div>
            </Card>

            {/* Ghi chú */}
            {selectedBooking.note && (
              <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Ghi chú từ khách hàng:
                </span>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {selectedBooking.note}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirm Booking Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmBooking}
        loading={actionLoading}
        title="Xác nhận duyệt đặt phòng"
        message={`Bạn có chắc chắn muốn xác nhận đơn đặt phòng ${targetBooking?.booking_code}? Phòng sẽ được chuyển sang trạng thái đã đặt.`}
        confirmText="Xác nhận duyệt"
        variant="primary"
      />

      {/* Cancel Booking Dialog */}
      <Modal
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Hủy đơn đặt phòng"
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-400">
            Bạn đang yêu cầu hủy đơn{' '}
            <strong className="text-gray-900 dark:text-white">
              {targetBooking?.booking_code}
            </strong>
            . Hành động này không thể hoàn tác.
          </p>

          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Lý do hủy (tùy chọn)
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do khách hủy hoặc khách không đến..."
              className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelDialogOpen(false)}
              disabled={actionLoading}
            >
              Quay lại
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={actionLoading}
              onClick={handleCancelBooking}
            >
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
