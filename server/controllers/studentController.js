const User = require('../models/User');
const Issue = require('../models/Issue');

// @desc    Get all students with search and department filtering
// @route   GET /api/students
// @access  Private (Admin, Librarian)
const getStudents = async (req, res, next) => {
  try {
    const { search, department, status, page = 1, limit = 50, sort = 'createdAt', order = 'desc' } = req.query;

    const query = { role: 'student' };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { studentId: regex },
        { department: regex }
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    const [students, total] = await Promise.all([
      User.find(query).sort(sortOption).skip(skip).limit(limitNum),
      User.countDocuments(query)
    ]);

    // Distinct departments for filter dropdown
    const departments = await User.distinct('department', { role: 'student' });

    return res.status(200).json({
      success: true,
      count: students.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      departments,
      students
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student profile with borrowing stats
// @route   GET /api/students/:id
// @access  Private (Admin, Librarian)
const getStudentById = async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found'
      });
    }

    // Active issues
    const activeIssues = await Issue.find({
      student: student._id,
      status: { $in: ['issued', 'overdue'] }
    }).populate('book', 'title author isbn');

    // Aggregate fines
    const fineStats = await Issue.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: null,
          totalFines: { $sum: '$fineAmount' },
          unpaidFines: {
            $sum: {
              $cond: [{ $eq: ['$finePaid', false] }, '$fineAmount', 0]
            }
          }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      student: {
        ...student.toJSON(),
        activeIssues,
        totalFines: fineStats[0]?.totalFines || 0,
        unpaidFines: fineStats[0]?.unpaidFines || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new student
// @route   POST /api/students
// @access  Private (Admin, Librarian)
const createStudent = async (req, res, next) => {
  try {
    const { name, email, password, studentId, department, phone } = req.body;

    if (!name || !email || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and Student ID are required.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanStudentId = studentId.toUpperCase().trim();

    // Check duplicate email
    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: `A user with email ${cleanEmail} already exists.`
      });
    }

    // Check duplicate Student ID
    const studentIdExists = await User.findOne({ studentId: cleanStudentId });
    if (studentIdExists) {
      return res.status(409).json({
        success: false,
        message: `Student ID ${cleanStudentId} is already registered.`
      });
    }

    const defaultPassword = password && password.length >= 6 ? password : 'Student@123';

    const student = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: defaultPassword,
      role: 'student',
      studentId: cleanStudentId,
      department: department ? department.trim() : 'General',
      phone: phone ? phone.trim() : '',
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Student account registered successfully',
      student: student.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private (Admin, Librarian)
const updateStudent = async (req, res, next) => {
  try {
    const { name, email, studentId, department, phone, password } = req.body;

    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found'
      });
    }

    // Check email uniqueness if modified
    if (email && email.toLowerCase().trim() !== student.email) {
      const cleanEmail = email.toLowerCase().trim();
      const duplicateEmail = await User.findOne({ email: cleanEmail });
      if (duplicateEmail) {
        return res.status(409).json({
          success: false,
          message: `Email ${cleanEmail} is already in use.`
        });
      }
      student.email = cleanEmail;
    }

    // Check studentId uniqueness if modified
    if (studentId && studentId.toUpperCase().trim() !== student.studentId) {
      const cleanStudentId = studentId.toUpperCase().trim();
      const duplicateId = await User.findOne({ studentId: cleanStudentId });
      if (duplicateId) {
        return res.status(409).json({
          success: false,
          message: `Student ID ${cleanStudentId} is already registered.`
        });
      }
      student.studentId = cleanStudentId;
    }

    if (name) student.name = name.trim();
    if (department) student.department = department.trim();
    if (phone !== undefined) student.phone = phone.trim();
    if (password && password.length >= 6) {
      student.password = password; // pre-save hook will hash it
    }

    await student.save();

    return res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      student: student.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle student active/deactivated status
// @route   PATCH /api/students/:id/status
// @access  Private (Admin, Librarian)
const toggleStudentStatus = async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found'
      });
    }

    student.isActive = !student.isActive;
    await student.save();

    return res.status(200).json({
      success: true,
      message: `Student account ${student.isActive ? 'activated' : 'deactivated'} successfully`,
      student: student.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  toggleStudentStatus
};
