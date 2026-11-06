import { useState, useRef } from 'react';
import {
  Upload,
  ArrowLeftRight,
  Trash2,
  Sliders,
  Play,
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SampleAlbumModal } from './SampleAlbumModal';
import { ModelResultsPanel } from './ModelResultsPanel';
import { aiComparisonApi } from '@/api/aiComparisonApi';
import type { ComparisonResult, SampleAlbumPair } from '@/types';

export function FaceComparisonTab() {
  // Trạng thái ảnh 1
  const [image1File, setImage1File] = useState<File | null>(null);
  const [image1Url, setImage1Url] = useState<string>('');
  const [image1Preview, setImage1Preview] = useState<string>('');
  const [refName, setRefName] = useState<string>('Khuôn mặt tham chiếu (Ảnh A)');

  // Trạng thái ảnh 2
  const [image2File, setImage2File] = useState<File | null>(null);
  const [image2Url, setImage2Url] = useState<string>('');
  const [image2Preview, setImage2Preview] = useState<string>('');
  const [testName, setTestName] = useState<string>('Khuôn mặt kiểm thử (Ảnh B)');

  // Thiết lập so sánh
  const [thresholdFacenet, setThresholdFacenet] = useState<number>(0.75);
  const [thresholdInsightface, setThresholdInsightface] = useState<number>(0.55);
  const [groundTruth, setGroundTruth] = useState<'genuine' | 'impostor' | 'unknown'>('unknown');
  const [datasetTag, setDatasetTag] = useState<string>('manual_upload');

  // Điều khiển modal & thực thi
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Xử lý khi người dùng chọn ảnh 1 từ máy tính
  const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage1File(file);
      setImage1Url('');
      const preview = URL.createObjectURL(file);
      setImage1Preview(preview);
      setRefName(file.name.replace(/\.[^/.]+$/, ''));
      setDatasetTag('manual_upload');
    }
  };

  // Xử lý khi người dùng chọn ảnh 2 từ máy tính
  const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage2File(file);
      setImage2Url('');
      const preview = URL.createObjectURL(file);
      setImage2Preview(preview);
      setTestName(file.name.replace(/\.[^/.]+$/, ''));
      setDatasetTag('manual_upload');
    }
  };

  // Hoán đổi vị trí 2 ảnh
  const handleSwapImages = () => {
    setImage1File(image2File);
    setImage2File(image1File);

    setImage1Url(image2Url);
    setImage2Url(image1Url);

    setImage1Preview(image2Preview);
    setImage2Preview(image1Preview);

    const tempName = refName;
    setRefName(testName);
    setTestName(tempName);

    toast.success('Đã đảo vị trí hai ảnh');
  };

  // Xóa toàn bộ ảnh đang chọn
  const handleClear = () => {
    setImage1File(null);
    setImage1Url('');
    setImage1Preview('');
    setRefName('Khuôn mặt tham chiếu (Ảnh A)');

    setImage2File(null);
    setImage2Url('');
    setImage2Preview('');
    setTestName('Khuôn mặt kiểm thử (Ảnh B)');

    setComparisonResult(null);
    setGroundTruth('unknown');
  };

  // Chọn cặp ảnh từ Sample Album Modal
  const handleSelectAlbumPair = (pair: SampleAlbumPair) => {
    setImage1File(null);
    setImage1Url(pair.image1.url);
    setImage1Preview(pair.image1.url);
    setRefName(`${pair.subjectName} (${pair.image1.label})`);

    setImage2File(null);
    setImage2Url(pair.image2.url);
    setImage2Preview(pair.image2.url);
    setTestName(`${pair.subjectName} (${pair.image2.label})`);

    setGroundTruth(pair.groundTruth);
    setDatasetTag('curated_album');
    setComparisonResult(null);

    toast.success(`Đã nạp cặp ảnh: ${pair.title}`);
  };

  // Chạy so sánh
  const handleRunComparison = async () => {
    if ((!image1File && !image1Url) || (!image2File && !image2Url)) {
      toast.error('Vui lòng cung cấp đầy đủ cả hai ảnh để thực hiện so sánh');
      return;
    }

    setLoading(true);
    setComparisonResult(null);

    try {
      const data = await aiComparisonApi.runComparison({
        image1File,
        image2File,
        image1Url,
        image2Url,
        thresholdFacenet,
        thresholdInsightface,
        groundTruth,
        datasetTag,
        referenceName: refName,
        testName: testName,
      });

      setComparisonResult(data.comparison);
      toast.success('Đã hoàn tất so sánh song song FaceNet và InsightFace!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg = error.response?.data?.error?.message || error.message || 'Lỗi khi so sánh hai mô hình';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const hasBothImages = (image1Preview || image1Url) && (image2Preview || image2Url);

  return (
    <div className="space-y-8">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-900">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Kiểm thử tương đồng FaceNet & InsightFace
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Tải lên hai ảnh hoặc chọn từ album có sẵn để so khớp đặc trưng trích xuất theo thời gian thực.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAlbumModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:bg-primary-700 hover:shadow-lg"
          >
            <FolderOpen className="h-4 w-4" />
            Chọn từ Album ảnh mẫu
          </button>

          {hasBothImages && (
            <>
              <button
                type="button"
                onClick={handleSwapImages}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                title="Đảo vị trí hai ảnh"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Đảo ảnh
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-danger-600 hover:bg-danger-50 dark:border-gray-700 dark:bg-gray-800 dark:text-danger-400 dark:hover:bg-danger-950/30"
                title="Xóa cả hai ảnh"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </button>
            </>
          )}
        </div>
      </div>

      {/* Input Image Slots & Settings Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Slot 1: Image 1 */}
        <div className="lg:col-span-4">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  Ảnh 1 (Tham chiếu)
                </span>
                {image1Preview && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sẵn sàng
                  </span>
                )}
              </div>

              {/* Upload Dropzone / Preview */}
              <div
                onClick={() => fileInputRef1.current?.click()}
                className={`group relative mt-3 flex h-60 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all ${image1Preview
                  ? 'border-transparent bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700'
                  : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50/20 dark:border-gray-700 dark:hover:border-primary-500'
                  }`}
              >
                {image1Preview ? (
                  <>
                    <img
                      src={image1Preview}
                      alt="Ảnh tham chiếu"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow">
                        <Upload className="h-3.5 w-3.5" /> Đổi ảnh khác
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center p-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600 dark:bg-gray-800 dark:text-gray-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Nhấn để tải ảnh từ máy tính
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">Hỗ trợ JPG, PNG (tối đa 5MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef1}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange1}
                  className="hidden"
                />
              </div>

              {/* Label input */}
              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Tên / Nhãn ảnh 1:
                </label>
                <input
                  type="text"
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                  placeholder="Nhập tên người hoặc nhãn"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Slot 2: Image 2 */}
        <div className="lg:col-span-4">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                  Ảnh 2 (Kiểm thử)
                </span>
                {image2Preview && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Sẵn sàng
                  </span>
                )}
              </div>

              {/* Upload Dropzone / Preview */}
              <div
                onClick={() => fileInputRef2.current?.click()}
                className={`group relative mt-3 flex h-60 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all ${image2Preview
                  ? 'border-transparent bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700'
                  : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50/20 dark:border-gray-700 dark:hover:border-primary-500'
                  }`}
              >
                {image2Preview ? (
                  <>
                    <img
                      src={image2Preview}
                      alt="Ảnh kiểm thử"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow">
                        <Upload className="h-3.5 w-3.5" /> Đổi ảnh khác
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center p-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600 dark:bg-gray-800 dark:text-gray-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Nhấn để tải ảnh từ máy tính
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">Hỗ trợ JPG, PNG (tối đa 5MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef2}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange2}
                  className="hidden"
                />
              </div>

              {/* Label input */}
              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Tên / Nhãn ảnh 2:
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Nhập tên người hoặc nhãn"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Slot 3: Parameters & Run Panel */}
        <div className="lg:col-span-4">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                <Sliders className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Tham số đánh giá
                </h3>
              </div>

              {/* Ground truth */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Nhãn thực tế (Ground Truth)
                  <span title="Dùng để đánh giá True Positive / False Positive">
                    <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                </label>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {[
                    { value: 'unknown', label: 'Chưa rõ' },
                    { value: 'genuine', label: 'Cùng người' },
                    { value: 'impostor', label: 'Khác người' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setGroundTruth(option.value as 'genuine' | 'impostor' | 'unknown')}
                      className={`rounded-lg py-2 text-xs font-semibold transition-colors ${groundTruth === option.value
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Threshold FaceNet */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Ngưỡng FaceNet:
                  </span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {thresholdFacenet.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.95"
                  step="0.01"
                  value={thresholdFacenet}
                  onChange={(e) => setThresholdFacenet(parseFloat(e.target.value))}
                  className="mt-2 h-2 w-full cursor-pointer accent-blue-600"
                />
                <span className="text-[10px] text-gray-400">Mặc định: 0.75</span>
              </div>

              {/* Threshold InsightFace */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Ngưỡng InsightFace:
                  </span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {thresholdInsightface.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.95"
                  step="0.01"
                  value={thresholdInsightface}
                  onChange={(e) => setThresholdInsightface(parseFloat(e.target.value))}
                  className="mt-2 h-2 w-full cursor-pointer accent-purple-600"
                />
                <span className="text-[10px] text-gray-400">Mặc định: 0.55</span>
              </div>
            </div>

            {/* Run button */}
            <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button
                type="button"
                onClick={handleRunComparison}
                disabled={loading || !hasBothImages}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all ${hasBothImages && !loading
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 shadow-primary-600/30'
                  : 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-800 dark:text-gray-600'
                  }`}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang chạy song song 2 mô hình...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>Chạy so sánh FaceNet & InsightFace</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Results Area */}
      {comparisonResult && (
        <div className="pt-2 animate-fade-in">
          <ModelResultsPanel result={comparisonResult} groundTruth={groundTruth} />
        </div>
      )}

      {/* Modal chọn ảnh từ album */}
      <SampleAlbumModal
        open={albumModalOpen}
        onClose={() => setAlbumModalOpen(false)}
        onSelectPair={handleSelectAlbumPair}
      />
    </div>
  );
}
