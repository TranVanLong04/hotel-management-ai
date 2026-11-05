export interface ModelResult {
  model_name: string;
  model_version: string;
  checkpoint: string;
  similarity: number;
  threshold: number;
  is_match: boolean;
  inference_time_ms: number;
  total_time_ms: number;
  face_detected: boolean;
  embedding_dim?: number;
  bbox_img1?: [number, number, number, number];
  bbox_img2?: [number, number, number, number];
  confidence_img1?: number;
  confidence_img2?: number;
}

export interface ComparisonAnalysis {
  is_agreement: boolean;
  discrepancy_type: 'facenet_only_match' | 'insightface_only_match' | null;
  delta_similarity: number;
  latency_difference_ms: number;
  overall_elapsed_ms: number;
}

export interface ComparisonResult {
  facenet: ModelResult;
  insightface: ModelResult;
  analysis: ComparisonAnalysis;
}

export interface ComparisonRecord {
  id: string;
  job_id: string;
  dataset_tag: string;
  ground_truth: 'genuine' | 'impostor' | 'unknown';
  reference_image_url?: string;
  test_image_url?: string;
  reference_name: string;
  test_name: string;

  facenet_model: string;
  facenet_checkpoint: string;
  facenet_similarity: number;
  facenet_threshold: number;
  facenet_is_match: boolean;
  facenet_inference_time_ms: number;
  facenet_total_time_ms: number;

  insightface_model: string;
  insightface_checkpoint: string;
  insightface_similarity: number;
  insightface_threshold: number;
  insightface_is_match: boolean;
  insightface_inference_time_ms: number;
  insightface_total_time_ms: number;

  is_agreement: boolean;
  discrepancy_type: string | null;
  delta_similarity: number;
  latency_difference_ms: number;

  metadata?: {
    facenet_bbox_img1?: number[];
    facenet_bbox_img2?: number[];
    insightface_bbox_img1?: number[];
    insightface_bbox_img2?: number[];
    confidence_img1?: number;
    confidence_img2?: number;
    overall_elapsed_ms?: number;
  };
  created_at: string;
}

export interface RocCurvePoint {
  threshold: number;
  facenet_fpr: number;
  facenet_tpr: number;
  insightface_fpr: number;
  insightface_tpr: number;
}

export interface SimilarityBin {
  range: string;
  facenet: number;
  insightface: number;
}

export interface ModelStats {
  name: string;
  accuracy: number | null;
  fmr: number | null;
  fnmr: number | null;
  eer: number | null;
  avgInferenceTimeMs: number;
  p95InferenceTimeMs: number;
  avgTotalTimeMs: number;
}

export interface ComparisonStats {
  overview: {
    totalRuns: number;
    totalFacesTested: number;
    labeledPairsCount: number;
    genuineCount: number;
    impostorCount: number;
    unlabeledCount: number;
    agreementCount: number;
    discrepancyCount: number;
  };
  facenet: ModelStats;
  insightface: ModelStats;
  rocCurve: RocCurvePoint[];
  similarityDistribution: SimilarityBin[];
  discrepancyList: ComparisonRecord[];
}

export interface SampleAlbumPair {
  id: string;
  category: string;
  title: string;
  description: string;
  subjectName: string;
  image1: { label: string; url: string };
  image2: { label: string; url: string };
  groundTruth: 'genuine' | 'impostor';
  difficulty: string;
}

export interface SampleAlbumResponse {
  curatedPairs: SampleAlbumPair[];
  customerProfiles: SampleAlbumPair[];
}
