import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { useCreateBooking } from '../hooks/useCreateBooking';
import { useBookingStore } from '@stores/bookingStore';
import { formatCurrency, formatNumber } from '@utils/format';
import { getErrorCode } from '@utils/errorHandler';
import { PATHS } from '@routes/paths';
import type { Room, CreateBookingPayload } from '@/types';

interface BookingFormProps {
  room: Room;
  disabled?: boolean;
}

/** Schema validation cho form đặt phòng với Zod */
const createBookingFormSchema = (maxGuests: number) =>
  z
    .object({
      check_in_date: z
        .string({ required_error: 'Vui lòng chọn ngày nhận phòng' })
        .min(1, 'Vui lòng chọn ngày nhận phòng')
        .refine(
          (val) => {
            const today = dayjs().startOf('day');
            const checkIn = dayjs(val).startOf('day');
            return checkIn.isSame(today) || checkIn.isAfter(today);
          },
          { message: 'Ngày nhận phòng không thể ở quá khứ' }
        ),
      check_out_date: z
        .string({ required_error: 'Vui lòng chọn ngày trả phòng' })
        .min(1, 'Vui lòng chọn ngày trả phòng'),
      number_of_guests: z
        .number({
          required_error: 'Vui lòng nhập số khách',
          invalid_type_error: 'Số khách phải là số',
        })
        .int('Số khách phải là số nguyên')
        .min(1, 'Tối thiểu 1 khách')
        .max(
          maxGuests,
          `Số khách tối đa cho loại phòng này là ${maxGuests} người`
        ),
      note: z
        .string()
        .max(500, 'Ghi chú không được vượt quá 500 ký tự')
        .optional(),
    })
    .refine(
      (data) => {
        if (!data.check_in_date || !data.check_out_date) return true;
        const inDate = dayjs(data.check_in_date);
        const outDate = dayjs(data.check_out_date);
        return outDate.isAfter(inDate);
      },
      {
        message: 'Ngày trả phòng phải sau ngày nhận phòng',
        path: ['check_out_date'],
      }
    );

type BookingFormValues = z.infer<ReturnType<typeof createBookingFormSchema>>;

/**
 * Form nhập thông tin đặt phòng
 * Hỗ trợ tính toán tổng số đêm & tiền phòng real-time, validate Zod và map mã lỗi API
 */
export function BookingForm({ room, disabled = false }: BookingFormProps) {
  const navigate = useNavigate();
  const resetStore = useBookingStore((state) => state.reset);
  const { createBooking, loading } = useCreateBooking();

  const maxGuests = room.room_type?.max_guests ?? 4;
  const basePrice = room.room_type?.base_price ?? 0;

  // Khởi tạo giá trị mặc định: Check-in hôm nay, check-out ngày mai
  const defaultToday = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
  const defaultTomorrow = useMemo(
    () => dayjs().add(1, 'day').format('YYYY-MM-DD'),
    []
  );

  const validationSchema = useMemo(
    () => createBookingFormSchema(maxGuests),
    [maxGuests]
  );

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      check_in_date: defaultToday,
      check_out_date: defaultTomorrow,
      number_of_guests: 1,
      note: '',
    },
  });

  // Watch các trường để tính toán số đêm & tổng tiền theo thời gian thực
  const watchCheckIn = watch('check_in_date');
  const watchCheckOut = watch('check_out_date');

  const { numberOfNights, totalPrice, isValidDuration } = useMemo(() => {
    if (!watchCheckIn || !watchCheckOut) {
      return { numberOfNights: 0, totalPrice: 0, isValidDuration: false };
    }

    const start = dayjs(watchCheckIn);
    const end = dayjs(watchCheckOut);
    const nights = end.diff(start, 'day');

    if (nights > 0) {
      return {
        numberOfNights: nights,
        totalPrice: nights * basePrice,
        isValidDuration: true,
      };
    }

    return { numberOfNights: 0, totalPrice: 0, isValidDuration: false };
  }, [watchCheckIn, watchCheckOut, basePrice]);

  /**
   * Xử lý submit form đặt phòng
   */
  const onSubmit = async (values: BookingFormValues) => {
    if (disabled) return;

    const payload: CreateBookingPayload = {
      room_id: room.id,
      check_in_date: values.check_in_date,
      check_out_date: values.check_out_date,
      number_of_guests: Number(values.number_of_guests),
      note: values.note?.trim() || undefined,
    };

    try {
      await createBooking(payload);

      // Thông báo thành công
      toast.success('Đặt phòng thành công! Cảm ơn bạn đã lựa chọn khách sạn.');

      // Bổ sung 2: Reset Zustand store & chuyển hướng sang /my-bookings
      resetStore();
      navigate(PATHS.MY_BOOKINGS);
    } catch (err: unknown) {
      const code = getErrorCode(err);

      // Mapping mã lỗi theo yêu cầu hệ thống
      if (code === 'BOOKING_OVERLAP') {
        setError('check_in_date', {
          type: 'manual',
          message: 'Phòng đã được đặt trong khoảng thời gian này. Vui lòng chọn ngày khác.',
        });
      } else if (code === 'BOOKING_GUESTS_EXCEED') {
        setError('number_of_guests', {
          type: 'manual',
          message: `Số khách vượt quá sức chứa tối đa (${maxGuests} người) của phòng`,
        });
      }
    }
  };

  const minCheckIn = dayjs().format('YYYY-MM-DD');
  const minCheckOut = watchCheckIn
    ? dayjs(watchCheckIn).add(1, 'day').format('YYYY-MM-DD')
    : dayjs().add(1, 'day').format('YYYY-MM-DD');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Khối cảnh báo nếu phòng không khả dụng */}
      {disabled && (
        <div className="flex items-center gap-3 rounded-2xl bg-warning-50 p-4 text-sm text-warning-800 dark:bg-warning-950/70 dark:text-warning-300 border border-warning-200 dark:border-warning-900">
          <Clock className="h-5 w-5 shrink-0" />
          <span>
            Phòng hiện tại không ở trạng thái trống và không thể thực hiện đặt phòng lúc này.
          </span>
        </div>
      )}

      {/* Thông tin ngày ở */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Input
            label="Ngày nhận phòng"
            type="date"
            min={minCheckIn}
            disabled={disabled || loading}
            required
            error={errors.check_in_date?.message}
            {...register('check_in_date')}
          />
        </div>

        <div>
          <Input
            label="Ngày trả phòng"
            type="date"
            min={minCheckOut}
            disabled={disabled || loading}
            required
            error={errors.check_out_date?.message}
            {...register('check_out_date')}
          />
        </div>
      </div>

      {/* Số lượng khách */}
      <div>
        <Input
          label={`Số lượng khách (Tối đa ${maxGuests} người)`}
          type="number"
          min={1}
          max={maxGuests}
          disabled={disabled || loading}
          required
          error={errors.number_of_guests?.message}
          {...register('number_of_guests', { valueAsNumber: true })}
        />
      </div>

      {/* Ghi chú đặc biệt */}
      <div>
        <label
          htmlFor="booking-note"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Ghi chú đặc biệt (Tùy chọn)
        </label>
        <textarea
          id="booking-note"
          rows={3}
          disabled={disabled || loading}
          placeholder="Ví dụ: Cần check-in sớm, yêu cầu tầng cao, giường phụ..."
          className="input resize-none"
          {...register('note')}
        />
        {errors.note?.message && (
          <p className="mt-1 text-sm text-danger-500">{errors.note.message}</p>
        )}
      </div>

      {/* Bảng tính toán tổng chi phí thời gian thực */}
      <Card className="rounded-2xl border border-primary-100 bg-primary-50/40 p-5 dark:border-primary-900/40 dark:bg-primary-950/20">
        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          <CreditCard className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <span>Tóm tắt chi phí dự tính</span>
        </h4>

        <div className="mt-4 space-y-2.5 text-sm text-gray-600 dark:text-gray-300 border-b border-primary-100/70 pb-4 dark:border-primary-900/40">
          <div className="flex justify-between">
            <span>Đơn giá niêm yết:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(basePrice)} / đêm
            </span>
          </div>

          <div className="flex justify-between">
            <span>Thời gian lưu trú:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {isValidDuration ? `${numberOfNights} đêm` : 'Chưa xác định'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Số khách đăng ký:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {watch('number_of_guests') || 1} người
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-bold text-gray-900 dark:text-white">
            Tổng tiền dự kiến:
          </span>
          <span className="text-xl font-black text-primary-600 dark:text-primary-400">
            {formatCurrency(totalPrice)}
          </span>
        </div>

        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          * Đã bao gồm thuế và phí dịch vụ. Thanh toán khi nhận hoặc trả phòng.
        </p>
      </Card>

      {/* Cam kết dịch vụ */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <ShieldCheck className="h-4 w-4 text-success-600 dark:text-success-400 shrink-0" />
        <span>Cam kết giá tốt nhất • Nhận diện khuôn mặt Check-in AI nhanh chóng</span>
      </div>

      {/* Nút gửi đặt phòng */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        disabled={disabled || !isValidDuration}
        className="w-full font-bold shadow-md cursor-pointer disabled:cursor-not-allowed"
      >
        <Sparkles className="mr-2 h-5 w-5" />
        Xác nhận đặt phòng
      </Button>
    </form>
  );
}
