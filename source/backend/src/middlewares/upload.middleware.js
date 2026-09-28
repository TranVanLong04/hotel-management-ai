import multer from 'multer';
import { BadRequestError } from '../utils/errors.js';

/**
 * Middleware upload ảnh sử dụng multer memoryStorage.
 * Tham chiếu: docs/03-backend/phase6-face-service/README.md
 */

// Lưu trữ trong memory để lấy Buffer xử lý trực tiếp
const storage = multer.memoryStorage();

// Giới hạn 5MB
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

// Chỉ chấp nhận image/jpeg, image/jpg, image/png
const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        'Định dạng file không hợp lệ. Chỉ chấp nhận ảnh định dạng JPEG, JPG hoặc PNG'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits,
  fileFilter,
});

/**
 * Middleware bắt 1 file ảnh từ field 'image'.
 * Bắt lỗi từ Multer (VD: quá dung lượng) và chuyển thành AppError phù hợp.
 */
export const uploadImage = (req, res, next) => {
  const singleUpload = upload.single('image');

  singleUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('Kích thước ảnh không được vượt quá 5MB'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new BadRequestError('Field upload ảnh phải có tên là "image"'));
        }
        return next(new BadRequestError(`Lỗi tải file: ${err.message}`));
      }
      return next(err);
    }

    next();
  });
};
