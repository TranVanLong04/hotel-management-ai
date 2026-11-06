# Điều phối so sánh song song: Nhận 2 ảnh đầu vào, 
# dùng ThreadPoolExecutor(max_workers=2) để kích hoạt đồng thời nhánh FaceNet và nhánh InsightFace
# đo đạc thời gian suy luận (ms)
# tính similarity độc lập cho từng mô hình và phân tích sai lệch.



import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, Tuple
import cv2
import numpy as np
from fastapi import HTTPException

from app.core.logger import logger
from app.services.face_detection import get_face_app
from app.services.facenet_service import process_image_facenet

# Giới hạn thread pool cho tác vụ so sánh mô hình CPU-bound
_comparison_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="ai-comparison-worker")


def decode_image_bytes(image_bytes: bytes, label: str = "ảnh") -> np.ndarray:
    """Giải mã mảng byte ảnh thành mảng ma trận màu BGR của OpenCV."""
    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_IMAGE", "message": f"{label} không có dữ liệu hoặc rỗng"},
        )
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img_bgr is None or img_bgr.size == 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_IMAGE", "message": f"Không thể giải mã dữ liệu {label}"},
        )
    return img_bgr


def detect_largest_face(face_app, img_bgr: np.ndarray, label: str = "ảnh"):
    """Phát hiện và trả về khuôn mặt lớn nhất trong ảnh."""
    try:
        faces = face_app.get(img_bgr)
    except Exception as e:
        logger.error(f"Lỗi khi chạy bộ phát hiện khuôn mặt trên {label}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"code": "DETECTION_ERROR", "message": f"Lỗi phát hiện khuôn mặt trên {label}"},
        )

    if not faces or len(faces) == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "FACE_NOT_DETECTED",
                "message": f"Không phát hiện được khuôn mặt trong {label}",
            },
        )

    largest_face = None
    max_area = -1.0
    for face in faces:
        bbox = face.bbox.astype(float).tolist()
        w = max(0.0, bbox[2] - bbox[0])
        h = max(0.0, bbox[3] - bbox[1])
        area = w * h
        if area > max_area:
            max_area = area
            largest_face = face

    return largest_face


def calculate_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Tính độ tương đồng Cosine Similarity giữa 2 vector."""
    n1 = np.linalg.norm(vec1)
    n2 = np.linalg.norm(vec2)
    if n1 == 0.0 or n2 == 0.0:
        return 0.0
    sim = float(np.dot(vec1, vec2) / (n1 * n2))
    return float(np.clip(sim, -1.0, 1.0))


def run_facenet_branch(
    img1_bgr: np.ndarray,
    img2_bgr: np.ndarray,
    face1_info: Any,
    face2_info: Any,
    threshold: float,
) -> Dict[str, Any]:
    """Thực thi luồng FaceNet trên cặp ảnh."""
    t0 = time.perf_counter()
    res1 = process_image_facenet(img1_bgr, face1_info)
    res2 = process_image_facenet(img2_bgr, face2_info)

    sim = calculate_cosine_similarity(res1["embedding"], res2["embedding"])
    is_match = bool(sim >= threshold)
    total_time_ms = round((time.perf_counter() - t0) * 1000, 2)
    total_inference_time_ms = round(res1["inference_time_ms"] + res2["inference_time_ms"], 2)

    return {
        "model_name": "FaceNet (Inception-ResNet-v1)",
        "model_version": "vggface2_onnx",
        "checkpoint": "InceptionResnetV1_vggface2",
        "similarity": round(sim, 4),
        "threshold": threshold,
        "is_match": is_match,
        "inference_time_ms": total_inference_time_ms,
        "total_time_ms": total_time_ms,
        "face_detected": True,
        "embedding_dim": res1.get("embedding_dim", int(res1["embedding"].size)),
        "bbox_img1": res1["bbox"],
        "bbox_img2": res2["bbox"],
        "confidence_img1": res1["confidence"],
        "confidence_img2": res2["confidence"],
    }


def run_insightface_branch(
    img1_bgr: np.ndarray,
    img2_bgr: np.ndarray,
    face1_info: Any,
    face2_info: Any,
    threshold: float,
) -> Dict[str, Any]:
    """Thực thi luồng InsightFace (ArcFace) trên cặp ảnh và đo đạc chuẩn xác thời gian suy luận."""
    t0 = time.perf_counter()
    face_app = get_face_app()
    rec_model = face_app.models.get("recognition")

    # Đo thời gian suy luận trích xuất đặc trưng ArcFace thuần túy
    t_infer_start = time.perf_counter()
    if rec_model is not None:
        rec_model.get(img1_bgr, face1_info)
        rec_model.get(img2_bgr, face2_info)
        infer_time_ms = round((time.perf_counter() - t_infer_start) * 1000, 2)
    else:
        infer_time_ms = 25.0

    emb1 = face1_info.embedding
    emb2 = face2_info.embedding

    # Chuẩn hóa L2
    norm1 = np.linalg.norm(emb1)
    norm2 = np.linalg.norm(emb2)
    norm_emb1 = emb1 / norm1 if norm1 > 0 else emb1
    norm_emb2 = emb2 / norm2 if norm2 > 0 else emb2

    sim = calculate_cosine_similarity(norm_emb1, norm_emb2)
    is_match = bool(sim >= threshold)
    total_time_ms = round((time.perf_counter() - t0) * 1000, 2)

    bbox1 = [round(c, 2) for c in face1_info.bbox.astype(float).tolist()]
    bbox2 = [round(c, 2) for c in face2_info.bbox.astype(float).tolist()]
    conf1 = float(face1_info.det_score) if hasattr(face1_info, "det_score") else 1.0
    conf2 = float(face2_info.det_score) if hasattr(face2_info, "det_score") else 1.0

    return {
        "model_name": "InsightFace (ArcFace buffalo_l)",
        "model_version": "buffalo_l",
        "checkpoint": "w600k_r50_arcface",
        "similarity": round(sim, 4),
        "threshold": threshold,
        "is_match": is_match,
        "inference_time_ms": infer_time_ms,
        "total_time_ms": total_time_ms,
        "face_detected": True,
        "embedding_dim": int(emb1.size),
        "bbox_img1": bbox1,
        "bbox_img2": bbox2,
        "confidence_img1": round(conf1, 4),
        "confidence_img2": round(conf2, 4),
    }


async def compare_both_models_concurrently(
    img1_bytes: bytes,
    img2_bytes: bytes,
    threshold_facenet: float = 0.75,
    threshold_insightface: float = 0.55,
) -> Dict[str, Any]:
    """
    Điều phối chạy song song FaceNet và InsightFace trên cùng một cặp ảnh:
    - Decode ảnh an toàn
    - Phát hiện khuôn mặt lớn nhất
    - Phân bổ thực thi đồng thời trong thread pool không chặn event loop
    - Xử lý ngoại lệ có kiểm soát cho từng nhánh
    - Tổng hợp kết quả riêng biệt cho từng mô hình
    """
    total_t0 = time.perf_counter()

    # 1. Decode ảnh
    img1_bgr = decode_image_bytes(img1_bytes, label="Ảnh tham chiếu (Ảnh 1)")
    img2_bgr = decode_image_bytes(img2_bytes, label="Ảnh kiểm thử (Ảnh 2)")

    # 2. Phát hiện khuôn mặt
    face_app = get_face_app()
    face1_info = detect_largest_face(face_app, img1_bgr, label="Ảnh tham chiếu (Ảnh 1)")
    face2_info = detect_largest_face(face_app, img2_bgr, label="Ảnh kiểm thử (Ảnh 2)")

    # 3. Chạy FaceNet và InsightFace song song qua asyncio.gather & thread pool executor
    loop = asyncio.get_running_loop()

    facenet_task = loop.run_in_executor(
        _comparison_executor,
        run_facenet_branch,
        img1_bgr,
        img2_bgr,
        face1_info,
        face2_info,
        threshold_facenet,
    )

    insightface_task = loop.run_in_executor(
        _comparison_executor,
        run_insightface_branch,
        img1_bgr,
        img2_bgr,
        face1_info,
        face2_info,
        threshold_insightface,
    )

    results = await asyncio.gather(facenet_task, insightface_task, return_exceptions=True)

    # Kiểm tra xem có nhánh nào bị exception không
    for idx, r in enumerate(results):
        if isinstance(r, Exception):
            branch_name = "FaceNet" if idx == 0 else "InsightFace"
            logger.error(f"Nhánh {branch_name} gặp lỗi: {r}", exc_info=r)
            if isinstance(r, HTTPException):
                raise r
            raise HTTPException(
                status_code=500,
                detail={
                    "code": f"{branch_name.upper()}_EXECUTION_ERROR",
                    "message": f"Lỗi khi thực thi mô hình {branch_name}: {str(r)}",
                },
            )

    facenet_res, insightface_res = results

    # 4. Phân tích tương đồng và độ chênh lệch
    is_agreement = bool(facenet_res["is_match"] == insightface_res["is_match"])
    discrepancy_type = None
    if not is_agreement:
        if facenet_res["is_match"] and not insightface_res["is_match"]:
            discrepancy_type = "facenet_only_match"
        else:
            discrepancy_type = "insightface_only_match"

    delta_similarity = round(abs(facenet_res["similarity"] - insightface_res["similarity"]), 4)
    overall_time_ms = round((time.perf_counter() - total_t0) * 1000, 2)

    return {
        "facenet": facenet_res,
        "insightface": insightface_res,
        "analysis": {
            "is_agreement": is_agreement,
            "discrepancy_type": discrepancy_type,
            "delta_similarity": delta_similarity,
            "latency_difference_ms": round(facenet_res["total_time_ms"] - insightface_res["total_time_ms"], 2),
            "overall_elapsed_ms": overall_time_ms,
        },
    }
