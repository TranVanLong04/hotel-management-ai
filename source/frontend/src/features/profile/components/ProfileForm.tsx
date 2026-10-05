import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, CreditCard, Calendar as CalendarIcon, MapPin, Mail, Save, Loader2 } from 'lucide-react';
import type { CustomerProfile, UpdateCustomerProfileDto } from '@/types';

const profileFormSchema = z.object({
  full_name: z
    .string({ required_error: 'Vui lòng nhập họ và tên' })
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự'),
  email: z.string().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số')
    .or(z.literal(''))
    .optional()
    .nullable(),
  identity_number: z
    .string()
    .trim()
    .regex(/^[0-9]{9,12}$/, 'Số CCCD phải có 9-12 chữ số')
    .or(z.literal(''))
    .optional()
    .nullable(),
  date_of_birth: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const today = new Date().toISOString().split('T')[0];
        return val <= today;
      },
      { message: 'Ngày sinh không được ở tương lai' }
    )
    .or(z.literal(''))
    .optional()
    .nullable(),
  gender: z
    .union([z.literal('male'), z.literal('female'), z.literal('other')])
    .optional()
    .nullable(),
  address: z
    .string()
    .max(500, 'Địa chỉ không được vượt quá 500 ký tự')
    .or(z.literal(''))
    .optional()
    .nullable(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  profile: CustomerProfile;
  onSubmit: (data: UpdateCustomerProfileDto) => Promise<boolean>;
  isSubmitting: boolean;
}

/**
 * Form chỉnh sửa thông tin cá nhân khách hàng với validation realtime và Zod schema
 */
export function ProfileForm({ profile, onSubmit, isSubmitting }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      identity_number: profile.identity_number || '',
      date_of_birth: profile.date_of_birth || '',
      gender: profile.gender || 'male',
      address: profile.address || '',
    },
  });

  useEffect(() => {
    reset({
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      identity_number: profile.identity_number || '',
      date_of_birth: profile.date_of_birth || '',
      gender: profile.gender || 'male',
      address: profile.address || '',
    });
  }, [profile, reset]);

  const onFormSubmit = async (values: ProfileFormValues) => {
    const payload: UpdateCustomerProfileDto = {
      full_name: values.full_name.trim(),
      phone: values.phone?.trim() ? values.phone.trim() : null,
      identity_number: values.identity_number?.trim() ? values.identity_number.trim() : null,
      date_of_birth: values.date_of_birth ? values.date_of_birth : null,
      gender: values.gender || null,
      address: values.address?.trim() ? values.address.trim() : null,
    };

    const success = await onSubmit(payload);
    if (success) {
      reset({
        ...values,
        full_name: payload.full_name || '',
        phone: payload.phone || '',
        identity_number: payload.identity_number || '',
        date_of_birth: payload.date_of_birth || '',
        gender: payload.gender || 'male',
        address: payload.address || '',
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="card space-y-6 border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Chỉnh sửa thông tin cá nhân
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Cập nhật thông tin chính xác để thuận tiện cho việc nhận phòng và sử dụng dịch vụ tại khách sạn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Họ và tên */}
        <div className="sm:col-span-2">
          <label htmlFor="full_name" className="label flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-gray-400" />
            <span>Họ và tên</span>
            <span className="text-danger-500">*</span>
          </label>
          <input
            id="full_name"
            type="text"
            className={`input ${errors.full_name ? 'border-danger-500 focus:ring-danger-500' : ''}`}
            placeholder="VD: Nguyễn Văn A"
            {...register('full_name')}
          />
          {errors.full_name && (
            <p className="mt-1.5 text-xs text-danger-500">{errors.full_name.message}</p>
          )}
        </div>

        {/* Email - Readonly */}
        <div>
          <label htmlFor="email" className="label flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            <span>Email</span>
            <span className="text-[10px] text-gray-400 font-normal">(Cố định)</span>
          </label>
          <input
            id="email"
            type="email"
            disabled
            value={profile.email || ''}
            className="input cursor-not-allowed bg-gray-50 text-gray-500 opacity-80 dark:bg-gray-800 dark:text-gray-400"
            title="Email tài khoản không thể thay đổi"
          />
        </div>

        {/* Số điện thoại */}
        <div>
          <label htmlFor="phone" className="label flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            <span>Số điện thoại</span>
          </label>
          <input
            id="phone"
            type="tel"
            className={`input ${errors.phone ? 'border-danger-500 focus:ring-danger-500' : ''}`}
            placeholder="VD: 0912345678"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs text-danger-500">{errors.phone.message}</p>
          )}
        </div>

        {/* CCCD / CMND */}
        <div>
          <label htmlFor="identity_number" className="label flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-gray-400" />
            <span>Số CCCD / CMND</span>
          </label>
          <input
            id="identity_number"
            type="text"
            className={`input ${errors.identity_number ? 'border-danger-500 focus:ring-danger-500' : ''}`}
            placeholder="VD: 048098001234 (9-12 số)"
            {...register('identity_number')}
          />
          {errors.identity_number && (
            <p className="mt-1.5 text-xs text-danger-500">{errors.identity_number.message}</p>
          )}
        </div>

        {/* Ngày sinh */}
        <div>
          <label htmlFor="date_of_birth" className="label flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
            <span>Ngày sinh</span>
          </label>
          <input
            id="date_of_birth"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            className={`input ${errors.date_of_birth ? 'border-danger-500 focus:ring-danger-500' : ''}`}
            {...register('date_of_birth')}
          />
          {errors.date_of_birth && (
            <p className="mt-1.5 text-xs text-danger-500">{errors.date_of_birth.message}</p>
          )}
        </div>

        {/* Giới tính */}
        <div className="sm:col-span-2">
          <label className="label block">Giới tính</label>
          <div className="flex items-center gap-6 pt-1">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                value="male"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                {...register('gender')}
              />
              <span>Nam</span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                value="female"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                {...register('gender')}
              />
              <span>Nữ</span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                value="other"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                {...register('gender')}
              />
              <span>Khác</span>
            </label>
          </div>
          {errors.gender && (
            <p className="mt-1.5 text-xs text-danger-500">{errors.gender.message}</p>
          )}
        </div>

        {/* Địa chỉ */}
        <div className="sm:col-span-2">
          <label htmlFor="address" className="label flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            <span>Địa chỉ thường trú / liên hệ</span>
          </label>
          <textarea
            id="address"
            rows={3}
            className={`input resize-none ${errors.address ? 'border-danger-500 focus:ring-danger-500' : ''}`}
            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
            {...register('address')}
          />
          {errors.address && (
            <p className="mt-1.5 text-xs text-danger-500">{errors.address.message}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => reset()}
          disabled={!isDirty || isSubmitting}
          className="btn btn-secondary px-4 py-2 text-xs font-medium disabled:opacity-50"
        >
          Hủy thay đổi
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="btn btn-primary inline-flex items-center gap-2 px-5 py-2 text-xs font-medium shadow-sm transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Lưu thay đổi</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
