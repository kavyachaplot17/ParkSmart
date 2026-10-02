const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null
  },
  phone: { 
    type: String, 
    default: null,
    index: true 
  },
  loginMethod: { 
    type: String, 
    enum: ['otp', 'password', 'google'], 
    required: true 
  },
  ipAddress: { 
    type: String,
    default: null 
  },
  userAgent: { 
    type: String,
    default: null 
  },
  status: { 
    type: String, 
    enum: ['success', 'failed'], 
    default: 'success' 
  },
  failureReason: { 
    type: String,
    default: null 
  },
  loginTime: { 
    type: Date, 
    default: Date.now,
    index: true 
  }
});

// Index for efficient queries
loginSchema.index({ userId: 1, loginTime: -1 });
loginSchema.index({ phone: 1, loginTime: -1 });

module.exports = mongoose.model('Login', loginSchema);
