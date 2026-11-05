import { useState } from 'react';
import { ScanFace, BarChart3, BrainCircuit } from 'lucide-react';
import { FaceComparisonTab } from '../components/FaceComparisonTab';
import { AggregateStatsTab } from '../components/AggregateStatsTab';

export function AiComparisonPage() {
  const [activeTab, setActiveTab] = useState<'compare' | 'stats'>('compare');

  return (
    <div className="space-y-6">
      {/* Header trang quản trị */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600/10 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400">
              <BrainCircuit className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              So sánh mô hình AI (FaceNet & InsightFace)
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Mô-đun đối sánh hiệu năng, độ chính xác và độ trễ nhận diện sinh trắc học giữa FaceNet Inception-ResNet-v1 và InsightFace ArcFace buffalo_l.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${activeTab === 'compare'
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            <ScanFace className="h-4 w-4" />
            So sánh khuôn mặt
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${activeTab === 'stats'
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            <BarChart3 className="h-4 w-4" />
            Thống kê toàn bộ
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="min-w-0">
        {activeTab === 'compare' ? <FaceComparisonTab /> : <AggregateStatsTab />}
      </div>
    </div>
  );
}
