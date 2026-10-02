import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = user?.role === 'admin'
    ? [{ to: '/admin', label: 'Dashboard' }, { to: '/my-bookings', label: 'Bookings' }]
    : [{ to: '/dashboard', label: 'Find Parking' }, { to: '/my-bookings', label: 'My Bookings' }];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10, 22, 40, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(26, 45, 74, 0.8)',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link to={user ? '/dashboard' : '/'} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, #00e87a, #00b85e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: '900', color: '#0a1628'
        }}>P</div>
        <span style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
          Park<span style={{ color: 'var(--green)' }}>Smart</span>
        </span>
      </Link>

      {/* Desktop nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {user && navLinks.map(link => (
          <Link key={link.to} to={link.to} style={{
            padding: '8px 16px', borderRadius: '8px', textDecoration: 'none',
            fontWeight: '500', fontSize: '14px',
            color: location.pathname.startsWith(link.to) ? 'var(--green)' : 'var(--text-dim)',
            background: location.pathname.startsWith(link.to) ? 'rgba(0, 232, 122, 0.1)' : 'transparent',
            transition: 'all 0.2s'
          }}>{link.label}</Link>
        ))}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' }}>
            <div style={{
              padding: '6px 14px', borderRadius: '20px',
              background: 'rgba(0, 232, 122, 0.1)',
              border: '1px solid rgba(0, 232, 122, 0.3)',
              fontSize: '13px', fontWeight: '600', color: 'var(--green)',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <span style={{ width: 7, height: 7, background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }}></span>
              {user.name?.split(' ')[0]}
            </div>
            <button onClick={handleLogout} className="btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login">
              <button className="btn-ghost" style={{ padding: '8px 20px', fontSize: '14px' }}>Login</button>
            </Link>
            <Link to="/login?mode=signup">
              <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '14px' }}>
                <span style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'rgba(10, 22, 40, 0.18)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '900'
                }}>+</span>
                Sign Up
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
