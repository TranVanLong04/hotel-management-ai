/**
 * Danh mục Album ảnh thử nghiệm tiêu chuẩn dùng cho kiểm thử và benchmark mô hình FaceNet & InsightFace.
 * Cung cấp các cặp ảnh Genuine (cùng một người) và Impostor (khác người) với đa dạng góc mặt, ánh sáng và biểu cảm.
 */

export const SAMPLE_ALBUM_PAIRS = [
  {
    id: 'pair-genuine-01',
    category: 'genuine',
    title: 'Cùng 1 người: Góc nhìn thẳng vs Biểu cảm tươi cười',
    description: 'Chụp chính diện trong cùng điều kiện ánh sáng phòng khách sạn, so sánh sự biến đổi biểu cảm khuôn mặt.',
    subjectName: 'Alex Johnson',
    image1: {
      label: 'Ảnh tham chiếu (Góc thẳng)',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    },
    image2: {
      label: 'Ảnh kiểm thử (Cười nhẹ)',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80&sat=15&con=10',
    },
    groundTruth: 'genuine',
    difficulty: 'standard',
  },
  {
    id: 'pair-genuine-02',
    category: 'genuine',
    title: 'Cùng 1 người: Ánh sáng studio vs Ánh sáng tự nhiên',
    description: 'Kiểm tra độ bền vững của vector đặc trưng trước sự thay đổi nhiệt độ màu và tương phản ánh sáng.',
    subjectName: 'David Miller',
    image1: {
      label: 'Ảnh tham chiếu (Studio)',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    },
    image2: {
      label: 'Ảnh kiểm thử (Ánh sáng ngoài trời)',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80&sat=20&con=15',
    },
    groundTruth: 'genuine',
    difficulty: 'medium',
  },
  {
    id: 'pair-genuine-03',
    category: 'genuine',
    title: 'Cùng 1 người: Nghiêng góc 15 độ & bóng đổ',
    description: 'Kiểm tra thuật toán căn chỉnh mặt (Face Alignment) của RetinaFace và tiền xử lý FaceNet.',
    subjectName: 'Sarah Williams',
    image1: {
      label: 'Ảnh tham chiếu (Thẳng)',
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    },
    image2: {
      label: 'Ảnh kiểm thử (Nghiêng nhẹ)',
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80&sat=10&con=5',
    },
    groundTruth: 'genuine',
    difficulty: 'hard',
  },
  {
    id: 'pair-impostor-01',
    category: 'impostor',
    title: 'Khác người: Hai cá nhân cùng độ tuổi & kiểu tóc (Thử thách khó)',
    description: 'Thử nghiệm khả năng phân biệt cá thể của mô hình đối với các khuôn mặt có nhiều nét tương đồng.',
    subjectName: 'Subject A vs Subject B',
    image1: {
      label: 'Ảnh tham chiếu (Người A)',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    },
    image2: {
      label: 'Ảnh kiểm thử (Người B)',
      url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    },
    groundTruth: 'impostor',
    difficulty: 'hard',
  },
  {
    id: 'pair-impostor-02',
    category: 'impostor',
    title: 'Khác người: Khác biệt rõ rệt về nhân trắc học',
    description: 'Kiểm tra False Match Rate (FMR) đối với 2 người có cấu trúc xương mặt và đặc điểm hoàn toàn khác nhau.',
    subjectName: 'Subject C vs Subject D',
    image1: {
      label: 'Ảnh tham chiếu (Người C)',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    },
    image2: {
      label: 'Ảnh kiểm thử (Người D)',
      url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    },
    groundTruth: 'impostor',
    difficulty: 'standard',
  },
  {
    id: 'pair-impostor-03',
    category: 'impostor',
    title: 'Khác người: Nam vs Nữ',
    description: 'Baseline test cho kiểm tra độ phân rã khoảng cách đặc trưng.',
    subjectName: 'Subject E vs Subject F',
    image1: {
      label: 'Ảnh tham chiếu (Nữ)',
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    },
    image2: {
      label: 'Ảnh kiểm thử (Nam)',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    },
    groundTruth: 'impostor',
    difficulty: 'standard',
  },
];
