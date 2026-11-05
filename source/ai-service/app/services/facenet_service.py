import os
import time
from typing import Dict, Any, Tuple, Optional
import cv2
import numpy as np
import onnxruntime as ort
from fastapi import HTTPException

from app.core.logger import logger

FACENET_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "weights",
    "facenet.onnx",
)

_facenet_session: Optional[ort.InferenceSession] = None


def get_facenet_session() -> ort.InferenceSession:
    """Singleton getter để nạp mô hình FaceNet ONNX."""
    global _facenet_session
    if _facenet_session is None:
        if not os.path.exists(FACENET_MODEL_PATH):
            logger.error(f"Không tìm thấy file trọng số FaceNet tại: {FACENET_MODEL_PATH}")
            raise HTTPException(
                status_code=500,
                detail={
                    "code": "MODEL_NOT_FOUND",
                    "message": f"Không tìm thấy file trọng số FaceNet ONNX tại weights/facenet.onnx",
                },
            )

        logger.info(f"Đang khởi tạo phiên suy luận FaceNet ONNX từ {FACENET_MODEL_PATH}...")
        try:
            sess_options = ort.SessionOptions()
            sess_options.intra_op_num_threads = 2
            sess_options.inter_op_num_threads = 1
            _facenet_session = ort.InferenceSession(
                FACENET_MODEL_PATH,
                sess_options=sess_options,
                providers=["CPUExecutionProvider"],
            )
            logger.info("FaceNet ONNX model đã sẵn sàng.")
        except Exception as e:
            logger.error(f"Lỗi khi khởi tạo InferenceSession FaceNet: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail={
                    "code": "MODEL_INIT_ERROR",
                    "message": "Không thể khởi tạo phiên suy luận FaceNet ONNX",
                },
            )
    return _facenet_session


def get_facenet_input_spec() -> Tuple[int, int, str]:
    """
    Xác định kích thước (chiều cao H, chiều rộng W) và bố cục layout (NHWC hoặc NCHW)
    yêu cầu bởi mô hình FaceNet ONNX.
    Hỗ trợ linh hoạt cả các checkpoint Inception-ResNet-v1 (160x160 NHWC)
    hoặc NCHW nếu có.
    """
    session = get_facenet_session()
    inputs = session.get_inputs()
    if not inputs:
        return (160, 160, "NHWC")

    shape = inputs[0].shape
    # NHWC layout: [batch, height, width, channels] (ví dụ: ['unk', 160, 160, 3])
    if len(shape) == 4 and shape[-1] in (1, 3):
        h = shape[1] if isinstance(shape[1], int) and shape[1] > 0 else 160
        w = shape[2] if isinstance(shape[2], int) and shape[2] > 0 else 160
        return (h, w, "NHWC")

    # NCHW layout: [batch, channels, height, width] (ví dụ: [1, 3, 160, 160])
    if len(shape) == 4 and shape[1] in (1, 3):
        h = shape[2] if isinstance(shape[2], int) and shape[2] > 0 else 160
        w = shape[3] if isinstance(shape[3], int) and shape[3] > 0 else 160
        return (h, w, "NCHW")

    return (160, 160, "NHWC")


def preprocess_face_for_facenet(img_bgr: np.ndarray, bbox: list) -> np.ndarray:
    """
    Tiền xử lý khuôn mặt cho mô hình FaceNet ONNX:
    1. Kiểm tra ảnh hợp lệ (kích thước bất kỳ từ Admin).
    2. Bounding box được kẹp biên an toàn trong kích thước ảnh.
    3. Thêm 15% margin theo chuẩn FaceNet.
    4. Cắt vùng mặt (nếu rỗng sẽ báo lỗi, không tự động lấy toàn bộ ảnh).
    5. Đọc kích thước đầu vào và layout từ ONNX session và resize linh hoạt.
    6. Chuyển hệ màu BGR sang RGB.
    7. Chuẩn hóa điểm ảnh [-1.0, 1.0] với công thức tiêu chuẩn (x - 127.5) / 128.0.
    8. Đóng gói tensor theo layout thực tế của mô hình (NHWC hoặc NCHW) kiểu float32.
    """
    if img_bgr is None or img_bgr.size == 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_IMAGE", "message": "Dữ liệu ảnh rỗng hoặc không hợp lệ"},
        )

    img_h, img_w = img_bgr.shape[:2]
    if img_h < 10 or img_w < 10:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_IMAGE", "message": "Kích thước ảnh quá nhỏ để xử lý"},
        )

    if not bbox or len(bbox) < 4:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_BBOX", "message": "Tọa độ bounding box khuôn mặt không hợp lệ"},
        )

    x1, y1, x2, y2 = [float(c) for c in bbox[:4]]

    # Kẹp biên an toàn trong ảnh
    x1_clamped = max(0, min(int(round(x1)), img_w - 1))
    y1_clamped = max(0, min(int(round(y1)), img_h - 1))
    x2_clamped = max(0, min(int(round(x2)), img_w))
    y2_clamped = max(0, min(int(round(y2)), img_h))

    w = x2_clamped - x1_clamped
    h = y2_clamped - y1_clamped

    if w <= 0 or h <= 0:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_BBOX",
                "message": "Vùng khuôn mặt phát hiện có kích thước không hợp lệ",
            },
        )

    # Thêm 15% margin xung quanh khuôn mặt
    margin_x = int(w * 0.15)
    margin_y = int(h * 0.15)

    x1_m = max(0, x1_clamped - margin_x)
    y1_m = max(0, y1_clamped - margin_y)
    x2_m = min(img_w, x2_clamped + margin_x)
    y2_m = min(img_h, y2_clamped + margin_y)

    face_crop = img_bgr[y1_m:y2_m, x1_m:x2_m]

    # Kiểm tra vùng crop
    if face_crop.size == 0 or face_crop.shape[0] < 5 or face_crop.shape[1] < 5:
        face_crop = img_bgr[y1_clamped:y2_clamped, x1_clamped:x2_clamped]

    if face_crop.size == 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "FACE_CROP_EMPTY", "message": "Không thể cắt vùng khuôn mặt hợp lệ"},
        )

    # Đọc thông số spec (H, W, Layout) trực tiếp từ session ONNX
    target_h, target_w, layout = get_facenet_input_spec()

    # Resize linh hoạt về kích thước mô hình yêu cầu (chuẩn 160x160)
    face_resized = cv2.resize(face_crop, (target_w, target_h), interpolation=cv2.INTER_LINEAR)

    # Chuyển BGR sang RGB
    face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB).astype(np.float32)

    # Chuẩn hóa giá trị pixel [-1.0, 1.0] theo chuẩn FaceNet
    face_normalized = (face_rgb - 127.5) / 128.0

    # Chuyển tensor theo layout yêu cầu của mô hình
    if layout == "NCHW":
        face_tensor = np.transpose(face_normalized, (2, 0, 1))[np.newaxis, ...].astype(np.float32)
    else:
        # NHWC layout: [1, H, W, 3]
        face_tensor = np.expand_dims(face_normalized, axis=0).astype(np.float32)

    return face_tensor


def process_image_facenet(img_bgr: np.ndarray, face_info: Any) -> Dict[str, Any]:
    """
    Trích xuất vector đặc trưng khuôn mặt (Face Embedding 128D) bằng FaceNet ONNX:
    - Tiền xử lý theo input shape động đọc từ file mô hình.
    - Thực hiện suy luận trích xuất đặc trưng.
    - Kiểm tra số chiều thực tế (chuẩn FaceNet 128 chiều).
    - Chuẩn hóa L2.
    """
    if face_info is None or not hasattr(face_info, "bbox"):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "FACE_NOT_DETECTED",
                "message": "Không có thông tin khuôn mặt hợp lệ để xử lý FaceNet",
            },
        )

    t_start = time.perf_counter()

    bbox = face_info.bbox.astype(float).tolist()
    confidence = float(face_info.det_score) if hasattr(face_info, "det_score") else 1.0

    # 1. Tiền xử lý theo kích thước ONNX yêu cầu
    face_tensor = preprocess_face_for_facenet(img_bgr, bbox)

    # 2. Suy luận FaceNet
    session = get_facenet_session()
    input_name = session.get_inputs()[0].name

    t_infer_start = time.perf_counter()
    try:
        outputs = session.run(None, {input_name: face_tensor})
    except ort.OrtException as oe:
        logger.error(f"Lỗi ONNX Runtime trong FaceNet inference: {oe}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "code": "FACENET_INFERENCE_ERROR",
                "message": f"Lỗi suy luận FaceNet ONNX: {str(oe)}",
            },
        )
    except Exception as e:
        logger.error(f"Lỗi không xác định khi chạy FaceNet session: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "code": "FACENET_ERROR",
                "message": "Đã xảy ra lỗi trong quá trình suy luận FaceNet",
            },
        )

    infer_time_ms = round((time.perf_counter() - t_infer_start) * 1000, 2)

    # 3. Trích xuất embedding thực tế
    raw_out = outputs[0]
    raw_embedding = raw_out.flatten()
    embedding_dim = int(raw_embedding.size)

    # Kiểm tra số chiều embedding theo Mục 5
    if embedding_dim != 128:
        logger.warning(
            f"FaceNet ONNX output embedding dimension={embedding_dim} (khác mục tiêu 128D). "
            f"Giữ nguyên vector gốc đầy đủ, không cắt gọt hoặc padding giả lập."
        )

    # 4. Chuẩn hóa L2
    norm = np.linalg.norm(raw_embedding)
    if norm > 0:
        norm_embedding = (raw_embedding / norm).astype(np.float32)
    else:
        norm_embedding = raw_embedding.astype(np.float32)

    total_time_ms = round((time.perf_counter() - t_start) * 1000, 2)

    return {
        "embedding": norm_embedding,
        "embedding_dim": embedding_dim,
        "bbox": [round(c, 2) for c in bbox],
        "confidence": round(confidence, 4),
        "inference_time_ms": infer_time_ms,
        "total_time_ms": total_time_ms,
    }
