import { useState, useEffect } from 'react';
import { Sparkles, Users, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Modal } from '@components/ui/Modal';
import { aiComparisonApi } from '@/api/aiComparisonApi';
import type { SampleAlbumPair, SampleAlbumResponse } from '@/types';

interface SampleAlbumModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPair: (pair: SampleAlbumPair) => void;
}

export function SampleAlbumModal({ open, onClose, onSelectPair }: SampleAlbumModalProps) {
  const [activeTab, setActiveTab] = useState<'curated' | 'customer'>('curated');
  const [albumData, setAlbumData] = useState<SampleAlbumResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !albumData) {
      setLoading(true);
      setError(null);
      aiComparisonApi
        .getSampleAlbum()
        .then((data) => setAlbumData(data))
        .catch((err) => setError(err.message || 'Không thể tải danh mục album mẫu'))
        .finally(() => setLoading(false));
    }
  }, [open, albumData]);

  const pairsToDisplay = activeTab === 'curated'
    ? (albumData?.curatedPairs || [])
    : (albumData?.customerProfiles || []);

  return (
    <Modal open={open} onClose={onClose} title="Kho ảnh mẫu kiểm thử mô hình AI" size="xl">
      <div className="space-y-4">
        {/* Tab selection */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setActiveTab('curated')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'curated'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Cặp ảnh Benchmark chuẩn ({albumData?.curatedPairs?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'customer'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Hồ sơ khách hàng thực tế ({albumData?.customerProfiles?.length || 0})
          </button>
        </div>

        {/* Content body */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <span className="text-sm font-medium">Đang tải danh mục ảnh thử nghiệm...</span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-danger-50 p-4 text-sm text-danger-700 dark:bg-danger-950/40 dark:text-danger-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : pairsToDisplay.length === 0 ? (
          <div className="flex h-52 flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
            <Users className="h-10 w-10 text-gray-400 opacity-60" />
            <p className="mt-2 text-sm">Chưa có ảnh nào trong danh mục này.</p>
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {pairsToDisplay.map((pair) => {
              const isGenuine = pair.groundTruth === 'genuine';
              return (
                <div
                  key={pair.id}
                  onClick={() => {
                    onSelectPair(pair);
                    onClose();
                  }}
                  className="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-primary-500"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isGenuine
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {isGenuine ? (
                            <>
                              <ShieldCheck className="h-3 w-3" /> Genuine (Cùng người)
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3" /> Impostor (Khác người)
                            </>
                          )}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          Độ khó: {pair.difficulty}
                        </span>
                      </div>

                      <h4 className="mt-1.5 truncate text-sm font-bold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                        {pair.title}
                      </h4>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                        {pair.description}
                      </p>
                    </div>

                    {/* Right: Images preview side by side */}
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="relative">
                        <img
                          src={pair.image1.url}
                          alt={pair.image1.label}
                          className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white truncate text-center rounded-b-lg">
                          Ảnh 1
                        </span>
                      </div>

                      <ArrowRight className="h-4 w-4 text-gray-400" />

                      <div className="relative">
                        <img
                          src={pair.image2.url}
                          alt={pair.image2.label}
                          className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white truncate text-center rounded-b-lg">
                          Ảnh 2
                        </span>
                      </div>

                      <button
                        type="button"
                        className="ml-2 hidden rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 group-hover:bg-primary-600 group-hover:text-white sm:inline-flex dark:bg-primary-950/40 dark:text-primary-300 dark:group-hover:bg-primary-600 dark:group-hover:text-white"
                      >
                        Chọn cặp này
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
