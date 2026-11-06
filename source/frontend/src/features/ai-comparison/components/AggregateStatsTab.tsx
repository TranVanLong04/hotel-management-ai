import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Download,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  Calendar,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { aiComparisonApi } from '@/api/aiComparisonApi';
import type { ComparisonStats } from '@/types';

export function AggregateStatsTab() {
  const [stats, setStats] = useState<ComparisonStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d'>('all');
  const [datasetFilter, setDatasetFilter] = useState<string>('all');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      let dateFrom: string | undefined = undefined;
      const now = new Date();
      if (dateFilter === '7d') {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFrom = d.toISOString();
      } else if (dateFilter === '30d') {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFrom = d.toISOString();
      }

      const data = await aiComparisonApi.getStats({
        date_from: dateFrom,
        dataset_tag: datasetFilter === 'all' ? undefined : datasetFilter,
      });
      setStats(data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, datasetFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    toast.loading('Đang chạy benchmark kiểm thử hàng loạt trên bộ dữ liệu chuẩn...', { id: 'bench' });
    try {
      await aiComparisonApi.runBatchBenchmark();
      toast.success('Đã hoàn thành lượt benchmark hàng loạt!', { id: 'bench' });
      await fetchStats();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Lỗi khi chạy benchmark', { id: 'bench' });
    } finally {
      setBenchmarking(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      await aiComparisonApi.downloadExport(format, {
        dataset_tag: datasetFilter === 'all' ? undefined : datasetFilter,
      });
      toast.success(`Đã xuất dữ liệu ${format.toUpperCase()} thành công`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Không thể xuất dữ liệu');
    }
  };

  // Chuẩn bị dữ liệu biểu đồ độ trễ
  const latencyData = stats
    ? [
        {
          name: 'Thời gian suy luận (Inference)',
          FaceNet: stats.facenet.avgInferenceTimeMs,
          InsightFace: stats.insightface.avgInferenceTimeMs,
        },
        {
          name: 'Độ trễ P95 (95th Percentile)',
          FaceNet: stats.facenet.p95InferenceTimeMs,
          InsightFace: stats.insightface.p95InferenceTimeMs,
        },
        {
          name: 'Tổng thời gian Pipeline',
          FaceNet: stats.facenet.avgTotalTimeMs,
          InsightFace: stats.insightface.avgTotalTimeMs,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Top Filter and Actions Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-900">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Báo cáo thống kê toàn bộ lượt so sánh
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Dữ liệu tổng hợp thực tế từ tất cả lượt kiểm thử FaceNet và InsightFace đã lưu trong cơ sở dữ liệu.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            title="Làm mới dữ liệu"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            type="button"
            onClick={handleRunBenchmark}
            disabled={benchmarking}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary-600/20 hover:bg-primary-700 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            {benchmarking ? 'Đang Benchmark...' : 'Chạy Benchmark tập chuẩn'}
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              Xuất CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              Xuất JSON
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs dark:border-gray-800 dark:bg-gray-800/40">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-gray-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">Bộ lọc:</span>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
          <Calendar className="ml-1.5 h-3.5 w-3.5 text-gray-400" />
          <button
            type="button"
            onClick={() => setDateFilter('all')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              dateFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
            }`}
          >
            Tất cả thời gian
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('7d')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              dateFilter === '7d'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
            }`}
          >
            7 ngày gần nhất
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('30d')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              dateFilter === '30d'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
            }`}
          >
            30 ngày gần nhất
          </button>
        </div>

        {/* Dataset Filter */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Tập dữ liệu:</span>
          <select
            value={datasetFilter}
            onChange={(e) => setDatasetFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">Tất cả tập dữ liệu</option>
            <option value="checkin_production">Dữ liệu Check-in / Check-out thực tế (Supabase)</option>
            <option value="curated_album">Album kiểm thử chuẩn</option>
            <option value="manual_upload">Tải lên thủ công</option>
            <option value="sample_album_benchmark">Benchmark chuẩn LFW</option>
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !stats ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            <span className="text-sm font-medium">Đang tính toán các chỉ số thống kê thực tế...</span>
          </div>
        </div>
      ) : stats ? (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tổng lượt kiểm thử
              </span>
              <p className="mt-2 font-mono text-3xl font-extrabold text-gray-900 dark:text-white">
                {stats.overview.totalRuns}
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                {stats.overview.totalFacesTested} khuôn mặt được đánh giá
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Cặp ảnh có Ground Truth
              </span>
              <p className="mt-2 font-mono text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats.overview.labeledPairsCount}
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                {stats.overview.genuineCount} Genuine / {stats.overview.impostorCount} Impostor
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tỷ lệ đồng thuận
              </span>
              <p className="mt-2 font-mono text-3xl font-extrabold text-primary-600 dark:text-primary-400">
                {stats.overview.totalRuns > 0
                  ? `${Math.round((stats.overview.agreementCount / stats.overview.totalRuns) * 100)}%`
                  : 'N/A'}
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                {stats.overview.agreementCount} đồng thuận / {stats.overview.discrepancyCount} sai lệch
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Ca sai lệch nhận định
              </span>
              <p className="mt-2 font-mono text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {stats.overview.discrepancyCount}
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                Cần lưu ý kiểm tra chuyên sâu
              </p>
            </div>
          </div>

          {/* Model Metrics Comparison Cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* FaceNet Metrics */}
            <div className="rounded-2xl border border-blue-500/20 bg-white p-6 shadow-sm dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">FaceNet</h3>
                    <p className="text-[11px] text-gray-400 font-mono">Inception-ResNet-v1 (512D)</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  Threshold: 0.75
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-gray-50 p-3.5 text-center dark:bg-gray-800/40">
                  <span className="text-[11px] font-semibold uppercase text-gray-400">Accuracy</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.facenet.accuracy !== null ? `${(stats.facenet.accuracy * 100).toFixed(1)}%` : 'Chưa có Ground Truth'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">Độ chính xác tổng thể</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3.5 text-center dark:bg-gray-800/40">
                  <span className="text-[11px] font-semibold uppercase text-gray-400">FMR (FAR)</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {stats.facenet.fmr !== null ? `${(stats.facenet.fmr * 100).toFixed(2)}%` : 'N/A'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">Nhận nhầm người lạ</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3.5 text-center dark:bg-gray-800/40">
                  <span className="text-[11px] font-semibold uppercase text-gray-400">FNMR (FRR)</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.facenet.fnmr !== null ? `${(stats.facenet.fnmr * 100).toFixed(2)}%` : 'N/A'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">Bỏ sót người quen</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <div>
                  <span className="text-[11px] text-gray-400">EER (Equal Error Rate)</span>
                  <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                    {stats.facenet.eer !== null ? `${(stats.facenet.eer * 100).toFixed(2)}%` : 'Chưa đủ dữ liệu'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400">Avg Inference</span>
                  <p className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                    {stats.facenet.avgInferenceTimeMs} ms
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400">P95 Latency</span>
                  <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                    {stats.facenet.p95InferenceTimeMs} ms
                  </p>
                </div>
              </div>
            </div>

            {/* InsightFace Metrics */}
            <div className="rounded-2xl border border-purple-500/20 bg-white p-6 shadow-sm dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">InsightFace</h3>
                    <p className="text-[11px] text-gray-400 font-mono">ArcFace buffalo_l (512D)</p>
                  </div>
                </div>
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                  Threshold: 0.55
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-gray-50 p-3.5 text-center dark:bg-gray-800/40">
                  <span className="text-[11px] font-semibold uppercase text-gray-400">Accuracy</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.insightface.accuracy !== null ? `${(stats.insightface.accuracy * 100).toFixed(1)}%` : 'Chưa có Ground Truth'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">Độ chính xác tổng thể</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3.5 text-center dark:bg-gray-800/40">
                  <span className="text-[11px] font-semibold uppercase text-gray-400">FMR (FAR)</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {stats.insightface.fmr !== null ? `${(stats.insightface.fmr * 100).toFixed(2)}%` : 'N/A'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">Nhận nhầm người lạ</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3.5 text-center dark:bg-gray-800/40">
                  <span className="text-[11px] font-semibold uppercase text-gray-400">FNMR (FRR)</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.insightface.fnmr !== null ? `${(stats.insightface.fnmr * 100).toFixed(2)}%` : 'N/A'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">Bỏ sót người quen</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <div>
                  <span className="text-[11px] text-gray-400">EER (Equal Error Rate)</span>
                  <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                    {stats.insightface.eer !== null ? `${(stats.insightface.eer * 100).toFixed(2)}%` : 'Chưa đủ dữ liệu'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400">Avg Inference</span>
                  <p className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
                    {stats.insightface.avgInferenceTimeMs} ms
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-gray-400">P95 Latency</span>
                  <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                    {stats.insightface.p95InferenceTimeMs} ms
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Chart 1: Latency Comparison */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary-600" />
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    So sánh độ trễ thực thi (Latency in ms)
                  </h4>
                </div>
                <span className="text-[11px] text-gray-400">Thấp hơn là tốt hơn</span>
              </div>

              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={latencyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="ms" />
                    <Tooltip
                      formatter={(val) => [`${val} ms`, '']}
                      contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="FaceNet" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="InsightFace" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: ROC Curve */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Đường cong ROC (Receiver Operating Characteristic)
                  </h4>
                </div>
                <span className="text-[11px] text-gray-400">
                  {stats.rocCurve.length > 0 ? 'Dựa trên Ground Truth thực tế' : 'Cần ít nhất 1 Genuine & 1 Impostor'}
                </span>
              </div>

              <div className="mt-4 h-72 w-full">
                {stats.rocCurve.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.rocCurve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis
                        dataKey="facenet_fpr"
                        label={{ value: 'FPR (False Positive Rate)', position: 'insideBottom', offset: -5, fontSize: 10 }}
                        tick={{ fontSize: 10 }}
                        domain={[0, 1]}
                      />
                      <YAxis
                        label={{ value: 'TPR (True Positive Rate)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                        tick={{ fontSize: 10 }}
                        domain={[0, 1]}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="facenet_tpr"
                        name="FaceNet (Inception-ResNet-v1)"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="insightface_tpr"
                        name="InsightFace (ArcFace)"
                        stroke="#a855f7"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                    <TrendingUp className="h-10 w-10 opacity-30" />
                    <p className="mt-2 text-xs">
                      Chưa đủ dữ liệu Ground Truth (cần cả Genuine và Impostor) để vẽ đường cong ROC.
                    </p>
                    <button
                      type="button"
                      onClick={handleRunBenchmark}
                      className="mt-3 text-xs font-semibold text-primary-600 hover:underline"
                    >
                      Nhấn vào đây để chạy Benchmark mẫu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart 3: Similarity Distribution Histogram */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary-600" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Phân bố điểm tương đồng (Similarity Score Distribution)
                </h4>
              </div>
              <span className="text-[11px] text-gray-400">Khoảng giá trị Cosine [-1.0, 1.0]</span>
            </div>

            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.similarityDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="facenet" name="FaceNet" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="insightface" name="InsightFace" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Discrepancy Table */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Các trường hợp hai mô hình cho kết quả khác nhau (Discrepancies)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Danh sách các cặp ảnh mà một mô hình kết luận Match trong khi mô hình kia kết luận Non-match.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {stats.discrepancyList.length} trường hợp
              </span>
            </div>

            {stats.discrepancyList.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-center text-gray-400">
                <ShieldCheck className="h-8 w-8 text-emerald-500 opacity-60" />
                <p className="mt-2 text-xs">Không có trường hợp sai lệch nào trong tập dữ liệu hiện tại.</p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Ảnh & Đối tượng</th>
                      <th className="px-4 py-3">Ground Truth</th>
                      <th className="px-4 py-3">FaceNet (0.75)</th>
                      <th className="px-4 py-3">InsightFace (0.55)</th>
                      <th className="px-4 py-3">Độ chênh lệch (Δ)</th>
                      <th className="px-4 py-3">Phân loại sai lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {stats.discrepancyList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {item.reference_name} vs {item.test_name}
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono">{item.job_id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                              item.ground_truth === 'genuine'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : item.ground_truth === 'impostor'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {item.ground_truth}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                item.facenet_is_match ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{(item.facenet_similarity).toFixed(4)}</span>
                            <span className="text-[10px] text-gray-400">
                              ({item.facenet_is_match ? 'Match' : 'No'})
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                item.insightface_is_match ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{(item.insightface_similarity).toFixed(4)}</span>
                            <span className="text-[10px] text-gray-400">
                              ({item.insightface_is_match ? 'Match' : 'No'})
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                          {(item.delta_similarity).toFixed(4)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            {item.discrepancy_type === 'facenet_only_match'
                              ? 'FaceNet Match, InsightFace Non-match'
                              : 'InsightFace Match, FaceNet Non-match'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
