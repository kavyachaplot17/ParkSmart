import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../utils/api';
import { formatCurrency, getDemandPrediction } from '../utils/pricing';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const prediction = getDemandPrediction();

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const chartData = {
    labels: prediction.map(p => p.label),
    datasets: [{
      label: 'Predicted Occupancy %',
      data: prediction.map(p => p.occupancy),
      backgroundColor: prediction.map(p =>
        p.occupancy > 80 ? 'rgba(239, 68, 68, 0.7)' :
        p.occupancy > 60 ? 'rgba(245, 158, 11, 0.7)' :
        'rgba(0, 232, 122, 0.7)'
      ),
      borderColor: prediction.map(p =>
        p.occupancy > 80 ? '#ef4444' : p.occupancy > 60 ? '#f59e0b' : '#00e87a'
      ),
      borderWidth: 2,
      borderRadius: 6,
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}% occupancy` } } },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { min: 0, max: 100, ticks: { color: '#64748b', callback: v => `${v}%` }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  const STATUS_COLORS = { confirmed: '#00e87a', pending: '#f59e0b', active: '#00d4ff', completed: '#64748b', cancelled: '#ef4444' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '80px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
            Admin <span style={{ color: 'var(--green)' }}>Dashboard</span>
          </h1>
          <p style={{ color: 'var(--text-dim)' }}>Real-time overview of ParkSmart Jaipur</p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
          </div>
        ) : stats && (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: '💰', sub: `Today: ${formatCurrency(stats.todayRevenue)}`, color: 'var(--green)' },
                { label: 'Occupancy Rate', value: `${stats.occupancyPercent}%`, icon: '📊', sub: `${stats.occupiedSlots + stats.reservedSlots}/${stats.totalSlots} slots`, color: 'var(--accent)' },
                { label: 'Active Bookings', value: stats.activeBookings, icon: '🅿️', sub: `${stats.totalBookings} total`, color: 'var(--amber)' },
                { label: 'Registered Users', value: stats.totalUsers, icon: '👥', sub: `${stats.totalLots} parking zones`, color: '#a78bfa' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: s.color, fontFamily: 'JetBrains Mono' }}>{s.value}</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>{s.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.sub}</div>
                    </div>
                    <span style={{ fontSize: '28px' }}>{s.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Occupancy bars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Available', value: stats.availableSlots, total: stats.totalSlots, color: 'var(--green)' },
                { label: 'Occupied', value: stats.occupiedSlots, total: stats.totalSlots, color: '#ef4444' },
                { label: 'Reserved', value: stats.reservedSlots, total: stats.totalSlots, color: 'var(--amber)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: s.color, fontFamily: 'JetBrains Mono' }}>{s.value}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>{s.label} Slots</div>
                  <div style={{ height: 6, background: 'var(--navy-light)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(s.value / s.total) * 100}%`, height: '100%', background: s.color, borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700' }}>AI Demand Prediction</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Predicted hourly occupancy — peak: 9-11am, 6-8pm</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                  {[['🔴', 'Peak (>80%)'], ['🟡', 'Busy (>60%)'], ['🟢', 'Normal']].map(([icon, label]) => (
                    <span key={label} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>{icon} {label}</span>
                  ))}
                </div>
              </div>
              <div style={{ height: 280 }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Recent bookings */}
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Recent Bookings</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr>
                      {['User', 'Lot', 'Slot', 'Start', 'Amount', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--navy-border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recentBookings || []).map(b => (
                      <tr key={b._id} style={{ borderBottom: '1px solid rgba(26,45,74,0.5)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                          {b.userId?.name || 'N/A'}
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{b.userId?.phone}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>{b.lotId?.name?.split(' ').slice(0, 2).join(' ')}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', color: 'var(--green)', fontWeight: '700' }}>
                          {b.slotId?.slotNumber || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '12px' }}>
                          {new Date(b.startTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                          {formatCurrency(b.totalCost)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge`} style={{
                            background: `${STATUS_COLORS[b.status]}20`,
                            color: STATUS_COLORS[b.status],
                            textTransform: 'capitalize'
                          }}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
