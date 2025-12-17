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

// Helper functions (copied from enrollment route logic)
function calculateEndDate(startDate, frequency, paymentMode, customWeeks) {
  let weeks;
  if (paymentMode === 'custom' && customWeeks) {
    weeks = customWeeks;
  } else {
    weeks = frequency === 1 ? 18 : 9;
  }
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + weeks * 7);
  return endDate;
}

function calculateTotalSessions(frequency, paymentMode, customWeeks) {
  if (paymentMode === 'custom' && customWeeks) {
    return customWeeks * frequency;
  } else {
    return 12;
  }
}

// Sample Vietnamese names
const firstNames = [
  'An', 'Bảo', 'Chi', 'Dũng', 'Đức', 'Giang', 'Hải', 'Hùng', 'Hương', 'Lan',
  'Long', 'Mai', 'Nam', 'Nga', 'Phong', 'Quang', 'Quỳnh', 'Sơn', 'Thảo', 'Tuấn',
  'Vân', 'Việt', 'Vy', 'Yến', 'Anh', 'Bình', 'Cường', 'Dương', 'Hạnh', 'Hiếu'
];

const lastNames = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đào', 'Lưu', 'Tôn'
];

// Generate random student data
function generateStudentData(index, studentNumber) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${lastName} ${firstName}`;
  const username = `hocsinh${studentNumber}`;
  
  // Generate phone number (10 digits, starts with 0)
  const phone = `0${Math.floor(Math.random() * 900000000) + 100000000}`;
  
  // Generate date of birth (ages 10-18)
  const age = Math.floor(Math.random() * 9) + 10;
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

// Generate sample classes
function generateClasses() {
  const classes = [];
  const timeSlots = [
    { start: '08:00', end: '09:30' },
    { start: '10:00', end: '11:30' },
    { start: '14:00', end: '15:30' },
    { start: '16:00', end: '17:30' },
    { start: '18:00', end: '19:30' },
    { start: '19:30', end: '21:00' }
  ];
  
  const grades = [6, 7, 8, 9, 10, 11, 12];
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  
  grades.forEach(grade => {
    // Create 2-3 classes per grade
    const numClasses = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < numClasses; i++) {
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      const dayOfWeek = Math.floor(Math.random() * 5) + 1; // Monday to Friday (1-5)
      
      classes.push({
        name: `Lớp ${grade} - ${dayNames[dayOfWeek]} ${timeSlot.start}`,
        grade,
        sessions: [{
          dayOfWeek,
          startTime: timeSlot.start,
          endTime: timeSlot.end
        }],
        enrolledStudents: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  });
  
  return classes;
}

async function seedSampleData() {
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

    // Check if data already exists (allow if only a few students from manual registration)
    const existingStudents = await db.collection('users').countDocuments({ role: 'student' });
    const existingClasses = await db.collection('classes').countDocuments();
    const existingEnrollments = await db.collection('enrollments').countDocuments();
    const existingAttendance = await db.collection('attendance').countDocuments();
    
    // Allow seeding if only a few students (likely from manual registration) and no classes/enrollments
    if (existingStudents > 5 || existingClasses > 0 || existingEnrollments > 0 || existingAttendance > 0) {
      console.log('\n⚠️  Đã có dữ liệu trong database:');
      console.log(`   - ${existingStudents} học sinh`);
      console.log(`   - ${existingClasses} lớp học`);
      console.log(`   - ${existingEnrollments} enrollments`);
      console.log(`   - ${existingAttendance} attendance records`);
      console.log('\nĐể seed lại, vui lòng xóa dữ liệu cũ trước.');
      return;
    }
    
    if (existingStudents > 0) {
      console.log(`\n⚠️  Đã có ${existingStudents} học sinh trong database (có thể từ đăng ký thủ công)`);
      console.log('Tiếp tục seed thêm dữ liệu...\n');
    }

    // Get required data
    const courses = await db.collection('courses').find({}).toArray();
    if (courses.length === 0) {
      console.error('❌ Không tìm thấy courses. Vui lòng chạy: npm run seed:courses');
      process.exit(1);
    }
    console.log(`✅ Tìm thấy ${courses.length} courses`);

    const teachers = await db.collection('users').find({ role: 'teacher' }).toArray();
    if (teachers.length === 0) {
      console.error('❌ Không tìm thấy teacher. Vui lòng chạy: npm run seed:teacher');
      process.exit(1);
    }
    const teacherId = teachers[0]._id;
    console.log(`✅ Tìm thấy teacher: ${teachers[0].fullName || teachers[0].username}`);

    // Step 1: Create students
    console.log('\n📝 Bước 1: Tạo học sinh...');
    const numStudents = 25;
    const studentsToInsert = [];
    
    // Get current max studentNumber
    const lastStudent = await db.collection('users').findOne(
      { role: 'student', studentNumber: { $exists: true } },
      { sort: { studentNumber: -1 } }
    );
    let nextStudentNumber = lastStudent?.studentNumber ? lastStudent.studentNumber + 1 : 1;

    for (let i = 0; i < numStudents; i++) {
      const studentData = generateStudentData(i, nextStudentNumber + i);
      const hashedPassword = await bcrypt.hash(studentData.password, 10);
      studentData.password = hashedPassword;
      studentsToInsert.push(studentData);
    }

    const studentResults = await db.collection('users').insertMany(studentsToInsert);
    const studentIds = Object.values(studentResults.insertedIds);
    console.log(`✅ Đã tạo ${studentIds.length} học sinh`);

    // Create student_profiles
    const profilesToInsert = studentIds.map(studentId => ({
      userId: studentId,
      grade: null,
      group: null,
      competitionScore: 0,
      status: 'PENDING',
      notes: null,
      dateOfBirth: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    await db.collection('student_profiles').insertMany(profilesToInsert);
    console.log(`✅ Đã tạo ${profilesToInsert.length} student profiles`);

    // Step 2: Create classes
    console.log('\n📝 Bước 2: Tạo lớp học...');
    const classesToInsert = generateClasses();
    const classResults = await db.collection('classes').insertMany(classesToInsert);
    const classIds = Object.values(classResults.insertedIds);
    console.log(`✅ Đã tạo ${classIds.length} lớp học`);

    // Step 3: Create enrollments
    console.log('\n📝 Bước 3: Tạo enrollments...');
    const enrollmentsToInsert = [];
    const now = new Date();
    
    studentIds.forEach((studentId, index) => {
      const course = courses[Math.floor(Math.random() * courses.length)];
      const frequency = Math.random() > 0.5 ? 2 : 1; // 50% chance of 2 sessions/week
      const paymentMode = Math.random() > 0.8 ? 'custom' : 'default'; // 20% custom
      const customWeeks = paymentMode === 'custom' ? Math.floor(Math.random() * 8) + 6 : undefined; // 6-13 weeks
      
      // Start date: between 8 weeks ago and now
      const weeksAgo = Math.floor(Math.random() * 8);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (weeksAgo * 7));
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = calculateEndDate(startDate, frequency, paymentMode, customWeeks);
      const totalSessions = calculateTotalSessions(frequency, paymentMode, customWeeks);
      
      // Status: 70% active, 20% completed, 10% pending
      const rand = Math.random();
      let status = 'active';
      if (rand > 0.9) status = 'pending';
      else if (rand > 0.7 && startDate < new Date(Date.now() - 18 * 7 * 24 * 60 * 60 * 1000)) status = 'completed';
      
      enrollmentsToInsert.push({
        studentId,
        courseId: course._id,
        frequency,
        startDate,
        endDate,
        status,
        cycle: undefined,
        paymentMode,
        customWeeks,
        totalSessions,
        schedule: { sessions: [] },
        completedSessions: 0,
        remainingSessions: totalSessions,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    const enrollmentResults = await db.collection('enrollments').insertMany(enrollmentsToInsert);
    const enrollmentIds = Object.values(enrollmentResults.insertedIds);
    console.log(`✅ Đã tạo ${enrollmentIds.length} enrollments`);

    // Step 4: Add students to classes
    console.log('\n📝 Bước 4: Thêm học sinh vào lớp...');
    let studentsAddedToClasses = 0;
    const classUpdates = [];
    
    classIds.forEach((classId, classIndex) => {
      const classData = classesToInsert[classIndex];
      // Each class gets 3-7 students
      const numStudentsInClass = Math.floor(Math.random() * 5) + 3;
      const shuffledStudents = [...studentIds].sort(() => Math.random() - 0.5);
      const studentsForClass = shuffledStudents.slice(0, Math.min(numStudentsInClass, shuffledStudents.length));
      
      if (studentsForClass.length > 0) {
        classUpdates.push({
          classId,
          students: studentsForClass
        });
        studentsAddedToClasses += studentsForClass.length;
      }
    });
    
    // Update all classes
    if (classUpdates.length > 0) {
      await Promise.all(
        classUpdates.map(update =>
          db.collection('classes').updateOne(
            { _id: update.classId },
            { $set: { enrolledStudents: update.students, updatedAt: new Date() } }
          )
        )
      );
    }
    console.log(`✅ Đã thêm ${studentsAddedToClasses} học sinh vào các lớp`);

    // Step 5: Create attendance records
    console.log('\n📝 Bước 5: Tạo attendance records...');
    const attendanceToInsert = [];
    const enrollmentUpdates = [];
    
    // Build a map of studentId -> classes
    const studentClassMap = new Map();
    for (let i = 0; i < classIds.length; i++) {
      const classData = await db.collection('classes').findOne({ _id: classIds[i] });
      if (classData && classData.enrolledStudents) {
        classData.enrolledStudents.forEach(studentId => {
          const studentIdStr = studentId.toString ? studentId.toString() : studentId;
          if (!studentClassMap.has(studentIdStr)) {
            studentClassMap.set(studentIdStr, []);
          }
          studentClassMap.get(studentIdStr).push({
            classId: classIds[i],
            sessions: classData.sessions
          });
        });
      }
    }
    
    enrollmentIds.forEach((enrollmentId, index) => {
      const enrollment = enrollmentsToInsert[index];
      const studentId = enrollment.studentId;
      const studentIdStr = studentId.toString ? studentId.toString() : String(studentId);
      
      // Find classes this student is enrolled in
      const studentClasses = studentClassMap.get(studentIdStr) || [];
      
      // Generate attendance for past sessions
      const startDate = new Date(enrollment.startDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      // Only create attendance for enrollments that have started
      if (startDate <= today) {
        // Calculate how many sessions should have occurred
        const weeksSinceStart = Math.floor((today - startDate) / (7 * 24 * 60 * 60 * 1000));
        const expectedSessions = Math.min(weeksSinceStart * enrollment.frequency, enrollment.totalSessions);
        const sessionsToCreate = Math.min(expectedSessions, 10); // Limit to 10 sessions max for seed data
        
        let completedSessions = 0;
        
        for (let i = 0; i < sessionsToCreate; i++) {
          // Calculate session date based on frequency
          const weekNumber = Math.floor(i / enrollment.frequency);
          
          // Find a matching class session if available
          let classId = null;
          let sessionDate = new Date(startDate);
          sessionDate.setDate(sessionDate.getDate() + (weekNumber * 7));
          
          if (studentClasses.length > 0 && studentClasses[0].sessions.length > 0) {
            const classSession = studentClasses[0].sessions[0];
            // Adjust date to match day of week
            const targetDay = classSession.dayOfWeek;
            const currentDay = sessionDate.getDay();
            const diff = targetDay - currentDay;
            sessionDate.setDate(sessionDate.getDate() + diff);
            classId = studentClasses[0].classId;
          } else {
            // Random day in the week if no class (Monday to Friday)
            const randomDay = Math.floor(Math.random() * 5) + 1;
            const currentDay = sessionDate.getDay();
            const diff = randomDay - currentDay;
            sessionDate.setDate(sessionDate.getDate() + diff);
          }
          
          // Only create attendance for past dates
          if (sessionDate <= today) {
            // 85% present, 10% absent, 5% excused
            const rand = Math.random();
            let status = 'present';
            if (rand > 0.95) status = 'excused';
            else if (rand > 0.85) status = 'absent';
            
            if (status === 'present') {
              completedSessions++;
            }
            
            attendanceToInsert.push({
              studentId,
              enrollmentId,
              classId,
              sessionDate: new Date(sessionDate),
              status,
              notes: status === 'excused' ? 'Có phép' : undefined,
              markedBy: teacherId,
              markedAt: new Date(sessionDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours after session start
              createdAt: new Date(sessionDate),
              updatedAt: new Date(sessionDate)
            });
          }
        }
        
        // Store update for later
        enrollmentUpdates.push({
          enrollmentId,
          completedSessions,
          remainingSessions: enrollment.totalSessions - completedSessions
        });
      }
    });
    
    // Update all enrollments with completed sessions
    if (enrollmentUpdates.length > 0) {
      await Promise.all(
        enrollmentUpdates.map(update =>
          db.collection('enrollments').updateOne(
            { _id: update.enrollmentId },
            {
              $set: {
                completedSessions: update.completedSessions,
                remainingSessions: update.remainingSessions,
                updatedAt: new Date()
              }
            }
          )
        )
      );
    }

    if (attendanceToInsert.length > 0) {
      await db.collection('attendance').insertMany(attendanceToInsert);
      console.log(`✅ Đã tạo ${attendanceToInsert.length} attendance records`);
    } else {
      console.log('⚠️  Không có attendance records nào được tạo (có thể do tất cả enrollments đều chưa bắt đầu)');
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ HOÀN THÀNH SEED DỮ LIỆU MẪU!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Tổng kết:`);
    console.log(`   - ${studentIds.length} học sinh`);
    console.log(`   - ${classIds.length} lớp học`);
    console.log(`   - ${enrollmentIds.length} enrollments`);
    console.log(`   - ${attendanceToInsert.length} attendance records`);
    console.log('\n💡 Lưu ý:');
    console.log('   - Mật khẩu mặc định cho tất cả học sinh: 123456');
    console.log('   - Username format: hocsinh1, hocsinh2, ...');
    console.log('   - Dữ liệu được tạo ngẫu nhiên để test');
    
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\nMongoDB connection closed');
    }
  }
}

seedSampleData();

