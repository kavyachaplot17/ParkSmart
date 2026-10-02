const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Login = require('../models/Login');
const { auth } = require('../middleware/auth');

// Helper function to log login
const logLogin = async (userId, phone, loginMethod, status, failureReason = null, req = null) => {
  try {
    await Login.create({
      userId,
      phone,
      loginMethod,
      status,
      failureReason,
      ipAddress: req?.ip || 'unknown',
      userAgent: req?.get('user-agent') || 'unknown'
    });
  } catch (err) {
    console.error('❌ Failed to log login:', err.message);
  }
};

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


// ================= OTP LOGIN =================

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid Indian phone number' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ phone });
    await OTP.create({ phone, otp, expiresAt });

    console.log(`📱 OTP for ${phone}: ${otp}`);

    res.json({ 
  message: 'OTP sent successfully', 
  demoOtp: otp   // ALWAYS send OTP
});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    // ✅ FIND OTP IN DATABASE
    const otpRecord = await OTP.findOne({ phone, otp, verified: false });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // ⏰ CHECK EXPIRY
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // 👤 CHECK USER
    let user = await User.findOne({ phone });
    const isNew = !user;

    // 🆕 CREATE USER IF NOT EXISTS
    if (!user) {
      if (!name || !req.body.password) {
        return res.status(400).json({
          message: 'Name and password required to create account',
          requireNameAndPass: true
        });
      }

      user = await User.create({ phone, name, password: req.body.password });
    }

    // ✅ MARK OTP USED
    await OTP.updateOne({ _id: otpRecord._id }, { verified: true });

    // 📝 LOG LOGIN
    await logLogin(user._id, phone, 'otp', 'success', null, req);

    // 🔐 CREATE TOKEN
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 🎯 RESPONSE
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      isNew
    });

  } catch (err) {
    console.error("OTP VERIFY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


// ================= PASSWORD LOGIN =================

// POST /api/auth/set-password
router.post('/set-password', auth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.password = password;
    await user.save();

    res.json({
      message: 'Password set successfully',
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password required' });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      await logLogin(null, phone, 'password', 'failed', 'User not found', req);
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.password) {
      await logLogin(user._id, phone, 'password', 'failed', 'No password set', req);
      return res.status(400).json({ message: 'Login with OTP first' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await logLogin(user._id, phone, 'password', 'failed', 'Invalid password', req);
      return res.status(400).json({ message: 'Invalid password' });
    }

    await logLogin(user._id, phone, 'password', 'success', null, req);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ================= GOOGLE LOGIN (FIXED) =================

// POST /api/auth/google-login
router.post('/google-login', async (req, res) => {
  try {
    const { name, email, googleId } = req.body;

    if (!googleId) {
      return res.status(400).json({ message: 'Invalid Google data' });
    }

    let user = await User.findOne({ googleId });

    if (!user && email) {
      user = await User.findOne({ email });
    }

    const isNew = !user;

    if (!user) {
      user = await User.create({
        name: name || 'Google User',
        email: email || null,
        googleId,
        isVerified: true
      });
    }

    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    await logLogin(user._id, user.phone || null, 'google', 'success', null, req);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      isNew
    });

  } catch (err) {
    console.error('❌ Google login error:', err.message);
    res.status(500).json({ message: 'Google login failed' });
  }
});


// ================= PROFILE =================

// POST /api/auth/register
router.post('/register', auth, async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true }
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      email: req.user.email,
      role: req.user.role
    }
  });
});


// ================= LOGIN HISTORY =================

// GET /api/auth/login-history
router.get('/login-history', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const logins = await Login.find({ userId: req.user._id })
      .sort({ loginTime: -1 })
      .limit(limit)
      .lean();

    res.json({ logins });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET /api/auth/all-logins
router.get('/all-logins', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const logins = await Login.find()
      .populate('userId', 'name phone')
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Login.countDocuments();

    res.json({
      logins,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;