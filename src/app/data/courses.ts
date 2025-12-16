export interface Course {
  id: number;
  title: string;
  instructor: string;
  type: 'online' | 'offline';
  level: 'basic' | 'intermediate' | 'advanced';
  duration: string;
  price: number;
  originalPrice?: number;
  rating: number;
  students: number;
  image: string;
  description: string;
  features: string[];
  whatYouWillLearn: string[];
  requirements: string[];
  curriculum: {
    week: number;
    title: string;
    description: string;
  }[];
  instructorInfo: {
    name: string;
    bio: string;
    experience: string;
    specialties: string[];
  };
  schedule?: {
    frequency: '1 session/week' | '2 sessions/week';
    duration: string;
    timeSlots: string[];
  };
  // New fields for the updated system
  totalSessions: number; // Always 12 sessions per level
  maxSessions: number; // Maximum 12 sessions per course
  canEnrollNextLevel: boolean; // Can enroll in next level after completing current
}

export const courses: Course[] = [
  {
    id: 1,
    title: "Guitar Cơ Bản - Từ Zero đến Hero",
    instructor: "Phúc Nguyễn",
    type: "online",
    level: "basic",
    duration: "9 tuần (2 buổi/tuần) hoặc 18 tuần (1 buổi/tuần)",
    price: 2800000,
    originalPrice: 3500000,
    rating: 4.9,
    students: 1247,
    image: "/wallpaper-1.jpg",
    description: "Khóa học guitar cơ bản hoàn chỉnh với 12 buổi học. Lớp học từ 3-5 bạn trong thời gian 1 tiếng 30 phút 1 buổi. Bạn sẽ học được cách cầm đàn, đánh hợp âm cơ bản, chơi được 10+ bài hát yêu thích và tự tin biểu diễn trước đám đông.",
    features: [
      "Video HD chất lượng cao",
      "Tài liệu PDF chi tiết", 
      "Hỗ trợ 24/7 qua chat",
      "Chứng chỉ hoàn thành",
      "Truy cập trọn đời",
      "Cộng đồng học viên"
    ],
    curriculum: [
      { week: 1, title: "Làm quen với guitar", description: "Giới thiệu về guitar, cách cầm đàn, tư thế ngồi và đứng" },
      { week: 2, title: "Luyện ngón tay cơ bản", description: "Bài tập luyện ngón, kỹ thuật cơ bản" },
      { week: 3, title: "Hợp âm cơ bản - Phần 1", description: "Hợp âm C, G, Am, F và cách bấm đúng" },
      { week: 4, title: "Hợp âm cơ bản - Phần 2", description: "Chuyển hợp âm mượt mà, bài tập thực hành" },
      { week: 5, title: "Điệu đàn Ballad", description: "Điệu Ballad và Slow Rock cơ bản" },
      { week: 6, title: "Điệu đàn Valse", description: "Điệu Valse và Country" },
      { week: 7, title: "Kết hợp hợp âm và điệu", description: "Thực hành với bài hát đơn giản" },
      { week: 8, title: "Kỹ thuật Fingerpicking", description: "Fingerpicking cơ bản và ứng dụng" },
      { week: 9, title: "Solo guitar đơn giản", description: "Kỹ thuật solo cơ bản" },
      { week: 10, title: "Thực hành bài hát", description: "Chơi hoàn chỉnh 3-5 bài hát" },
      { week: 11, title: "Biểu diễn và trình bày", description: "Kỹ năng biểu diễn trước đám đông" },
      { week: 12, title: "Kiểm tra cuối khóa", description: "Đánh giá và cấp chứng chỉ" }
    ],
    requirements: [
      "Có đàn guitar (acoustic hoặc classic)",
      "Máy tính hoặc điện thoại có kết nối internet",
      "Thời gian luyện tập 30-45 phút/ngày",
      "Không cần kinh nghiệm trước đó"
    ],
    whatYouWillLearn: [
      "Cách cầm đàn và tư thế chơi đúng",
      "Bấm được 8 hợp âm cơ bản",
      "Chơi được 5 điệu đàn phổ biến", 
      "Đánh được 10+ bài hát yêu thích",
      "Kỹ thuật Fingerpicking cơ bản",
      "Tự tin biểu diễn trước đám đông"
    ],
    instructorInfo: {
      name: "Phúc Nguyễn",
      bio: "Nghệ sĩ guitar với hơn 15 năm kinh nghiệm biểu diễn và giảng dạy. Từng là guitarist chính của nhiều ban nhạc nổi tiếng tại Việt Nam.",
      experience: "15+ năm",
      specialties: ["Guitar acoustic", "Fingerpicking", "Solo guitar", "Sáng tác"]
    },
    totalSessions: 12,
    maxSessions: 12,
    canEnrollNextLevel: true
  },
  {
    id: 2,
    title: "Guitar Trung Cấp - Nâng Cao Kỹ Năng",
    instructor: "Phúc Nguyễn", 
    type: "online",
    level: "intermediate",
    duration: "9 tuần (2 buổi/tuần) hoặc 18 tuần (1 buổi/tuần)",
    price: 2800000,
    originalPrice: 3500000,
    rating: 4.8,
    students: 456,
    image: "/wallpaper-2.jpg",
    description: "Khóa học guitar trung cấp dành cho học viên đã hoàn thành level cơ bản. 12 buổi học nâng cao kỹ năng với các kỹ thuật phức tạp hơn và phong cách đa dạng.",
    features: [
      "Video HD chất lượng cao",
      "Tài liệu PDF chi tiết",
      "Hỗ trợ 24/7 qua chat", 
      "Chứng chỉ hoàn thành",
      "Truy cập trọn đời",
      "Cộng đồng học viên"
    ],
    curriculum: [
      { week: 1, title: "Hợp âm nâng cao", description: "Hợp âm 7, 9, sus, add và ứng dụng" },
      { week: 2, title: "Kỹ thuật Barre", description: "Bấm hợp âm Barre và chuyển đổi" },
      { week: 3, title: "Điệu đàn phức tạp", description: "Bossa Nova, Jazz, Blues" },
      { week: 4, title: "Fingerpicking nâng cao", description: "Kỹ thuật fingerpicking phức tạp" },
      { week: 5, title: "Solo guitar trung cấp", description: "Kỹ thuật solo và improvisation" },
      { week: 6, title: "Scale và Mode", description: "Các thang âm và mode cơ bản" },
      { week: 7, title: "Hòa âm phức tạp", description: "Hòa âm Jazz và Blues" },
      { week: 8, title: "Kỹ thuật đặc biệt", description: "Hammer-on, Pull-off, Slide" },
      { week: 9, title: "Phong cách âm nhạc", description: "Rock, Pop, Folk, Country" },
      { week: 10, title: "Sáng tác cơ bản", description: "Cách sáng tác giai điệu và hợp âm" },
      { week: 11, title: "Recording và Production", description: "Kỹ thuật thu âm cơ bản" },
      { week: 12, title: "Kiểm tra cuối khóa", description: "Đánh giá và cấp chứng chỉ" }
    ],
    requirements: [
      "Đã hoàn thành khóa Guitar Cơ Bản",
      "Có đàn guitar (acoustic hoặc classic)",
      "Máy tính hoặc điện thoại có kết nối internet",
      "Thời gian luyện tập 45-60 phút/ngày"
    ],
    whatYouWillLearn: [
      "Bấm được các hợp âm nâng cao",
      "Kỹ thuật Barre thành thạo",
      "Chơi được nhiều phong cách âm nhạc",
      "Solo guitar trung cấp",
      "Kỹ thuật Fingerpicking nâng cao",
      "Sáng tác giai điệu cơ bản"
    ],
    instructorInfo: {
      name: "Phúc Nguyễn",
      bio: "Nghệ sĩ guitar với hơn 15 năm kinh nghiệm biểu diễn và giảng dạy. Từng là guitarist chính của nhiều ban nhạc nổi tiếng tại Việt Nam.",
      experience: "15+ năm", 
      specialties: ["Guitar acoustic", "Fingerpicking", "Solo guitar", "Sáng tác"]
    },
    totalSessions: 12,
    maxSessions: 12,
    canEnrollNextLevel: true
  },
  {
    id: 3,
    title: "Guitar Nâng Cao - Masterclass",
    instructor: "Minh Đức",
    type: "offline",
    level: "advanced", 
    duration: "9 tuần (2 buổi/tuần) hoặc 18 tuần (1 buổi/tuần)",
    price: 2800000,
    originalPrice: 3500000,
    rating: 4.95,
    students: 89,
    image: "/wallpaper-3.jpg",
    description: "Khóa học guitar nâng cao dành cho học viên đã hoàn thành level trung cấp. 12 buổi học masterclass với các kỹ thuật chuyên nghiệp và phong cách đa dạng.",
    features: [
      "Học trực tiếp 1-1 với giảng viên",
      "Studio chuyên nghiệp",
      "Recording session cá nhân",
      "Biểu diễn cuối khóa tại sân khấu",
      "Tài liệu độc quyền",
      "Mentorship 6 tháng sau khóa học"
    ],
    curriculum: [
      { week: 1, title: "Kỹ thuật chuyên nghiệp", description: "Advanced fingerpicking và hybrid picking" },
      { week: 2, title: "Jazz Harmony", description: "Hòa âm Jazz phức tạp và ứng dụng" },
      { week: 3, title: "Classical Guitar", description: "Kỹ thuật guitar cổ điển" },
      { week: 4, title: "Flamenco Techniques", description: "Kỹ thuật Flamenco cơ bản" },
      { week: 5, title: "Advanced Improvisation", description: "Improvisation nâng cao và modal playing" },
      { week: 6, title: "Composition", description: "Sáng tác và arrangement" },
      { week: 7, title: "Performance Techniques", description: "Kỹ thuật biểu diễn chuyên nghiệp" },
      { week: 8, title: "Music Theory", description: "Lý thuyết âm nhạc nâng cao" },
      { week: 9, title: "Genre Mastery", description: "Thành thạo nhiều phong cách âm nhạc" },
      { week: 10, title: "Recording & Production", description: "Thu âm và sản xuất âm nhạc" },
      { week: 11, title: "Teaching Methods", description: "Phương pháp giảng dạy guitar" },
      { week: 12, title: "Final Performance", description: "Biểu diễn cuối khóa và đánh giá" }
    ],
    requirements: [
      "Đã hoàn thành khóa Guitar Trung Cấp",
      "Có đàn guitar (acoustic hoặc classic)",
      "Thời gian luyện tập 60-90 phút/ngày",
      "Cam kết tham gia đầy đủ các buổi học"
    ],
    whatYouWillLearn: [
      "Kỹ thuật guitar chuyên nghiệp",
      "Hòa âm Jazz phức tạp",
      "Kỹ thuật guitar cổ điển",
      "Improvisation nâng cao",
      "Sáng tác và arrangement",
      "Kỹ năng biểu diễn chuyên nghiệp"
    ],
    instructorInfo: {
      name: "Minh Đức",
      bio: "Guitarist chuyên nghiệp với 20 năm kinh nghiệm. Từng học tại Berklee College of Music và biểu diễn tại nhiều festival quốc tế.",
      experience: "20+ năm",
      specialties: ["Jazz Guitar", "Classical Guitar", "Composition", "Music Production"]
    },
    schedule: {
      frequency: "2 sessions/week",
      duration: "1.5 hours per session",
      timeSlots: ["19:00-20:30", "20:30-22:00"]
    },
    totalSessions: 12,
    maxSessions: 12,
    canEnrollNextLevel: false
  }
];