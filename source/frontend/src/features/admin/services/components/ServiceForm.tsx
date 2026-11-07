import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { serviceApi } from '@/api/service.api';
import type { Service } from '@/types';

const serviceSchema = z.object({
  name: z
    .string({ required_error: 'Tên dịch vụ là bắt buộc' })
    .trim()
    .min(2, 'Tên dịch vụ phải có ít nhất 2 ký tự')
    .max(100, 'Tên dịch vụ không được quá 100 ký tự'),
  price: z.coerce
    .number({ required_error: 'Giá dịch vụ là bắt buộc', invalid_type_error: 'Giá phải là số hợp lệ' })
    .min(0, 'Giá dịch vụ không được âm'),
  unit: z
    .string({ required_error: 'Đơn vị tính là bắt buộc' })
    .trim()
    .min(1, 'Đơn vị tính không được để trống')
    .max(30, 'Đơn vị tính không được quá 30 ký tự'),
  description: z
    .string()
    .trim()
    .max(500, 'Mô tả dịch vụ không được quá 500 ký tự')
    .optional()
    .or(z.literal('')),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  open: boolean;
  onClose: () => void;
  service?: Service | null;
  onSuccess: () => void;
}

/**
 * Modal Form Tạo mới / Cập nhật Dịch vụ (Admin)
 */
export function ServiceForm({ open, onClose, service, onSuccess }: ServiceFormProps) {
  const isEdit = !!service;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      price: 0,
      unit: '',
      description: '',
    },
  });

  // Điền dữ liệu khi mở form edit
  useEffect(() => {
    if (open) {
      if (service) {
        reset({
          name: service.name,
          price: service.price,
          unit: service.unit,
          description: service.description ?? '',
        });
      } else {
        reset({
          name: '',
          price: 0,
          unit: '',
          description: '',
        });
      }
    }
  }, [open, service, reset]);

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      const payload = {
        name: values.name.trim(),
        price: Number(values.price),
        unit: values.unit.trim(),
        description: values.description?.trim() ? values.description.trim() : null,
      };

      if (isEdit && service) {
        await serviceApi.update(service.id, payload);
        toast.success('Cập nhật dịch vụ thành công');
      } else {
        await serviceApi.create(payload);
        toast.success('Thêm dịch vụ mới thành công');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errResponse = err as {
        response?: { data?: { error?: { code?: string; message?: string } } };
        message?: string;
      };
      const errorCode = errResponse?.response?.data?.error?.code;
      const errorMessage = errResponse?.response?.data?.error?.message;

      if (errorCode === 'SERVICE_NAME_EXISTS') {
        setError('name', { message: 'Tên dịch vụ đã tồn tại trong hệ thống' });
      } else {
        toast.error(errorMessage ?? (isEdit ? 'Không thể cập nhật dịch vụ' : 'Không thể tạo dịch vụ mới'));
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tên dịch vụ */}
        <div>
          <Input
            label="Tên dịch vụ"
            required
            placeholder="VD: Giặt ủi cao cấp, Bữa sáng buffet..."
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        {/* Đơn giá & Đơn vị tính */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Input
              label="Đơn giá (VNĐ)"
              type="number"
              min={0}
              step={1000}
              required
              placeholder="VD: 50000"
              error={errors.price?.message}
              {...register('price')}
            />
          </div>
          <div>
            <Input
              label="Đơn vị tính"
              required
              placeholder="VD: lượt, kg, người, giờ..."
              error={errors.unit?.message}
              {...register('unit')}
            />
          </div>
        </div>

        {/* Mô tả */}
        <div>
          <label htmlFor="service-desc" className="label">
            Mô tả dịch vụ
          </label>
          <textarea
            id="service-desc"
            rows={3}
            placeholder="Mô tả chi tiết quy cách, tiêu chuẩn dịch vụ..."
            className={`input ${errors.description ? 'border-danger-500 focus:ring-danger-500' : ''}`}
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-danger-500">{errors.description.message}</p>
          )}
        </div>

        {/* Nút hành động */}
        <div className="mt-6 flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Lưu thay đổi' : 'Thêm dịch vụ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

