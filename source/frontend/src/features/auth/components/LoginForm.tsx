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

/** Schema xác thực cho form đăng nhập */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không đúng định dạng'),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  /** Callback được gọi khi đăng nhập thành công */
  onSuccess?: () => void;
}

/**
 * Form đăng nhập người dùng
 * Xử lý validation client qua Zod và map lỗi server vào từng input
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { handleLogin, loading } = useAuthActions();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await handleLogin(data);
      onSuccess?.();
    } catch (error: unknown) {
      const code = getErrorCode(error);
      const message = getErrorMessage(error);

      // Map lỗi từ server về trường mật khẩu
      if (code === 'AUTH_INVALID_CREDENTIALS' || code === 'UNAUTHORIZED') {
        setError('password', {
          type: 'server',
          message: message || 'Email hoặc mật khẩu không chính xác',
        });
      }
      // Map lỗi tài khoản bị khóa về trường email
      else if (code === 'AUTH_ACCOUNT_DISABLED' || code === 'FORBIDDEN') {
        setError('email', {
          type: 'server',
          message: message || 'Tài khoản đã bị vô hiệu hóa',
        });
      }
      // Các lỗi khác hiển thị qua toast
      else {
        toast.error(message || 'Đăng nhập thất bại, vui lòng thử lại');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

      <div className="relative">
        <Input
          id="password"
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder="Nhập mật khẩu của bạn"
          required
          autoComplete="current-password"
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

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={loading}
        disabled={loading}
        className="w-full mt-2"
      >
        Đăng nhập
      </Button>
    </form>
  );
}
