import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/LandingHome';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LotView from './pages/LotView';
import BookingPage from './pages/BookingPage';
import BookingSuccess from './pages/BookingSuccess';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';

const PrivateRoute = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '48px', animation: 'float 1s ease-in-out infinite' }}>🅿️</div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function AppRoutes() { 
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/lot/:id" element={<PrivateRoute><LotView /></PrivateRoute>} />
        <Route path="/book/:id" element={<PrivateRoute><BookingPage /></PrivateRoute>} />
        <Route path="/booking-success/:id" element={<PrivateRoute><BookingSuccess /></PrivateRoute>} />
        <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right" autoClose={3000} hideProgressBar={false}
          toastStyle={{ background: '#111d35', border: '1px solid #1a2d4a', color: '#e2e8f0' }}
          theme="dark"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
