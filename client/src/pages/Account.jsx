import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../services/api.js';
import { date, money } from '../utils/format.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PasswordInput, PasswordRequirements } from './AuthPages.jsx';
import { CalendarCheck, Clock, CreditCard, ShieldCheck, UserRound } from 'lucide-react';

export default function Account() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/reservations/my').then((r) => setItems(r.data.data)); }, []);
  async function cancel(id) {
    if (!confirm('Cancel this reservation?')) return;
    await api.patch(`/reservations/${id}/cancel`, { reason: 'Cancelled from guest portal' });
    setItems((list) => list.map((i) => (i._id === id ? { ...i, status: 'cancelled' } : i)));
  }
  const upcoming = items.filter((item) => ['pending', 'confirmed'].includes(item.status)).length;
  const paid = items.filter((item) => item.paymentStatus === 'paid').length;
  const totalSpent = items.reduce((sum, item) => sum + (item.price?.total || 0), 0);
  return (
    <main className="page accountPage">
      <section className="pageTitleRow">
        <div>
          <span className="eyebrow">Guest portal</span>
          <h1>Guest Account</h1>
          <p>Review upcoming stays, reservation history, and saved guest details.</p>
        </div>
      </section>
      <section className="accountHero">
        <div className="accountAvatar"><UserRound size={28} /></div>
        <div>
          <span>Welcome back</span>
          <h2>{user?.name}</h2>
          <p>{user?.email}{user?.phone ? ` / ${user.phone}` : ''}</p>
        </div>
      </section>
      <section className="accountStats">
        <AccountStat icon={<CalendarCheck />} label="Upcoming stays" value={upcoming} />
        <AccountStat icon={<Clock />} label="Total bookings" value={items.length} />
        <AccountStat icon={<CreditCard />} label="Paid bookings" value={paid} />
        <AccountStat icon={<CreditCard />} label="Recorded total" value={money(totalSpent)} />
      </section>
      <section className="panelSection">
        <div className="panelHeader">
          <div>
            <span className="eyebrow">Reservations</span>
            <h2>Booking History</h2>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead><tr><th>Reference</th><th>Room</th><th>Dates</th><th>Status</th><th>Payment</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {items.length ? items.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.bookingReference}</strong></td>
                  <td>{r.roomSnapshot?.name}</td>
                  <td>{date(r.checkIn)} to {date(r.checkOut)}</td>
                  <td><StatusBadge value={r.status} /></td>
                  <td><StatusBadge value={r.paymentStatus} /></td>
                  <td>{money(r.price?.total)}</td>
                  <td>{['pending', 'confirmed'].includes(r.status) && <button className="subtleButton" onClick={() => cancel(r._id)}>Cancel</button>}</td>
                </tr>
              )) : <tr><td colSpan="7"><div className="emptyInline">No reservations yet.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <ChangePasswordCard />
    </main>
  );
}

function ChangePasswordCard() {
  const { register, handleSubmit, watch, reset } = useForm();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const newPassword = watch('newPassword') || '';

  async function onSubmit(values) {
    if (!values.currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (!values.newPassword) {
      setError('Please enter your new password.');
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    const isLengthValid = values.newPassword.length >= 8;
    const hasLower = /[a-z]/.test(values.newPassword);
    const hasUpper = /[A-Z]/.test(values.newPassword);
    const hasNumber = /[0-9]/.test(values.newPassword);
    if (!isLengthValid || !hasLower || !hasUpper || !hasNumber) {
      setError('New password must satisfy all security requirements.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/auth/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      setSuccess('Password updated successfully! Redirecting to sign in...');
      reset();
      setTimeout(async () => {
        try { await logout(); } catch {}
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panelSection" style={{ marginTop: '2.5rem' }}>
      <div className="panelHeader">
        <div>
          <span className="eyebrow">Security</span>
          <h2>Change Password</h2>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--muted)', fontSize: '0.92rem' }}>
            Ensure your account stays secure by choosing a strong password.
          </p>
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '8px', padding: '1.75rem', maxWidth: '520px', boxShadow: 'var(--shadow-soft)' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1.1rem' }}>
          {error && <div style={{ color: 'var(--red)', background: '#fdf2f2', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #fecaca' }}>{error}</div>}
          {success && <div style={{ color: 'var(--green)', background: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>{success}</div>}

          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--charcoal)' }}>
            <span>Current password</span>
            <PasswordInput placeholder="Enter your current password" registerObj={register('currentPassword')} />
          </label>

          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--charcoal)' }}>
            <span>New password</span>
            <PasswordInput placeholder="Create a strong new password" registerObj={register('newPassword')} />
          </label>

          <PasswordRequirements password={newPassword} />

          <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--charcoal)' }}>
            <span>Confirm new password</span>
            <PasswordInput placeholder="Re-enter your new password" registerObj={register('confirmPassword')} />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.4rem' }}>
            <button className="primaryButton" disabled={loading} style={{ padding: '0.75rem 1.6rem' }}>
              {loading ? 'Updating password...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function AccountStat({ icon, label, value }) {
  return <article><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}

