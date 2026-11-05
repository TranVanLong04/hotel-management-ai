import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  runComparisonSchema,
  getHistorySchema,
  getStatsSchema,
  exportSchema,
} from './ai-comparison.validation.js';
import * as aiCompController from './ai-comparison.controller.js';
import { BadRequestError } from '../../utils/errors.js';

const router = Router();

// Cấu hình Multer cho phép tải lên 2 ảnh: image1 và image2
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB mỗi ảnh
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestError('Định dạng file không hợp lệ. Chỉ chấp nhận ảnh JPEG, JPG hoặc PNG'),
        false
      );
    }
  },
});

const uploadComparisonImages = (req, res, next) => {
  const fieldsUpload = upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
  ]);

  fieldsUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('Kích thước mỗi ảnh không được vượt quá 5MB'));
        }
        return next(new BadRequestError(`Lỗi tải file ảnh: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};

/**
 * Tất cả routes AI Comparison yêu cầu xác thực Admin
 */
router.use(authenticate, requireAdmin);

// POST /api/ai-comparison/run — Chạy so sánh mô hình cho 1 cặp ảnh
router.post(
  '/run',
  uploadComparisonImages,
  validate(runComparisonSchema),
  aiCompController.runComparison
);

// GET /api/ai-comparison/history — Lấy lịch sử các lượt kiểm thử
router.get(
  '/history',
  validate(getHistorySchema),
  aiCompController.getHistory
);

// GET /api/ai-comparison/stats — Lấy báo cáo thống kê tổng hợp, EER, ROC curve, độ trễ
router.get(
  '/stats',
  validate(getStatsSchema),
  aiCompController.getStats
);

// GET /api/ai-comparison/sample-album — Lấy danh mục ảnh mẫu và hồ sơ khách hàng
router.get(
  '/sample-album',
  aiCompController.getSampleAlbum
);

// POST /api/ai-comparison/benchmark — Chạy benchmark hàng loạt trên bộ ảnh mẫu
router.post(
  '/benchmark',
  aiCompController.runBatchBenchmark
);

// GET /api/ai-comparison/export — Xuất dữ liệu kiểm thử (CSV hoặc JSON)
router.get(
  '/export',
  validate(exportSchema),
  aiCompController.exportData
);

export default router;
