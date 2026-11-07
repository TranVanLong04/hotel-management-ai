import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  Calendar,
  DollarSign,
  Percent,
  Receipt,
  RotateCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { StatsCard } from '@components/common/StatsCard';
import { formatCurrency, formatDate } from '@utils/format';
import { reportApi } from '@/api/report.api';
import type {
  RevenuePoint,
  OccupancyPoint,
} from '@/types';

export function ReportPage() {
  const [from, setFrom] = useState(() => dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(true);

  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [occupancyData, setOccupancyData] = useState<OccupancyPoint[]>([]);
  const [averageOccupancy, setAverageOccupancy] = useState<number>(0);

  const fetchReports = useCallback(async () => {
    if (from > to) {
      toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc');
      return;
    }

    setLoading(true);
    try {
      const [revRes, occRes] = await Promise.allSettled([
        reportApi.getRevenue({ from, to, group_by: 'day' }),
        reportApi.getOccupancy({ from, to }),
      ]);

      if (revRes.status === 'fulfilled') {
        setRevenueData(revRes.value.data.data ?? []);
        setTotalRevenue(revRes.value.data.total_revenue ?? 0);
      }
      if (occRes.status === 'fulfilled') {
        setOccupancyData(occRes.value.data.data ?? []);
        setAverageOccupancy(occRes.value.data.average_occupancy ?? 0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải báo cáo';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Presets
  const handleApplyPreset = (days: number) => {
    const end = dayjs().format('YYYY-MM-DD');
    const start = dayjs().subtract(days, 'day').format('YYYY-MM-DD');
    setFrom(start);
    setTo(end);
  };

  const handleApplyThisMonth = () => {
    const start = dayjs().startOf('month').format('YYYY-MM-DD');
    const end = dayjs().format('YYYY-MM-DD');
    setFrom(start);
    setTo(end);
  };

  // Tính tổng số giao dịch
  const totalPayments = useMemo(() => {
    return revenueData.reduce((sum, item) => sum + (item.payment_count || 0), 0);
  }, [revenueData]);

  // Số ngày báo cáo
  const daysCount = useMemo(() => {
    return dayjs(to).diff(dayjs(from), 'day') + 1;
  }, [from, to]);

  // Xuất file CSV client-side
  const handleExportCSV = () => {
    if (!revenueData.length && !occupancyData.length) {
      toast.error('Không có dữ liệu để xuất file');
      return;
    }

    // Gộp dữ liệu theo ngày
    const occMap = new Map(occupancyData.map((o) => [o.report_date, o]));
    const headers = [
      'Ngay',
      'DoanhThu_VND',
      'SoGiaoDich',
      'TongPhong',
      'PhongCoKhach',
      'TyLeLapDay_PhanTram',
    ];

    const rows = revenueData.map((r) => {
      const occ = occMap.get(r.report_date);
      return [
        r.report_date,
        r.revenue,
        r.payment_count,
        occ?.total_rooms ?? '—',
        occ?.occupied_rooms ?? '—',
        occ?.occupancy_rate ?? '—',
      ].join(',');
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `bao-cao-doanh-thu-cong-suat-${from}-${to}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất file CSV báo cáo thành công');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Báo cáo & Thống kê Kinh doanh
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Phân tích chuyên sâu doanh thu thực thu và công suất sử dụng buồng phòng
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleExportCSV}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Xuất báo cáo CSV</span>
        </Button>
      </div>

      {/* Date Range Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Từ ngày:
              </span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Đến ngày:
              </span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <Button
              type="button"
              size="sm"
              onClick={fetchReports}
              loading={loading}
              className="h-9 gap-1 text-xs"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Tra cứu</span>
            </Button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-gray-400">Chọn nhanh:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset(7)}
              className="rounded-lg bg-gray-100 px-2.5 py-1 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(30)}
              className="rounded-lg bg-gray-100 px-2.5 py-1 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              30 ngày qua
            </button>
            <button
              type="button"
              onClick={handleApplyThisMonth}
              className="rounded-lg bg-gray-100 px-2.5 py-1 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset(90)}
              className="rounded-lg bg-gray-100 px-2.5 py-1 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Quý gần nhất
            </button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng doanh thu thực tế"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="success"
          subtext={`Trong khoảng ${daysCount} ngày`}
        />

        <StatsCard
          title="Công suất phòng TB"
          value={`${averageOccupancy}%`}
          icon={Percent}
          color="primary"
          subtext="Tỷ lệ buồng phòng có khách"
        />

        <StatsCard
          title="Số giao dịch thanh toán"
          value={totalPayments}
          icon={Receipt}
          color="info"
          subtext="Hóa đơn đã hoàn tất"
        />

        <StatsCard
          title="Số ngày thống kê"
          value={`${daysCount} ngày`}
          icon={Calendar}
          color="warning"
          subtext={`${formatDate(from)} đến ${formatDate(to)}`}
        />
      </div>

      {/* Revenue Chart (BarChart) */}
      <Card className="p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Doanh thu theo ngày (Bar Chart)
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Số tiền thực thu theo từng ngày giao dịch (VNĐ)
          </p>
        </div>

        <div className="h-72 w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              Đang tải biểu đồ doanh thu...
            </div>
          ) : revenueData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              Chưa có dữ liệu doanh thu trong khoảng thời gian này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="report_date"
                  tickFormatter={(val: string) => formatDate(val, 'DD/MM')}
                  tick={{ fontSize: 11 }}
                  stroke="#888888"
                />
                <YAxis
                  tickFormatter={(val: number) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return String(val);
                  }}
                  tick={{ fontSize: 11 }}
                  stroke="#888888"
                />
                <Tooltip
                  formatter={(val: ValueType | undefined) => {
                    const num = typeof val === 'number' ? val : Number(val);
                    return [
                      formatCurrency(Number.isFinite(num) ? num : 0),
                      'Doanh thu',
                    ];
                  }}
                  labelFormatter={(label) => `Ngày: ${formatDate(String(label))}`}
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Occupancy Chart (LineChart) */}
      <Card className="p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Tỷ lệ Lấp đầy Phòng (Occupancy Rate)
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Tỷ lệ % buồng phòng đang có khách lưu trú theo ngày
          </p>
        </div>

        <div className="h-72 w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              Đang tải biểu đồ công suất...
            </div>
          ) : occupancyData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              Chưa có dữ liệu công suất trong khoảng thời gian này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={occupancyData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="report_date"
                  tickFormatter={(val: string) => formatDate(val, 'DD/MM')}
                  tick={{ fontSize: 11 }}
                  stroke="#888888"
                />
                <YAxis
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="#888888"
                />
                <Tooltip
                  formatter={(val: ValueType | undefined) => [
                    `${val ?? 0}%`,
                    'Tỷ lệ lấp đầy',
                  ]}
                  labelFormatter={(label) => `Ngày: ${formatDate(String(label))}`}
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="occupancy_rate"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}

