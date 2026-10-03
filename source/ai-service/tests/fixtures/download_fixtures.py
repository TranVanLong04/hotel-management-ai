import os
import numpy as np
import cv2
import urllib.request

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "sample_faces")


def ensure_fixtures_dir():
    os.makedirs(FIXTURES_DIR, exist_ok=True)


def create_landscape_image(filepath: str):
    """Tạo ảnh phong cảnh giả lập (không có mặt người)."""
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    # Gradient bầu trời & cỏ
    for y in range(200):
        img[y, :] = [235 - y // 2, 206 - y // 3, 135]  # Sky
    for y in range(200, 400):
        img[y, :] = [34, 139 + (y - 200) // 3, 34]    # Grass
    # Vẽ núi và mặt trời
    cv2.circle(img, (500, 80), 40, (0, 215, 255), -1)
    pts = np.array([[50, 200], [200, 50], [350, 200]], np.int32)
    cv2.fillPoly(img, [pts], (100, 100, 100))
    cv2.imwrite(filepath, img)
    print(f"Created landscape: {filepath}")


def create_small_face_image(filepath: str):
    """Tạo ảnh khuôn mặt nhỏ < 80x80 px."""
    img = np.zeros((60, 60, 3), dtype=np.uint8)
    # Vẽ hình tròn nhỏ tượng trưng mặt
    cv2.circle(img, (30, 30), 20, (200, 200, 200), -1)
    cv2.imwrite(filepath, img)
    print(f"Created small face: {filepath}")


def create_or_download_fixtures():
    """Tải hoặc sinh các ảnh fixtures phục vụ test."""
    ensure_fixtures_dir()
    
    landscape_path = os.path.join(FIXTURES_DIR, "landscape.jpg")
    small_face_path = os.path.join(FIXTURES_DIR, "small_face.jpg")
    face_1_path = os.path.join(FIXTURES_DIR, "face_1.jpg")
    face_2_path = os.path.join(FIXTURES_DIR, "face_2.jpg")

    if not os.path.exists(landscape_path):
        create_landscape_image(landscape_path)

    if not os.path.exists(small_face_path):
        create_small_face_image(small_face_path)

    # Thử tải 2 ảnh chân dung AI synthetic CC0 hoặc tạo ảnh mẫu
    headers = {"User-Agent": "Mozilla/5.0"}
    sample_urls = {
        face_1_path: "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg",
        face_2_path: "https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg",
    }

    for path, url in sample_urls.items():
        if not os.path.exists(path):
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=5) as response, open(path, "wb") as out_file:
                    out_file.write(response.read())
                print(f"Downloaded sample face: {path}")
            except Exception as e:
                print(f"Could not download {url}: {e}, creating placeholder portrait...")
                # Tạo ảnh chân dung tổng hợp
                img = np.full((300, 300, 3), 240, dtype=np.uint8)
                cv2.circle(img, (150, 150), 80, (180, 190, 220), -1)
                cv2.circle(img, (120, 130), 10, (50, 50, 50), -1)
                cv2.circle(img, (180, 130), 10, (50, 50, 50), -1)
                cv2.ellipse(img, (150, 180), (30, 15), 0, 0, 180, (50, 50, 50), 3)
                cv2.imwrite(path, img)


if __name__ == "__main__":
    create_or_download_fixtures()
