import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  RotateCcw,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Pagination } from '@components/ui/Pagination';
import { Loading } from '@components/feedback/Loading';
import { formatCurrency, formatDate } from '@utils/format';
import { serviceApi } from '@/api/service.api';
import { ServiceForm } from '../components/ServiceForm';
import { ServiceActionsMenu } from '../components/ServiceActionsMenu';
import type { Service } from '@/types';

type StatusFilter = 'all' | 'active' | 'inactive';

const ITEMS_PER_PAGE = 8;

/**
 * Trang Quản lý Danh mục Dịch vụ (Admin)
 */
export function ManageServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc & tìm kiếm
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal thêm/sửa dịch vụ
  const [formOpen, setFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Tải danh sách dịch vụ
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      // Admin xem tất cả các trạng thái
      const response = await serviceApi.list();
      setServices(response.data ?? []);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách dịch vụ';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Lọc và tìm kiếm client-side
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      // Lọc trạng thái
      if (statusFilter === 'active' && !item.is_active) return false;
      if (statusFilter === 'inactive' && item.is_active) return false;

      // Tìm kiếm theo tên hoặc mô tả hoặc đơn vị tính
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query) ?? false;
        const matchUnit = item.unit.toLowerCase().includes(query);
        return matchName || matchDesc || matchUnit;
      }

      return true;
    });
  }, [services, statusFilter, search]);

  // Phân trang
  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE) || 1;
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredServices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredServices, currentPage]);

  // Reset trang về 1 khi lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    setSelectedService(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setSelectedService(service);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8">
      {/* Tiêu đề & Nút thêm dịch vụ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary-100 p-2 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Quản lý Dịch vụ
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản trị danh mục dịch vụ tiện ích, ẩm thực và chăm sóc khách hàng trong khách sạn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={fetchServices}
            title="Làm mới danh sách"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            className="shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Thêm dịch vụ mới
          </Button>
        </div>
      </div>

      {/* Thẻ tìm kiếm & Bộ lọc */}
      <Card className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card dark:border-gray-800 dark:bg-gray-850">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên dịch vụ, đơn vị tính..."
              className="input pl-10"
            />
          </div>

          {/* Bộ lọc trạng thái */}
          <div className="flex items-center gap-1.5 rounded-xl bg-gray-100 p-1 dark:bg-gray-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Tất cả ({services.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-700 dark:text-emerald-400'
                  : 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400'
              }`}
            >
              Đang hoạt động ({services.filter((s) => s.is_active).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Ngừng cung cấp ({services.filter((s) => !s.is_active).length})
            </button>
          </div>
        </div>
      </Card>

      {/* Bảng dữ liệu dịch vụ */}
      <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-850">
        {loading ? (
          <div className="py-20">
            <Loading fullScreen={false} size="md" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-danger-500 mb-2" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchServices}
              className="mt-4"
            >
              Thử lại
            </Button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
              <Tag className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Chưa có dịch vụ nào
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {search || statusFilter !== 'all'
                ? 'Không tìm thấy kết quả phù hợp với điều kiện lọc'
                : 'Bắt đầu bằng cách thêm dịch vụ đầu tiên vào hệ thống'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                className="mt-4"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Thêm dịch vụ ngay
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Tên dịch vụ
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Đơn vị tính
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Đơn giá
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Cập nhật
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedServices.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-800/40"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {service.name}
                        </p>
                        {service.description ? (
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1 dark:text-gray-400 max-w-sm">
                            {service.description}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs text-gray-400 italic">Chưa có mô tả</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                      {service.unit}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary-600 dark:text-primary-400 font-mono">
                        {formatCurrency(service.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {service.is_active ? (
                        <Badge variant="success" size="sm">
                          Đang hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          Ngừng cung cấp
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(service.updated_at || service.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ServiceActionsMenu
                        service={service}
                        onEdit={handleOpenEdit}
                        onRefresh={fetchServices}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredServices.length)} trong tổng số{' '}
              {filteredServices.length} dịch vụ
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Modal Form Thêm / Sửa dịch vụ */}
      <ServiceForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        service={selectedService}
        onSuccess={fetchServices}
      />
    </div>
  );
}

