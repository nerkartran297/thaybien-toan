// Student Management System Data Types

export interface Student {
  id: string;
  email: string;
  password: string; // Will be hashed in production
  fullName: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  registrationDate: string;
  status: 'pending' | 'active' | 'suspended' | 'completed';
  courses: StudentCourse[];
}

export interface StudentCourse {
  id: string;
  courseId: string;
  courseName: string;
  courseType: 'online' | 'offline';
  registrationDate: string;
  status: 'pending_approval' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  approvedDate?: string;
  approvedBy?: string;
  schedule: StudentSchedule;
  attendance: AttendanceRecord[];
}

export interface StudentSchedule {
  frequency: 1 | 2; // 1 or 2 sessions per week
  sessions: ScheduleSession[];
  makeUpSessions: MakeUpSession[];
}

export interface ScheduleSession {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  timeSlot: string; // e.g., "19:00-20:30"
  classId: string;
  className: string;
  instructor: string;
  room: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface MakeUpSession {
  id: string;
  originalSessionId: string;
  newSessionId: string;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedDate?: string;
}

export interface AttendanceRecord {
  sessionId: string;
  date: string;
  status: 'present' | 'absent' | 'excused' | 'makeup';
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface ClassCancellation {
  id: string;
  classId: string;
  className: string;
  date: string;
  timeSlot: string;
  instructor: string;
  reason: string;
  cancelledBy: string; // Instructor ID
  cancelledAt: string;
  affectedStudents: string[]; // Student IDs
  makeupSessionsCreated: boolean; // Đã tạo buổi học bù chưa
}

export interface StudentAttendanceSummary {
  studentId: string;
  courseId: string;
  totalSessions: number; // 12
  attendedSessions: number; // Số buổi học đúng lịch
  makeupSessions: number; // Số buổi học bù
  excusedAbsences: number; // Số buổi vắng có phép
  unexcusedAbsences: number; // Số buổi vắng không phép
  // Công thức: 12 - unexcusedAbsences = attendedSessions + makeupSessions - excusedAbsences
}

export interface ClassSchedule {
  id: string;
  dayOfWeek: number;
  timeSlot: string;
  timeCategory: 'morning' | 'afternoon' | 'evening';
  instructor: string;
  room: string;
  maxCapacity: number;
  currentEnrollment: number;
  courseType: 'online' | 'offline';
  courseLevel: 'basic' | 'intermediate' | 'advanced'; // Mỗi lớp chỉ có 1 level
  isActive: boolean;
  availableSlots: number;
}

export interface CourseRegistration {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  courseType: 'online' | 'offline';
  courseLevel: 'basic' | 'intermediate' | 'advanced'; // Level cụ thể của khóa học
  registrationDate: string;
  status: 'pending' | 'approved' | 'rejected';
  studentInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  requestedSchedule: {
    frequency: 1 | 2; // 1 hoặc 2 buổi/tuần
    preferredDays: number[];
    preferredTimeSlots: string[];
  };
  adminNotes?: string;
  processedBy?: string;
  processedDate?: string;
  totalSessions: number; // Tổng số buổi học (luôn là 12)
  completedSessions: number; // Số buổi đã hoàn thành
  remainingSessions: number; // Số buổi còn lại
  canEnrollNextLevel: boolean; // Có thể đăng ký level tiếp theo
}

// Sample data - Every day has all time slots
export const sampleClassSchedules: ClassSchedule[] = [
  // Monday (1) - All time slots
  {
    id: 'class-monday-morning-1',
    dayOfWeek: 1,
    timeSlot: '07:00-08:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 2,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 2
  },
  {
    id: 'class-monday-morning-2',
    dayOfWeek: 1,
    timeSlot: '09:00-10:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 4,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 0
  },
  {
    id: 'class-monday-afternoon-1',
    dayOfWeek: 1,
    timeSlot: '13:00-14:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-monday-afternoon-2',
    dayOfWeek: 1,
    timeSlot: '15:00-16:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 3,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 1
  },
  {
    id: 'class-monday-evening-1',
    dayOfWeek: 1,
    timeSlot: '17:30-19:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 3,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 2
  },
  {
    id: 'class-monday-evening-2',
    dayOfWeek: 1,
    timeSlot: '19:30-21:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 5,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 0
  },
  {
    id: 'class-monday-evening-3',
    dayOfWeek: 1,
    timeSlot: '21:30-23:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 4
  },

  // Tuesday (2) - All time slots
  {
    id: 'class-tuesday-morning-1',
    dayOfWeek: 2,
    timeSlot: '07:00-08:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-tuesday-morning-2',
    dayOfWeek: 2,
    timeSlot: '09:00-10:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 2,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 2
  },
  {
    id: 'class-tuesday-afternoon-1',
    dayOfWeek: 2,
    timeSlot: '13:00-14:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 3,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 1
  },
  {
    id: 'class-tuesday-afternoon-2',
    dayOfWeek: 2,
    timeSlot: '15:00-16:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 4,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 0
  },
  {
    id: 'class-tuesday-evening-1',
    dayOfWeek: 2,
    timeSlot: '17:30-19:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 2,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-tuesday-evening-2',
    dayOfWeek: 2,
    timeSlot: '19:30-21:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Online',
    maxCapacity: 10,
    currentEnrollment: 7,
    courseType: 'online',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-tuesday-evening-3',
    dayOfWeek: 2,
    timeSlot: '21:30-23:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 0,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 5
  },

  // Wednesday (3) - All time slots
  {
    id: 'class-wednesday-morning-1',
    dayOfWeek: 3,
    timeSlot: '07:00-08:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-wednesday-morning-2',
    dayOfWeek: 3,
    timeSlot: '09:00-10:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 3,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 1
  },
  {
    id: 'class-wednesday-afternoon-1',
    dayOfWeek: 3,
    timeSlot: '13:00-14:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 0,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 4
  },
  {
    id: 'class-wednesday-afternoon-2',
    dayOfWeek: 3,
    timeSlot: '15:00-16:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 2,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 2
  },
  {
    id: 'class-wednesday-evening-1',
    dayOfWeek: 3,
    timeSlot: '17:30-19:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 4,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 1
  },
  {
    id: 'class-wednesday-evening-2',
    dayOfWeek: 3,
    timeSlot: '19:30-21:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 2,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-wednesday-evening-3',
    dayOfWeek: 3,
    timeSlot: '21:30-23:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 4
  },

  // Thursday (4) - All time slots
  {
    id: 'class-thursday-morning-1',
    dayOfWeek: 4,
    timeSlot: '07:00-08:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 2,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 2
  },
  {
    id: 'class-thursday-morning-2',
    dayOfWeek: 4,
    timeSlot: '09:00-10:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-thursday-afternoon-1',
    dayOfWeek: 4,
    timeSlot: '13:00-14:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-thursday-afternoon-2',
    dayOfWeek: 4,
    timeSlot: '15:00-16:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 3,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 1
  },
  {
    id: 'class-thursday-evening-1',
    dayOfWeek: 4,
    timeSlot: '17:30-19:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 0,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 5
  },
  {
    id: 'class-thursday-evening-2',
    dayOfWeek: 4,
    timeSlot: '19:30-21:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Online',
    maxCapacity: 10,
    currentEnrollment: 5,
    courseType: 'online',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 5
  },
  {
    id: 'class-thursday-evening-3',
    dayOfWeek: 4,
    timeSlot: '21:30-23:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 3,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 2
  },

  // Friday (5) - All time slots
  {
    id: 'class-friday-morning-1',
    dayOfWeek: 5,
    timeSlot: '07:00-08:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 0,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 4
  },
  {
    id: 'class-friday-morning-2',
    dayOfWeek: 5,
    timeSlot: '09:00-10:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 2,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 2
  },
  {
    id: 'class-friday-afternoon-1',
    dayOfWeek: 5,
    timeSlot: '13:00-14:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 4,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 0
  },
  {
    id: 'class-friday-afternoon-2',
    dayOfWeek: 5,
    timeSlot: '15:00-16:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-friday-evening-1',
    dayOfWeek: 5,
    timeSlot: '17:30-19:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 2,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-friday-evening-2',
    dayOfWeek: 5,
    timeSlot: '19:30-21:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 4
  },
  {
    id: 'class-friday-evening-3',
    dayOfWeek: 5,
    timeSlot: '21:30-23:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 4
  },

  // Saturday (6) - All time slots
  {
    id: 'class-saturday-morning-1',
    dayOfWeek: 6,
    timeSlot: '07:00-08:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 3,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 1
  },
  {
    id: 'class-saturday-morning-2',
    dayOfWeek: 6,
    timeSlot: '09:00-10:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 0,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 4
  },
  {
    id: 'class-saturday-afternoon-1',
    dayOfWeek: 6,
    timeSlot: '13:00-14:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 2,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 2
  },
  {
    id: 'class-saturday-afternoon-2',
    dayOfWeek: 6,
    timeSlot: '15:00-16:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 4,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 0
  },
  {
    id: 'class-saturday-evening-1',
    dayOfWeek: 6,
    timeSlot: '17:30-19:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 5,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 0
  },
  {
    id: 'class-saturday-evening-2',
    dayOfWeek: 6,
    timeSlot: '19:30-21:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 3,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 2
  },
  {
    id: 'class-saturday-evening-3',
    dayOfWeek: 6,
    timeSlot: '21:30-23:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 0,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 5
  },

  // Sunday (0) - All time slots
  {
    id: 'class-sunday-morning-1',
    dayOfWeek: 0,
    timeSlot: '07:00-08:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-sunday-morning-2',
    dayOfWeek: 0,
    timeSlot: '09:00-10:30',
    timeCategory: 'morning',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 4,
    currentEnrollment: 4,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 0
  },
  {
    id: 'class-sunday-afternoon-1',
    dayOfWeek: 0,
    timeSlot: '13:00-14:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 0,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 4
  },
  {
    id: 'class-sunday-afternoon-2',
    dayOfWeek: 0,
    timeSlot: '15:00-16:30',
    timeCategory: 'afternoon',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A2',
    maxCapacity: 4,
    currentEnrollment: 2,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 2
  },
  {
    id: 'class-sunday-evening-1',
    dayOfWeek: 0,
    timeSlot: '17:30-19:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 2,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 3
  },
  {
    id: 'class-sunday-evening-2',
    dayOfWeek: 0,
    timeSlot: '19:30-21:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 4,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 1
  },
  {
    id: 'class-sunday-evening-3',
    dayOfWeek: 0,
    timeSlot: '21:30-23:00',
    timeCategory: 'evening',
    instructor: 'Phúc Nguyễn',
    room: 'Phòng A1',
    maxCapacity: 5,
    currentEnrollment: 1,
    courseType: 'offline',
    courseLevel: 'basic',
    isActive: true,
    availableSlots: 4
  }
];

export const sampleStudents: Student[] = [
  {
    id: 'student-1',
    email: 'nguyen.van.a@gmail.com',
    password: 'hashedpassword123',
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    dateOfBirth: '1995-05-15',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    emergencyContact: {
      name: 'Nguyễn Thị B',
      phone: '0907654321',
      relationship: 'Vợ/Chồng'
    },
    registrationDate: '2024-12-01',
    status: 'active',
    courses: []
  },
  {
    id: 'student-2',
    email: 'tran.thi.b@gmail.com',
    password: 'hashedpassword456',
    fullName: 'Trần Thị B',
    phone: '0902345678',
    dateOfBirth: '1998-08-20',
    address: '456 Đường XYZ, Quận 3, TP.HCM',
    emergencyContact: {
      name: 'Trần Văn C',
      phone: '0908765432',
      relationship: 'Anh trai'
    },
    registrationDate: '2024-12-05',
    status: 'active',
    courses: []
  },
  {
    id: 'student-3',
    email: 'le.van.c@gmail.com',
    password: 'hashedpassword789',
    fullName: 'Lê Văn C',
    phone: '0903456789',
    dateOfBirth: '1992-12-10',
    address: '789 Đường DEF, Quận 7, TP.HCM',
    emergencyContact: {
      name: 'Lê Thị D',
      phone: '0909876543',
      relationship: 'Chị gái'
    },
    registrationDate: '2025-10-12',
    status: 'active',
    courses: []
  },
  {
    id: 'student-4',
    email: 'pham.thi.d@gmail.com',
    password: 'hashedpassword101',
    fullName: 'Phạm Thị D',
    phone: '0904567890',
    dateOfBirth: '1996-03-18',
    address: '321 Đường GHI, Quận 3, TP.HCM',
    emergencyContact: {
      name: 'Phạm Văn E',
      phone: '0904567891',
      relationship: 'Bố'
    },
    registrationDate: '2025-10-08',
    status: 'active',
    courses: []
  },
  {
    id: 'student-5',
    email: 'hoang.van.e@gmail.com',
    password: 'hashedpassword202',
    fullName: 'Hoàng Văn E',
    phone: '0905678901',
    dateOfBirth: '1994-07-25',
    address: '654 Đường JKL, Quận 4, TP.HCM',
    emergencyContact: {
      name: 'Hoàng Thị F',
      phone: '0905678902',
      relationship: 'Mẹ'
    },
    registrationDate: '2025-10-15',
    status: 'active',
    courses: []
  },
  {
    id: 'student-6',
    email: 'vu.thi.f@gmail.com',
    password: 'hashedpassword303',
    fullName: 'Vũ Thị F',
    phone: '0906789012',
    dateOfBirth: '1997-11-12',
    address: '987 Đường MNO, Quận 5, TP.HCM',
    emergencyContact: {
      name: 'Vũ Văn G',
      phone: '0906789013',
      relationship: 'Chồng'
    },
    registrationDate: '2025-10-20',
    status: 'active',
    courses: []
  },
  {
    id: 'student-7',
    email: 'dang.van.g@gmail.com',
    password: 'hashedpassword404',
    fullName: 'Đặng Văn G',
    phone: '0907890123',
    dateOfBirth: '1993-09-30',
    address: '147 Đường PQR, Quận 6, TP.HCM',
    emergencyContact: {
      name: 'Đặng Thị H',
      phone: '0907890124',
      relationship: 'Vợ'
    },
    registrationDate: '2025-10-18',
    status: 'active',
    courses: []
  },
  {
    id: 'student-8',
    email: 'bui.thi.h@gmail.com',
    password: 'hashedpassword505',
    fullName: 'Bùi Thị H',
    phone: '0908901234',
    dateOfBirth: '1999-01-08',
    address: '258 Đường STU, Quận 8, TP.HCM',
    emergencyContact: {
      name: 'Bùi Văn I',
      phone: '0908901235',
      relationship: 'Anh trai'
    },
    registrationDate: '2025-10-22',
    status: 'active',
    courses: []
  }
];

export const sampleRegistrations: CourseRegistration[] = [
  {
    id: 'reg-1',
    studentId: 'student-1',
    courseId: 'course-1',
    courseName: 'Guitar Cơ Bản - Từ Zero đến Hero',
    courseType: 'offline',
    courseLevel: 'basic',
    registrationDate: '2025-10-15',
    status: 'approved',
    studentInfo: {
      fullName: 'Nguyễn Văn A',
      email: 'nguyen.van.a@gmail.com',
      phone: '0901234567'
    },
    requestedSchedule: {
      frequency: 2,
      preferredDays: [1, 3], // Monday, Wednesday
      preferredTimeSlots: ['17:30-19:00', '19:30-21:00']
    },
    totalSessions: 12,
    completedSessions: 3,
    remainingSessions: 9,
    canEnrollNextLevel: false
  },
  {
    id: 'reg-2',
    studentId: 'student-2',
    courseId: 'course-2',
    courseName: 'Guitar Cơ Bản - Từ Zero đến Hero',
    courseType: 'online',
    courseLevel: 'basic',
    registrationDate: '2025-10-10',
    status: 'approved',
    studentInfo: {
      fullName: 'Trần Thị B',
      email: 'tran.thi.b@gmail.com',
      phone: '0902345678'
    },
    requestedSchedule: {
      frequency: 1,
      preferredDays: [2, 4], // Tuesday, Thursday
      preferredTimeSlots: ['19:30-21:00']
    },
    totalSessions: 12,
    completedSessions: 3,
    remainingSessions: 9,
    canEnrollNextLevel: false
  },
  {
    id: 'reg-3',
    studentId: 'student-3',
    courseId: 'course-1',
    courseName: 'Guitar Cơ Bản - Từ Zero đến Hero',
    courseType: 'offline',
    courseLevel: 'basic',
    registrationDate: '2025-10-20',
    status: 'approved',
    studentInfo: {
      fullName: 'Lê Văn C',
      email: 'le.van.c@gmail.com',
      phone: '0903456789'
    },
    requestedSchedule: {
      frequency: 2,
      preferredDays: [1, 3], // Monday, Wednesday
      preferredTimeSlots: ['17:30-19:00', '19:30-21:00']
    },
    totalSessions: 12,
    completedSessions: 2,
    remainingSessions: 10,
    canEnrollNextLevel: false
  },
  {
    id: 'reg-4',
    studentId: 'student-4',
    courseId: 'course-1',
    courseName: 'Guitar Cơ Bản - Từ Zero đến Hero',
    courseType: 'offline',
    courseLevel: 'basic',
    registrationDate: '2025-10-18',
    status: 'approved',
    studentInfo: {
      fullName: 'Phạm Thị D',
      email: 'pham.thi.d@gmail.com',
      phone: '0904567890'
    },
    requestedSchedule: {
      frequency: 2,
      preferredDays: [1, 3], // Monday, Wednesday
      preferredTimeSlots: ['17:30-19:00', '19:30-21:00']
    },
    totalSessions: 12,
    completedSessions: 4,
    remainingSessions: 8,
    canEnrollNextLevel: false
  },
  {
    id: 'reg-5',
    studentId: 'student-5',
    courseId: 'course-1',
    courseName: 'Guitar Cơ Bản - Từ Zero đến Hero',
    courseType: 'offline',
    courseLevel: 'basic',
    registrationDate: '2025-10-22',
    status: 'approved',
    studentInfo: {
      fullName: 'Hoàng Văn E',
      email: 'hoang.van.e@gmail.com',
      phone: '0905678901'
    },
    requestedSchedule: {
      frequency: 2,
      preferredDays: [2, 4], // Tuesday, Thursday
      preferredTimeSlots: ['19:30-21:00', '21:30-23:00']
    },
    totalSessions: 12,
    completedSessions: 1,
    remainingSessions: 11,
    canEnrollNextLevel: false
  },
  {
    id: 'reg-6',
    studentId: 'student-6',
    courseId: 'course-1',
    courseName: 'Guitar Cơ Bản - Từ Zero đến Hero',
    courseType: 'offline',
    courseLevel: 'basic',
    registrationDate: '2025-10-25',
    status: 'approved',
    studentInfo: {
      fullName: 'Vũ Thị F',
      email: 'vu.thi.f@gmail.com',
      phone: '0906789012'
    },
    requestedSchedule: {
      frequency: 2,
      preferredDays: [2, 4], // Tuesday, Thursday
      preferredTimeSlots: ['19:30-21:00', '21:30-23:00']
    },
    totalSessions: 12,
    completedSessions: 2,
    remainingSessions: 10,
    canEnrollNextLevel: false
  },
  {
    id: 'reg-7',
    studentId: 'student-7',
    courseId: 'course-1',
    courseName: 'Guitar Cơ Bản - Từ Zero đến Hero',
    courseType: 'offline',
    courseLevel: 'basic',
    registrationDate: '2025-10-28',
    status: 'approved',
    studentInfo: {
      fullName: 'Đặng Văn G',
      email: 'dang.van.g@gmail.com',
      phone: '0907890123'
    },
    requestedSchedule: {
      frequency: 1,
      preferredDays: [5], // Friday
      preferredTimeSlots: ['09:00-10:30']
    },
    totalSessions: 12,
    completedSessions: 5,
    remainingSessions: 7,
    canEnrollNextLevel: false
  },
  {
    id: 'reg-8',
    studentId: 'student-8',
    courseId: 'course-1',
    courseName: 'Guitar Cơ Bản - Từ Zero đến Hero',
    courseType: 'offline',
    courseLevel: 'basic',
    registrationDate: '2025-10-30',
    status: 'approved',
    studentInfo: {
      fullName: 'Bùi Thị H',
      email: 'bui.thi.h@gmail.com',
      phone: '0908901234'
    },
    requestedSchedule: {
      frequency: 1,
      preferredDays: [6], // Saturday
      preferredTimeSlots: ['15:00-16:30']
    },
    totalSessions: 12,
    completedSessions: 3,
    remainingSessions: 9,
    canEnrollNextLevel: false
  }
];
