import numpy as np
from typing import List, Dict, Any
from fastapi import HTTPException


def calculate_similarity(
    embedding1: List[float],
    embedding2: List[float],
    threshold: float = 0.75,
) -> Dict[str, Any]:
    """
    Tính độ tương đồng Cosine Similarity giữa 2 vector embedding và so sánh với threshold.
    """
    if len(embedding1) != 512 or len(embedding2) != 512:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_EMBEDDING",
                "message": "Cả hai vector embedding đều phải có đúng 512 chiều",
            },
        )

    vec1 = np.array(embedding1, dtype=np.float32)
    vec2 = np.array(embedding2, dtype=np.float32)

    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)

    if norm1 == 0.0 or norm2 == 0.0:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_EMBEDDING",
                "message": "Vector embedding có độ dài (norm) bằng 0",
            },
        )

    # Cosine similarity = dot(A, B) / (||A|| * ||B||)
    raw_similarity = float(np.dot(vec1, vec2) / (norm1 * norm2))

    # Giới hạn về khoảng [-1.0, 1.0] để tránh sai số số thực (floating point error)
    similarity = float(np.clip(raw_similarity, -1.0, 1.0))

    is_match = bool(similarity >= threshold)
    distance = float(max(0.0, 1.0 - similarity))

    return {
        "similarity": round(similarity, 4),
        "is_match": is_match,
        "threshold": threshold,
        "distance": round(distance, 4),
    }
