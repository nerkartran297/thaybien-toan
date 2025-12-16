// import { StudentAttendanceSummary, AttendanceRecord, ClassCancellation } from "../data/studentData";

// /**
//  * Tính toán điểm danh học sinh theo công thức:
//  * 12 - Số buổi vắng không phép = Số buổi học đúng lịch + Số buổi học bù - Số buổi vắng có phép
//  */
// export class AttendanceCalculator {
//   /**
//    * Tính toán tóm tắt điểm danh cho một học sinh
//    */
//   static calculateAttendanceSummary(
//     studentId: string,
//     courseId: string,
//     attendanceRecords: AttendanceRecord[],
//     classCancellations: ClassCancellation[],
//     totalSessions: number = 12
//   ): StudentAttendanceSummary {
//     // Lọc các bản ghi điểm danh của học sinh trong khóa học
//     const studentRecords = attendanceRecords.filter(
//       record => record.studentId === studentId
//     );

//     // Đếm các loại buổi học
//     const attendedSessions = studentRecords.filter(
//       record => record.status === 'present'
//     ).length;

//     const makeupSessions = studentRecords.filter(
//       record => record.status === 'makeup'
//     ).length;

//     const excusedAbsences = studentRecords.filter(
//       record => record.status === 'excused'
//     ).length;

//     // Tính số buổi vắng không phép
//     // Công thức: 12 - unexcusedAbsences = attendedSessions + makeupSessions - excusedAbsences
//     // => unexcusedAbsences = 12 - attendedSessions - makeupSessions + excusedAbsences
//     const unexcusedAbsences = totalSessions - attendedSessions - makeupSessions + excusedAbsences;

//     return {
//       studentId,
//       courseId,
//       totalSessions,
//       attendedSessions,
//       makeupSessions,
//       excusedAbsences,
//       unexcusedAbsences: Math.max(0, unexcusedAbsences) // Đảm bảo không âm
//     };
//   }

//   /**
//    * Tạo buổi học bù cho tất cả học sinh khi giáo viên hủy lớp
//    */
//   static createMakeupSessionsForCancelledClass(
//     classCancellation: ClassCancellation,
//     affectedStudents: string[]
//   ): AttendanceRecord[] {
//     return affectedStudents.map(studentId => ({
//       id: `makeup-${studentId}-${classCancellation.id}-${Date.now()}`,
//       studentId,
//       sessionId: classCancellation.classId,
//       date: classCancellation.date,
//       status: 'makeup' as const,
//       notes: `Buổi học bù do lớp bị hủy: ${classCancellation.reason}`,
//       recordedBy: classCancellation.cancelledBy,
//       recordedAt: classCancellation.cancelledAt
//     }));
//   }

//   /**
//    * Kiểm tra xem học sinh có đủ điều kiện tốt nghiệp không
//    */
//   static checkGraduationEligibility(summary: StudentAttendanceSummary): {
//     eligible: boolean;
//     reason?: string;
//   } {
//     // Điều kiện: không quá 4 buổi vắng không phép
//     if (summary.unexcusedAbsences > 4) {
//       return {
//         eligible: false,
//         reason: `Học sinh có ${summary.unexcusedAbsences} buổi vắng không phép (tối đa 4 buổi)`
//       };
//     }

//     // Điều kiện: đã hoàn thành ít nhất 8 buổi học (bao gồm cả học bù)
//     const totalCompletedSessions = summary.attendedSessions + summary.makeupSessions;
//     if (totalCompletedSessions < 8) {
//       return {
//         eligible: false,
//         reason: `Học sinh chỉ hoàn thành ${totalCompletedSessions} buổi học (tối thiểu 8 buổi)`
//       };
//     }

//     return { eligible: true };
//   }

//   /**
//    * Tính tỷ lệ tham gia của học sinh
//    */
//   static calculateParticipationRate(summary: StudentAttendanceSummary): number {
//     const totalPossibleSessions = summary.totalSessions;
//     const totalAttendedSessions = summary.attendedSessions + summary.makeupSessions;
    
//     return Math.round((totalAttendedSessions / totalPossibleSessions) * 100);
//   }

//   /**
//    * Lấy trạng thái học tập dựa trên điểm danh
//    */
//   static getStudyStatus(summary: StudentAttendanceSummary): {
//     status: 'excellent' | 'good' | 'warning' | 'critical';
//     message: string;
//   } {
//     if (summary.unexcusedAbsences === 0) {
//       return {
//         status: 'excellent',
//         message: 'Xuất sắc - Không vắng buổi nào không phép'
//       };
//     }

//     if (summary.unexcusedAbsences <= 2) {
//       return {
//         status: 'good',
//         message: 'Tốt - Tham gia đều đặn'
//       };
//     }

//     if (summary.unexcusedAbsences <= 4) {
//       return {
//         status: 'warning',
//         message: 'Cảnh báo - Cần chú ý tham gia đều đặn hơn'
//       };
//     }

//     return {
//       status: 'critical',
//       message: 'Cần chú ý - Quá nhiều buổi vắng không phép'
//     };
//   }

//   /**
//    * Tính số buổi học còn lại có thể vắng
//    */
//   static getRemainingAbsenceAllowance(summary: StudentAttendanceSummary): number {
//     const maxAllowedAbsences = 4; // Tối đa 4 buổi vắng không phép
//     return Math.max(0, maxAllowedAbsences - summary.unexcusedAbsences);
//   }
// }
