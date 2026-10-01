import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@components/ui/Card';
import { RegisterForm } from '../components/RegisterForm';
import { PATHS } from '@routes/paths';

/**
 * Trang Đăng ký
 * Căn giữa màn hình max-w-md, bao bọc RegisterForm trong Card
 * Tự động chuyển hướng về trang yêu cầu trước đó hoặc trang chủ sau khi đăng ký thành công
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy đường dẫn trước đó từ location.state.from hoặc mặc định '/'
  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ||
    (location.state as { from?: string })?.from ||
    PATHS.HOME;

  const handleSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Đăng ký tài khoản
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Tạo tài khoản để trải nghiệm dịch vụ khách sạn hiện đại
          </p>
        </div>

        <Card>
          <RegisterForm onSuccess={handleSuccess} />
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Đã có tài khoản?{' '}
          <Link
            to={PATHS.LOGIN}
            state={location.state}
            className="font-medium text-primary-600 hover:text-primary-500 hover:underline dark:text-primary-400"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
