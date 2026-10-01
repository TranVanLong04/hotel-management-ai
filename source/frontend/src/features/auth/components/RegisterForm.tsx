import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { useAuthActions } from '../hooks/useAuthActions';
import { getErrorCode, getErrorMessage } from '@utils/errorHandler';

/** Schema xác thực cho form đăng ký */
const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, 'Họ tên phải có ít nhất 2 ký tự')
      .max(100, 'Họ tên không được quá 100 ký tự')
      .trim(),
    email: z
      .string()
      .min(1, 'Email không được để trống')
      .email('Email không đúng định dạng'),
    phone: z
      .string()
      .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số'),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số'),
    confirm_password: z
      .string()
      .min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  /** Callback được gọi khi đăng ký và tự động đăng nhập thành công */
  onSuccess?: () => void;
}

/**
 * Form đăng ký tài khoản khách hàng mới
 * Xử lý validation đầy đủ các trường và tự động đăng nhập khi thành công
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { handleRegister, loading } = useAuthActions();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Tách confirm_password trước khi gửi sang API payload
      const { confirm_password: _, ...payload } = data;
      await handleRegister(payload);
      onSuccess?.();
    } catch (error: unknown) {
      const code = getErrorCode(error);
      const message = getErrorMessage(error);

      // Email đã tồn tại trong hệ thống
      if (code === 'AUTH_EMAIL_EXISTS') {
        setError('email', {
          type: 'server',
          message: message || 'Email đã được sử dụng',
        });
      } else {
        toast.error(message || 'Đăng ký thất bại, vui lòng thử lại');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        id="full_name"
        label="Họ và tên"
        type="text"
        placeholder="Nguyễn Văn A"
        required
        autoComplete="name"
        error={errors.full_name?.message}
        disabled={loading}
        {...register('full_name')}
      />

      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="example@hotel.com"
        required
        autoComplete="email"
        error={errors.email?.message}
        disabled={loading}
        {...register('email')}
      />

      <Input
        id="phone"
        label="Số điện thoại"
        type="tel"
        placeholder="0912345678"
        required
        autoComplete="tel"
        error={errors.phone?.message}
        disabled={loading}
        {...register('phone')}
      />

      <div className="relative">
        <Input
          id="password"
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 số"
          required
          autoComplete="new-password"
          error={errors.password?.message}
          disabled={loading}
          className="pr-10"
          {...register('password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-[33px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
          tabIndex={-1}
          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      <div className="relative">
        <Input
          id="confirm_password"
          label="Xác nhận mật khẩu"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Nhập lại mật khẩu"
          required
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          disabled={loading}
          className="pr-10"
          {...register('confirm_password')}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          className="absolute right-3 top-[33px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
          tabIndex={-1}
          aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
        >
          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={loading}
        disabled={loading}
        className="w-full mt-2"
      >
        Đăng ký tài khoản
      </Button>
    </form>
  );
}
