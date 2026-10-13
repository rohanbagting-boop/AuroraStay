import React from 'react';
import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { money, date } from '../utils/format.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { BedDouble, CalendarCheck, CreditCard, UsersRound } from 'lucide-react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);
export function DashboardHome() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/dashboard/stats').then((r) => setStats(r.data.data)); }, []);
  if (!stats) return <div className="loader">Loading dashboard</div>;
  return <><DashTitle eyebrow="Operations" title="Dashboard" text="Monitor reservations, arrivals, room activity, and recorded revenue." /><div className="statGrid"><Stat icon={<CalendarCheck />} label="Total reservations" value={stats.totalReservations} /><Stat icon={<ClockIcon />} label="Today" value={stats.reservationsToday} /><Stat icon={<BedDouble />} label="Upcoming" value={stats.upcomingConfirmed} /><Stat icon={<CreditCard />} label="Revenue" value={money(stats.revenue)} /></div><section className="panelSection"><PanelHeader eyebrow="Latest activity" title="Recent reservations" /><DataTable rows={stats.recentReservations} /></section></>;
}

function ClockIcon() { return <CalendarCheck />; }
function Stat({ icon, label, value }) { return <div className="stat"><span className="statIcon">{icon}</span><span>{label}</span><strong>{value}</strong></div>; }
function DataTable({ rows }) { return <div className="tableWrap"><table><thead><tr><th>Reference</th><th>Guest</th><th>Room</th><th>Date</th><th>Status</th></tr></thead><tbody>{rows?.map((r) => <tr key={r._id}><td>{r.bookingReference}</td><td>{r.guest?.name}</td><td>{r.roomSnapshot?.roomNumber}</td><td>{date(r.checkIn)}</td><td><StatusBadge value={r.status} /></td></tr>)}</tbody></table></div>; }

export function ReservationsAdmin() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/reservations').then((r) => setRows(r.data.data)); }, []);
  async function status(id, next) { await api.patch(`/reservations/${id}/status`, { status: next }); setRows((rs) => rs.map((r) => (r._id === id ? { ...r, status: next } : r))); }
  
  const events = rows.map(r => ({
    id: r._id,
    title: `${r.guest?.name} (Room ${r.roomSnapshot?.roomNumber || 'Any'})`,
    start: new Date(r.checkIn),
    end: new Date(r.checkOut),
    resource: r
  }));

  return <><DashTitle eyebrow="Front desk" title="Reservations" text="Search, review, and update guest reservation statuses." /><section className="panelSection"><PanelHeader eyebrow="Calendar view" title="Schedule" /><div style={{ height: 600, background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #eee', marginBottom: 24 }}><Calendar localizer={localizer} events={events} startAccessor="start" endAccessor="end" style={{ height: '100%' }} /></div><PanelHeader eyebrow="Reservations" title="All reservations" /><div className="tableWrap"><table><thead><tr><th>Reference</th><th>Guest</th><th>Dates</th><th>Status</th><th>Payment</th><th></th></tr></thead><tbody>{rows.map((r) => <tr key={r._id}><td><strong>{r.bookingReference}</strong></td><td>{r.guest?.name}</td><td>{date(r.checkIn)} - {date(r.checkOut)}</td><td><StatusBadge value={r.status} /></td><td><StatusBadge value={r.paymentStatus} /></td><td>{r.status === 'confirmed' && <button className="subtleButton" onClick={() => status(r._id, 'checked-in')}>Check in</button>}{r.status === 'checked-in' && <button className="subtleButton" onClick={() => status(r._id, 'checked-out')}>Check out</button>}</td></tr>)}</tbody></table></div></section></>;
}

export function RoomsAdmin() {
  const [rooms, setRooms] = useState([]);
  useEffect(() => { api.get('/rooms?limit=100').then((r) => setRooms(r.data.data)); }, []);
  return <><DashTitle eyebrow="Inventory" title="Rooms" text="Review room inventory, capacity, rates, and availability status." /><section className="panelSection"><PanelHeader eyebrow="Room inventory" title="All rooms" /><div className="tableWrap"><table><thead><tr><th>Room</th><th>Type</th><th>Capacity</th><th>Rate</th><th>Status</th></tr></thead><tbody>{rooms.map((r) => <tr key={r._id}><td><strong>{r.roomNumber}</strong> {r.name}</td><td>{r.roomType?.name}</td><td>{r.capacity}</td><td>{money(r.nightlyRate)}</td><td><StatusBadge value={r.status} /></td></tr>)}</tbody></table></div></section></>;
}

export function UsersAdmin() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/users').then((r) => setRows(r.data.data)); }, []);
  return <><DashTitle eyebrow="Accounts" title="Users" text="Manage guest and staff account records." /><section className="panelSection"><PanelHeader eyebrow="User records" title="Registered users" /><div className="tableWrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody>{rows.map((u) => <tr key={u._id}><td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.role}</td><td>{u.isActive ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div></section></>;
}

export function PaymentsAdmin() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/payments').then((r) => setRows(r.data.data)); }, []);
  return <><DashTitle eyebrow="Finance" title="Payments" text="Review recorded reservation payments and transaction statuses." /><section className="panelSection"><PanelHeader eyebrow="Payment records" title="Payments" /><div className="tableWrap"><table><thead><tr><th>Reservation</th><th>Method</th><th>Status</th><th>Amount</th></tr></thead><tbody>{rows.map((p) => <tr key={p._id}><td><strong>{p.reservation?.bookingReference}</strong></td><td>{p.method}</td><td><StatusBadge value={p.status} /></td><td>{money(p.amount)}</td></tr>)}</tbody></table></div></section></>;
}

export function SettingsAdmin() {
  const [settings, setSettings] = useState(null);
  useEffect(() => { api.get('/settings').then((r) => setSettings(r.data.data)); }, []);
  if (!settings) return <div className="loader">Loading settings</div>;
  return <><DashTitle eyebrow="Configuration" title="Hotel Settings" text="Review core hotel information shown across guest and staff workflows." /><section className="settingsPanel"><strong>{settings.hotelName}</strong><span>{settings.address}</span><span>{settings.contactEmail}</span><span>Check-in {settings.checkInTime} / Check-out {settings.checkOutTime}</span></section></>;
}

function DashTitle({ eyebrow, title, text }) {
  return <section className="dashTitle"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></section>;
}

function PanelHeader({ eyebrow, title }) {
  return <div className="panelHeader"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div></div>;
}

