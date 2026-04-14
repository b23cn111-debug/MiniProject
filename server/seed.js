/**
 * Database Seeder
 * Creates demo admin + student accounts and sample courses
 * Run: node seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Course = require('./models/Course');
const Feedback = require('./models/Feedback');

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🔗 Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany(), Course.deleteMany(), Feedback.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  // Create Users
  const [admin, student1, student2] = await Promise.all([
    User.create({ name: 'Admin User', email: 'admin@college.edu', password: 'admin123', role: 'admin' }),
    User.create({ name: 'Alice Johnson', email: 'alice@college.edu', password: 'student123', role: 'student' }),
    User.create({ name: 'Bob Smith', email: 'bob@college.edu', password: 'student123', role: 'student' }),
  ]);
  console.log('👤 Created users: admin, alice, bob');

  // Create Courses
  const courses = await Course.insertMany([
    { courseName: 'Data Structures & Algorithms', courseCode: 'CS301', facultyName: 'Dr. Priya Sharma', department: 'Computer Science', semester: '3', description: 'Fundamental CS algorithms and data structures' },
    { courseName: 'Database Management Systems', courseCode: 'CS401', facultyName: 'Prof. Rajesh Kumar', department: 'Computer Science', semester: '4', description: 'SQL, NoSQL, and database design principles' },
    { courseName: 'Machine Learning', courseCode: 'CS501', facultyName: 'Dr. Anita Patel', department: 'Computer Science', semester: '5', description: 'Supervised, unsupervised learning and deep learning basics' },
    { courseName: 'Web Technologies', courseCode: 'CS351', facultyName: 'Prof. Suresh Menon', department: 'Computer Science', semester: '4', description: 'HTML, CSS, JavaScript and modern frameworks' },
    { courseName: 'Operating Systems', courseCode: 'CS302', facultyName: 'Dr. Kavita Rao', department: 'Computer Science', semester: '3', description: 'Process management, memory, and file systems' },
    { courseName: 'Computer Networks', courseCode: 'CS452', facultyName: 'Prof. Vikas Singh', department: 'Computer Science', semester: '5', description: 'TCP/IP, routing, and network protocols' },
  ]);
  console.log(`📚 Created ${courses.length} courses`);

  // Create Sample Feedbacks
  await Feedback.insertMany([
    { studentId: student1._id, courseId: courses[0]._id, rating: 5, comment: 'Excellent course! Dr. Sharma explains complex algorithms very clearly.', anonymous: false, teachingQuality: 5, courseContent: 4, overallSatisfaction: 5 },
    { studentId: student1._id, courseId: courses[1]._id, rating: 4, comment: 'Great DBMS course with practical examples.', anonymous: false, teachingQuality: 4, courseContent: 5, overallSatisfaction: 4 },
    { studentId: student1._id, courseId: courses[2]._id, rating: 5, comment: 'Best ML course I have taken!', anonymous: true, teachingQuality: 5, courseContent: 5, overallSatisfaction: 5 },
    { studentId: student2._id, courseId: courses[0]._id, rating: 4, comment: 'Good coverage of topics, could use more practice problems.', anonymous: false, teachingQuality: 4, courseContent: 4, overallSatisfaction: 4 },
    { studentId: student2._id, courseId: courses[3]._id, rating: 3, comment: 'Course was okay, needs more hands-on projects.', anonymous: false, teachingQuality: 3, courseContent: 4, overallSatisfaction: 3 },
  ]);
  console.log('💬 Created sample feedbacks');

  console.log('\n✅ Seeding complete!\n');
  console.log('📧 Login Credentials:');
  console.log('  Admin:   admin@college.edu / admin123');
  console.log('  Student: alice@college.edu / student123');
  console.log('  Student: bob@college.edu   / student123\n');

  process.exit(0);
};

seedData().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
