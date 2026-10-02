import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [step, setStep] = useState('phone');
  const [loginMode, setLoginMode] = useState('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { sendOTP, verifyOTP, loginWithPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isSignupIntent = new URLSearchParams(location.search).get('mode') === 'signup';
  const isOtpEntry = step !== 'phone' || loginMode === 'otp';
  const authTitle = isSignupIntent && isOtpEntry ? 'Create your ParkSmart account' : 'Welcome to ParkSmart';
  const authSubtitle = isSignupIntent && isOtpEntry
    ? 'Sign up with your mobile number and start booking in seconds.'
    : 'Login with OTP or password to continue.';

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter valid Indian mobile number');
      return;
    }

    setLoading(true);

    try {
      const res = await sendOTP(phone);

      if (res.demoOtp) {
        setDemoOtp(res.demoOtp);
      }

      setStep('otp');
      toast.success('OTP sent successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Enter valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const res = await verifyOTP(phone, otp);

      if (res.requireName) {
        setStep('name');
        return;
      }

      toast.success(`Welcome ${res.user?.name || ''}`);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.requireName || err.response?.data?.requireNameAndPass) {
        setStep('name');
        toast.info('Enter your name and create a password to continue');
        return;
      }

      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Enter your name');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await verifyOTP(phone, otp, name.trim(), password);
      toast.success(`Welcome ${res.user?.name || ''}`);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.requireName || err.response?.data?.requireNameAndPass) {
        toast.error('Name and password are required');
        return;
      }

      toast.error(err.response?.data?.message || 'Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter valid Indian mobile number');
      return;
    }

    if (!password) {
      toast.error('Enter your password');
      return;
    }

    setLoading(true);

    try {
      const res = await loginWithPassword(phone, password);
      toast.success(`Welcome ${res.user?.name || ''}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (step === 'phone' && loginMode === 'otp') {
      return (
        <form onSubmit={handleSendOTP}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter mobile number"
            style={inputStyle}
          />
          <button style={btnStyle} type="submit">
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      );
    }

    if (step === 'otp') {
      return (
        <form onSubmit={handleVerifyOTP}>
          {demoOtp && <div style={otpStyle}>Demo OTP: {demoOtp}</div>}
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter OTP"
            style={inputStyle}
          />
          <button style={btnStyle} type="submit">
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      );
    }

    if (step === 'name') {
      return (
        <form onSubmit={handleCompleteSignup}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            style={inputStyle}
          />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              style={{ ...inputStyle, paddingRight: '56px' }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={toggleStyle}
              type="button"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button style={btnStyle} type="submit">
            {loading ? 'Saving...' : 'Complete Signup'}
          </button>
        </form>
      );
    }

    return (
      <form onSubmit={handlePasswordLogin}>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          placeholder="Phone"
          style={inputStyle}
        />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{ ...inputStyle, paddingRight: '56px' }}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            style={toggleStyle}
            type="button"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <button style={btnStyle} type="submit">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    );
  };

  return (
    <div style={pageStyle}>
      <div style={glowStyle} />

      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={logoStyle}>P</div>
          <h2 style={{ color: '#fff', marginBottom: '10px' }}>
            {authTitle}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5 }}>
            {authSubtitle}
          </p>
        </div>

        {step === 'phone' && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <button
              onClick={() => setLoginMode(loginMode === 'otp' ? 'password' : 'otp')}
              style={{ background: 'none', border: 'none', color: '#00e87a', cursor: 'pointer' }}
              type="button"
            >
              {loginMode === 'otp' ? 'Switch to Password Login' : 'Switch to OTP Login'}
            </button>
          </div>
        )}

        {renderStepContent()}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0a1628, #020617)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
};

const glowStyle = {
  position: 'absolute',
  width: 500,
  height: 500,
  background: 'radial-gradient(circle, rgba(0,232,122,0.08), transparent)',
  borderRadius: '50%',
  top: '30%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
};

const cardStyle = {
  width: '100%',
  maxWidth: 420,
  background: '#111827',
  padding: '40px',
  borderRadius: '20px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
  position: 'relative',
  zIndex: 2
};

const logoStyle = {
  width: 60,
  height: 60,
  borderRadius: 15,
  background: 'linear-gradient(135deg, #00e87a, #00b85e)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 15px',
  fontSize: 28,
  fontWeight: 'bold',
  color: '#000'
};

const otpStyle = {
  background: '#1f2937',
  padding: 10,
  borderRadius: 8,
  marginBottom: 15,
  textAlign: 'center',
  color: '#00e87a'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '15px',
  borderRadius: '10px',
  border: '1px solid #374151',
  background: '#020617',
  color: '#fff'
};

const btnStyle = {
  width: '100%',
  padding: '12px',
  background: '#00e87a',
  border: 'none',
  borderRadius: '10px',
  fontWeight: '600',
  cursor: 'pointer'
};

const toggleStyle = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-85%)',
  background: 'none',
  border: 'none',
  color: '#9ca3af',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600'
};
