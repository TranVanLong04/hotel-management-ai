import { RotateCcw, CheckCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@components/ui/Button';

interface FacePreviewProps {
  dataUrl: string;
  submitting: boolean;
  onRetake: () => void;
  onConfirm: () => void;
}

/**
 * Component xem trước ảnh khuôn mặt vừa chụp trước khi gửi xác nhận đăng ký
 */
export function FacePreview({ dataUrl, submitting, onRetake, onConfirm }: FacePreviewProps) {
  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Khung hiển thị ảnh chụp */}
      <div className="relative mx-auto aspect-[4/3] max-w-lg overflow-hidden rounded-3xl bg-gray-950 shadow-2xl border-2 border-primary-500/50 flex items-center justify-center">
        <img
          src={dataUrl}
          alt="Face preview"
          className="h-full w-full object-cover"
        />

        {/* Badge xác nhận ảnh hợp lệ */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-success-500/90 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Đã chụp</span>
        </div>
      </div>

      {/* Thông điệp bảo mật */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <ShieldCheck className="h-4 w-4 text-success-500" />
        <span>Ảnh chụp sẽ được mã hóa an toàn thành vector 512 chiều phục vụ nhận diện Check-in</span>
      </div>

      {/* Nút hành động */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={onRetake}
          disabled={submitting}
          className="w-full sm:w-auto font-semibold cursor-pointer"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Chụp lại
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={onConfirm}
          loading={submitting}
          disabled={submitting}
          className="w-full sm:w-auto font-semibold shadow-lg cursor-pointer"
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          Xác nhận đăng ký
        </Button>
      </div>
    </div>
  );
}
