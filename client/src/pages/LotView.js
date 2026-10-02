import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../utils/api';
import { getDynamicPrice, formatCurrency } from '../utils/pricing';

export default function LotView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchData();
    const socket = io('http://localhost:5000');
    socket.emit('join-lot', id);
    socket.on('slot-update', ({ changedSlots }) => {
      setSlots(prev => prev.map(slot => {
        const changed = changedSlots.find(c => c.slotId === slot._id);
        return changed ? { ...slot, status: changed.status } : slot;
      }));
    });
    return () => { socket.emit('leave-lot', id); socket.disconnect(); };
  }, [id]);

  const fetchData = async () => {
    try {
      const [lotRes, slotsRes] = await Promise.all([
        api.get(`/parking/lots/${id}`),
        api.get(`/parking/lots/${id}/slots`)
      ]);
      setLot(lotRes.data);
      setSlots(slotsRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '48px', animation: 'float 1s ease-in-out infinite' }}>🅿️</div>
    </div>
  );

  const currentHour = new Date().getHours();
  const pricing = lot ? getDynamicPrice(lot.pricePerHour, currentHour) : null;
  const floors = [...new Set(slots.map(s => s.floor))].sort();
  const filtered = slots.filter(s =>
    (filterFloor === 'all' || s.floor === Number(filterFloor)) &&
    (filterType === 'all' || s.type === filterType)
  );

  const available = slots.filter(s => s.status === 'available').length;
  const occupied = slots.filter(s => s.status === 'occupied').length;
  const reserved = slots.filter(s => s.status === 'reserved').length;

  const statusColors = {
    available: { bg: 'rgba(0, 232, 122, 0.12)', border: '#00e87a', text: '#00e87a' },
    occupied: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', text: '#ef4444' },
    reserved: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', text: '#f59e0b' },
  };

  const typeIcons = { regular: '🚗', compact: '🚙', handicapped: '♿', ev: '⚡' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '80px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer',
            fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px'
          }}>← Back to Search</button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>{lot?.name}</h1>
              <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>📍 {lot?.location}</p>
            </div>
            <div style={{
              padding: '16px 24px', borderRadius: '12px',
              background: 'var(--navy-card)', border: '1px solid var(--navy-border)', textAlign: 'right'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                {formatCurrency(pricing?.price)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>per hour • {pricing?.label}</div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Available', value: available, color: 'var(--green)', icon: '🟢' },
            { label: 'Occupied', value: occupied, color: '#ef4444', icon: '🔴' },
            { label: 'Reserved', value: reserved, color: 'var(--amber)', icon: '🟡' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: '36px', fontWeight: '900', color: s.color, fontFamily: 'JetBrains Mono' }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '600', marginTop: '4px' }}>{s.icon} {s.label}</div>
            </div>
          ))}
        </div>

        {/* Legend + Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {floors.map(f => (
              <button key={f} onClick={() => setFilterFloor(filterFloor === String(f) ? 'all' : String(f))}
                className={filterFloor === String(f) ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '8px 16px', fontSize: '13px' }}>
                Floor {f}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['regular', 'compact', 'ev', 'handicapped'].map(t => (
              <button key={t} onClick={() => setFilterType(filterType === t ? 'all' : t)}
                className={filterType === t ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '8px 14px', fontSize: '12px' }}>
                {typeIcons[t]} {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Slot Grid */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '10px',
              padding: '24px',
              background: 'var(--navy-card)',
              borderRadius: '16px',
              border: '1px solid var(--navy-border)'
            }}>
              {filtered.map(slot => {
                const c = statusColors[slot.status];
                const isSelected = selectedSlot?._id === slot._id;
                return (
                  <button
                    key={slot._id}
                    onClick={() => slot.status === 'available' ? setSelectedSlot(isSelected ? null : slot) : null}
                    disabled={slot.status !== 'available'}
                    style={{
                      padding: '12px 8px', borderRadius: '10px',
                      border: `2px solid ${isSelected ? '#fff' : c.border}`,
                      background: isSelected ? c.border : c.bg,
                      color: isSelected ? '#000' : c.text,
                      cursor: slot.status === 'available' ? 'pointer' : 'default',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      transition: 'all 0.2s',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                      boxShadow: isSelected ? `0 0 20px ${c.border}` : 'none',
                      minHeight: '70px'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{typeIcons[slot.type]}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'JetBrains Mono' }}>{slot.slotNumber}</span>
                    <span style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', opacity: 0.8 }}>
                      {slot.status === 'available' ? 'Free' : slot.status}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Available', color: 'var(--green)' },
                { label: 'Occupied', color: '#ef4444' },
                { label: 'Reserved', color: 'var(--amber)' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '3px', background: l.color }}></span>
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Booking panel */}
          {selectedSlot && (
            <div className="card" style={{ width: '280px', flexShrink: 0, position: 'sticky', top: '80px', border: '1px solid rgba(0, 232, 122, 0.4)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'var(--green)' }}>
                ✅ Slot Selected
              </h3>
              <div style={{ marginBottom: '16px', padding: '14px', background: 'var(--navy-light)', borderRadius: '10px' }}>
                <div style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'JetBrains Mono', color: 'var(--green)' }}>
                  {selectedSlot.slotNumber}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '4px' }}>
                  Floor {selectedSlot.floor} • {typeIcons[selectedSlot.type]} {selectedSlot.type}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Rate</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(pricing.price)}/hr</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Pricing</span>
                  <span className={`badge ${pricing.label === 'Peak' ? 'badge-red' : pricing.label === 'Off-Peak' ? 'badge-blue' : 'badge-green'}`}>
                    {pricing.label} ({pricing.multiplier}x)
                  </span>
                </div>
              </div>
              <button
                className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate(`/book/${id}`, { state: { slot: selectedSlot, lot, pricing } })}
              >
                Book This Slot →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
