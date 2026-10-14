const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Issue = require('../models/Issue');

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'super_secret_college_lms_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id, role }, secret, { expiresIn });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact the administrator.'
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    let extraStats = {};
    if (user.role === 'student') {
      const activeIssuesCount = await Issue.countDocuments({
        student: user._id,
        status: { $in: ['issued', 'overdue'] }
      });

      const unpaidFines = await Issue.aggregate([
        {
          $match: {
            student: user._id,
            fineAmount: { $gt: 0 },
            finePaid: false
          }
        },
        {
          $group: {
            _id: null,
            totalFine: { $sum: '$fineAmount' }
          }
        }
      ]);

      extraStats = {
        activeIssuesCount,
        unpaidFinesTotal: unpaidFines[0]?.totalFine || 0
      };
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user.toJSON(),
        ...extraStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, department } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (department && user.role === 'student') user.department = department.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  updateProfile
};
