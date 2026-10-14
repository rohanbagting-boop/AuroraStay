import React from 'react';
import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { money, date } from '../utils/format.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { BedDouble, CalendarCheck, CreditCard, Plus, UsersRound, X } from 'lucide-react';
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
  const [roomTypes, setRoomTypes] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const fetchRooms = () => {
    api.get('/rooms?limit=100').then((r) => setRooms(r.data.data));
  };

  useEffect(() => {
    fetchRooms();
    api.get('/room-types').then((r) => setRoomTypes(r.data.data)).catch(() => {});
  }, []);

  const handleCreated = (newRoom) => {
    setRooms((prev) => [newRoom, ...prev]);
    setNotification(`Room ${newRoom.roomNumber} (${newRoom.name}) added to inventory.`);
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <>
      <DashTitle
        eyebrow="Inventory"
        title="Rooms"
        text="Review room inventory, capacity, rates, and availability status."
      />
      {notification && (
        <div style={{ background: '#f0fdf4', color: 'var(--green)', border: '1px solid #bbf7d0', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontWeight: 600 }}>
          {notification}
        </div>
      )}
      <section className="panelSection">
        <PanelHeader
          eyebrow="Room inventory"
          title="All rooms"
          action={
            <button
              type="button"
              className="primaryButton"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1rem', fontSize: '0.88rem' }}
              onClick={() => setIsAddOpen(true)}
            >
              <Plus size={17} /> Add room
            </button>
          }
        />
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.roomNumber}</strong> {r.name}</td>
                  <td>{r.roomType?.name}</td>
                  <td>{r.capacity}</td>
                  <td>{money(r.nightlyRate)}</td>
                  <td><StatusBadge value={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isAddOpen && (
        <AddRoomModal
          isOpen={isAddOpen}
          roomTypes={roomTypes}
          onClose={() => setIsAddOpen(false)}
          onSuccess={handleCreated}
        />
      )}
    </>
  );
}

const DEFAULT_AMENITIES = [
  'High-speed Wi-Fi',
  'Air Conditioning',
  'Smart TV',
  'Mini-bar',
  'Balcony',
  'Ocean View',
  'Ensuite Bath',
  'Coffee Maker',
  'In-room Safe',
  'Work Desk'
];

function AddRoomModal({ isOpen, roomTypes, onClose, onSuccess }) {
  const [form, setForm] = useState({
    roomNumber: '',
    name: '',
    roomType: roomTypes[0]?._id || '',
    floor: '1',
    capacity: '2',
    bedType: 'King bed',
    nightlyRate: '3500',
    sizeSqm: '30',
    status: 'available',
    description: '',
    imageUrl: ''
  });
  const [selectedAmenities, setSelectedAmenities] = useState(['High-speed Wi-Fi', 'Air Conditioning', 'Smart TV']);
  const [customAmenity, setCustomAmenity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!form.roomType && roomTypes.length > 0) {
      setForm((prev) => ({ ...prev, roomType: roomTypes[0]._id }));
    }
  }, [roomTypes]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      setSelectedAmenities((prev) => [...prev, trimmed]);
      setCustomAmenity('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.roomNumber.trim()) return setError('Please enter a room number.');
    if (!form.name.trim()) return setError('Please enter a room name.');
    if (!form.roomType) return setError('Please select a room type.');
    if (!form.bedType.trim()) return setError('Please specify the bed type.');
    if (Number(form.floor) < 0) return setError('Floor must be 0 or higher.');
    if (Number(form.capacity) < 1) return setError('Capacity must be at least 1 person.');
    if (Number(form.nightlyRate) < 0) return setError('Rate cannot be negative.');
    if (form.description.trim().length < 20) {
      return setError('Description must be at least 20 characters long.');
    }

    setLoading(true);
    try {
      const payload = {
        roomNumber: form.roomNumber.trim(),
        name: form.name.trim(),
        roomType: form.roomType,
        floor: Number(form.floor),
        capacity: Number(form.capacity),
        bedType: form.bedType.trim(),
        nightlyRate: Number(form.nightlyRate),
        sizeSqm: form.sizeSqm ? Number(form.sizeSqm) : 28,
        status: form.status,
        amenities: selectedAmenities,
        description: form.description.trim(),
        images: [
          {
            url: form.imageUrl.trim() || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
            alt: `${form.name} photo`
          }
        ]
      };

      const res = await api.post('/rooms', payload);
      onSuccess(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room. Please verify the entered details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modalCard modalCardLarge" onClick={(e) => e.stopPropagation()}>
        <button className="modalCloseBtn" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>

        <div className="modalHeader">
          <div className="modalIconWrap primary">
            <BedDouble size={20} />
          </div>
          <div className="modalTitleGroup">
            <h3>Add New Room</h3>
            <p>Create and configure a new room in the hotel inventory.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fdf2f2', color: 'var(--red)', border: '1px solid #fecaca', padding: '0.65rem 0.85rem', borderRadius: 6, fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div className="formGrid2">
            <div className="formGroup">
              <label>Room Number *</label>
              <input
                type="text"
                placeholder="e.g. 503"
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                required
              />
            </div>

            <div className="formGroup">
              <label>Room Name *</label>
              <input
                type="text"
                placeholder="e.g. Deluxe Ocean View"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="formGroup">
              <label>Room Type *</label>
              <select
                value={form.roomType}
                onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                required
              >
                {roomTypes.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="formGroup">
              <label>Floor *</label>
              <input
                type="number"
                min="0"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
                required
              />
            </div>

            <div className="formGroup">
              <label>Capacity (Guests) *</label>
              <input
                type="number"
                min="1"
                max="12"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
              />
            </div>

            <div className="formGroup">
              <label>Bed Type *</label>
              <input
                type="text"
                placeholder="e.g. King bed, 2 Queen beds"
                value={form.bedType}
                onChange={(e) => setForm({ ...form, bedType: e.target.value })}
                required
              />
            </div>

            <div className="formGroup">
              <label>Nightly Rate (₱) *</label>
              <input
                type="number"
                min="0"
                step="50"
                value={form.nightlyRate}
                onChange={(e) => setForm({ ...form, nightlyRate: e.target.value })}
                required
              />
            </div>

            <div className="formGroup">
              <label>Size (sqm)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 35"
                value={form.sizeSqm}
                onChange={(e) => setForm({ ...form, sizeSqm: e.target.value })}
              />
            </div>

            <div className="formGroup">
              <label>Initial Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="available">Available</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
                <option value="occupied">Occupied</option>
              </select>
            </div>

            <div className="formGroup">
              <label>Image URL (Optional)</label>
              <input
                type="url"
                placeholder="https://... (or leave blank for curated photo)"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>

            <div className="formGroup fullWidth">
              <label>Amenities</label>
              <div className="amenityChips">
                {DEFAULT_AMENITIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`amenityChip ${selectedAmenities.includes(item) ? 'selected' : ''}`}
                    onClick={() => toggleAmenity(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Add custom amenity..."
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAmenity(); } }}
                  style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  className="subtleButton"
                  onClick={addCustomAmenity}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="formGroup fullWidth">
              <label>Description * (min 20 characters)</label>
              <textarea
                rows="3"
                placeholder="Describe room features, view, layout, and unique selling points..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <small style={{ color: form.description.length >= 20 ? 'var(--muted)' : 'var(--red)', fontSize: '0.78rem' }}>
                {form.description.length}/20 characters minimum
              </small>
            </div>
          </div>

          <div className="modalActions" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="modalCancelBtn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="modalConfirmBtn primary" disabled={loading}>
              {loading ? 'Creating room...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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

function PanelHeader({ eyebrow, title, action }) {
  return (
    <div className="panelHeader">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

