import api from './axios';
import type {
  ApiResponse,
  ComparisonResult,
  ComparisonRecord,
  ComparisonStats,
  SampleAlbumResponse,
} from '@/types';

export interface RunComparisonPayload {
  image1File?: File | null;
  image2File?: File | null;
  image1Url?: string;
  image2Url?: string;
  thresholdFacenet?: number;
  thresholdInsightface?: number;
  groundTruth?: 'genuine' | 'impostor' | 'unknown';
  datasetTag?: string;
  referenceName?: string;
  testName?: string;
}

export interface GetHistoryParams {
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
  dataset_tag?: string;
  ground_truth?: string;
  is_agreement?: string;
}

export interface GetStatsParams {
  date_from?: string;
  date_to?: string;
  dataset_tag?: string;
}

export const aiComparisonApi = {
  /**
   * Thực hiện so sánh FaceNet & InsightFace trên một cặp ảnh
   */
  runComparison: async (payload: RunComparisonPayload): Promise<{ jobId: string; record: ComparisonRecord; comparison: ComparisonResult }> => {
    const formData = new FormData();
    if (payload.image1File) formData.append('image1', payload.image1File);
    if (payload.image2File) formData.append('image2', payload.image2File);
    if (payload.image1Url) formData.append('image1_url', payload.image1Url);
    if (payload.image2Url) formData.append('image2_url', payload.image2Url);

    if (payload.thresholdFacenet !== undefined) formData.append('threshold_facenet', String(payload.thresholdFacenet));
    if (payload.thresholdInsightface !== undefined) formData.append('threshold_insightface', String(payload.thresholdInsightface));
    if (payload.groundTruth) formData.append('ground_truth', payload.groundTruth);
    if (payload.datasetTag) formData.append('dataset_tag', payload.datasetTag);
    if (payload.referenceName) formData.append('reference_name', payload.referenceName);
    if (payload.testName) formData.append('test_name', payload.testName);

    const res = await api.post<never, ApiResponse<{ jobId: string; record: ComparisonRecord; comparison: ComparisonResult }>>(
      '/ai-comparison/run',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000,
      }
    );
    return res.data;
  },

  /**
   * Lấy lịch sử so sánh có phân trang
   */
  getHistory: async (params: GetHistoryParams = {}): Promise<{ items: ComparisonRecord[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }> => {
    const res = await api.get<never, ApiResponse<{ items: ComparisonRecord[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>>(
      '/ai-comparison/history',
      { params }
    );
    return res.data;
  },

  /**
   * Lấy báo cáo thống kê tổng hợp (Accuracy, FMR, FNMR, EER, Latency, ROC curve)
   */
  getStats: async (params: GetStatsParams = {}): Promise<ComparisonStats> => {
    const res = await api.get<never, ApiResponse<ComparisonStats>>('/ai-comparison/stats', { params });
    return res.data;
  },

  /**
   * Lấy danh mục ảnh mẫu và hồ sơ khách hàng
   */
  getSampleAlbum: async (): Promise<SampleAlbumResponse> => {
    const res = await api.get<never, ApiResponse<SampleAlbumResponse>>('/ai-comparison/sample-album');
    return res.data;
  },

  /**
 * Chạy benchmark hàng loạt trên tập ảnh chuẩn
 */
  runBatchBenchmark: async (): Promise<unknown[]> => {
    const res = await api.post<never, ApiResponse<unknown[]>>(
      '/ai-comparison/benchmark',
      {},
      {
        timeout: 120000, // 120 giây dành riêng cho Benchmark
      }
    );

    return res.data;
  },

  /**
   * Tải file báo cáo xuất khẩu (CSV hoặc JSON)
   */
  downloadExport: async (format: 'json' | 'csv', params: GetStatsParams = {}): Promise<void> => {
    const response = await api.get('/ai-comparison/export', {
      params: { ...params, format },
      responseType: 'blob',
    });
    const blob = new Blob([response.data as unknown as BlobPart], {
      type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ai_model_comparison_${new Date().toISOString().slice(0, 10)}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
