import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Printer,
  DoorOpen,
  Calendar,
  AlertCircle,
  Home,
  Receipt,
  Search,
  User,
  Phone,
  LogOut,
  Clock,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Badge } from '@components/ui/Badge';
import { Card } from '@components/ui/Card';
import { Loading } from '@components/feedback/Loading';
import { formatCurrency, formatDate } from '@utils/format';
import { PATHS } from '@routes/paths';
import { bookingApi } from '@/api/booking.api';
import type { Booking } from '@/types';
import {
  checkoutApi,
  type CheckoutPreviewData,
  type PaymentItemPayload,
  type CheckoutResponseData,
} from '../checkoutApi';
import { InvoicePreview } from '../components/InvoicePreview';
import { PaymentForm } from '../components/PaymentForm';

export const CheckoutPage: React.FC = () => {
  const { bookingId: paramBookingId } = useParams<{ bookingId?: string }>();
  const navigate = useNavigate();

  // Active booking ID (từ URL param hoặc khi chọn từ danh sách)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    paramBookingId || null
  );

  // State cho danh sách phòng đang checked-in (khi không có paramBookingId)
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [loadingActiveBookings, setLoadingActiveBookings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // State dữ liệu checkout preview
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<CheckoutPreviewData | null>(null);

  // Form states
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0.08); // 8% VAT
  const [checkoutNote, setCheckoutNote] = useState<string>('');
  const [payments, setPayments] = useState<PaymentItemPayload[]>([]);

  // Trạng thái submit & modal thành công
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<CheckoutResponseData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Cập nhật selectedBookingId khi param thay đổi
  useEffect(() => {
    if (paramBookingId) {
      setSelectedBookingId(paramBookingId);
    }
  }, [paramBookingId]);

  // Tải danh sách đơn checked-in khi chưa chọn booking nào
  useEffect(() => {
    if (!selectedBookingId) {
      const fetchActiveBookings = async () => {
        setLoadingActiveBookings(true);
        try {
          const res = await bookingApi.list({ status: 'checked_in', limit: 50 });
          setActiveBookings(res?.data || []);
        } catch (err) {
          toast.error('Không thể tải danh sách phòng đang lưu trú');
        } finally {
          setLoadingActiveBookings(false);
        }
      };

      fetchActiveBookings();
    }
  }, [selectedBookingId]);

  // Tải thông tin preview khi có selectedBookingId
  useEffect(() => {
    let isMounted = true;

    const fetchPreview = async () => {
      if (!selectedBookingId) return;

      setLoading(true);
      try {
        const res = await checkoutApi.getPreview(selectedBookingId, {
          discount_amount: 0,
          tax_rate: 0.08,
        });

        if (isMounted) {
          const data = res.data;
          setPreviewData(data);
          setError(null);

          // Khởi tạo 1 khoản thanh toán mặc định bằng đúng số tiền tổng cộng
          const initialTotal = data.summary?.total_amount || 0;
          setPayments([
            {
              amount: initialTotal,
              method: 'cash',
              note: '',
            },
          ]);
        }
      } catch (err: any) {
        if (isMounted) {
          const errMsg =
            err.response?.data?.error?.message ||
            err.message ||
            'Không thể tải thông tin đặt phòng để check-out';
          setError(errMsg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [selectedBookingId]);

  // Xử lý xác nhận trả phòng & xuất hóa đơn
  const handleConfirmCheckout = async () => {
    if (!selectedBookingId || !previewData) return;

    if (payments.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 khoản thanh toán');
      return;
    }

    for (const p of payments) {
      if (Number(p.amount) <= 0) {
        toast.error('Số tiền thanh toán phải lớn hơn 0');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await checkoutApi.confirmCheckout(selectedBookingId, {
        discount_amount: discountAmount,
        tax_rate: taxRate,
        payments,
        note: checkoutNote.trim() || undefined,
      });

      toast.success('Check-out và tạo hóa đơn thành công!');
      setSuccessResult(res.data);
      setShowSuccessModal(true);
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Check-out thất bại. Vui lòng kiểm tra lại số liệu';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // In hóa đơn
  const handlePrintInvoice = () => {
    window.print();
  };

  // Lọc danh sách booking checked-in theo từ khóa tìm kiếm
  const filteredActiveBookings = activeBookings.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const roomNum = (b.rooms?.room_number || b.room?.room_number || '').toLowerCase();
    const code = (b.booking_code || '').toLowerCase();
    const custName = (b.customers?.full_name || b.customer?.full_name || '').toLowerCase();
    const phone = (b.customers?.phone || b.customer?.phone || '').toLowerCase();
    return (
      roomNum.includes(q) ||
      code.includes(q) ||
      custName.includes(q) ||
      phone.includes(q)
    );
  });

  // ========== MÀN HÌNH 1: DANH SÁCH & TÌM KIẾM ĐƠN CHECKED-IN (khi chưa chọn booking) ==========
  if (!selectedBookingId) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 dark:bg-gray-900 transition-colors">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
                Danh sách phòng đang lưu trú (Check-out)
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Chọn phòng hoặc tìm kiếm mã đơn để tiến hành thanh toán và trả phòng
              </p>
            </div>
            <Link to={PATHS.STAFF_CHECKIN}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Sparkles className="h-4 w-4 text-primary-500" />
                Đến trang Check-in AI
              </Button>
            </Link>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo số phòng, mã đặt phòng (BK...), tên khách hoặc số điện thoại..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Danh sách phòng */}
          {loadingActiveBookings ? (
            <div className="py-16">
              <Loading fullScreen={false} size="md" />
            </div>
          ) : filteredActiveBookings.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-gray-300 dark:border-gray-700">
              <DoorOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Không có phòng nào đang ở phù hợp
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Hiện tại không có đơn đặt phòng nào ở trạng thái đã check-in khớp với từ khóa tìm kiếm.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActiveBookings.map((b) => {
                const roomNum = b.rooms?.room_number || b.room?.room_number || '---';
                const roomType =
                  b.rooms?.room_types?.name || b.room?.room_type?.name || 'Tiêu chuẩn';
                const custName =
                  b.customers?.full_name || b.customer?.full_name || 'Khách vãng lai';
                const phone = b.customers?.phone || b.customer?.phone || '---';

                return (
                  <Card
                    key={b.id}
                    className="p-5 border border-gray-200 hover:border-primary-300 dark:border-gray-800 dark:hover:border-primary-700 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                            {b.booking_code}
                          </span>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                            Phòng {roomNum} — {roomType}
                          </h4>
                        </div>
                        <Badge variant="success">Đang ở</Badge>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {custName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span>{phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span>
                            {formatDate(b.check_in_date)} ➔ {formatDate(b.check_out_date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Tiền phòng: <strong>{formatCurrency(b.room_subtotal)}</strong>
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedBookingId(b.id);
                          navigate(`/checkout/${b.id}`);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Làm thủ tục Trả phòng
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== MÀN HÌNH 2: XỬ LÝ TRẢ PHÒNG & XUẤT HÓA ĐƠN ==========
  if (loading) {
    return (
      <div className="py-24">
        <Loading fullScreen={false} size="lg" />
      </div>
    );
  }

  if (error || !previewData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center animate-fade-in">
        <div className="mb-4 inline-flex rounded-2xl bg-danger-50 p-4 text-danger-600 dark:bg-danger-950 dark:text-danger-400">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
          Không thể thực hiện Check-out
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {error || 'Đặt phòng không ở trạng thái sẵn sàng để trả phòng.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedBookingId(null);
              navigate(PATHS.STAFF_CHECKOUT);
            }}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Xem danh sách phòng
          </Button>
          <Link to={PATHS.STAFF_CHECKIN}>
            <Button variant="primary">Trang Lễ tân</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { booking } = previewData;

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 dark:bg-gray-900 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header điều hướng */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedBookingId(null);
                navigate(PATHS.STAFF_CHECKOUT);
              }}
              className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
                  Thủ tục Trả phòng (Check-out)
                </h1>
                <Badge variant="success">Khách đang ở</Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Phòng{' '}
                <strong className="text-gray-800 dark:text-gray-200">
                  {booking.room?.room_number}
                </strong>{' '}
                • Đặt phòng{' '}
                <span className="font-mono font-semibold">{booking.booking_code}</span> • Khách hàng:{' '}
                <strong>{booking.customer?.full_name}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Nội dung chính: 2 Cột */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Cột trái: Chi tiết hóa đơn Breakdown (7 Cột) */}
          <div className="lg:col-span-7 space-y-6">
            <InvoicePreview
              previewData={previewData}
              discountAmount={discountAmount}
              taxRate={taxRate}
            />

            {/* Ghi chú khi check-out */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-850 space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Ghi chú nội bộ khi Check-out
              </label>
              <textarea
                rows={3}
                value={checkoutNote}
                onChange={(e) => setCheckoutNote(e.target.value)}
                placeholder="Nhập ghi chú tình trạng phòng khi trả, yêu cầu đặc biệt của khách (nếu có)..."
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Cột phải: Form thanh toán (5 Cột) */}
          <div className="lg:col-span-5">
            <PaymentForm
              roomAmount={Number(booking.room_subtotal || 0)}
              serviceAmount={previewData.services.reduce(
                (sum, s) => sum + Number(s.total_amount || 0),
                0
              )}
              discountAmount={discountAmount}
              taxRate={taxRate}
              onDiscountChange={setDiscountAmount}
              onTaxRateChange={setTaxRate}
              payments={payments}
              onPaymentsChange={setPayments}
              onSubmit={handleConfirmCheckout}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* MODAL THÀNH CÔNG & IN HÓA ĐƠN */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Check-out & Xuất Hóa đơn thành công"
        size="lg"
      >
        {successResult && (
          <div className="space-y-6 text-center">
            {/* Icon & Thông báo */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-950/60 dark:text-success-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">
                Thủ tục hoàn tất thành công!
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Phòng{' '}
                <strong className="text-gray-800 dark:text-gray-200">
                  {booking.room?.room_number}
                </strong>{' '}
                đã được chuyển sang trạng thái <strong>Dọn dẹp (Cleaning)</strong>.
              </p>
            </div>

            {/* Chi tiết Hóa đơn */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-5 text-left text-xs space-y-3 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500">Mã hóa đơn:</span>
                <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400">
                  {successResult.invoice.invoice_code}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Trạng thái thanh toán:</span>
                <Badge
                  variant={
                    successResult.invoice.status === 'paid' ? 'success' : 'warning'
                  }
                >
                  {successResult.invoice.status === 'paid'
                    ? 'ĐÃ THANH TOÁN ĐỦ (PAID)'
                    : 'THANH TOÁN MỘT PHẦN (PARTIAL)'}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Tổng tiền hóa đơn:</span>
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  {formatCurrency(successResult.invoice.total_amount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Ngày giờ xuất hóa đơn:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(successResult.invoice.issued_at).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handlePrintInvoice}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                In hóa đơn (Print)
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSelectedBookingId(null);
                  navigate(PATHS.STAFF_CHECKOUT);
                }}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Về danh sách phòng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default CheckoutPage;
