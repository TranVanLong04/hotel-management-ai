import crypto from 'crypto';
import axios from 'axios';
import * as aiService from '../../services/ai.service.js';
import * as aiCompRepo from './ai-comparison.repository.js';
import { SAMPLE_ALBUM_PAIRS } from './sample-album.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { BadRequestError } from '../../utils/errors.js';

/**
 * Tải buffer ảnh từ URL nếu được truyền vào.
 */
const fetchImageBufferFromUrl = async (url) => {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    return Buffer.from(res.data);
  } catch (err) {
    logger.error({ err: err.message, url }, 'Không thể tải ảnh từ URL');
    throw new BadRequestError(`Không thể tải ảnh từ đường dẫn: ${url}`, 'INVALID_IMAGE');
  }
};

/**
 * Chạy so sánh FaceNet và InsightFace cho một cặp ảnh.
 */
export const runComparison = async ({
  file1,
  file2,
  image1Url,
  image2Url,
  thresholdFacenet = 0.75,
  thresholdInsightface = 0.55,
  groundTruth = 'unknown', // 'genuine' | 'impostor' | 'unknown'
  datasetTag = 'manual',
  referenceName = 'Khuôn mặt A',
  testName = 'Khuôn mặt B',
  userId = null,
}) => {
  // 1. Chuẩn bị Buffer cho cả 2 ảnh
  let buf1 = file1?.buffer;
  let buf2 = file2?.buffer;

  if (!buf1 && image1Url) {
    buf1 = await fetchImageBufferFromUrl(image1Url);
  }
  if (!buf2 && image2Url) {
    buf2 = await fetchImageBufferFromUrl(image2Url);
  }

  if (!buf1 || !buf2) {
    throw new BadRequestError(
      'Cần cung cấp đủ 2 ảnh (upload file hoặc URL) để tiến hành so sánh',
      'VALIDATION_ERROR'
    );
  }

  const jobId = `job_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  // 2. Điều phối gọi AI Service
  const comparisonResult = await aiService.compareModels(buf1, buf2, {
    thresholdFacenet,
    thresholdInsightface,
    filename1: file1?.originalname || 'face1.jpg',
    filename2: file2?.originalname || 'face2.jpg',
  });

  const { facenet, insightface, analysis } = comparisonResult;

  // 3. Chuẩn bị bản ghi lưu trữ
  const record = {
    job_id: jobId,
    dataset_tag: datasetTag,
    ground_truth: groundTruth,
    reference_image_url: image1Url || (file1 ? `upload://${file1.originalname}` : null),
    test_image_url: image2Url || (file2 ? `upload://${file2.originalname}` : null),
    reference_name: referenceName,
    test_name: testName,

    facenet_model: facenet.model_name,
    facenet_checkpoint: facenet.checkpoint,
    facenet_similarity: facenet.similarity,
    facenet_threshold: facenet.threshold,
    facenet_is_match: facenet.is_match,
    facenet_inference_time_ms: facenet.inference_time_ms,
    facenet_total_time_ms: facenet.total_time_ms,

    insightface_model: insightface.model_name,
    insightface_checkpoint: insightface.checkpoint,
    insightface_similarity: insightface.similarity,
    insightface_threshold: insightface.threshold,
    insightface_is_match: insightface.is_match,
    insightface_inference_time_ms: insightface.inference_time_ms,
    insightface_total_time_ms: insightface.total_time_ms,

    is_agreement: analysis.is_agreement,
    discrepancy_type: analysis.discrepancy_type,
    delta_similarity: analysis.delta_similarity,
    latency_difference_ms: analysis.latency_difference_ms,

    metadata: {
      facenet_bbox_img1: facenet.bbox_img1,
      facenet_bbox_img2: facenet.bbox_img2,
      insightface_bbox_img1: insightface.bbox_img1,
      insightface_bbox_img2: insightface.bbox_img2,
      confidence_img1: insightface.confidence_img1,
      confidence_img2: insightface.confidence_img2,
      overall_elapsed_ms: analysis.overall_elapsed_ms,
    },
    created_by: userId,
  };

  // 4. Lưu vào cơ sở dữ liệu / persistent store
  const savedRecord = await aiCompRepo.createRecord(record);

  logger.info(
    {
      jobId,
      facenet_sim: facenet.similarity,
      insightface_sim: insightface.similarity,
      agreement: analysis.is_agreement,
    },
    'AI Model Comparison completed and persisted'
  );

  return {
    jobId,
    record: savedRecord,
    comparison: comparisonResult,
  };
};

/**
 * Lấy lịch sử các lượt kiểm thử có phân trang và bộ lọc.
 */
export const getHistory = async ({
  page = 1,
  pageSize = 15,
  dateFrom,
  dateTo,
  datasetTag,
  groundTruth,
  isAgreement,
}) => {
  const limit = Math.max(1, Math.min(100, Number(pageSize)));
  const offset = (Math.max(1, Number(page)) - 1) * limit;

  let agreementBool = undefined;
  if (isAgreement === 'true' || isAgreement === true) agreementBool = true;
  if (isAgreement === 'false' || isAgreement === false) agreementBool = false;

  const { items, total } = await aiCompRepo.findRecords({
    limit,
    offset,
    dateFrom,
    dateTo,
    datasetTag,
    groundTruth,
    isAgreement: agreementBool,
  });

  return {
    items,
    pagination: {
      total,
      page: Number(page),
      pageSize: limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Tính toán các chỉ số thống kê thực tế (Accuracy, FMR, FNMR, EER, Latency, ROC curve).
 * CHỈ tính toán độ chính xác khi có nhãn Ground Truth (genuine / impostor) thực tế, tuyệt đối không hardcode.
 */
export const getStats = async ({
  dateFrom,
  dateTo,
  datasetTag,
  thresholdFacenet = 0.75,
  thresholdInsightface = 0.55,
} = {}) => {
  const records = await aiCompRepo.getAllRecordsForStats({ dateFrom, dateTo, datasetTag });

  const totalRuns = records.length;
  const totalFacesTested = totalRuns * 2;

  const fnThreshold = Number(thresholdFacenet) || 0.75;
  const insThreshold = Number(thresholdInsightface) || 0.55;

  // Lọc tập dữ liệu có Ground Truth
  const genuineRecords = records.filter((r) => r.ground_truth === 'genuine');
  const impostorRecords = records.filter((r) => r.ground_truth === 'impostor');
  const labeledCount = genuineRecords.length + impostorRecords.length;

  // 1. Phân tích FaceNet theo ngưỡng fnThreshold
  let facenetTP = 0; // Genuine & is_match == true
  let facenetFN = 0; // Genuine & is_match == false (False Non-Match)
  let facenetFP = 0; // Impostor & is_match == true (False Match)
  let facenetTN = 0; // Impostor & is_match == false

  for (const r of genuineRecords) {
    if (Number(r.facenet_similarity) >= fnThreshold) facenetTP++;
    else facenetFN++;
  }
  for (const r of impostorRecords) {
    if (Number(r.facenet_similarity) >= fnThreshold) facenetFP++;
    else facenetTN++;
  }

  // 2. Phân tích InsightFace theo ngưỡng insThreshold
  let insightTP = 0;
  let insightFN = 0;
  let insightFP = 0;
  let insightTN = 0;

  for (const r of genuineRecords) {
    if (Number(r.insightface_similarity) >= insThreshold) insightTP++;
    else insightFN++;
  }
  for (const r of impostorRecords) {
    if (Number(r.insightface_similarity) >= insThreshold) insightFP++;
    else insightTN++;
  }

  // Độ chính xác (Accuracy = (TP + TN) / Total Labeled)
  const facenetAccuracy = labeledCount > 0 ? Number(((facenetTP + facenetTN) / labeledCount).toFixed(4)) : null;
  const insightAccuracy = labeledCount > 0 ? Number(((insightTP + insightTN) / labeledCount).toFixed(4)) : null;

  // FMR (False Match Rate = FP / Total Impostors)
  const facenetFMR = impostorRecords.length > 0 ? Number((facenetFP / impostorRecords.length).toFixed(4)) : null;
  const insightFMR = impostorRecords.length > 0 ? Number((insightFP / impostorRecords.length).toFixed(4)) : null;

  // FNMR (False Non-Match Rate = FN / Total Genuines)
  const facenetFNMR = genuineRecords.length > 0 ? Number((facenetFN / genuineRecords.length).toFixed(4)) : null;
  const insightFNMR = genuineRecords.length > 0 ? Number((insightFN / genuineRecords.length).toFixed(4)) : null;

  // 3. Tính toán độ trễ (Latency: Mean & P95)
  const facenetInferTimes = records.map((r) => Number(r.facenet_inference_time_ms) || 0).sort((a, b) => a - b);
  const insightInferTimes = records.map((r) => Number(r.insightface_inference_time_ms) || 0).sort((a, b) => a - b);
  const facenetTotalTimes = records.map((r) => Number(r.facenet_total_time_ms) || 0).sort((a, b) => a - b);
  const insightTotalTimes = records.map((r) => Number(r.insightface_total_time_ms) || 0).sort((a, b) => a - b);

  const calcMean = (arr) => (arr.length ? Number((arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(2)) : 0);
  const calcP95 = (arr) => {
    if (!arr.length) return 0;
    const idx = Math.min(arr.length - 1, Math.floor(arr.length * 0.95));
    return Number(arr[idx].toFixed(2));
  };

  const facenetAvgInfer = calcMean(facenetInferTimes);
  const facenetP95Infer = calcP95(facenetInferTimes);
  const insightAvgInfer = calcMean(insightInferTimes);
  const insightP95Infer = calcP95(insightInferTimes);

  const facenetAvgTotal = calcMean(facenetTotalTimes);
  const insightAvgTotal = calcMean(insightTotalTimes);

  // 4. Tính toán đường cong ROC và EER (Equal Error Rate) khi có đủ nhãn
  const rocCurvePoints = [];
  let facenetEER = null;
  let insightEER = null;

  if (genuineRecords.length > 0 && impostorRecords.length > 0) {
    let minFacenetDiff = 999;
    let minInsightDiff = 999;

    // Quét threshold từ 0.00 đến 1.00 với bước nhảy 0.02
    for (let t = 0.0; t <= 1.001; t += 0.02) {
      const currentThreshold = Number(t.toFixed(2));

      // FaceNet FPR và TPR tại threshold t
      const fnFpAtT = impostorRecords.filter((r) => Number(r.facenet_similarity) >= currentThreshold).length;
      const fnTpAtT = genuineRecords.filter((r) => Number(r.facenet_similarity) >= currentThreshold).length;
      const fnFpr = Number((fnFpAtT / impostorRecords.length).toFixed(4));
      const fnTpr = Number((fnTpAtT / genuineRecords.length).toFixed(4));
      const fnFnr = Number((1 - fnTpr).toFixed(4));

      // InsightFace FPR và TPR tại threshold t
      const insFpAtT = impostorRecords.filter((r) => Number(r.insightface_similarity) >= currentThreshold).length;
      const insTpAtT = genuineRecords.filter((r) => Number(r.insightface_similarity) >= currentThreshold).length;
      const insFpr = Number((insFpAtT / impostorRecords.length).toFixed(4));
      const insTpr = Number((insTpAtT / genuineRecords.length).toFixed(4));
      const insFnr = Number((1 - insTpr).toFixed(4));

      rocCurvePoints.push({
        threshold: currentThreshold,
        facenet_fpr: fnFpr,
        facenet_tpr: fnTpr,
        insightface_fpr: insFpr,
        insightface_tpr: insTpr,
      });

      // Tìm điểm giao nhau EER nơi FPR ≈ FNR
      const fnDiff = Math.abs(fnFpr - fnFnr);
      if (fnDiff < minFacenetDiff) {
        minFacenetDiff = fnDiff;
        facenetEER = Number(((fnFpr + fnFnr) / 2).toFixed(4));
      }

      const insDiff = Math.abs(insFpr - insFnr);
      if (insDiff < minInsightDiff) {
        minInsightDiff = insDiff;
        insightEER = Number(((insFpr + insFnr) / 2).toFixed(4));
      }
    }
  }

  // 5. Đánh giá sự đồng thuận và danh sách sai lệch theo đúng 2 ngưỡng vận hành
  let agreementCount = 0;
  const discrepancyList = [];

  for (const r of records) {
    const fnMatch = Number(r.facenet_similarity) >= fnThreshold;
    const insMatch = Number(r.insightface_similarity) >= insThreshold;

    if (fnMatch === insMatch) {
      agreementCount++;
    } else {
      if (discrepancyList.length < 50) {
        discrepancyList.push({
          id: r.id,
          job_id: r.job_id,
          ground_truth: r.ground_truth,
          reference_name: r.reference_name,
          test_name: r.test_name,
          reference_image_url: r.reference_image_url,
          test_image_url: r.test_image_url,
          facenet_similarity: Number(r.facenet_similarity),
          facenet_is_match: fnMatch,
          facenet_threshold: fnThreshold,
          insightface_similarity: Number(r.insightface_similarity),
          insightface_is_match: insMatch,
          insightface_threshold: insThreshold,
          discrepancy_type: fnMatch ? 'facenet_only_match' : 'insightface_only_match',
          delta_similarity: Number(Math.abs(Number(r.facenet_similarity) - Number(r.insightface_similarity)).toFixed(4)),
          created_at: r.created_at,
        });
      }
    }
  }

  const discrepancyCount = totalRuns - agreementCount;

  // Phân bố tương đồng (Histogram bins)
  const similarityBins = [
    { range: '0.0 - 0.2', facenet: 0, insightface: 0 },
    { range: '0.2 - 0.4', facenet: 0, insightface: 0 },
    { range: '0.4 - 0.6', facenet: 0, insightface: 0 },
    { range: '0.6 - 0.7', facenet: 0, insightface: 0 },
    { range: '0.7 - 0.8', facenet: 0, insightface: 0 },
    { range: '0.8 - 0.9', facenet: 0, insightface: 0 },
    { range: '0.9 - 1.0', facenet: 0, insightface: 0 },
  ];

  for (const r of records) {
    const fnSim = Number(r.facenet_similarity) || 0;
    const insSim = Number(r.insightface_similarity) || 0;

    const assignBin = (val, key) => {
      if (val < 0.2) similarityBins[0][key]++;
      else if (val < 0.4) similarityBins[1][key]++;
      else if (val < 0.6) similarityBins[2][key]++;
      else if (val < 0.7) similarityBins[3][key]++;
      else if (val < 0.8) similarityBins[4][key]++;
      else if (val < 0.9) similarityBins[5][key]++;
      else similarityBins[6][key]++;
    };

    assignBin(fnSim, 'facenet');
    assignBin(insSim, 'insightface');
  }

  return {
    overview: {
      totalRuns,
      totalFacesTested,
      labeledPairsCount: labeledCount,
      genuineCount: genuineRecords.length,
      impostorCount: impostorRecords.length,
      unlabeledCount: totalRuns - labeledCount,
      agreementCount,
      discrepancyCount,
    },
    facenet: {
      name: 'FaceNet (Inception-ResNet-v1)',
      threshold: fnThreshold,
      accuracy: facenetAccuracy,
      fmr: facenetFMR,
      fnmr: facenetFNMR,
      eer: facenetEER,
      avgInferenceTimeMs: facenetAvgInfer,
      p95InferenceTimeMs: facenetP95Infer,
      avgTotalTimeMs: facenetAvgTotal,
    },
    insightface: {
      name: 'InsightFace (ArcFace buffalo_l)',
      threshold: insThreshold,
      accuracy: insightAccuracy,
      fmr: insightFMR,
      fnmr: insightFNMR,
      eer: insightEER,
      avgInferenceTimeMs: insightAvgInfer,
      p95InferenceTimeMs: insightP95Infer,
      avgTotalTimeMs: insightAvgTotal,
    },
    rocCurve: rocCurvePoints,
    similarityDistribution: similarityBins,
    discrepancyList,
  };
};

/**
 * Lấy danh sách album ảnh mẫu thử nghiệm (kèm theo hồ sơ khách hàng đã đăng ký).
 */
export const getSampleAlbum = async () => {
  // Lấy các hồ sơ khuôn mặt khách hàng thực tế trong database nếu có
  let customerPairs = [];
  try {
    const { data: faces } = await supabaseAdmin
      .from('face_profiles')
      .select('id, customer_id, face_image_url, model_version, created_at, customers(full_name)')
      .eq('is_active', true)
      .limit(6);

    if (faces && faces.length > 0) {
      customerPairs = faces.map((f, idx) => ({
        id: `customer-profile-${f.id}`,
        category: 'customer_profile',
        title: `Hồ sơ khách hàng: ${f.customers?.full_name || 'Khách sạn'}`,
        description: `Ảnh hồ sơ đã đăng ký nhận diện AI của khách hàng trong hệ thống Grand Luxury.`,
        subjectName: f.customers?.full_name || 'Khách hàng',
        image1: {
          label: 'Ảnh hồ sơ đăng ký',
          url: f.face_image_url,
        },
        image2: {
          label: 'Ảnh đối sánh',
          url: f.face_image_url,
        },
        groundTruth: 'genuine',
        difficulty: 'production',
      }));
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Không thể lấy danh sách face_profiles từ DB');
  }

  return {
    curatedPairs: SAMPLE_ALBUM_PAIRS,
    customerProfiles: customerPairs,
  };
};

/**
 * Chạy benchmark hàng loạt trên tập dữ liệu mẫu chuẩn để tạo dữ liệu kiểm thử thực tế.
 * Xử lý tuần tự nhẹ nhàng để không gây nghẽn CPU hoặc ảnh hưởng check-in.
 */
export const runBatchBenchmark = async (userId = null) => {
  const results = [];
  for (const pair of SAMPLE_ALBUM_PAIRS) {
    try {
      const res = await runComparison({
        image1Url: pair.image1.url,
        image2Url: pair.image2.url,
        thresholdFacenet: 0.75,
        thresholdInsightface: 0.55,
        groundTruth: pair.groundTruth,
        datasetTag: 'sample_album_benchmark',
        referenceName: `${pair.subjectName} (${pair.image1.label})`,
        testName: `${pair.subjectName} (${pair.image2.label})`,
        userId,
      });
      results.push({
        id: pair.id,
        success: true,
        agreement: res.comparison.analysis.is_agreement,
        facenet_sim: res.comparison.facenet.similarity,
        insightface_sim: res.comparison.insightface.similarity,
      });
      // Tạm nghỉ 100ms giữa các lần chạy để giảm tải CPU
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      logger.error({ err: err.message, pairId: pair.id }, 'Lỗi khi benchmark cặp ảnh mẫu');
      results.push({ id: pair.id, success: false, error: err.message });
    }
  }
  return results;
};

/**
 * Xuất dữ liệu báo cáo so sánh ra định dạng CSV hoặc JSON.
 */
export const exportData = async ({ format = 'json', dateFrom, dateTo, datasetTag }) => {
  const records = await aiCompRepo.getAllRecordsForStats({ dateFrom, dateTo, datasetTag });

  if (format === 'json') {
    return {
      contentType: 'application/json',
      filename: `ai_comparison_export_${new Date().toISOString().slice(0, 10)}.json`,
      content: JSON.stringify(records, null, 2),
    };
  }

  // Định dạng CSV
  const headers = [
    'Job ID',
    'Created At',
    'Dataset Tag',
    'Ground Truth',
    'Reference Name',
    'Test Name',
    'FaceNet Model',
    'FaceNet Similarity',
    'FaceNet Threshold',
    'FaceNet Match',
    'FaceNet Inference (ms)',
    'FaceNet Total (ms)',
    'InsightFace Model',
    'InsightFace Similarity',
    'InsightFace Threshold',
    'InsightFace Match',
    'InsightFace Inference (ms)',
    'InsightFace Total (ms)',
    'Agreement',
    'Discrepancy Type',
    'Delta Similarity',
  ];

  const rows = records.map((r) => [
    `"${r.job_id || ''}"`,
    `"${r.created_at || ''}"`,
    `"${r.dataset_tag || ''}"`,
    `"${r.ground_truth || ''}"`,
    `"${r.reference_name || ''}"`,
    `"${r.test_name || ''}"`,
    `"${r.facenet_model || ''}"`,
    r.facenet_similarity,
    r.facenet_threshold,
    r.facenet_is_match ? 'YES' : 'NO',
    r.facenet_inference_time_ms,
    r.facenet_total_time_ms,
    `"${r.insightface_model || ''}"`,
    r.insightface_similarity,
    r.insightface_threshold,
    r.insightface_is_match ? 'YES' : 'NO',
    r.insightface_inference_time_ms,
    r.insightface_total_time_ms,
    r.is_agreement ? 'YES' : 'NO',
    `"${r.discrepancy_type || 'NONE'}"`,
    r.delta_similarity,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return {
    contentType: 'text/csv; charset=utf-8',
    filename: `ai_comparison_export_${new Date().toISOString().slice(0, 10)}.csv`,
    content: '\uFEFF' + csvContent, // Thêm BOM UTF-8 để mở tiếng Việt đúng trong Excel
  };
};
