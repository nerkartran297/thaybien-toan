/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Get database name from MONGODB_URI
function getDatabaseName(uri) {
  if (process.env.MONGODB_DB_NAME) {
    return process.env.MONGODB_DB_NAME;
  }
  const urlMatch = uri.match(/mongodb(\+srv)?:\/\/[^/]+\/([^?]+)/);
  if (urlMatch && urlMatch[2]) {
    return urlMatch[2];
  }
  return 'thaybien';
}

// Sample Vietnamese names
const firstNames = [
  'An', 'Bảo', 'Chi', 'Dũng', 'Đức', 'Giang', 'Hải', 'Hùng', 'Hương', 'Lan',
  'Long', 'Mai', 'Nam', 'Nga', 'Phong', 'Quang', 'Quỳnh', 'Sơn', 'Thảo', 'Tuấn',
  'Vân', 'Việt', 'Vy', 'Yến', 'Anh', 'Bình', 'Cường', 'Dương', 'Hạnh', 'Hiếu',
  'Hoàng', 'Huy', 'Khang', 'Khoa', 'Linh', 'Minh', 'My', 'Ngọc', 'Nhật', 'Phúc',
  'Quân', 'Quyên', 'Sang', 'Tâm', 'Thanh', 'Thành', 'Thi', 'Thu', 'Tiến', 'Trang',
  'Trâm', 'Trang', 'Trí', 'Trung', 'Tú', 'Tùng', 'Uyên', 'Vinh', 'Xuân', 'Yên'
];

const lastNames = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đào', 'Lưu', 'Tôn'
];

// Generate random student data
function generateStudentData(index, studentNumber, grade) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${lastName} ${firstName}`;
  const username = `hocsinh${studentNumber}`;
  
  // Generate phone number (10 digits, starts with 0)
  const phone = `0${Math.floor(Math.random() * 900000000) + 100000000}`;
  
  // Generate date of birth based on grade (age 11-18 for grades 6-12)
  const age = grade + 5; // Grade 6 = age 11, Grade 12 = age 18
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;
  const dateOfBirth = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
  
  // Generate address (random districts in Ho Chi Minh City)
  const districts = ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 7', 'Quận Bình Thạnh', 'Quận Tân Bình'];
  const address = `${Math.floor(Math.random() * 200) + 1} Đường ${lastName}, ${districts[Math.floor(Math.random() * districts.length)]}, TP.HCM`;
  
  // Generate emergency contact
  const emergencyRelationships = ['Bố', 'Mẹ', 'Anh/Chị', 'Ông/Bà'];
  const emergencyName = `${lastNames[Math.floor(Math.random() * lastNames.length)]} ${firstNames[Math.floor(Math.random() * firstNames.length)]}`;
  const emergencyPhone = `0${Math.floor(Math.random() * 900000000) + 100000000}`;
  
  return {
    username,
    password: '123456', // Default password for all seed students
    fullName,
    phone,
    dateOfBirth,
    address,
    emergencyContact: {
      name: emergencyName,
      phone: emergencyPhone,
      relationship: emergencyRelationships[Math.floor(Math.random() * emergencyRelationships.length)]
    },
    role: 'student',
    studentNumber,
    facebookName: `fb.${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Time slots available
const timeSlots = [
  { start: '08:00', end: '09:30' },
  { start: '10:00', end: '11:30' },
  { start: '14:00', end: '15:30' },
  { start: '16:00', end: '17:30' },
  { start: '18:00', end: '19:30' },
  { start: '19:30', end: '21:00' }
];

// Days of week (1 = Monday, 7 = Sunday)
const daysOfWeek = [1, 2, 3, 4, 5, 6, 7];

// Check if a time slot conflicts with existing classes
function hasTimeConflict(newSession, existingClasses) {
  for (const cls of existingClasses) {
    for (const session of cls.sessions) {
      // Same day and overlapping time
      if (session.dayOfWeek === newSession.dayOfWeek) {
        const newStart = timeToMinutes(newSession.startTime);
        const newEnd = timeToMinutes(newSession.endTime);
        const existingStart = timeToMinutes(session.startTime);
        const existingEnd = timeToMinutes(session.endTime);
        
        // Check overlap: new session overlaps with existing if:
        // (newStart < existingEnd) && (newEnd > existingStart)
        if (newStart < existingEnd && newEnd > existingStart) {
          return true;
        }
      }
    }
  }
  return false;
}

// Convert time string (HH:mm) to minutes
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Generate classes with no conflicts
function generateClasses() {
  const classes = [];
  const grades = [6, 7, 8, 9, 10, 11, 12];
  const classLetters = ['A', 'B', 'C'];
  
  // Track all sessions to avoid conflicts
  const allSessions = [];
  
  grades.forEach(grade => {
    // Create 2-3 classes per grade
    const numClasses = Math.floor(Math.random() * 2) + 2; // 2 or 3 classes
    
    for (let i = 0; i < numClasses; i++) {
      const classLetter = classLetters[i];
      const className = `${grade}${classLetter}`;
      
      // Each class has 2-3 sessions per week
      const numSessions = Math.floor(Math.random() * 2) + 2; // 2 or 3 sessions
      
      const sessions = [];
      const usedDays = new Set(); // Track used days for this class
      
      let attempts = 0;
      while (sessions.length < numSessions && attempts < 100) {
        attempts++;
        
        // Pick a random day (Monday to Sunday)
        const dayOfWeek = daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];
        
        // Skip if this class already has a session on this day
        if (usedDays.has(dayOfWeek)) {
          continue;
        }
        
        // Pick a random time slot
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        
        const newSession = {
          dayOfWeek,
          startTime: timeSlot.start,
          endTime: timeSlot.end
        };
        
        // Check if this session conflicts with any existing class
        if (!hasTimeConflict(newSession, classes)) {
          sessions.push(newSession);
          usedDays.add(dayOfWeek);
          allSessions.push({ ...newSession, className });
        }
      }
      
      // Sort sessions by dayOfWeek for consistency
      sessions.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      
      if (sessions.length > 0) {
        classes.push({
          name: className,
          grade,
          sessions,
          enrolledStudents: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
  });
  
  return classes;
}

// Generate random score (lifetimeScore)
function getRandomScore(min = 0, max = 5000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random gold
function getRandomGold(min = 0, max = 2000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedRealisticData() {
  let client;
  
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ Vui lòng tạo file .env.local với MONGODB_URI');
      process.exit(1);
    }

    const MONGODB_URI = process.env.MONGODB_URI;
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Đã kết nối MongoDB');

    const databaseName = getDatabaseName(MONGODB_URI);
    console.log(`📦 Sử dụng database: ${databaseName}`);
    const db = client.db(databaseName);

    // Step 0: Clear old data
    console.log('\n🗑️  Bước 0: Xóa dữ liệu cũ...');
    const existingStudents = await db.collection('users').countDocuments({ role: 'student' });
    const existingClasses = await db.collection('classes').countDocuments();
    const existingProfiles = await db.collection('student_profiles').countDocuments();
    const existingEnrollments = await db.collection('enrollments').countDocuments();
    const existingAttendance = await db.collection('attendance').countDocuments();
    
    if (existingStudents > 0 || existingClasses > 0 || existingProfiles > 0 || existingEnrollments > 0 || existingAttendance > 0) {
      console.log(`   - ${existingStudents} học sinh`);
      console.log(`   - ${existingClasses} lớp học`);
      console.log(`   - ${existingProfiles} student profiles`);
      console.log(`   - ${existingEnrollments} enrollments`);
      console.log(`   - ${existingAttendance} attendance records`);
      
      await db.collection('users').deleteMany({ role: 'student' });
      await db.collection('classes').deleteMany({});
      await db.collection('student_profiles').deleteMany({});
      await db.collection('enrollments').deleteMany({});
      await db.collection('attendance').deleteMany({});
      await db.collection('absences').deleteMany({});
      
      console.log('✅ Đã xóa dữ liệu cũ');
    } else {
      console.log('✅ Không có dữ liệu cũ để xóa');
    }

    // Step 1: Create 100 students
    console.log('\n📝 Bước 1: Tạo 100 học sinh...');
    const numStudents = 100;
    const studentsToInsert = [];
    
    // Get current max studentNumber
    const lastStudent = await db.collection('users').findOne(
      { role: 'student', studentNumber: { $exists: true } },
      { sort: { studentNumber: -1 } }
    );
    let nextStudentNumber = lastStudent?.studentNumber ? lastStudent.studentNumber + 1 : 1;

    // Distribute students evenly across grades (6-12)
    const grades = [6, 7, 8, 9, 10, 11, 12];
    const studentsPerGrade = Math.floor(numStudents / grades.length); // ~14 students per grade
    const remainder = numStudents % grades.length; // Extra students
    
    let studentIndex = 0;
    const studentsByGrade = {};
    
    grades.forEach((grade, gradeIndex) => {
      const count = studentsPerGrade + (gradeIndex < remainder ? 1 : 0);
      studentsByGrade[grade] = [];
      
      for (let i = 0; i < count; i++) {
        const studentData = generateStudentData(studentIndex, nextStudentNumber + studentIndex, grade);
        studentsByGrade[grade].push({ ...studentData, grade });
        studentIndex++;
      }
    });

    // Hash passwords and prepare for insertion (maintain order)
    const studentGradeList = []; // Track grade for each student in insertion order
    for (const grade in studentsByGrade) {
      for (const student of studentsByGrade[grade]) {
        const hashedPassword = await bcrypt.hash(student.password, 10);
        student.password = hashedPassword;
        studentsToInsert.push(student);
        studentGradeList.push(parseInt(grade)); // Track grade for this student
      }
    }

    const studentResults = await db.collection('users').insertMany(studentsToInsert);
    const studentIds = Object.values(studentResults.insertedIds);
    console.log(`✅ Đã tạo ${studentIds.length} học sinh`);
    
    // Show distribution by grade
    console.log('\n📊 Phân bổ học sinh theo khối:');
    for (const grade in studentsByGrade) {
      console.log(`   - Khối ${grade}: ${studentsByGrade[grade].length} học sinh`);
    }

    // Step 2: Create student profiles with scores and gold
    console.log('\n📝 Bước 2: Tạo student profiles với điểm và vàng...');
    const profilesToInsert = [];
    
    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const grade = studentGradeList[i];
      const student = studentsToInsert[i];
      const lifetimeScore = getRandomScore(0, 5000);
      const currentSeasonScore = getRandomScore(0, 2000);
      const gold = getRandomGold(0, 2000);
      
      profilesToInsert.push({
        userId: studentId,
        grade: grade,
        group: null, // Will be updated when assigned to class
        lifetimeScore: lifetimeScore,
        seasonalScores: [currentSeasonScore],
        currentSeason: 1,
        gold: gold,
        status: 'ACTIVE',
        notes: null,
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await db.collection('student_profiles').insertMany(profilesToInsert);
    console.log(`✅ Đã tạo ${profilesToInsert.length} student profiles với điểm và vàng`);

    // Step 3: Create classes with no conflicts
    console.log('\n📝 Bước 3: Tạo lớp học (không trùng lịch)...');
    const classesToInsert = generateClasses();
    const classResults = await db.collection('classes').insertMany(classesToInsert);
    const classIds = Object.values(classResults.insertedIds);
    console.log(`✅ Đã tạo ${classIds.length} lớp học`);
    
    // Show classes by grade
    console.log('\n📊 Phân bổ lớp học theo khối:');
    const classesByGrade = {};
    classesToInsert.forEach((cls, index) => {
      const grade = cls.grade;
      if (!classesByGrade[grade]) {
        classesByGrade[grade] = [];
      }
      classesByGrade[grade].push({ name: cls.name, id: classIds[index] });
    });
    
    for (const grade in classesByGrade) {
      console.log(`   - Khối ${grade}: ${classesByGrade[grade].length} lớp (${classesByGrade[grade].map(c => c.name).join(', ')})`);
    }

    // Step 4: Assign students to classes evenly
    console.log('\n📝 Bước 4: Phân bổ học sinh vào lớp (đều nhau)...');
    const classUpdates = [];
    const studentProfileUpdates = [];
    
    // Group classes by grade
    const classesByGradeMap = {};
    classesToInsert.forEach((cls, index) => {
      const grade = cls.grade;
      if (!classesByGradeMap[grade]) {
        classesByGradeMap[grade] = [];
      }
      classesByGradeMap[grade].push({
        classId: classIds[index],
        className: cls.name,
        enrolledStudents: []
      });
    });
    
    // Group students by grade using studentGradeList
    const studentsByGradeMap = {};
    for (let i = 0; i < studentIds.length; i++) {
      const grade = studentGradeList[i];
      if (!studentsByGradeMap[grade]) {
        studentsByGradeMap[grade] = [];
      }
      studentsByGradeMap[grade].push(studentIds[i]);
    }
    
    // Assign students to classes of the same grade
    for (const grade in studentsByGradeMap) {
      const studentsInGrade = studentsByGradeMap[grade];
      const classesInGrade = classesByGradeMap[parseInt(grade)];
      
      if (classesInGrade && classesInGrade.length > 0) {
        // Distribute students evenly
        studentsInGrade.forEach((studentId, index) => {
          const classIndex = index % classesInGrade.length;
          classesInGrade[classIndex].enrolledStudents.push(studentId);
        });
      }
    }
    
    // Update classes and student profiles
    for (const grade in classesByGradeMap) {
      for (const classInfo of classesByGradeMap[grade]) {
        classUpdates.push({
          updateOne: {
            filter: { _id: classInfo.classId },
            update: {
              $set: {
                enrolledStudents: classInfo.enrolledStudents,
                updatedAt: new Date()
              }
            }
          }
        });
        
        // Update student profiles with class name (group)
        classInfo.enrolledStudents.forEach(studentId => {
          studentProfileUpdates.push({
            updateOne: {
              filter: { userId: studentId },
              update: {
                $set: {
                  group: classInfo.className,
                  updatedAt: new Date()
                }
              }
            }
          });
        });
      }
    }
    
    if (classUpdates.length > 0) {
      await db.collection('classes').bulkWrite(classUpdates);
      console.log(`✅ Đã cập nhật ${classUpdates.length} lớp học với học sinh`);
    }
    
    if (studentProfileUpdates.length > 0) {
      await db.collection('student_profiles').bulkWrite(studentProfileUpdates);
      console.log(`✅ Đã cập nhật ${studentProfileUpdates.length} student profiles với tên lớp`);
    }
    
    // Show distribution
    console.log('\n📊 Phân bổ học sinh vào lớp:');
    for (const grade in classesByGradeMap) {
      console.log(`\n   Khối ${grade}:`);
      for (const classInfo of classesByGradeMap[grade]) {
        console.log(`     - ${classInfo.className}: ${classInfo.enrolledStudents.length} học sinh`);
      }
    }

    // Step 5: Show final statistics
    console.log('\n📊 Tổng kết:');
    console.log(`   ✅ Tổng số học sinh: ${studentIds.length}`);
    console.log(`   ✅ Tổng số lớp học: ${classIds.length}`);
    
    const stats = await db.collection('student_profiles').aggregate([
      {
        $group: {
          _id: null,
          minScore: { $min: '$lifetimeScore' },
          maxScore: { $max: '$lifetimeScore' },
          avgScore: { $avg: '$lifetimeScore' },
          minGold: { $min: '$gold' },
          maxGold: { $max: '$gold' },
          avgGold: { $avg: '$gold' }
        }
      }
    ]).toArray();
    
    if (stats.length > 0) {
      const stat = stats[0];
      console.log('\n📈 Thống kê điểm và vàng:');
      console.log(`   - Điểm thấp nhất: ${Math.round(stat.minScore || 0)}`);
      console.log(`   - Điểm cao nhất: ${Math.round(stat.maxScore || 0)}`);
      console.log(`   - Điểm trung bình: ${Math.round(stat.avgScore || 0)}`);
      console.log(`   - Vàng thấp nhất: ${Math.round(stat.minGold || 0)}`);
      console.log(`   - Vàng cao nhất: ${Math.round(stat.maxGold || 0)}`);
      console.log(`   - Vàng trung bình: ${Math.round(stat.avgGold || 0)}`);
    }
    
    console.log('\n🎉 Seed data hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi khi seed data:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Đã đóng kết nối MongoDB');
    }
  }
}

// Run the script
seedRealisticData()
  .then(() => {
    console.log('\n✅ Script hoàn thành thành công!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script thất bại:', error);
    process.exit(1);
  });

