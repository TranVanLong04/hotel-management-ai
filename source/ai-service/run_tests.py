import requests
import json

print("=== 4. GET /health ===")
r = requests.get("http://localhost:8000/health")
print(json.dumps(r.json(), indent=2))

print("\n=== 5. POST /embed with face_1.jpg (Expect 200, 512D) ===")
with open("tests/fixtures/sample_faces/face_1.jpg", "rb") as f:
    r = requests.post(
        "http://localhost:8000/embed",
        headers={"X-API-Key": "dev-key-12345"},
        files={"image": ("face_1.jpg", f, "image/jpeg")},
    )
embed_data = r.json()
print("Success:", embed_data.get("success"))
print("Dimensions:", len(embed_data["data"]["embedding"]))
print("Model version:", embed_data["data"]["model_version"])
print("Sample first 5 floats:", [round(x, 5) for x in embed_data["data"]["embedding"][:5]])
print("BBox:", embed_data["data"]["bbox"])
print("Confidence:", embed_data["data"]["confidence"])

print("\n=== 6. POST /embed without API Key (Expect 401 UNAUTHORIZED) ===")
with open("tests/fixtures/sample_faces/face_1.jpg", "rb") as f:
    r = requests.post(
        "http://localhost:8000/embed",
        files={"image": ("face_1.jpg", f, "image/jpeg")},
    )
print(f"Status code: {r.status_code}")
print(json.dumps(r.json(), indent=2))

print("\n=== 7. POST /embed with landscape.jpg (Expect 400 FACE_NOT_DETECTED) ===")
with open("tests/fixtures/sample_faces/landscape.jpg", "rb") as f:
    r = requests.post(
        "http://localhost:8000/embed",
        headers={"X-API-Key": "dev-key-12345"},
        files={"image": ("landscape.jpg", f, "image/jpeg")},
    )
print(f"Status code: {r.status_code}")
print(json.dumps(r.json(), indent=2))

print("\n=== 8. POST /embed with small_face.jpg (Expect 400 FACE_LOW_QUALITY or FACE_NOT_DETECTED) ===")
with open("tests/fixtures/sample_faces/small_face.jpg", "rb") as f:
    r = requests.post(
        "http://localhost:8000/embed",
        headers={"X-API-Key": "dev-key-12345"},
        files={"image": ("small_face.jpg", f, "image/jpeg")},
    )
print(f"Status code: {r.status_code}")
print(json.dumps(r.json(), indent=2))

print("\n=== 9. POST /compare with identical vectors ===")
emb1 = embed_data["data"]["embedding"]
r = requests.post(
    "http://localhost:8000/compare",
    headers={"X-API-Key": "dev-key-12345"},
    json={"embedding1": emb1, "embedding2": emb1, "threshold": 0.75},
)
print(json.dumps(r.json(), indent=2))

print("\n=== 10. POST /compare with different vectors ===")
emb2 = [0.0] * 512
emb2[0] = 1.0
r = requests.post(
    "http://localhost:8000/compare",
    headers={"X-API-Key": "dev-key-12345"},
    json={"embedding1": emb1, "embedding2": emb2, "threshold": 0.75},
)
print(json.dumps(r.json(), indent=2))

print("\n=== 12. Swagger UI Check ===")
r = requests.get("http://localhost:8000/docs")
print("Swagger docs status code:", r.status_code)
