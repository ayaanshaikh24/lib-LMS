const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Book = require('../models/Book');
const Issue = require('../models/Issue');
const Setting = require('../models/Setting');
const { calculateOverdueFine } = require('../utils/fineCalculator');

const seedData = async () => {
  try {
    console.log('--- Starting College LMS Database Seeder ---');
    await connectDB();

    // Clear existing collections
    console.log('Clearing existing records...');
    await Promise.all([
      User.deleteMany({}),
      Book.deleteMany({}),
      Issue.deleteMany({}),
      Setting.deleteMany({})
    ]);

    // 1. Seed Settings
    console.log('Seeding library policy settings...');
    await Setting.create([
      { key: 'finePerDay', value: 5, description: 'Fine charged in currency units per overdue day' },
      { key: 'defaultIssueDays', value: 14, description: 'Default duration allowed for book loans' },
      { key: 'maxBooksPerStudent', value: 5, description: 'Maximum active book loans permitted per student' }
    ]);

    // 2. Seed Users (Admin, Librarian, Students)
    // Passwords are automatically hashed by User pre-save hook
    console.log('Seeding user accounts...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@collegelms.edu',
      password: 'Admin@123',
      role: 'admin',
      department: 'Central Administration',
      phone: '+91 98765 00001',
      isActive: true
    });

    const librarianUser = await User.create({
      name: 'Chief Librarian',
      email: 'librarian@collegelms.edu',
      password: 'Librarian@123',
      role: 'librarian',
      department: 'Central Library',
      phone: '+91 98765 00002',
      isActive: true
    });

    const students = await User.create([
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@collegelms.edu',
        password: 'Student@123',
        role: 'student',
        studentId: 'CS2023001',
        department: 'Computer Science',
        phone: '+91 98765 11111',
        isActive: true
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@collegelms.edu',
        password: 'Student@123',
        role: 'student',
        studentId: 'EE2023045',
        department: 'Electrical Engineering',
        phone: '+91 98765 22222',
        isActive: true
      },
      {
        name: 'Arjun Verma',
        email: 'arjun.verma@collegelms.edu',
        password: 'Student@123',
        role: 'student',
        studentId: 'ME2023012',
        department: 'Mechanical Engineering',
        phone: '+91 98765 33333',
        isActive: true
      },
      {
        name: 'Ananya Iyer',
        email: 'ananya.iyer@collegelms.edu',
        password: 'Student@123',
        role: 'student',
        studentId: 'IT2023089',
        department: 'Information Technology',
        phone: '+91 98765 44444',
        isActive: true
      }
    ]);

    // 3. Seed Books Catalog
    console.log('Seeding college books catalog...');
    const books = await Book.create([
      {
        title: 'Database System Concepts',
        author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
        isbn: '978-0078022159',
        category: 'Computer Science',
        publisher: 'McGraw-Hill Education',
        totalCopies: 6,
        availableCopies: 6, // Will adjust below with active loans
        location: 'Rack CS-01'
      },
      {
        title: 'Introduction to Algorithms (CLRS)',
        author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
        isbn: '978-0262033848',
        category: 'Computer Science',
        publisher: 'MIT Press',
        totalCopies: 5,
        availableCopies: 4, // 1 overdue copy loaned to Priya
        location: 'Rack CS-02'
      },
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        category: 'Computer Science',
        publisher: 'Prentice Hall',
        totalCopies: 4,
        availableCopies: 3, // 1 copy loaned to Rahul
        location: 'Rack CS-03'
      },
      {
        title: 'Operating System Concepts',
        author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
        isbn: '978-1119800361',
        category: 'Computer Science',
        publisher: 'Wiley',
        totalCopies: 5,
        availableCopies: 5,
        location: 'Rack CS-04'
      },
      {
        title: 'Computer Networking: A Top-Down Approach',
        author: 'James F. Kurose, Keith W. Ross',
        isbn: '978-0133594140',
        category: 'Information Technology',
        publisher: 'Pearson',
        totalCopies: 4,
        availableCopies: 4,
        location: 'Rack IT-01'
      },
      {
        title: 'Electric Machinery Fundamentals',
        author: 'Stephen J. Chapman',
        isbn: '978-0073529547',
        category: 'Electrical Engineering',
        publisher: 'McGraw-Hill',
        totalCopies: 3,
        availableCopies: 3,
        location: 'Rack EE-01'
      },
      {
        title: 'Microelectronic Circuits',
        author: 'Adel S. Sedra, Kenneth C. Smith',
        isbn: '978-0190853464',
        category: 'Electrical Engineering',
        publisher: 'Oxford University Press',
        totalCopies: 4,
        availableCopies: 4,
        location: 'Rack EE-02'
      },
      {
        title: 'Engineering Mechanics: Dynamics',
        author: 'J.L. Meriam, L.G. Kraige, J.N. Bolton',
        isbn: '978-1118885840',
        category: 'Mechanical Engineering',
        publisher: 'Wiley',
        totalCopies: 4,
        availableCopies: 4,
        location: 'Rack ME-01'
      },
      {
        title: 'Thermodynamics: An Engineering Approach',
        author: 'Yunus A. Cengel, Michael A. Boles',
        isbn: '978-0073398174',
        category: 'Mechanical Engineering',
        publisher: 'McGraw-Hill',
        totalCopies: 5,
        availableCopies: 5,
        location: 'Rack ME-02'
      },
      {
        title: 'Higher Engineering Mathematics',
        author: 'B.S. Grewal',
        isbn: '978-8193328491',
        category: 'Mathematics',
        publisher: 'Khanna Publishers',
        totalCopies: 8,
        availableCopies: 8,
        location: 'Rack MATH-01'
      },
      {
        title: 'University Physics with Modern Physics',
        author: 'Hugh D. Young, Roger A. Freedman',
        isbn: '978-0135159553',
        category: 'Physics',
        publisher: 'Pearson',
        totalCopies: 5,
        availableCopies: 5,
        location: 'Rack SCI-01'
      },
      {
        title: 'Principles of Management',
        author: 'Harold Koontz, Heinz Weihrich',
        isbn: '978-0070682139',
        category: 'Management',
        publisher: 'McGraw-Hill',
        totalCopies: 4,
        availableCopies: 4,
        location: 'Rack MGMT-01'
      }
    ]);

    // 4. Seed Issue Records
    console.log('Seeding circulation issue/return records...');
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fourDaysFuture = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixteenDaysAgo = new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    // Active issue: Clean Code to Rahul (due in future)
    await Issue.create({
      book: books[2]._id, // Clean Code
      student: students[0]._id, // Rahul
      issuedBy: librarianUser._id,
      issueDate: tenDaysAgo,
      dueDate: fourDaysFuture,
      status: 'issued',
      fineAmount: 0,
      finePaid: false,
      notes: 'Standard semester issue'
    });

    // Overdue issue: CLRS to Priya (due 6 days ago -> 6 days overdue * ₹5 = ₹30 fine pending)
    const clrsFineResult = calculateOverdueFine(sixDaysAgo, now, 5);
    await Issue.create({
      book: books[1]._id, // CLRS
      student: students[1]._id, // Priya
      issuedBy: librarianUser._id,
      issueDate: twentyDaysAgo,
      dueDate: sixDaysAgo,
      status: 'overdue',
      fineAmount: clrsFineResult.fineAmount,
      finePaid: false,
      notes: 'First overdue notice sent via email'
    });

    // Returned issue: Database System Concepts to Rahul (returned on time, no fine)
    await Issue.create({
      book: books[0]._id,
      student: students[0]._id,
      issuedBy: librarianUser._id,
      issueDate: thirtyDaysAgo,
      dueDate: sixteenDaysAgo,
      returnDate: fifteenDaysAgo, // Returned 1 day before due date
      status: 'returned',
      fineAmount: 0,
      finePaid: true,
      notes: 'Returned in excellent condition'
    });

    // Returned with Fine Paid: Operating Systems to Arjun (returned 3 days late, fine ₹15 paid)
    await Issue.create({
      book: books[3]._id,
      student: students[2]._id,
      issuedBy: adminUser._id,
      issueDate: thirtyDaysAgo,
      dueDate: sixteenDaysAgo,
      returnDate: new Date(sixteenDaysAgo.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days late
      status: 'returned',
      fineAmount: 15,
      finePaid: true,
      paidAt: now,
      notes: 'Overdue fine of ₹15 collected at circulation desk'
    });

    console.log('===========================================================');
    console.log(' College LMS Database Seeded Successfully!');
    console.log('===========================================================');
    console.log(' Demo Accounts Created (Development Only):');
    console.log(' 1. Admin:     admin@collegelms.edu     | Password: Admin@123');
    console.log(' 2. Librarian: librarian@collegelms.edu | Password: Librarian@123');
    console.log(' 3. Student:   rahul.sharma@collegelms.edu | Password: Student@123');
    console.log('    Student:   priya.patel@collegelms.edu  | Password: Student@123');
    console.log('    Student:   arjun.verma@collegelms.edu  | Password: Student@123');
    console.log('===========================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
};

seedData();
