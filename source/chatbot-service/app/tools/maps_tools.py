import re
import urllib.parse
from typing import Dict, Any, List, Optional, Union
import googlemaps
from langchain_core.tools import tool
from app.core.config import settings
from app.core.logger import logger



# Curated high-res images and metadata for top Da Nang & Central Vietnam attractions
FAMOUS_PLACES_DB: Dict[str, Dict[str, Any]] = {
    "bà nà": {
        "name": "Sun World Bà Nà Hills (Cầu Vàng)",
        "address": "Thôn An Sơn, Xã Hòa Ninh, Huyện Hòa Vang, Đà Nẵng",
        "rating": 4.8,
        "user_ratings_total": 42100,
        "distance_km": "38 km",
        "duration_minutes": "50 phút lái xe",
        "description": "Quần thể du lịch nghỉ dưỡng trên đỉnh núi Chúa cao 1.487m với cây Cầu Vàng nổi tiếng thế giới, Làng Pháp cổ kính và hệ thống cáp treo đạt nhiều kỷ lục.",
        "image_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
        "category": "Điểm tham quan nổi bật",
        "location": {"lat": 15.9950, "lng": 107.9865},
    },
    "hội an": {
        "name": "Phố cổ Hội An",
        "address": "Phường Minh An, Thành phố Hội An, Tỉnh Quảng Nam",
        "rating": 4.9,
        "user_ratings_total": 56000,
        "distance_km": "28 km",
        "duration_minutes": "40 phút lái xe",
        "description": "Di sản Văn hóa Thế giới UNESCO với những dãy nhà cổ sơn vàng, đèn lồng rực rỡ bên dòng sông Hoài thơ mộng, ẩm thực Cao Lầu, Bánh Mì Phượng trứ danh.",
        "image_url": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80",
        "category": "Di sản văn hóa",
        "location": {"lat": 15.8801, "lng": 108.3380},
    },
    "cầu rồng": {
        "name": "Cầu Rồng Đà Nẵng",
        "address": "Đường Nguyễn Văn Linh, Phước Ninh, Hải Châu, Đà Nẵng",
        "rating": 4.7,
        "user_ratings_total": 28500,
        "distance_km": "3.5 km",
        "duration_minutes": "7 phút lái xe",
        "description": "Biểu tượng hiện đại của thành phố Đà Nẵng, bắc qua sông Hàn. Cầu phun lửa và phun nước vào đúng 21:00 các tối Thứ 7 và Chủ Nhật hàng tuần.",
        "image_url": "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80",
        "category": "Biểu tượng thành phố",
        "location": {"lat": 16.0611, "lng": 108.2272},
    },
    "sơn trà": {
        "name": "Bán đảo Sơn Trà & Chùa Linh Ứng",
        "address": "Bán đảo Sơn Trà, Thọ Quang, Sơn Trà, Đà Nẵng",
        "rating": 4.8,
        "user_ratings_total": 31200,
        "distance_km": "9.5 km",
        "duration_minutes": "15 phút lái xe",
        "description": "Lá phổi xanh của Đà Nẵng với tượng Phật Bà Quan Âm cao 67m hướng nhìn ra biển Đông, đỉnh Bàn Cờ hùng vĩ và hệ sinh thái Voọc chà vá chân nâu quý hiếm.",
        "image_url": "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
        "category": "Tâm linh & Thiên nhiên",
        "location": {"lat": 16.1002, "lng": 108.2764},
    },
    "ngũ hành sơn": {
        "name": "Danh thắng Ngũ Hành Sơn (Non Nước)",
        "address": "81 Huyền Trân Công Chúa, Hòa Hải, Ngũ Hành Sơn, Đà Nẵng",
        "rating": 4.6,
        "user_ratings_total": 19400,
        "distance_km": "8.0 km",
        "duration_minutes": "12 phút lái xe",
        "description": "Quần thể 5 ngọn núi đá vôi (Kim, Mộc, Thủy, Hỏa, Thổ) với nhiều hang động huyền bí như động Huyền Không, động Âm Phủ cùng Làng nghề điêu khắc đá Non Nước.",
        "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "category": "Di tích lịch sử & Thắng cảnh",
        "location": {"lat": 16.0044, "lng": 108.2635},
    },
    "mỹ khê": {
        "name": "Bãi biển Mỹ Khê",
        "address": "Đường Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng",
        "rating": 4.7,
        "user_ratings_total": 35000,
        "distance_km": "0.1 km (Ngay trước mặt khách sạn)",
        "duration_minutes": "1 phút đi bộ",
        "description": "Một trong 6 bãi biển quyến rũ nhất hành tinh do tạp chí Forbes bình chọn, với bờ cát trắng mịn, sóng biển êm ả và hàng dừa thơ mộng.",
        "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "category": "Bãi biển",
        "location": {"lat": 16.0645, "lng": 108.2468},
    },
    "chợ hàn": {
        "name": "Chợ Hàn Đà Nẵng",
        "address": "119 Trần Phú, Hải Châu 1, Hải Châu, Đà Nẵng",
        "rating": 4.4,
        "user_ratings_total": 24000,
        "distance_km": "4.0 km",
        "duration_minutes": "8 phút lái xe",
        "description": "Khu chợ mua sắm đặc sản truyền thống sầm uất bậc nhất Đà Nẵng, nơi lý tưởng để mua chả bò, mực rim me, bánh khô mè và đồ lưu niệm.",
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "category": "Chợ truyền thống & Đặc sản",
        "location": {"lat": 16.0682, "lng": 108.2241},
    },
}

# Curated top restaurants & cafes near Grand Luxury Hotel (My Khe Beach / Son Tra / Hai Chau)
RESTAURANTS_AND_CAFES_DB: List[Dict[str, Any]] = [
    # --- Hải sản tươi sống ven biển ---
    {
        "name": "Hải sản Bé Mặn",
        "type": "Hải sản tươi sống",
        "address": "Lô 11 Võ Nguyên Giáp, Mạn Thái, Sơn Trà, Đà Nẵng",
        "rating": 4.5,
        "user_ratings_total": 8400,
        "price_level": "$$",
        "distance_km": "0.6 km",
        "duration_walking": "7 phút đi bộ",
        "highlight": "Hải sản tươi sống bơi tại hồ, giá niêm yết rõ ràng, không gian thoáng đãng sát biển.",
        "image_url": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80",
        "tags": ["hải sản", "seafood", "quán ăn", "ăn tối", "ven biển"],
    },
    {
        "name": "Hải sản Năm Đảnh",
        "type": "Hải sản bình dân trứ danh",
        "address": "K139/H59/38 Trần Quang Khải, Thọ Quang, Sơn Trà, Đà Nẵng",
        "rating": 4.4,
        "user_ratings_total": 6500,
        "price_level": "$",
        "distance_km": "2.8 km",
        "duration_walking": "8 phút đi taxi",
        "highlight": "Quán hải sản nổi tiếng đông khách nhất Đà Nẵng, đĩa đồng giá hấp dẫn, hải sản tươi ngon đậm đà.",
        "image_url": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
        "tags": ["hải sản", "seafood", "bình dân", "quán ăn"],
    },
    {
        "name": "Hải sản Bà Rô",
        "type": "Hải sản tươi sống bình dân",
        "address": "115 Lý Tử Tấn, Thọ Quang, Sơn Trà, Đà Nẵng",
        "rating": 4.5,
        "user_ratings_total": 4200,
        "price_level": "$",
        "distance_km": "3.2 km",
        "duration_walking": "9 phút đi taxi",
        "highlight": "Nổi tiếng với mực hấp gừng, tôm nướng muối ớt, cua ghẹ chắc nịch với mức giá vô cùng hợp lý.",
        "image_url": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80",
        "tags": ["hải sản", "seafood", "bình dân", "quán ăn", "ăn tối"],
    },
    {
        "name": "Hải sản Cua Đỏ",
        "type": "Nhà hàng hải sản cao cấp",
        "address": "233 Nguyễn Văn Thoại, Phước Mỹ, Sơn Trà, Đà Nẵng",
        "rating": 4.6,
        "user_ratings_total": 3100,
        "price_level": "$$$",
        "distance_km": "1.1 km",
        "duration_walking": "12 phút đi bộ",
        "highlight": "Chuyên các món cua Huỳnh Đế, tôm hùm bông, không gian sang trọng lịch sự thích hợp tiếp khách.",
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "tags": ["hải sản", "seafood", "sang trọng", "cao cấp", "quán ăn"],
    },
    {
        "name": "Nhà hàng Hải sản Phố",
        "type": "Hải sản bờ biển view vịnh",
        "address": "51 Võ Nguyên Giáp, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng",
        "rating": 4.7,
        "user_ratings_total": 5200,
        "price_level": "$$$",
        "distance_km": "1.8 km",
        "duration_walking": "4 phút đi taxi",
        "highlight": "Kiến trúc đẳng cấp bên bờ biển Mỹ Khê, bể hải sản khổng lồ chuẩn quốc tế.",
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        "tags": ["hải sản", "seafood", "view biển", "sang trọng", "nhà hàng"],
    },
    {
        "name": "Hải sản Lão Đại",
        "type": "Quán hải sản nhậu đường phố",
        "address": "Lô 1 Võ Văn Kiệt, An Hải Đông, Sơn Trà, Đà Nẵng",
        "rating": 4.4,
        "user_ratings_total": 2800,
        "price_level": "$$",
        "distance_km": "2.0 km",
        "duration_walking": "5 phút đi taxi",
        "highlight": "Món ốc hương sốt trứng muối, chíp chíp hấp sả thơm lừng, mở cửa muộn đến nửa đêm.",
        "image_url": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80",
        "tags": ["hải sản", "quán nhậu", "ăn đêm", "quán ăn"],
    },
    {
        "name": "Hải sản Bé Nhỏ",
        "type": "Hải sản gia đình",
        "address": "32 Hà Bổng, Phước Mỹ, Sơn Trà, Đà Nẵng",
        "rating": 4.5,
        "user_ratings_total": 1900,
        "price_level": "$$",
        "distance_km": "0.4 km",
        "duration_walking": "5 phút đi bộ",
        "highlight": "Nằm ngay khu phố Tây sát khách sạn, hải sản tươi chế biến nhanh và nêm nếm rất vừa miệng.",
        "image_url": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80",
        "tags": ["hải sản", "gần khách sạn", "quán ăn"],
    },
    {
        "name": "Hải sản Thời Cổ",
        "type": "Hải sản đồng giá tươi ngon",
        "address": "354/1 Võ Nguyên Giáp, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng",
        "rating": 4.6,
        "user_ratings_total": 2400,
        "price_level": "$",
        "distance_km": "1.5 km",
        "duration_walking": "18 phút đi bộ",
        "highlight": "Các món đồng giá chỉ từ 70k, tôm sốt Thái cay nồng và lẩu hải sản đầy đặn.",
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "tags": ["hải sản", "đồng giá", "bình dân", "quán ăn"],
    },

    # --- Đặc sản Đà Nẵng & Món cuốn ---
    {
        "name": "Bếp Cuốn Đà Nẵng",
        "type": "Đặc sản Đà Nẵng & Món cuốn",
        "address": "54 Nguyễn Văn Thoại, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng",
        "rating": 4.8,
        "user_ratings_total": 3200,
        "price_level": "$$",
        "distance_km": "1.2 km",
        "duration_walking": "14 phút đi bộ",
        "highlight": "Bánh tráng cuốn thịt heo hai đầu da, bánh xèo tôm nhảy, nem lụi nướng than hoa thơm lừng.",
        "image_url": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
        "tags": ["đặc sản", "bánh tráng cuốn", "bánh xèo", "quán ăn", "ăn trưa"],
    },
    {
        "name": "Đặc sản Trần (Quán Trần)",
        "type": "Bánh tráng cuốn thịt heo chuẩn vị",
        "address": "04 Lê Duẩn, Hải Châu 1, Hải Châu, Đà Nẵng",
        "rating": 4.6,
        "user_ratings_total": 5800,
        "price_level": "$$",
        "distance_km": "3.8 km",
        "duration_walking": "8 phút lái xe",
        "highlight": "Thương hiệu bánh tráng thịt heo hai đầu da nổi tiếng nhất Đà Nẵng cùng mắm nêm đậm đà trứ danh.",
        "image_url": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
        "tags": ["đặc sản", "bánh tráng cuốn", "thịt heo", "quán ăn"],
    },
    {
        "name": "Mì Quảng Bà Mua",
        "type": "Mì Quảng & Đặc sản Quảng Nam",
        "address": "95A Nguyễn Tri Phương, Chính Gián, Thanh Khê, Đà Nẵng",
        "rating": 4.6,
        "user_ratings_total": 4100,
        "price_level": "$",
        "distance_km": "4.2 km",
        "duration_walking": "10 phút lái xe",
        "highlight": "Thương hiệu Mì Quảng nổi tiếng với nước dùng đậm vị tôm thịt, gà ta thả vườn và ếch đồng thơm ngon.",
        "image_url": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=600&q=80",
        "tags": ["mì quảng", "ăn sáng", "ăn trưa", "đặc sản"],
    },
    {
        "name": "Mì Quảng ếch Bếp Trang",
        "type": "Mì Quảng ếch thố đất hiện đại",
        "address": "24 Pasteur, Hải Châu 1, Hải Châu, Đà Nẵng",
        "rating": 4.7,
        "user_ratings_total": 3600,
        "price_level": "$$",
        "distance_km": "4.0 km",
        "duration_walking": "9 phút lái xe",
        "highlight": "Mì Quảng ếch bày trên mẹt tre lót lá chuối đẹp mắt, thịt ếch om sả ớt vàng ươm thơm lừng.",
        "image_url": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=600&q=80",
        "tags": ["mì quảng", "mì quảng ếch", "đặc sản", "quán ăn"],
    },
    {
        "name": "Bánh xèo Bà Dưỡng",
        "type": "Bánh xèo & Nem lụi gia truyền",
        "address": "K280/23 Hoàng Diệu, Bình Hiên, Hải Châu, Đà Nẵng",
        "rating": 4.5,
        "user_ratings_total": 7200,
        "price_level": "$",
        "distance_km": "4.1 km",
        "duration_walking": "10 phút lái xe",
        "highlight": "Bánh xèo đúc chảo giòn rụm nhân tôm thịt giá đỗ, nước chấm gan heo bùi béo không nơi nào có.",
        "image_url": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80",
        "tags": ["bánh xèo", "nem lụi", "đặc sản", "quán ăn"],
    },
    {
        "name": "Bún chả cá Bà Lữ",
        "type": "Bún chả cá truyền thống",
        "address": "319 Hùng Vương, Vĩnh Trung, Thanh Khê, Đà Nẵng",
        "rating": 4.5,
        "user_ratings_total": 3300,
        "price_level": "$",
        "distance_km": "4.8 km",
        "duration_walking": "11 phút lái xe",
        "highlight": "Chả cá chiên và hấp dai giòn tự nhiên, nước dùng ngọt thanh từ xương cá và bí đỏ, cà chua thơm ngát.",
        "image_url": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=600&q=80",
        "tags": ["bún chả cá", "ăn sáng", "đặc sản", "quán ăn"],
    },
    {
        "name": "Cơm Niêu Nhà Đỏ 2",
        "type": "Cơm niêu gia đình truyền thống",
        "address": "86 Nguyễn Tri Phương, Chính Gián, Thanh Khê, Đà Nẵng",
        "rating": 4.5,
        "user_ratings_total": 2900,
        "price_level": "$$",
        "distance_km": "4.5 km",
        "duration_walking": "11 phút lái xe",
        "highlight": "Cơm cháy đập giòn rụm, cá bống kho tộ, canh cua mồng tơi ăn cùng cà pháo chuẩn cơm mẹ nấu.",
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "tags": ["cơm niêu", "gia đình", "ăn trưa", "ăn tối", "quán ăn"],
    },
    {
        "name": "Cơm gà A Hải",
        "type": "Cơm gà xối mỡ nổi tiếng",
        "address": "100 Thái Phiên, Phước Ninh, Hải Châu, Đà Nẵng",
        "rating": 4.6,
        "user_ratings_total": 3800,
        "price_level": "$",
        "distance_km": "3.9 km",
        "duration_walking": "9 phút lái xe",
        "highlight": "Gà xối mỡ lớp da giòn rụm, thịt bên trong mềm ngọt, hạt cơm chiên tơi vàng ươm ăn kèm kim chi.",
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "tags": ["cơm gà", "ăn trưa", "ăn tối", "quán ăn"],
    },

    # --- Quán Cafe & Tráng miệng ---
    {
        "name": "The Power House Espresso Cafe",
        "type": "Quán cafe view biển cao cấp",
        "address": "Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng",
        "rating": 4.7,
        "user_ratings_total": 1200,
        "price_level": "$$",
        "distance_km": "0.3 km",
        "duration_walking": "3 phút đi bộ",
        "highlight": "Cà phê đặc sản rang xay tươi, không gian ngắm bình minh biển Mỹ Khê tuyệt đẹp.",
        "image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
        "tags": ["cafe", "cà phê", "view biển", "sống ảo", "đồ uống"],
    },
    {
        "name": "Reply 1988 Cafe",
        "type": "Cafe phong cách hoài niệm Hàn Quốc",
        "address": "20 Lê Hồng Phong, Phước Ninh, Hải Châu, Đà Nẵng",
        "rating": 4.8,
        "user_ratings_total": 2100,
        "price_level": "$$",
        "distance_km": "3.6 km",
        "duration_walking": "8 phút lái xe",
        "highlight": "Không gian vintage ấm cúng, bánh ngọt tự nướng và trà sữa nướng thơm lừng cực chill.",
        "image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
        "tags": ["cafe", "cà phê", "sống ảo", "bánh ngọt"],
    },
    {
        "name": "Trình Cà Phê",
        "type": "Cà phê bơ đặc sản Đà Nẵng",
        "address": "22/4 Lê Đình Dương, Phước Ninh, Hải Châu, Đà Nẵng",
        "rating": 4.7,
        "user_ratings_total": 2900,
        "price_level": "$",
        "distance_km": "3.5 km",
        "duration_walking": "7 phút lái xe",
        "highlight": "Nổi tiếng nhất món Cà phê bơ béo ngậy độc đáo, sân vườn nhiều cây xanh thoáng mát.",
        "image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
        "tags": ["cafe", "cà phê", "cà phê bơ", "đặc sản"],
    },
    {
        "name": "Chè Sầu Liên Đà Nẵng",
        "type": "Quán chè đặc sản trứ danh",
        "address": "189 Hoàng Diệu, Nam Dương, Hải Châu, Đà Nẵng",
        "rating": 4.8,
        "user_ratings_total": 8900,
        "price_level": "$",
        "distance_km": "4.2 km",
        "duration_walking": "10 phút lái xe",
        "highlight": "Chè sầu riêng nước cốt dừa nức tiếng cả nước, chè thái và tàu hũ sầu riêng thơm béo mát lạnh.",
        "image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
        "tags": ["chè", "chè sầu", "tráng miệng", "ăn vặt"],
    },

    # --- Quán Nướng & BBQ ---
    {
        "name": "Quán Nướng Nhóp Nhép",
        "type": "Nướng lẩu than hoa đường phố",
        "address": "343 Phan Châu Trinh, Bình Hiên, Hải Châu, Đà Nẵng",
        "rating": 4.6,
        "user_ratings_total": 3500,
        "price_level": "$$",
        "distance_km": "3.5 km",
        "duration_walking": "7 phút lái xe",
        "highlight": "Quán nướng đông khách bậc nhất Đà Nẵng, bạch tuộc sa tế, ba chỉ cuộn nấm kim châm ướp đậm đà.",
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "tags": ["nướng", "quán nướng", "thịt nướng", "bbq", "lẩu nướng", "ăn tối", "quán ăn"],
    },
    {
        "name": "Phố Nướng Tokyo Đà Nẵng",
        "type": "Nướng BBQ phong cách Nhật Bản",
        "address": "04 Phạm Văn Đồng, An Hải Bắc, Sơn Trà, Đà Nẵng",
        "rating": 4.7,
        "user_ratings_total": 2900,
        "price_level": "$$",
        "distance_km": "1.5 km",
        "duration_walking": "15 phút đi bộ / 3 phút xe",
        "highlight": "Nằm ngay trục đường lớn gần biển, bò Mỹ nướng sốt cay Tokyo, không gian mở ngoài trời thoáng đãng.",
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        "tags": ["nướng", "quán nướng", "thịt nướng", "bbq", "tokyo", "gần khách sạn"],
    },
    {
        "name": "Mọi Quán - Lẩu & Nướng Than Hoa",
        "type": "Lẩu nướng ngói & than hoa",
        "address": "114 Núi Thành, Hòa Thuận Đông, Hải Châu, Đà Nẵng",
        "rating": 4.5,
        "user_ratings_total": 2400,
        "price_level": "$$",
        "distance_km": "4.0 km",
        "duration_walking": "9 phút lái xe",
        "highlight": "Bò cuộn phô mai nướng ngói, sườn sụn nướng mật ong và lẩu ếch măng cay nức tiếng.",
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "tags": ["nướng", "quán nướng", "lẩu nướng", "thịt nướng", "than hoa"],
    },
    {
        "name": "Nướng Bơ Nầm Bò 92",
        "type": "Bò nầm nướng chảo bơ",
        "address": "78 Nguyễn Văn Thoại, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng",
        "rating": 4.6,
        "user_ratings_total": 1800,
        "price_level": "$",
        "distance_km": "1.0 km",
        "duration_walking": "10 phút đi bộ",
        "highlight": "Bò nầm nướng sốt me chua ngọt đậm đà, phết bơ thơm lừng ăn kèm bánh mì giòn rụm sát khách sạn.",
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "tags": ["nướng", "quán nướng", "nướng bơ", "bò nầm nướng", "thịt nướng"],
    },
    {
        "name": "Gogi House Vincom Đà Nẵng",
        "type": "Thịt nướng Hàn Quốc cao cấp",
        "address": "Tầng 4 Vincom Plaza, 910A Ngô Quyền, Sơn Trà, Đà Nẵng",
        "rating": 4.7,
        "user_ratings_total": 4100,
        "price_level": "$$$",
        "distance_km": "2.2 km",
        "duration_walking": "5 phút lái xe",
        "highlight": "Dẻ sườn bò Mỹ hảo hạng, sốt ướp chuẩn Seoul và các món panchan không giới hạn.",
        "image_url": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
        "tags": ["nướng", "quán nướng", "hàn quốc", "thịt nướng", "bbq"],
    },

    # --- Lẩu Gà & Quán Gà ---
    {
        "name": "Lẩu Gà Lá É Tao Ngộ Đà Nẵng",
        "type": "Lẩu gà lá é nấm chuẩn vị Đà Lạt",
        "address": "120 Nguyễn Văn Thoại, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng",
        "rating": 4.7,
        "user_ratings_total": 2800,
        "price_level": "$$",
        "distance_km": "0.9 km",
        "duration_walking": "8 phút đi bộ",
        "highlight": "Nước dùng thanh ngọt nấu từ thịt gà ta dai ngon, nấm bào ngư và lá é thơm lừng cay the ấm nồng.",
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "tags": ["lẩu gà", "lẩu gà lá é", "quán lẩu", "lẩu", "gà", "ăn tối"],
    },
    {
        "name": "Lẩu Gà Lá É Ớt Hiểm 79",
        "type": "Lẩu gà tiềm ớt hiểm cay nồng",
        "address": "05 Trần Cao Vân, Tam Thuận, Thanh Khê, Đà Nẵng",
        "rating": 4.5,
        "user_ratings_total": 1900,
        "price_level": "$",
        "distance_km": "4.5 km",
        "duration_walking": "10 phút lái xe",
        "highlight": "Gà ta thả vườn tiềm cùng ớt hiểm xanh và hạt sen, nước lẩu ngọt thơm kích thích vị giác.",
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "tags": ["lẩu gà", "lẩu", "ớt hiểm", "gà", "quán ăn"],
    },
    {
        "name": "Quán Lẩu Gà Đồi & Gà Nướng Lu",
        "type": "Gà đồi 3 món & Lẩu gà nấm",
        "address": "K139 Trần Quang Khải, Thọ Quang, Sơn Trà, Đà Nẵng",
        "rating": 4.6,
        "user_ratings_total": 2100,
        "price_level": "$$",
        "distance_km": "2.6 km",
        "duration_walking": "7 phút lái xe",
        "highlight": "Gà quê nguyên con: nửa nướng lu da giòn rụm, nửa nấu lẩu lá giang hoặc lẩu nấm thuốc bắc thơm lừng.",
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "tags": ["lẩu gà", "gà nướng", "lẩu", "gà", "quán ăn"],
    },
    {
        "name": "Lẩu Gà Lá Giang Bà Ba",
        "type": "Lẩu gà nấu lá giang truyền thống",
        "address": "45 Trương Nữ Vương, Bình Hiên, Hải Châu, Đà Nẵng",
        "rating": 4.5,
        "user_ratings_total": 1700,
        "price_level": "$",
        "distance_km": "3.8 km",
        "duration_walking": "8 phút lái xe",
        "highlight": "Vị chua dịu thanh mát từ lá giang tươi ăn kèm bún tươi và thịt gà đồi chấm muối ớt chanh chuẩn bài.",
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "tags": ["lẩu gà", "lá giang", "lẩu", "gà", "quán ăn"],
    },
]



def _parse_exclude_set(exclude_ids: Optional[Union[List[str], str]]) -> set:
    """Chuyển đổi danh sách exclude_ids (chuỗi hoặc mảng) thành set chữ thường để lọc trùng."""
    if not exclude_ids:
        return set()
    if isinstance(exclude_ids, str):
        raw_list = [item.strip() for item in re.split(r"[,;\n|]", exclude_ids) if item.strip()]
    elif isinstance(exclude_ids, list):
        raw_list = [str(item).strip() for item in exclude_ids if str(item).strip()]
    else:
        raw_list = []

    clean_set = set()
    for item in raw_list:
        clean_set.add(item.lower())
    return clean_set


def _is_excluded(place: Dict[str, Any], exclude_set: set) -> bool:
    """Kiểm tra xem địa điểm hoặc quán ăn có nằm trong danh sách cần loại trừ hay không."""
    if not exclude_set:
        return False
    p_id = str(place.get("place_id") or "").lower().strip()
    p_name = str(place.get("name") or "").lower().strip()

    if p_id and p_id in exclude_set:
        return True
    if p_name and p_name in exclude_set:
        return True

    # So khớp chuỗi con tương đối để bắt đúng tên quán rút gọn
    for ex in exclude_set:
        clean_ex = ex.replace("hải sản", "").replace("nhà hàng", "").replace("quán", "").strip()
        if len(clean_ex) >= 3 and (clean_ex in p_name or p_name in clean_ex):
            return True
        if len(ex) >= 4 and (ex in p_name or p_name in ex):
            return True
    return False



def _get_gmaps_client() -> Optional[googlemaps.Client]:
    """Khởi tạo Google Maps client nếu có API key hợp lệ."""
    if settings.GOOGLE_MAPS_API_KEY and settings.GOOGLE_MAPS_API_KEY.strip():
        try:
            return googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY.strip())
        except Exception as e:
            logger.warning(f"Không thể khởi tạo Google Maps Client: {e}")
    return None


def _build_embed_url(origin: str, destination: str) -> str:
    """Tạo Embed URL bản đồ (Google Maps directions embed)."""
    enc_orig = urllib.parse.quote(origin)
    enc_dest = urllib.parse.quote(destination)
    if settings.GOOGLE_MAPS_API_KEY and settings.GOOGLE_MAPS_API_KEY.strip():
        return f"https://www.google.com/maps/embed/v1/directions?key={settings.GOOGLE_MAPS_API_KEY.strip()}&origin={enc_orig}&destination={enc_dest}&mode=driving"
    # Fallback embed URL không cần API key
    return f"https://maps.google.com/maps?saddr={enc_orig}&daddr={enc_dest}&output=embed"


def _build_external_maps_url(origin: str, destination: str) -> str:
    """Tạo link mở Google Maps chính thức trên ứng dụng điện thoại hoặc trình duyệt."""
    enc_orig = urllib.parse.quote(origin)
    enc_dest = urllib.parse.quote(destination)
    return f"https://www.google.com/maps/dir/?api=1&origin={enc_orig}&destination={enc_dest}&travelmode=driving"


@tool
def search_place(query: str) -> Dict[str, Any]:
    """Tìm kiếm thông tin địa điểm du lịch, danh lam thắng cảnh tại Đà Nẵng và các vùng lân cận (Hội An, Bà Nà...).

    Args:
        query: Tên địa điểm cần tìm (VD: 'Bà Nà Hills', 'Phố cổ Hội An', 'Cầu Rồng', 'Ngũ Hành Sơn', 'Bán đảo Sơn Trà').
    """
    clean_query = query.strip()
    logger.info(f"Tool search_place: Searching for '{clean_query}'...")

    gmaps = _get_gmaps_client()
    places: List[Dict[str, Any]] = []

    # 1. Thử gọi Google Maps Places API nếu có API key
    if gmaps:
        try:
            search_text = f"{clean_query} Đà Nẵng" if "đà nẵng" not in clean_query.lower() and "hội an" not in clean_query.lower() else clean_query
            results = gmaps.places(
                query=search_text,
                location=(settings.HOTEL_LAT, settings.HOTEL_LNG),
                radius=50000,
            )
            raw_places = results.get("results", [])
            for p in raw_places[:3]:
                photo_url = None
                photos = p.get("photos", [])
                if photos and "photo_reference" in photos[0]:
                    ref = photos[0]["photo_reference"]
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference={ref}&key={settings.GOOGLE_MAPS_API_KEY}"

                # Match with curated image if available
                p_name_l = p.get("name", "").lower()
                for k, db_val in FAMOUS_PLACES_DB.items():
                    if k in p_name_l or k in clean_query.lower():
                        if not photo_url:
                            photo_url = db_val["image_url"]
                        break

                loc = p.get("geometry", {}).get("location", {})
                places.append({
                    "name": p.get("name"),
                    "address": p.get("formatted_address", "Đà Nẵng, Việt Nam"),
                    "rating": p.get("rating", 4.7),
                    "user_ratings_total": p.get("user_ratings_total", 1000),
                    "place_id": p.get("place_id"),
                    "image_url": photo_url or "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80",
                    "location": loc,
                    "types": p.get("types", []),
                })
        except Exception as ge:
            logger.warning(f"Google Maps Places API error: {ge}. Sử dụng dữ liệu dự phòng.")

    # 2. Fallback nếu không có kết quả từ Google Maps API
    if not places:
        q_l = clean_query.lower()
        matched = []
        for key, info in FAMOUS_PLACES_DB.items():
            if key in q_l or any(word in q_l for word in key.split()):
                matched.append(info)

        if not matched:
            # Nếu không khớp cụ thể, lấy các điểm nổi tiếng nhất
            matched = [
                FAMOUS_PLACES_DB["bà nà"],
                FAMOUS_PLACES_DB["cầu rồng"],
                FAMOUS_PLACES_DB["hội an"],
            ]

        for m in matched:
            places.append({
                "name": m["name"],
                "address": m["address"],
                "rating": m["rating"],
                "user_ratings_total": m["user_ratings_total"],
                "description": m["description"],
                "category": m["category"],
                "image_url": m["image_url"],
                "distance_km": m["distance_km"],
                "duration_minutes": m["duration_minutes"],
                "location": m.get("location"),
            })

    first_place = places[0] if places else None
    return {
        "success": True,
        "ui_type": "place_list",
        "ui_payload": places,
        "query": clean_query,
        "count": len(places),
        "places": places,
        "place": first_place,
        "origin_hotel": settings.HOTEL_NAME,
    }


@tool
def search_restaurants_or_cafes(
    keyword: str = "quán ăn",
    radius_meters: int = 5000,
    limit: int = 20,
    exclude_ids: Optional[Union[List[str], str]] = None,
) -> Dict[str, Any]:
    """Tìm kiếm quán ăn, nhà hàng hoặc quán cà phê gần Khách sạn Grand Luxury theo từ khóa cụ thể.

    Args:
        keyword: Từ khóa ẩm thực trích xuất chính xác từ yêu cầu của khách (VD: 'quán nướng', 'lẩu gà', 'hải sản', 'cafe', 'mì quảng', 'bánh tráng cuốn').
        radius_meters: Bán kính tìm kiếm quanh khách sạn theo mét (mặc định 5000m = 5km).
        limit: Số lượng quán cần trả về (mặc định là 20, tối đa 20).
        exclude_ids: Danh sách tên hoặc place_id các quán đã gợi ý trước đó cần loại trừ để không trùng lặp khi khách hỏi 'còn quán nào khác không'.
    """
    clean_keyword = keyword.strip()
    exclude_set = _parse_exclude_set(exclude_ids)
    effective_limit = max(1, min(int(limit), 20))
    logger.info(
        f"Tool search_restaurants_or_cafes: Searching '{clean_keyword}' "
        f"(limit: {effective_limit}, excluded: {len(exclude_set)} places)..."
    )

    gmaps = _get_gmaps_client()
    places: List[Dict[str, Any]] = []

    # 1. Thử gọi Google Maps Places (Text Search) nếu có API key
    if gmaps:
        try:
            query_str = f"{clean_keyword} Đà Nẵng" if "đà nẵng" not in clean_keyword.lower() else clean_keyword
            results = gmaps.places(
                query=query_str,
                location=(settings.HOTEL_LAT, settings.HOTEL_LNG),
                radius=radius_meters,
            )
            raw_places = results.get("results", [])
            for p in raw_places:
                if _is_excluded(p, exclude_set):
                    continue

                photo_url = None
                photos = p.get("photos", [])
                if photos and "photo_reference" in photos[0]:
                    ref = photos[0]["photo_reference"]
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference={ref}&key={settings.GOOGLE_MAPS_API_KEY}"

                places.append({
                    "name": p.get("name"),
                    "address": p.get("vicinity", p.get("formatted_address", "Đà Nẵng")),
                    "rating": p.get("rating", 4.5),
                    "user_ratings_total": p.get("user_ratings_total", 500),
                    "place_id": p.get("place_id"),
                    "image_url": photo_url or "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80",
                    "location": p.get("geometry", {}).get("location", {}),
                    "price_level": "$$" if p.get("price_level", 2) >= 2 else "$",
                })

                if len(places) >= effective_limit:
                    break
        except Exception as ge:
            logger.warning(f"Google Maps Places API error: {ge}")

    # 2. Fallback cơ sở dữ liệu nếu không có kết quả từ Google Maps hoặc không có API key
    if not places:
        kw_l = clean_keyword.lower()
        matched: List[Dict[str, Any]] = []

        # Tách từ khóa loại bỏ stop words
        stop_words = {"quán", "nhà", "hàng", "tiệm", "ăn", "uống", "ngon", "gần", "đây", "tại", "ở", "tp", "thành", "phố"}
        query_words = [w for w in kw_l.split() if w not in stop_words and len(w) > 1]

        # Bước 2.1: Tìm quán khớp với từ khóa tìm kiếm (chưa bị loại trừ)
        for r in RESTAURANTS_AND_CAFES_DB:
            if _is_excluded(r, exclude_set):
                continue
            r_name_l = r["name"].lower()
            r_tags = r.get("tags", [])
            r_type = r.get("type", "").lower()

            # Khớp trực tiếp tag hoặc name chứa cụm từ khóa
            is_match = False
            if kw_l in r_name_l or any(t in kw_l for t in r_tags) or any(kw_l in t for t in r_tags):
                is_match = True
            elif query_words and any(qw in r_name_l or any(qw in t for t in r_tags) or qw in r_type for qw in query_words):
                is_match = True

            if is_match:
                matched.append(r)

        # Bước 2.2: Chỉ bổ sung quán khác nếu là câu hỏi chung chung (quán ăn, ăn uống, ẩm thực)
        # TUYỆT ĐỐI KHÔNG bổ sung quán không liên quan nếu người dùng hỏi món cụ thể (VD: 'nướng', 'lẩu gà', 'chay', 'cafe')
        is_generic_query = any(gen in kw_l for gen in ["quán ăn", "ăn uống", "ẩm thực", "nhà hàng", "ăn gì"]) and not any(
            spec in kw_l for spec in ["nướng", "bbq", "lẩu", "gà", "hải sản", "cafe", "cà phê", "chè", "mì quảng", "bánh tráng", "bún"]
        )

        if is_generic_query and len(matched) < effective_limit:
            for r in RESTAURANTS_AND_CAFES_DB:
                if _is_excluded(r, exclude_set) or r in matched:
                    continue
                matched.append(r)
                if len(matched) >= effective_limit:
                    break

        for m in matched[:effective_limit]:
            places.append({
                "name": m["name"],
                "type": m["type"],
                "address": m["address"],
                "rating": m["rating"],
                "user_ratings_total": m["user_ratings_total"],
                "price_level": m["price_level"],
                "distance_km": m["distance_km"],
                "duration_walking": m["duration_walking"],
                "highlight": m["highlight"],
                "image_url": m["image_url"],
            })

    returned_names = [p["name"] for p in places]

    return {
        "success": True,
        "ui_type": "place_list",
        "ui_payload": places,
        "keyword": clean_keyword,
        "count": len(places),
        "places": places,
        "returned_names": returned_names,
        "hotel_name": settings.HOTEL_NAME,
        "hotel_address": settings.HOTEL_ADDRESS,
    }



@tool
def get_directions(destination: str, mode: str = "driving") -> Dict[str, Any]:
    """Tính khoảng cách, thời gian di chuyển và cung cấp bản đồ chỉ đường từ Khách sạn Grand Luxury đến địa điểm khách chọn.

    Args:
        destination: Điểm đến (VD: 'Bà Nà Hills', 'Phố cổ Hội An', 'Cầu Rồng', 'Sân bay Quốc tế Đà Nẵng', 'Hải sản Bé Mặn').
        mode: Phương tiện di chuyển: 'driving' (ô tô/xe máy), 'walking' (đi bộ), hoặc 'transit' (xe bus). Mặc định là 'driving'.
    """
    clean_dest = destination.strip()
    origin_name = settings.HOTEL_NAME
    origin_address = settings.HOTEL_ADDRESS
    logger.info(f"Tool get_directions: Origin '{origin_address}' -> Destination '{clean_dest}' (mode: {mode})")

    distance_text = "5.0 km"
    duration_text = "10 phút"
    start_addr = origin_address
    end_addr = clean_dest
    steps: List[str] = []

    gmaps = _get_gmaps_client()
    if gmaps:
        try:
            dirs = gmaps.directions(
                origin=origin_address,
                destination=f"{clean_dest}, Đà Nẵng, Việt Nam" if "việt nam" not in clean_dest.lower() else clean_dest,
                mode=mode,
                language="vi",
            )
            if dirs and len(dirs) > 0 and "legs" in dirs[0] and len(dirs[0]["legs"]) > 0:
                leg = dirs[0]["legs"][0]
                distance_text = leg.get("distance", {}).get("text", distance_text)
                duration_text = leg.get("duration", {}).get("text", duration_text)
                start_addr = leg.get("start_address", start_addr)
                end_addr = leg.get("end_address", end_addr)

                for step in leg.get("steps", [])[:5]:
                    instr = step.get("html_instructions", "")
                    clean_instr = re.sub(r"<[^>]+>", " ", instr).strip()
                    if clean_instr:
                        steps.append(clean_instr)
        except Exception as de:
            logger.warning(f"Google Maps Directions API error: {de}")

    # Fallback ước lượng khoảng cách chuẩn xác theo cơ sở dữ liệu Đà Nẵng
    if not steps:
        dest_l = clean_dest.lower()
        if "bà nà" in dest_l:
            distance_text = "38 km"
            duration_text = "50 phút lái xe"
            end_addr = "Sun World Bà Nà Hills, Hòa Ninh, Hòa Vang, Đà Nẵng"
            steps = ["Đi theo đường Võ Nguyên Giáp về hướng Nam", "Rẽ vào đường Bà Nà - Suối Mơ", "Đi thẳng đến cổng nhà ga cáp treo Bà Nà Hills"]
        elif "hội an" in dest_l:
            distance_text = "28 km"
            duration_text = "40 phút lái xe"
            end_addr = "Phố cổ Hội An, Minh An, Hội An, Quảng Nam"
            steps = ["Chạy dọc theo đường biển Võ Nguyên Giáp - Trường Sa", "Tiếp tục vào đường Lạc Long Quân", "Rẽ phải vào trung tâm phố cổ Hội An"]
        elif "cầu rồng" in dest_l:
            distance_text = "3.5 km"
            duration_text = "7 phút lái xe"
            end_addr = "Cầu Rồng, Nguyễn Văn Linh, Hải Châu, Đà Nẵng"
            steps = ["Từ khách sạn đi thẳng đường Võ Nguyên Giáp", "Rẽ phải vào đường Võ Văn Kiệt", "Đi thẳng 2.5km qua bùng binh là đến thẳng đầu Cầu Rồng"]
        elif "sơn trà" in dest_l or "linh ứng" in dest_l:
            distance_text = "9.5 km"
            duration_text = "15 phút lái xe"
            end_addr = "Chùa Linh Ứng, Bán đảo Sơn Trà, Thọ Quang, Sơn Trà, Đà Nẵng"
            steps = ["Chạy thẳng đường Hoàng Sa về hướng Bắc dọc biển", "Lên dốc bán đảo Sơn Trà theo biển chỉ dẫn", "Đến cổng chính Chùa Linh Ứng"]
        elif "ngũ hành sơn" in dest_l:
            distance_text = "8.0 km"
            duration_text = "12 phút lái xe"
            end_addr = "Ngũ Hành Sơn, 81 Huyền Trân Công Chúa, Hòa Hải, Ngũ Hành Sơn"
            steps = ["Chạy dọc đường Võ Nguyên Giáp về hướng Nam", "Tiếp tục vào đường Trường Sa", "Rẽ phải vào Huyền Trân Công Chúa"]
        elif "sân bay" in dest_l:
            distance_text = "6.0 km"
            duration_text = "12 phút lái xe"
            end_addr = "Cảng Hàng không Quốc tế Đà Nẵng, Hải Châu, Đà Nẵng"
            steps = ["Đi đường Nguyễn Văn Thoại qua Cầu Trần Thị Lý", "Tiếp tục theo đường Duy Tân", "Đi thẳng vào nhà ga T1/T2 sân bay"]
        elif "bé mặn" in dest_l:
            distance_text = "0.6 km"
            duration_text = "7 phút đi bộ / 1 phút lái xe"
            end_addr = "Hải sản Bé Mặn, Lô 11 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng"
            steps = ["Từ cửa khách sạn rẽ trái đi theo đường Võ Nguyên Giáp 500m là tới quán"]
        else:
            steps = ["Từ khách sạn đi theo đường biển Võ Nguyên Giáp", f"Di chuyển theo định vị Google Maps tới {clean_dest}"]

    embed_url = _build_embed_url(origin_address, end_addr)
    external_url = _build_external_maps_url(origin_address, end_addr)

    return {
        "success": True,
        "origin": origin_name,
        "origin_address": origin_address,
        "destination": clean_dest,
        "destination_address": end_addr,
        "distance_km": distance_text,
        "duration_minutes": duration_text,
        "mode": mode,
        "steps": steps,
        "map_embed_url": embed_url,
        "external_maps_url": external_url,
    }


DESTINATIONS_FALLBACK_DB: Dict[str, List[Dict[str, Any]]] = {
    "quảng bình": [
        {
            "name": "Vườn quốc gia Phong Nha - Kẻ Bàng",
            "place": "Động Phong Nha, Bố Trạch, Quảng Bình",
            "time": "08:00 - 11:30",
            "period": "Buổi sáng",
            "title": "Khám phá Kỳ quan Đệ nhất động Phong Nha",
            "activity": "Đi thuyền xuôi dòng sông Son ngắm núi đá vôi hùng vĩ, khám phá hang bi ký, thạch nhũ lung linh kỳ ảo trong lòng động Phong Nha.",
        },
        {
            "name": "Nhà hàng Ẩm thực Phong Nha",
            "place": "Thị trấn Phong Nha, Bố Trạch, Quảng Bình",
            "time": "12:00 - 13:30",
            "period": "Buổi trưa",
            "title": "Thưởng thức Đặc sản Cá mát sông Son & Gà nướng muối cheo",
            "activity": "Dùng bữa trưa đậm đà hương vị núi rừng Quảng Bình với cá mát sông Son, tôm nướng và gà đồi chấm muối cheo trứ danh.",
        },
        {
            "name": "Động Thiên Đường",
            "place": "Xã Sơn Trạch, Huyện Bố Trạch, Quảng Bình",
            "time": "14:00 - 17:00",
            "period": "Buổi chiều",
            "title": "Chinh phục Hoàng cung trong lòng đất - Động Thiên Đường",
            "activity": "Chiêm ngưỡng động khô dài nhất châu Á với hệ thống thạch nhũ triệu năm tráng lệ tựa chốn bồng lai tiên cảnh.",
        },
        {
            "name": "Suối Nước Moọc / Sông Chày Hang Tối",
            "place": "Phúc Trạch, Bố Trạch, Quảng Bình",
            "time": "08:30 - 12:00",
            "period": "Sáng ngày 2",
            "title": "Chèo kayak, zipline và ngâm mình tại Suối Nước Moọc / Sông Chày",
            "activity": "Trải nghiệm đu dây zipline trên không, chèo thuyền kayak làn nước xanh ngọc bích và tắm bùn tự nhiên trong Hang Tối.",
        },
        {
            "name": "Bãi biển Nhật Lệ & Đồi cát Quang Phú",
            "place": "Đồng Hới, Quảng Bình",
            "time": "15:30 - 18:30",
            "period": "Chiều ngày 2",
            "title": "Trượt cát Quang Phú & Ngắm hoàng hôn Biển Nhật Lệ",
            "activity": "Trải nghiệm trượt ván trên đồi cát trắng mịn màng Quang Phú, tắm biển và thưởng thức bánh xèo gạo lứt Quảng Hòa.",
        },
        {
            "name": "Chợ đêm Đồng Hới & Tượng đài Mẹ Suốt",
            "place": "Bên bờ sông Nhật Lệ, Đồng Hới, Quảng Bình",
            "time": "19:00 - 21:30",
            "period": "Buổi tối",
            "title": "Dạo mát sông Nhật Lệ & Khám phá Ẩm thực Đêm Đồng Hới",
            "activity": "Viếng Tượng đài Mẹ Suốt, dạo bộ ngắm cầu Nhật Lệ rực rỡ ánh đèn và ăn hải sản đêm, bánh bột lọc trứ danh.",
        },
    ],
    "đà nẵng": [
        {
            "name": "Bán đảo Sơn Trà & Chùa Linh Ứng",
            "place": "Chùa Linh Ứng, Sơn Trà, Đà Nẵng",
            "time": "08:00 - 10:30",
            "period": "Buổi sáng",
            "title": "Viếng Chùa Linh Ứng & Chiêm ngưỡng Vịnh Đà Nẵng",
            "activity": "Tham quan tượng Phật Bà Quan Âm cao 67m hướng biển, ngắm toàn cảnh thành phố biển và vịnh Đà Nẵng bao la.",
        },
        {
            "name": "Chợ Hàn & Ẩm thực Mì Quảng",
            "place": "Chợ Hàn, Hải Châu, Đà Nẵng",
            "time": "11:00 - 12:30",
            "period": "Buổi trưa",
            "title": "Khám phá Chợ Hàn & Thưởng thức Mì Quảng ếch / tôm thịt",
            "activity": "Mua sắm đặc sản chả bò, tré, mực rim me và ăn trưa Mì Quảng hương vị truyền thống đậm đà.",
        },
        {
            "name": "Sun World Bà Nà Hills & Cầu Vàng",
            "place": "Bà Nà Hills, Hòa Vang, Đà Nẵng",
            "time": "08:00 - 15:30",
            "period": "Ngày 2 (Sáng - Chiều)",
            "title": "Khám phá Xứ sở Thần tiên Bà Nà Hills & Cầu Vàng",
            "activity": "Trải nghiệm cáp treo kỷ lục thế giới, check-in Cầu Vàng bàn tay khổng lồ, dạo Làng Pháp và vui chơi Fantasy Park.",
        },
        {
            "name": "Danh thắng Ngũ Hành Sơn",
            "place": "Ngũ Hành Sơn, Hòa Hải, Ngũ Hành Sơn, Đà Nẵng",
            "time": "14:00 - 16:30",
            "period": "Buổi chiều",
            "title": "Khám phá Quần thể Động Huyền Không & Đỉnh Thủy Sơn",
            "activity": "Chinh phục đỉnh núi đá vôi, chiêm ngưỡng các hang động tự nhiên thanh mát và ghé thăm làng đá mỹ nghệ Non Nước.",
        },
        {
            "name": "Bãi biển Mỹ Khê & Cầu Rồng Sông Hàn",
            "place": "Cầu Rồng, Hải Châu, Đà Nẵng",
            "time": "18:00 - 21:30",
            "period": "Buổi tối",
            "title": "Tiệc Hải sản sát biển & Ngắm Cầu Rồng phun lửa / phun nước",
            "activity": "Ăn tối hải sản tươi sống tại quán Bé Mặn ven biển, dạo mát ngắm Cầu Rồng phun lửa và du thuyền sông Hàn.",
        },
    ],
    "huế": [
        {
            "name": "Đại Nội Huế (Hoàng Thành)",
            "place": "Đại Nội, Phú Hậu, TP Huế",
            "time": "08:00 - 11:30",
            "period": "Buổi sáng",
            "title": "Tham quan Di sản Cố Đô - Đại Nội Hoàng Thành Huế",
            "activity": "Chiêm ngưỡng Ngọ Môn, Điện Thái Hòa, Tử Cấm Thành và lắng nghe lịch sử triều Nguyễn hào hùng.",
        },
        {
            "name": "Ẩm thực Bún bò Huế & Bánh bèo chén",
            "place": "Trung tâm TP Huế",
            "time": "12:00 - 13:30",
            "period": "Buổi trưa",
            "title": "Thưởng thức Bún Bò Huế gia truyền & Bánh nậm lọc",
            "activity": "Thưởng thức tô bún bò chuẩn vị Huế thơm lừng mắm ruốc cùng khay bánh bèo, bánh nậm, ram ít nóng hổi.",
        },
        {
            "name": "Chùa Thiên Mụ & Lăng Khải Định",
            "place": "Hương Long & Thủy Bằng, TP Huế",
            "time": "14:00 - 17:30",
            "period": "Buổi chiều",
            "title": "Vãn cảnh Chùa Thiên Mụ cổ kính & Kiến trúc Lăng Khải Định",
            "activity": "Ngắm Tháp Phước Duyên bên dòng sông Hương thơ mộng, khám phá nghệ thuật ghép gốm sứ độc nhất vô nhị tại Lăng Khải Định.",
        },
        {
            "name": "Ca Huế trên Sông Hương",
            "place": "Bến thuyền Tòa Khâm, Sông Hương, Huế",
            "time": "19:00 - 21:00",
            "period": "Buổi tối",
            "title": "Nghe Ca Huế trên thuyền rồng & Thả đèn hoa đăng Sông Hương",
            "activity": "Lắng nghe những làn điệu dân ca Huế ngọt ngào trữ tình, thả hoa đăng lung linh cầu bình an trên dòng Hương Giang.",
        },
    ],
}


@tool
def suggest_dynamic_itinerary(
    destination: str = "Đà Nẵng",
    days: int = 1,
    preferences: str = "khám phá tổng hợp",
    target_audience: str = "gia đình",
) -> Dict[str, Any]:
    """Tự động lên lịch trình du lịch động từ 1 đến nhiều ngày cho bất kỳ địa danh, tỉnh thành nào (VD: Quảng Bình, Đà Nẵng, Huế, Hội An, Phú Quốc, Hà Giang...).
    Sử dụng Google Places Text Search để tìm kiếm các địa danh thực tế tại địa phương và tự động phân chia theo số ngày yêu cầu.

    Args:
        destination: Tên thành phố, tỉnh hoặc địa danh cần lên lịch trình (VD: 'Quảng Bình', 'Đà Nẵng', 'Huế', 'Nha Trang', 'Hà Giang'). Bắt buộc trích xuất đúng từ câu hỏi của khách.
        days: Số lượng ngày của chuyến đi (VD: 1, 2, 3 ngày). Mặc định là 1 ngày.
        preferences: Sở thích (VD: 'khám phá thiên nhiên', 'hang động', 'văn hóa lịch sử', 'nghỉ dưỡng', 'ẩm thực').
        target_audience: Đối tượng du khách: 'gia đình', 'cặp đôi', 'nhóm bạn', hoặc 'một mình'.
    """
    clean_dest = destination.strip() if destination else "Đà Nẵng"
    dest_l = clean_dest.lower()
    num_days = max(1, min(int(days or 1), 7))
    logger.info(f"Tool suggest_dynamic_itinerary: Destination='{clean_dest}', Days={num_days}, Pref='{preferences}', Audience='{target_audience}'")

    gmaps = _get_gmaps_client()
    found_attractions: List[Dict[str, Any]] = []

    # 1. Gọi Google Places Text Search tìm kiếm địa điểm du lịch & ẩm thực thực tế tại destination
    if gmaps:
        try:
            queries = [
                f"địa điểm du lịch nổi tiếng {clean_dest}",
                f"quán ăn đặc sản ngon {clean_dest}",
            ]
            for q in queries:
                res = gmaps.places(query=q)
                for p in res.get("results", [])[:6]:
                    name = p.get("name", "")
                    if name and not any(a["name"].lower() == name.lower() for a in found_attractions):
                        found_attractions.append({
                            "name": name,
                            "address": p.get("formatted_address", p.get("vicinity", clean_dest)),
                            "rating": p.get("rating", 4.5),
                        })
        except Exception as ge:
            logger.warning(f"Google Places API error in suggest_dynamic_itinerary: {ge}")

    # 2. Xây dựng lịch trình theo số ngày
    schedule: List[Dict[str, Any]] = []
    periods_pool = [
        ("08:00 - 11:30", "Buổi sáng"),
        ("12:00 - 13:30", "Buổi trưa"),
        ("14:00 - 17:00", "Buổi chiều"),
        ("18:30 - 21:30", "Buổi tối"),
    ]

    # Kiểm tra xem có dữ liệu địa phương từ fallback DB không (dành cho Quảng Bình, Huế, Đà Nẵng khi offline/no API key)
    matched_fallback_key = None
    for k in DESTINATIONS_FALLBACK_DB.keys():
        if k in dest_l or dest_l in k:
            matched_fallback_key = k
            break

    if matched_fallback_key:
        fallback_items = DESTINATIONS_FALLBACK_DB[matched_fallback_key]
        # Lấy số lượng địa điểm tương ứng với số ngày (mỗi ngày ~3-4 hoạt động)
        max_items = min(len(fallback_items), num_days * 3)
        schedule = fallback_items[:max_items]
    elif found_attractions:
        # Tự động chia các địa điểm tìm được từ Google Maps theo từng ngày
        item_idx = 0
        for d in range(1, num_days + 1):
            day_prefix = f"Ngày {d} - " if num_days > 1 else ""
            for time_slot, period_name in periods_pool:
                if item_idx >= len(found_attractions):
                    break
                attr = found_attractions[item_idx]
                schedule.append({
                    "time": time_slot,
                    "period": f"{day_prefix}{period_name}",
                    "title": f"Trải nghiệm & Tham quan {attr['name']}",
                    "activity": f"Ghé thăm {attr['name']}, trải nghiệm văn hóa và cảnh quan đặc sắc tại {attr.get('address', clean_dest)}.",
                    "place": attr["name"],
                })
                item_idx += 1
    else:
        # Fallback tổng quát cho mọi tỉnh thành khác
        schedule = [
            {
                "time": "08:00 - 11:30",
                "period": "Buổi sáng",
                "title": f"Tham quan Danh lam thắng cảnh nổi bật {clean_dest}",
                "activity": f"Khởi hành khám phá các danh thắng nổi tiếng nhất tại trung tâm {clean_dest}, tận hưởng không khí trong lành.",
                "place": f"Trung tâm du lịch {clean_dest}",
            },
            {
                "time": "12:00 - 13:30",
                "period": "Buổi trưa",
                "title": f"Thưởng thức Ẩm thực Đặc sản {clean_dest}",
                "activity": f"Dùng bữa trưa với các món ngon địa phương đặc sắc của vùng đất {clean_dest}.",
                "place": f"Nhà hàng Đặc sản {clean_dest}",
            },
            {
                "time": "14:00 - 17:30",
                "period": "Buổi chiều",
                "title": f"Khám phá Văn hóa & Check-in Thắng cảnh {clean_dest}",
                "activity": f"Trải nghiệm các hoạt động tham quan sinh thái, chụp ảnh lưu niệm và tìm hiểu nếp sống bản địa.",
                "place": f"Khu du lịch sinh thái {clean_dest}",
            },
            {
                "time": "18:30 - 21:00",
                "period": "Buổi tối",
                "title": f"Dạo chợ đêm & Thưởng thức ẩm thực đường phố {clean_dest}",
                "activity": f"Khám phá chợ đêm sầm uất, mua quà lưu niệm và thưởng thức ẩm thực đêm hấp dẫn tại {clean_dest}.",
                "place": f"Phố đi bộ & Chợ đêm {clean_dest}",
            },
        ]

    title = f"Lịch trình Du lịch {clean_dest} {num_days} Ngày Hoàn Hảo"

    return {
        "success": True,
        "title": title,
        "destination": clean_dest,
        "days": num_days,
        "target_audience": target_audience,
        "preferences": preferences,
        "hotel_origin": settings.HOTEL_NAME,
        "schedule": schedule,
        "travel_tips": [
            f"Quý khách nên chuẩn bị trang phục phù hợp với thời tiết và đặc thù địa hình tại {clean_dest}.",
            f"Khách sạn Grand Luxury hỗ trợ tư vấn xe đưa đón, thuê xe tự lái và hướng dẫn viên cho các tour liên tỉnh {clean_dest}.",
            "Nên đặt trước vé tham quan và dịch vụ thuyền/cáp treo vào mùa cao điểm để tránh chờ đợi lâu.",
        ],
    }


# Giữ alias suggest_day_itinerary để tương thích ngược
suggest_day_itinerary = suggest_dynamic_itinerary


