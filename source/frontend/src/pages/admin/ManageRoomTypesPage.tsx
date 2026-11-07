import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Users,
  Edit2,
  Trash2,
  Check,
  Search,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { EmptyState } from '@components/common/EmptyState';
import { ConfirmDialog } from '@components/common/ConfirmDialog';
import { roomTypeApi } from '@/api/roomType.api';
import { formatCurrency } from '@utils/format';
import type {
  RoomType,
  CreateRoomTypePayload,
  UpdateRoomTypePayload,
} from '@/types';

export function ManageRoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [name, setName] = useState('');
  const [maxGuests, setMaxGuests] = useState<number>(2);
  const [basePrice, setBasePrice] = useState<number>(500000);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<RoomType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoomTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomTypeApi.list();
      setRoomTypes(res.data ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải danh sách loại phòng';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  // Lọc theo search
  const filteredTypes = roomTypes.filter((rt) =>
    rt.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleOpenCreate = () => {
    setEditingType(null);
    setName('');
    setMaxGuests(2);
    setBasePrice(500000);
    setDescription('');
    setImageUrl('');
    setAmenitiesInput('Wifi, Điều hòa, Smart TV, Bồn tắm, Minibar');
    setFormOpen(true);
  };

  const handleOpenEdit = (rt: RoomType) => {
    setEditingType(rt);
    setName(rt.name);
    setMaxGuests(rt.max_guests);
    setBasePrice(rt.base_price);
    setDescription(rt.description || '');
    setImageUrl(rt.image_url || '');

    // Amenities có thể là mảng hoặc chuỗi JSON
    let parsedAmenities = '';
    if (typeof rt.amenities === 'string') {
      try {
        const arr = JSON.parse(rt.amenities);
        parsedAmenities = Array.isArray(arr) ? arr.join(', ') : rt.amenities;
      } catch {
        parsedAmenities = rt.amenities;
      }
    }
    setAmenitiesInput(parsedAmenities);
    setFormOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Tên loại phòng không được để trống');
      return;
    }

    const amenitiesArr = amenitiesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      if (editingType) {
        const payload: UpdateRoomTypePayload = {
          name: name.trim(),
          max_guests: Number(maxGuests),
          base_price: Number(basePrice),
          description: description.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          amenities: amenitiesArr,
        };
        await roomTypeApi.update(editingType.id, payload);
        toast.success(`Cập nhật loại phòng "${name}" thành công`);
      } else {
        const payload: CreateRoomTypePayload = {
          name: name.trim(),
          max_guests: Number(maxGuests),
          base_price: Number(basePrice),
          description: description.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          amenities: amenitiesArr,
        };
        await roomTypeApi.create(payload);
        toast.success(`Tạo loại phòng "${name}" thành công`);
      }
      setFormOpen(false);
      fetchRoomTypes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu loại phòng';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;
    setDeleting(true);
    try {
      await roomTypeApi.delete(typeToDelete.id);
      toast.success(`Đã xóa loại phòng "${typeToDelete.name}"`);
      setDeleteDialogOpen(false);
      fetchRoomTypes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa loại phòng';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Hạng & Loại phòng Nghỉ
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Quản lý bảng giá niêm yết, tiện ích dịch vụ và tiêu chuẩn phòng nghỉ
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleOpenCreate}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm hạng phòng</span>
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hạng phòng..."
            className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          />
        </div>
        {search && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearch('')}
            className="h-9 gap-1 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Xóa tìm</span>
          </Button>
        )}
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center text-xs text-gray-400">
          Đang tải danh sách hạng phòng...
        </div>
      ) : filteredTypes.length === 0 ? (
        <EmptyState
          title="Không tìm thấy hạng phòng nào"
          description="Chưa có loại phòng nào phù hợp hoặc chưa có dữ liệu trong hệ thống."
          action={
            <Button size="sm" onClick={handleOpenCreate}>
              Thêm loại phòng đầu tiên
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTypes.map((rt) => {
            let amenitiesList: string[] = [];
            if (typeof rt.amenities === 'string') {
              try {
                const parsed = JSON.parse(rt.amenities);
                if (Array.isArray(parsed)) amenitiesList = parsed;
                else amenitiesList = rt.amenities.split(',').map((s) => s.trim());
              } catch {
                amenitiesList = rt.amenities.split(',').map((s) => s.trim());
              }
            }

            return (
              <Card
                key={rt.id}
                className="group flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                <div>
                  {/* Aspect Video Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={
                        rt.image_url ||
                        'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={rt.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute right-3 top-3">
                      <span className="rounded-lg bg-black/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                        {formatCurrency(rt.base_price)} / đêm
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {rt.name}
                      </h3>
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Users className="h-3.5 w-3.5" />
                        <span>Tối đa {rt.max_guests} khách</span>
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {rt.description || 'Chưa có mô tả cho hạng phòng này.'}
                    </p>

                    {/* Amenities Chips */}
                    {amenitiesList.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {amenitiesList.slice(0, 4).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          >
                            <Check className="h-2.5 w-2.5 text-primary-600" />
                            <span>{amenity}</span>
                          </span>
                        ))}
                        {amenitiesList.length > 4 && (
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400 dark:bg-gray-800">
                            +{amenitiesList.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 p-4 dark:border-gray-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(rt)}
                    className="h-8 gap-1 text-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Sửa</span>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setTypeToDelete(rt);
                      setDeleteDialogOpen(true);
                    }}
                    className="h-8 gap-1 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Thêm / Sửa Loại Phòng */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingType ? `Sửa loại phòng ${editingType.name}` : 'Thêm loại phòng mới'}
        size="md"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Tên hạng / loại phòng *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Phòng Deluxe Hướng Biển"
              className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Giá cơ bản (VNĐ / đêm) *
              </label>
              <input
                type="number"
                min={0}
                step={50000}
                required
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Số khách tối đa *
              </label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={maxGuests}
                onChange={(e) => setMaxGuests(Number(e.target.value))}
                className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              URL hình ảnh đại diện
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Tiện ích (cách nhau bởi dấu phẩy)
            </label>
            <input
              type="text"
              value={amenitiesInput}
              onChange={(e) => setAmenitiesInput(e.target.value)}
              placeholder="Wifi, Điều hòa, Smart TV, Bồn tắm..."
              className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả không gian, tầm nhìn và tiện nghi..."
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              {editingType ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Xóa loại phòng"
        message={`Bạn có chắc chắn muốn xóa loại phòng "${typeToDelete?.name}"? Các phòng thuộc loại này có thể bị ảnh hưởng.`}
        confirmText="Xác nhận xóa"
      />
    </div>
  );
}

