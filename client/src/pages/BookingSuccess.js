import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate, formatTime } from '../utils/pricing';

export default function BookingSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then(res => setBooking(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '64px' }}>
      <div style={{ fontSize: '48px', animation: 'float 1s ease-in-out infinite' }}>✅</div>
    </div>
  );

  if (!booking) return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '100px', textAlign: 'center' }}>
      Booking not found.
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '80px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px', textAlign: 'center', animation: 'fadeInUp 0.5s ease' }}>
        {/* Success icon */}
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          background: 'rgba(0, 232, 122, 0.15)',
          border: '3px solid var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '44px', margin: '0 auto 24px',
          boxShadow: '0 0 40px rgba(0, 232, 122, 0.3)',
          animation: 'pulse-green 2s ease-in-out 3'
        }}>✅</div>

        <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '8px' }}>
          Booking <span style={{ color: 'var(--green)' }}>Confirmed!</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '36px', fontSize: '16px' }}>
          Your parking slot has been reserved. Show the QR code at entry.
        </p>

        {/* QR Code */}
        {booking.qrCode && (
          <div className="card" style={{ marginBottom: '24px', padding: '28px', border: '1px solid rgba(0, 232, 122, 0.3)' }}>
            <div style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Entry / Exit QR Code
            </div>
            <div style={{
              display: 'inline-block', padding: '16px', background: '#fff',
              borderRadius: '12px', marginBottom: '16px'
            }}>
              <img src={booking.qrCode} alt="Booking QR Code" style={{ width: 200, height: 200, display: 'block' }} />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Valid QR code for parking access
            </div>
          </div>
        )}

        {/* Booking details */}
        <div className="card" style={{ marginBottom: '24px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Booking Details</h3>
          {[
            { label: 'Parking Lot', value: booking.lotId?.name },
            { label: 'Slot Number', value: booking.slotId?.slotNumber, mono: true },
            { label: 'Floor', value: `Floor ${booking.slotId?.floor}` },
            { label: 'Vehicle', value: booking.vehicleNumber, mono: true },
            { label: 'Date', value: formatDate(booking.startTime) },
            { label: 'Start Time', value: formatTime(booking.startTime) },
            { label: 'End Time', value: formatTime(booking.endTime) },
            { label: 'Duration', value: `${booking.duration} hour${booking.duration !== 1 ? 's' : ''}` },
            { label: 'Total Paid', value: formatCurrency(booking.totalCost), highlight: true },
            { label: 'Status', value: booking.status, badge: true },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: '12px', marginBottom: '12px',
              borderBottom: '1px solid var(--navy-border)'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{item.label}</span>
              {item.badge ? (
                <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>{item.value}</span>
              ) : (
                <span style={{
                  fontWeight: '700', fontSize: '14px',
                  color: item.highlight ? 'var(--green)' : 'var(--text)',
                  fontFamily: item.mono ? 'JetBrains Mono' : 'inherit'
                }}>{item.value}</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ flex: 1, justifyContent: 'center' }}>
            🅿️ Find More Parking
          </button>
          <button className="btn-secondary" onClick={() => navigate('/my-bookings')} style={{ flex: 1 }}>
            My Bookings
          </button>
        </div>
      </div>
    </div>
  );
}
