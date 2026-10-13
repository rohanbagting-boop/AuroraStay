import React from 'react';
import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { date, money } from '../utils/format.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { CalendarCheck, Clock, CreditCard, UserRound } from 'lucide-react';

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
          <h2>{user.name}</h2>
          <p>{user.email}{user.phone ? ` / ${user.phone}` : ''}</p>
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
    </main>
  );
}

function AccountStat({ icon, label, value }) {
  return <article><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}

