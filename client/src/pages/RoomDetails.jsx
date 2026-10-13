import React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { money } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { findDemoRoom } from '../data/demoRooms.js';
import { BedDouble, DoorClosed, Ruler, ShieldCheck, Wifi } from 'lucide-react';

export default function RoomDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [message, setMessage] = useState('');
  const { register, handleSubmit, watch } = useForm({ defaultValues: { guests: 2 } });
  useEffect(() => {
    const demoRoom = findDemoRoom(id);
    if (demoRoom) {
      setRoom(demoRoom);
      return;
    }
    api.get(`/rooms/${id}`).then((r) => setRoom(r.data.data));
  }, [id]);
  async function book(values) {
    if (!user) return navigate('/login');
    if (room._id?.startsWith('demo-')) {
      setMessage('This preview room is for browsing only. Please choose an available room from the current room list or contact the front desk for assistance.');
      return;
    }
    try {
      const payload = { ...values, guests: Number(values.guests), roomType: room.roomType._id, guestInfo: { name: user.name, email: user.email, phone: user.phone || '' }, idempotencyKey: crypto.randomUUID() };
      const { data } = await api.post('/reservations', payload);
      navigate(`/account?booking=${data.data.bookingReference}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Booking failed.');
    }
  }
  if (!room) return <div className="page"><div className="loader">Loading room</div></div>;
  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const nights = checkIn && checkOut ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)) : 0;
  const subtotal = nights * room.nightlyRate;
  return (
    <main className="page details">
      <div className="gallery">{room.images?.map((img) => <img key={img.url} src={img.url} alt={img.alt} />)}</div>
      <section className="detailGrid">
        <div className="roomDetailCopy">
          <span className="eyebrow">{room.roomType?.name} Room {room.roomNumber}</span>
          <h1>{room.name}</h1>
          <p>{room.description}</p>
          <div className="detailSpecs">
            <span><BedDouble size={18} /> {room.bedType}</span>
            <span><DoorClosed size={18} /> Up to {room.capacity} guests</span>
            <span><Ruler size={18} /> {room.sizeSqm} sqm</span>
            <span><ShieldCheck size={18} /> Secure booking</span>
          </div>
          <h2>Amenities</h2>
          <ul className="amenityList">{room.amenities?.map((a) => <li key={a}><Wifi size={16} /> {a}</li>)}</ul>
        </div>
        <form className="bookingPanel" onSubmit={handleSubmit(book)}>
          <h2>{money(room.nightlyRate)} <span>/ night</span></h2>
          <label>Check-in<input type="date" {...register('checkIn', { required: true })} /></label>
          <label>Check-out<input type="date" {...register('checkOut', { required: true })} /></label>
          <label>Guests<input type="number" min="1" max={room.capacity} {...register('guests', { required: true })} /></label>
          <label>Special requests<textarea {...register('specialRequests')} /></label>
          <div className="total"><span>Estimated subtotal</span><strong>{money(subtotal)}</strong></div>
          <button>Reserve room</button>
          {message && <p className="error">{message}</p>}
        </form>
      </section>
    </main>
  );
}

