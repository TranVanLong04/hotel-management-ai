import {
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  Layers,
  Cpu,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';
import type { ComparisonResult } from '@/types';

interface ModelResultsPanelProps {
  result: ComparisonResult;
  groundTruth?: 'genuine' | 'impostor' | 'unknown';
}

export function ModelResultsPanel({ result, groundTruth }: ModelResultsPanelProps) {
  const { facenet, insightface, analysis } = result;

  const renderSingleModel = (
    model: typeof facenet,
    brandColor: 'blue' | 'purple',
    title: string
  ) => {
    const isMatch = model.is_match;
    const percentage = Math.min(100, Math.max(0, Math.round(model.similarity * 100)));
    const thresholdPercentage = Math.round(model.threshold * 100);

    const isBlue = brandColor === 'blue';
    const borderAccent = isBlue
      ? 'border-blue-500/30 hover:border-blue-500/60'
      : 'border-purple-500/30 hover:border-purple-500/60';
    const badgeColor = isBlue
      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
      : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';

    return (
      <div
        className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all dark:bg-gray-900 ${borderAccent}`}
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}>
                  <Cpu className="h-3.5 w-3.5" />
                  {title}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {model.model_version}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                {model.model_name}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-mono">
                Checkpoint: {model.checkpoint}
              </p>
            </div>

            {/* Match Status Badge */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${isMatch
                  ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 ring-1 ring-rose-600/20 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
            >
              {isMatch ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  MATCH (Khớp)
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  NON-MATCH (Không khớp)
                </>
              )}
            </div>
          </div>

          {/* Similarity Score Visual Meter */}
          <div className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Cosine Similarity
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-extrabold text-gray-900 dark:text-white">
                  {(model.similarity).toFixed(4)}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  ({percentage}%)
                </span>
              </div>
            </div>

            {/* Progress Bar with Threshold Marker */}
            <div className="relative mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isMatch
                    ? isBlue
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                      : 'bg-gradient-to-r from-purple-500 to-emerald-500'
                    : 'bg-gradient-to-r from-gray-400 to-rose-500'
                  }`}
                style={{ width: `${percentage}%` }}
              />
              {/* Threshold pointer marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-black dark:bg-white shadow"
                style={{ left: `${thresholdPercentage}%` }}
                title={`Ngưỡng quyết định: ${model.threshold}`}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span>0.00 (Khác biệt)</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Ngưỡng: {(model.threshold).toFixed(2)}
              </span>
              <span>1.00 (Trùng khớp)</span>
            </div>
          </div>

          {/* Performance & Latency Metrics */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/60">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>Inference time</span>
              </div>
              <p className="mt-1 font-mono text-lg font-bold text-gray-900 dark:text-white">
                {model.inference_time_ms}{' '}
                <span className="text-xs font-normal text-gray-500">ms</span>
              </p>
              <p className="text-[10px] text-gray-400">Thời gian chạy mạng nơ-ron</p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900/60">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span>Total pipeline time</span>
              </div>
              <p className="mt-1 font-mono text-lg font-bold text-gray-900 dark:text-white">
                {model.total_time_ms}{' '}
                <span className="text-xs font-normal text-gray-500">ms</span>
              </p>
              <p className="text-[10px] text-gray-400">Bao gồm cắt mặt & chuẩn hóa</p>
            </div>
          </div>
        </div>

        {/* Footer: Detection details & Embedding Dimension */}
        <div className="mt-4 border-t border-gray-100 pt-3 text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-gray-400" />
              Độ tin cậy khuôn mặt:
            </span>
            <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
              {model.confidence_img1 ? `${Math.round(model.confidence_img1 * 100)}%` : '100%'} /{' '}
              {model.confidence_img2 ? `${Math.round(model.confidence_img2 * 100)}%` : '100%'}
            </span>
          </div>
          {model.embedding_dim && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-gray-400" />
                Kích thước vector đặc trưng:
              </span>
              <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                {model.embedding_dim} chiều (D)
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isAgreement = analysis.is_agreement;

  return (
    <div className="space-y-6">
      {/* Side by side Model Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {renderSingleModel(facenet, 'blue', 'FaceNet Model')}
        {renderSingleModel(insightface, 'purple', 'InsightFace Model')}
      </div>

      {/* Comparison Delta & Technical Evaluation Box */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 p-6 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900/80 dark:to-gray-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${isAgreement
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
                  : 'bg-gradient-to-br from-amber-500 to-orange-700'
                }`}
            >
              {isAgreement ? (
                <Check className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  {isAgreement
                    ? 'Đồng thuận nhận định (Model Agreement)'
                    : 'Sai lệch nhận định (Model Discrepancy)'}
                </h4>
                {groundTruth && groundTruth !== 'unknown' && (
                  <span className="rounded bg-gray-200 px-2 py-0.5 text-[11px] font-semibold uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    Ground truth: {groundTruth}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {isAgreement
                  ? `Cả hai mô hình đều đưa ra cùng phán quyết: ${facenet.is_match ? 'CÙNG KHUÔN MẶT (MATCH)' : 'KHÁC KHUÔN MẶT (NON-MATCH)'
                  }.`
                  : `FaceNet kết luận ${facenet.is_match ? 'MATCH' : 'NON-MATCH'
                  }, trong khi InsightFace kết luận ${insightface.is_match ? 'MATCH' : 'NON-MATCH'
                  }.`}
              </p>
            </div>
          </div>

          {/* Quick Delta Stats */}
          <div className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white/80 p-3 shadow-xs dark:border-gray-700 dark:bg-gray-800/80">
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Δ Similarity
              </span>
              <span className="font-mono text-base font-bold text-gray-900 dark:text-white">
                {analysis.delta_similarity.toFixed(4)}
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Δ Pipeline Time
              </span>
              <span className="font-mono text-base font-bold text-gray-900 dark:text-white">
                {Math.abs(analysis.latency_difference_ms).toFixed(1)} ms
              </span>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Tổng thời gian xử lý
              </span>
              <span className="font-mono text-base font-bold text-primary-600 dark:text-primary-400">
                {analysis.overall_elapsed_ms} ms
              </span>
            </div>
          </div>
        </div>

        {/* Explainability footnote */}
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50/60 p-3 text-xs text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="leading-relaxed">
            <strong>Ghi chú kỹ thuật:</strong> FaceNet (Inception-ResNet-v1) sử dụng hàm mất mát Triplet Loss
            và kích thước chuẩn hóa 160×160; trong khi InsightFace (ArcFace ResNet-50) sử dụng Additive Angular
            Margin Loss trên không gian siêu cầu với căn chỉnh điểm mốc 112×112. Hai không gian embedding này
            hoàn toàn độc lập và không thể gộp vector (No AND Fusion / No vector mixing).
          </p>
        </div>
      </div>
    </div>
  );
}
