import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c < 97 ? c + 1 : c);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: '🗺️', title: 'Live Map View', desc: 'See all parking spots in Jaipur with real-time availability on an interactive map.' },
    { icon: '⚡', title: 'Instant Booking', desc: 'Reserve your slot in seconds. Get a QR code for seamless entry and exit.' },
    { icon: '💰', title: 'Smart Pricing', desc: 'Dynamic pricing that adjusts to demand. Save more during off-peak hours.' },
    { icon: '📊', title: 'AI Predictions', desc: 'Know when parking is available before you leave home with AI-powered forecasts.' },
    { icon: '🔴', title: 'Real-time Updates', desc: 'Live slot status with IoT sensor data updated every 5 seconds.' },
    { icon: '📱', title: 'UPI Payments', desc: 'Pay seamlessly with UPI, cards, or net banking. Pure Indian experience.' },
  ];

  const stats = [
    { value: '3', label: 'Parking Zones', suffix: '+' },
    { value: '60', label: 'Parking Slots', suffix: '' },
    { value: '24/7', label: 'Availability', suffix: '' },
    { value: '₹25', label: 'Starting Price', suffix: '/hr' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px 60px',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }} className="grid-bg">
        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 232, 122, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 18px', borderRadius: '20px',
            background: 'rgba(0, 232, 122, 0.1)', border: '1px solid rgba(0, 232, 122, 0.3)',
            marginBottom: '32px', fontSize: '13px', fontWeight: '600', color: 'var(--green)'
          }}>
            <span style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', animation: 'pulse-green 2s infinite' }}></span>
            Live — Jaipur's Smartest Parking System
          </div>

          <h1 style={{
            fontSize: 'clamp(42px, 7vw, 80px)',
            fontWeight: '900', lineHeight: 1.05,
            marginBottom: '24px', color: '#fff',
            letterSpacing: '-2px'
          }}>
            Smart Parking<br />
            for <span style={{
              color: 'var(--green)',
              textShadow: '0 0 60px rgba(0, 232, 122, 0.5)'
            }}>Smarter</span> Cities
          </h1>

          <p style={{ fontSize: '20px', color: 'var(--text-dim)', marginBottom: '40px', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Find, book, and navigate to parking spots across Jaipur in real-time. 
            No more circling blocks. No more wasted time.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login"><button className="btn-primary" style={{ fontSize: '17px', padding: '14px 36px' }}>
              🅿️ Find Parking Now
            </button></Link>
            <Link to="/login"><button className="btn-secondary" style={{ fontSize: '17px', padding: '14px 36px' }}>
              See How It Works
            </button></Link>
          </div>

          {/* Live counter */}
          <div style={{
            marginTop: '60px', display: 'inline-flex', alignItems: 'center', gap: '16px',
            padding: '16px 28px', borderRadius: '16px',
            background: 'var(--navy-card)', border: '1px solid var(--navy-border)'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--green)', fontFamily: 'JetBrains Mono' }}>
                {count}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>CURRENT OCCUPANCY</div>
            </div>
            <div style={{ width: 1, height: 50, background: 'var(--navy-border)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }}></span>
                <span style={{ fontSize: '13px', color: 'var(--text)' }}>Available Slots</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }}></span>
                <span style={{ fontSize: '13px', color: 'var(--text)' }}>Occupied</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '60px 24px', background: 'var(--navy-light)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '28px' }}>
              <div style={{ fontSize: '48px', fontWeight: '900', color: 'var(--green)', fontFamily: 'JetBrains Mono' }}>
                {s.value}{s.suffix}
              </div>
              <div style={{ fontSize: '15px', color: 'var(--text-dim)', marginTop: '8px', fontWeight: '500' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '16px' }}>
              Everything You Need
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text-dim)', maxWidth: 500, margin: '0 auto' }}>
              A complete parking ecosystem built for the modern Indian city
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, fontSize: '15px' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '100px 24px', textAlign: 'center',
        background: 'linear-gradient(180deg, var(--navy) 0%, rgba(0, 232, 122, 0.05) 50%, var(--navy) 100%)'
      }}>
        <h2 style={{ fontSize: '52px', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '20px' }}>
          Ready to Park<br /><span style={{ color: 'var(--green)' }}>Smarter?</span>
        </h2>
        <p style={{ fontSize: '18px', color: 'var(--text-dim)', marginBottom: '40px' }}>
          Join thousands of Jaipur drivers using ParkSmart daily
        </p>
        <Link to="/login">
          <button className="btn-primary" style={{ fontSize: '18px', padding: '16px 48px' }}>
            Get Started — It's Free
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 24px', borderTop: '1px solid var(--navy-border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          © 2024 ParkSmart — Built for Jaipur, Rajasthan 🌹
        </p>
      </footer>
    </div>
  );
}
