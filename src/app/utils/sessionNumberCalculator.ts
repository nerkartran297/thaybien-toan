/**
 * Tính số buổi học theo chu kỳ
 * @param weekNumber - Số tuần đã trôi qua (1, 2, 3, ...)
 * @param cycle - Chu kỳ đếm số buổi (ví dụ: 4, 6). Nếu không có, đếm bình thường 1-12
 * @param totalSessions - Tổng số buổi (mặc định 12)
 * @returns Số buổi hiển thị (ví dụ: "1", "2", "3", "4", "1", "2"... nếu cycle=4)
 */
export function calculateSessionNumber(
  weekNumber: number,
  cycle?: number,
  totalSessions: number = 12
): string {
  // Nếu không có cycle, đếm bình thường 1-12
  if (!cycle || cycle <= 0) {
    if (weekNumber > totalSessions) return "Đã kết thúc";
    if (weekNumber <= 0) return "Sắp học";
    return `${weekNumber}/${totalSessions}`;
  }

  // Nếu có cycle, đếm lặp lại theo chu kỳ
  // Ví dụ: cycle=4, weekNumber=1,2,3,4,5,6,7,8,9,10,11,12
  // Kết quả: 1,2,3,4,1,2,3,4,1,2,3,4
  if (weekNumber <= 0) return "Sắp học";
  if (weekNumber > totalSessions) return "Đã kết thúc";

  // Tính số buổi trong chu kỳ: ((weekNumber - 1) % cycle) + 1
  const sessionInCycle = ((weekNumber - 1) % cycle) + 1;
  return `${sessionInCycle}/${cycle}`;
}

