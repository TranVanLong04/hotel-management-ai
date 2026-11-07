import { asyncHandler } from '../../utils/asyncHandler.js';
import * as aiComparisonService from './ai-comparison.service.js';

/**
 * Controller thực thi so sánh FaceNet & InsightFace.
 */
export const runComparison = asyncHandler(async (req, res) => {
  const files = req.files || {};
  const file1 = files['image1'] ? files['image1'][0] : null;
  const file2 = files['image2'] ? files['image2'][0] : null;

  const {
    image1_url,
    image2_url,
    threshold_facenet,
    threshold_insightface,
    ground_truth,
    dataset_tag,
    reference_name,
    test_name,
  } = req.body;

  const result = await aiComparisonService.runComparison({
    file1,
    file2,
    image1Url: image1_url,
    image2Url: image2_url,
    thresholdFacenet: threshold_facenet ? Number(threshold_facenet) : 0.75,
    thresholdInsightface: threshold_insightface ? Number(threshold_insightface) : 0.55,
    groundTruth: ground_truth || 'unknown',
    datasetTag: dataset_tag || 'manual',
    referenceName: reference_name || 'Khuôn mặt A',
    testName: test_name || 'Khuôn mặt B',
    userId: req.user?.id,
  });

  return res.status(200).json({
    success: true,
    data: result,
    message: 'So sánh hai mô hình AI hoàn tất thành công',
  });
});

/**
 * Controller lấy lịch sử so sánh.
 */
export const getHistory = asyncHandler(async (req, res) => {
  const {
    page,
    page_size,
    date_from,
    date_to,
    dataset_tag,
    ground_truth,
    is_agreement,
  } = req.query;

  const result = await aiComparisonService.getHistory({
    page,
    pageSize: page_size,
    dateFrom: date_from,
    dateTo: date_to,
    datasetTag: dataset_tag,
    groundTruth: ground_truth,
    isAgreement: is_agreement,
  });

  return res.status(200).json({
    success: true,
    data: result,
    message: 'Lấy lịch sử so sánh mô hình thành công',
  });
});

/**
 * Controller lấy báo cáo thống kê tổng hợp và ma trận chỉ số.
 */
export const getStats = asyncHandler(async (req, res) => {
  const { date_from, date_to, dataset_tag, threshold_facenet, threshold_insightface } = req.query;

  const stats = await aiComparisonService.getStats({
    dateFrom: date_from,
    dateTo: date_to,
    datasetTag: dataset_tag,
    thresholdFacenet: threshold_facenet ? Number(threshold_facenet) : 0.75,
    thresholdInsightface: threshold_insightface ? Number(threshold_insightface) : 0.55,
  });

  return res.status(200).json({
    success: true,
    data: stats,
    message: 'Lấy thống kê đánh giá mô hình thành công',
  });
});

/**
 * Controller lấy danh sách album mẫu và hồ sơ tham chiếu.
 */
export const getSampleAlbum = asyncHandler(async (req, res) => {
  const album = await aiComparisonService.getSampleAlbum();
  return res.status(200).json({
    success: true,
    data: album,
    message: 'Lấy danh sách album mẫu thử nghiệm thành công',
  });
});

/**
 * Controller chạy benchmark hàng loạt trên bộ ảnh mẫu.
 */
export const runBatchBenchmark = asyncHandler(async (req, res) => {
  const results = await aiComparisonService.runBatchBenchmark(req.user?.id);
  return res.status(200).json({
    success: true,
    data: results,
    message: 'Đã hoàn thành lượt chạy benchmark hàng loạt trên tập ảnh chuẩn',
  });
});

/**
 * Controller xuất dữ liệu kiểm thử (CSV / JSON).
 */
export const exportData = asyncHandler(async (req, res) => {
  const { format, date_from, date_to, dataset_tag } = req.query;

  const fileData = await aiComparisonService.exportData({
    format,
    dateFrom: date_from,
    dateTo: date_to,
    datasetTag: dataset_tag,
  });

  res.setHeader('Content-Type', fileData.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
  return res.send(fileData.content);
});
