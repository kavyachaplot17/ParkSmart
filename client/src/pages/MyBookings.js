import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatDate, formatTime } from '../utils/pricing';
import { toast } from 'react-toastify';

const STATUS_COLORS = {
  confirmed: 'badge-green', pending: 'badge-amber', active: 'badge-blue',
  completed: 'badge-blue', cancelled: 'badge-red'
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanding, setExpanding] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/bookings/my')
      .then(res => setBookings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '80px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>My Bookings</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '32px' }}>View and manage your parking reservations</p>

        {loading ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🅿️</div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>No bookings yet</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '28px' }}>Start by finding a parking spot</p>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>Find Parking →</button>
          </div>
        ) : bookings.map(booking => (
          <div key={booking._id} className="card" style={{ marginBottom: '16px', cursor: 'pointer' }}
            onClick={() => setExpanding(expanding === booking._id ? null : booking._id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'JetBrains Mono', color: 'var(--green)' }}>
                    {booking.slotId?.slotNumber || 'N/A'}
                  </span>
                  <span className={`badge ${STATUS_COLORS[booking.status] || 'badge-blue'}`} style={{ textTransform: 'capitalize' }}>
                    {booking.status}
                  </span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  {booking.lotId?.name}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {formatDate(booking.startTime)} • {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>
                  {formatCurrency(booking.totalCost)}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{booking.duration}h</div>
              </div>
            </div>

            {expanding === booking._id && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--navy-border)', animation: 'fadeInUp 0.3s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: 'Vehicle', value: booking.vehicleNumber },
                    { label: 'Floor', value: `Floor ${booking.slotId?.floor}` },
                    { label: 'Location', value: booking.lotId?.location },
                    { label: 'Booked on', value: formatDate(booking.createdAt) },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', fontFamily: item.label === 'Vehicle' ? 'JetBrains Mono' : 'inherit' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {booking.qrCode && (
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px', padding: '14px', background: 'var(--navy-light)', borderRadius: '10px' }}>
                    <img src={booking.qrCode} alt="QR" style={{ width: 70, height: 70, background: '#fff', padding: '4px', borderRadius: '6px' }} />
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>QR Code</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show this at parking entry/exit</div>
                    </div>
                  </div>
                )}

                {['confirmed', 'pending'].includes(booking.status) && (
                  <button
                    className="btn-ghost" onClick={(e) => { e.stopPropagation(); handleCancel(booking._id); }}
                    style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                    Cancel Booking
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
