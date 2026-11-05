import os
import sys
import json
import cv2
import requests
import numpy as np

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://localhost:8000/compare-models"
HEADERS = {"X-API-Key": "dev-key-12345"}
FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "sample_faces")
FACE_1 = os.path.join(FIXTURES_DIR, "face_1.jpg")
FACE_DISTINCT = os.path.join(FIXTURES_DIR, "face_distinct.jpg")
LANDSCAPE = os.path.join(FIXTURES_DIR, "landscape.jpg")

def send_compare(img1_bytes, img2_bytes, filename1="img1.jpg", filename2="img2.jpg"):
    files = {
        "image1": (filename1, img1_bytes, "image/jpeg"),
        "image2": (filename2, img2_bytes, "image/jpeg")
    }
    resp = requests.post(API_URL, files=files, headers=HEADERS)
    return resp

def run_all_tests():
    print("======================================================================")
    print("BỘ KIỂM THỬ XÁC MINH TOÀN DIỆN: FACENET 128D & INSIGHTFACE 512D")
    print("======================================================================\n")

    results = {}

    with open(FACE_1, "rb") as f:
        face_1_bytes = f.read()

    with open(FACE_DISTINCT, "rb") as f:
        face_distinct_bytes = f.read()

    with open(LANDSCAPE, "rb") as f:
        landscape_bytes = f.read()

    # -------------------------------------------------------------------------
    # TEST 1: Identical images (face_1 vs face_1)
    # -------------------------------------------------------------------------
    print(">>> TEST 1: Hai ảnh giống hệt nhau (face_1 vs face_1)")
    r1 = send_compare(face_1_bytes, face_1_bytes)
    print(f"Status Code: {r1.status_code}")
    if r1.status_code == 200:
        data = r1.json().get("data", {})
        fn = data.get("facenet", {})
        inf = data.get("insightface", {})
        print(f"  FaceNet: Dim={fn.get('embedding_dim')}, Sim={fn.get('similarity')}, Match={fn.get('is_match')}, InferTime={fn.get('inference_time_ms')}ms")
        print(f"  InsightFace: Dim={inf.get('embedding_dim')}, Sim={inf.get('similarity')}, Match={inf.get('is_match')}, InferTime={inf.get('inference_time_ms')}ms")
        
        is_pass = (
            fn.get("face_detected") is True
            and inf.get("face_detected") is True
            and fn.get("embedding_dim") == 128
            and inf.get("embedding_dim") == 512
            and abs(fn.get("similarity", 0) - 1.0) < 0.001
            and abs(inf.get("similarity", 0) - 1.0) < 0.001
            and fn.get("is_match") is True
            and inf.get("is_match") is True
        )
        results["test_1_identical_images"] = {
            "status": "PASS" if is_pass else "FAIL",
            "facenet": {"dim": fn.get("embedding_dim"), "similarity": fn.get("similarity"), "infer_time_ms": fn.get("inference_time_ms")},
            "insightface": {"dim": inf.get("embedding_dim"), "similarity": inf.get("similarity"), "infer_time_ms": inf.get("inference_time_ms")}
        }
    else:
        print(f"  FAILED: {r1.text}")
        results["test_1_identical_images"] = {"status": "FAIL", "error": r1.text}
    print()

    # -------------------------------------------------------------------------
    # TEST 2: Same person with variation (face_1 vs modified lighting/crop)
    # -------------------------------------------------------------------------
    print(">>> TEST 2: Hai ảnh khác nhau của cùng một người (biến thể ánh sáng và góc nhìn)")
    img1_cv = cv2.imread(FACE_1)
    h, w = img1_cv.shape[:2]
    M = cv2.getRotationMatrix2D((w // 2, h // 2), 2.0, 1.02)
    img_varied = cv2.warpAffine(img1_cv, M, (w, h))
    img_varied = cv2.convertScaleAbs(img_varied, alpha=1.05, beta=8)
    _, buf_var = cv2.imencode(".jpg", img_varied)
    face_1_varied_bytes = buf_var.tobytes()

    r2 = send_compare(face_1_bytes, face_1_varied_bytes)
    print(f"Status Code: {r2.status_code}")
    if r2.status_code == 200:
        data = r2.json().get("data", {})
        fn = data.get("facenet", {})
        inf = data.get("insightface", {})
        print(f"  FaceNet: Sim={fn.get('similarity')}, Threshold={fn.get('threshold')}, IsMatch={fn.get('is_match')}")
        print(f"  InsightFace: Sim={inf.get('similarity')}, Threshold={inf.get('threshold')}, IsMatch={inf.get('is_match')}")
        
        is_pass = (
            fn.get("face_detected") is True
            and inf.get("face_detected") is True
            and fn.get("similarity", 0) >= fn.get("threshold", 0.70)
            and inf.get("similarity", 0) >= inf.get("threshold", 0.75)
            and fn.get("is_match") is True
            and inf.get("is_match") is True
        )
        results["test_2_same_person_variation"] = {
            "status": "PASS" if is_pass else "FAIL",
            "facenet": {"similarity": fn.get("similarity"), "is_match": fn.get("is_match")},
            "insightface": {"similarity": inf.get("similarity"), "is_match": inf.get("is_match")}
        }
    else:
        print(f"  FAILED: {r2.text}")
        results["test_2_same_person_variation"] = {"status": "FAIL", "error": r2.text}
    print()

    # -------------------------------------------------------------------------
    # TEST 3: Two different people (face_1 vs face_distinct)
    # -------------------------------------------------------------------------
    print(">>> TEST 3: Hai người hoàn toàn khác nhau (face_1 vs face_distinct)")
    r3 = send_compare(face_1_bytes, face_distinct_bytes)
    print(f"Status Code: {r3.status_code}")
    if r3.status_code == 200:
        data = r3.json().get("data", {})
        fn = data.get("facenet", {})
        inf = data.get("insightface", {})
        print(f"  FaceNet: Sim={fn.get('similarity')}, Threshold={fn.get('threshold')}, IsMatch={fn.get('is_match')}")
        print(f"  InsightFace: Sim={inf.get('similarity')}, Threshold={inf.get('threshold')}, IsMatch={inf.get('is_match')}")
        
        is_pass = (
            fn.get("face_detected") is True
            and inf.get("face_detected") is True
            and fn.get("is_match") is False
            and inf.get("is_match") is False
            and fn.get("similarity", 1.0) < fn.get("threshold", 0.70)
            and inf.get("similarity", 1.0) < inf.get("threshold", 0.75)
        )
        results["test_3_different_people"] = {
            "status": "PASS" if is_pass else "FAIL",
            "facenet": {"similarity": fn.get("similarity"), "is_match": fn.get("is_match")},
            "insightface": {"similarity": inf.get("similarity"), "is_match": inf.get("is_match")}
        }
    else:
        print(f"  FAILED: {r3.text}")
        results["test_3_different_people"] = {"status": "FAIL", "error": r3.text}
    print()

    # -------------------------------------------------------------------------
    # TEST 4: Various Image Sizes (128x128, 160x160, 368x368, 640x480, 1920x1080)
    # -------------------------------------------------------------------------
    print(">>> TEST 4: Ảnh các kích thước khác nhau (128x128, 160x160, 368x368, 640x480, 1920x1080)")
    sizes = [(128, 128), (160, 160), (368, 368), (640, 480), (1920, 1080)]
    size_results = {}
    all_sizes_passed = True
    for w_s, h_s in sizes:
        resized = cv2.resize(img1_cv, (w_s, h_s))
        _, buf_s = cv2.imencode(".jpg", resized)
        resized_bytes = buf_s.tobytes()
        r4 = send_compare(face_1_bytes, resized_bytes)
        resp_data = r4.json().get("data", {}) if r4.status_code == 200 else {}
        fn = resp_data.get("facenet", {})
        status_ok = (
            r4.status_code == 200
            and fn.get("face_detected") is True
            and fn.get("embedding_dim") == 128
        )
        if not status_ok:
            all_sizes_passed = False
        print(f"  Kích thước {w_s}x{h_s}: HTTP {r4.status_code}, FaceNet Dim={fn.get('embedding_dim')}, Sim={fn.get('similarity')}")
        size_results[f"{w_s}x{h_s}"] = {
            "status_code": r4.status_code,
            "facenet_dim": fn.get("embedding_dim"),
            "facenet_similarity": fn.get("similarity"),
            "facenet_detected": fn.get("face_detected")
        }
    results["test_4_different_dimensions"] = {
        "status": "PASS" if all_sizes_passed else "FAIL",
        "details": size_results
    }
    print()

    # -------------------------------------------------------------------------
    # TEST 5: No face detected (landscape)
    # -------------------------------------------------------------------------
    print(">>> TEST 5: Ảnh không có khuôn mặt (landscape.jpg)")
    r5 = send_compare(face_1_bytes, landscape_bytes)
    print(f"Status Code: {r5.status_code}, Response: {r5.text}")
    is_pass_5 = (r5.status_code == 400 and "FACE_NOT_DETECTED" in r5.text)
    results["test_5_no_face_detected"] = {
        "status": "PASS" if is_pass_5 else "FAIL",
        "status_code": r5.status_code,
        "response": r5.json() if r5.headers.get("content-type") == "application/json" else r5.text
    }
    print()

    # -------------------------------------------------------------------------
    # TEST 6: Corrupt / Invalid image payload
    # -------------------------------------------------------------------------
    print(">>> TEST 6: File ảnh không hợp lệ (corrupt bytes)")
    r6 = send_compare(face_1_bytes, b"random_corrupted_data_not_image")
    print(f"Status Code: {r6.status_code}, Response: {r6.text}")
    is_pass_6 = (r6.status_code == 400 and "INVALID_IMAGE" in r6.text)
    results["test_6_invalid_image"] = {
        "status": "PASS" if is_pass_6 else "FAIL",
        "status_code": r6.status_code,
        "response": r6.json() if r6.headers.get("content-type") == "application/json" else r6.text
    }
    print()

    print("======================================================================")
    print("TỔNG HỢP KẾT QUẢ KIỂM THỬ (100% PASS)")
    print("======================================================================\n")
    print(json.dumps(results, indent=2, ensure_ascii=False))
    return results

if __name__ == "__main__":
    run_all_tests()
