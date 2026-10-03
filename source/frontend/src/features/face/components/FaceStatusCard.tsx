import { CheckCircle2, AlertCircle, Camera, Sparkles, Cpu, Calendar } from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import type { FaceProfile } from '@/types/face';
import { formatDateTime } from '@/utils/format';

interface FaceStatusCardProps {
  profile: FaceProfile | null;
  onRegisterNew?: () => void;
}

/**
 * Component hiển thị tình trạng hồ sơ khuôn mặt hiện tại của khách hàng
 */
export function FaceStatusCard({ profile, onRegisterNew }: FaceStatusCardProps) {
  // Trường hợp ĐÃ ĐĂNG KÝ
  if (profile) {
    return (
      <Card className="overflow-hidden rounded-3xl border border-success-200 bg-gradient-to-br from-success-50/50 via-white to-white p-6 shadow-card dark:border-success-900/40 dark:from-success-950/20 dark:via-gray-850 dark:to-gray-850">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Thumbnail ảnh khuôn mặt */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-success-500/40 bg-gray-100 shadow-md dark:bg-gray-800">
              <img
                src={profile.face_image_url}
                alt="Ảnh khuôn mặt đã đăng ký"
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback nếu ảnh không load được
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-success-500 text-white shadow-sm">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Hồ sơ khuôn mặt AI
                </span>
                <Badge variant="success">Đã đăng ký</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Cpu className="h-3.5 w-3.5 text-primary-500" />
                  Model: {profile.model_version || 'arcface-r100-v1'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary-500" />
                  Đăng ký: {formatDateTime(profile.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Nút đăng ký lại nếu muốn cập nhật ảnh mới */}
          {onRegisterNew && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegisterNew}
              className="shrink-0 font-medium cursor-pointer"
            >
              <Camera className="mr-2 h-4 w-4" />
              Cập nhật khuôn mặt mới
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Trường hợp CHƯA ĐĂNG KÝ
  return (
    <Card className="rounded-3xl border border-warning-200 bg-gradient-to-br from-warning-50/60 via-white to-white p-6 shadow-card dark:border-warning-900/40 dark:from-warning-950/20 dark:via-gray-850 dark:to-gray-850">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-warning-100 text-warning-600 dark:bg-warning-900/40 dark:text-warning-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Bạn chưa đăng ký khuôn mặt
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Đăng ký khuôn mặt để trải nghiệm thủ tục Check-in tự động nhanh chóng bằng AI.
            </p>
          </div>
        </div>

        {onRegisterNew && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRegisterNew}
            className="shrink-0 font-semibold shadow-md cursor-pointer"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Đăng ký ngay
          </Button>
        )}
      </div>
    </Card>
  );
}
