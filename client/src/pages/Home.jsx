import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, Bath, BedDouble, CalendarCheck, Coffee, DoorClosed, MapPin, Search, ShieldCheck, Sparkles, Star, Utensils, Wifi } from 'lucide-react';
import { api } from '../services/api.js';
import { money } from '../utils/format.js';
import { demoRooms } from '../data/demoRooms.js';

export default function Home() {
  const [rooms, setRooms] = useState(demoRooms.slice(0, 3));
  const navigate = useNavigate();
  useEffect(() => {
    api.get('/rooms?limit=3')
      .then((r) => setRooms(r.data.data.length ? r.data.data : demoRooms.slice(0, 3)))
      .catch(() => setRooms(demoRooms.slice(0, 3)));
  }, []);
  function submit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    navigate(`/rooms?checkIn=${data.get('checkIn')}&checkOut=${data.get('checkOut')}&guests=${data.get('guests')}`);
  }
  return (
    <main>
      <section className="hero">
        <div className="heroText">
          <p><MapPin size={16} /> Makati City, Philippines</p>
          <h1>Calm city stays with thoughtful Filipino hospitality.</h1>
          <div className="heroMeta">
            <span><Star size={16} /> 4.8 guest rating</span>
            <span><DoorClosed size={16} /> 10 curated rooms</span>
            <span><CalendarCheck size={16} /> Secure reservations</span>
          </div>
          <form className="searchBar" onSubmit={submit}>
            <input type="date" name="checkIn" required />
            <input type="date" name="checkOut" required />
            <input type="number" name="guests" min="1" defaultValue="2" />
            <button><Search size={18} /> Check availability</button>
          </form>
        </div>
      </section>
      <section className="quickFacts">
        <div><Wifi size={20} /><strong>Fast Wi-Fi</strong><span>Work-ready rooms</span></div>
        <div><Coffee size={20} /><strong>Breakfast Service</strong><span>Daily from 6:30 AM</span></div>
        <div><Bath size={20} /><strong>Private Baths</strong><span>Rain shower options</span></div>
        <div><BedDouble size={20} /><strong>Flexible Rooms</strong><span>Solo, couple, family</span></div>
      </section>
      <section className="section">
        <div className="sectionHead">
          <div><span className="eyebrow">Selected stays</span><h2>Featured Rooms</h2></div>
          <Link to="/rooms">View all <ArrowRight size={17} /></Link>
        </div>
        <div className="roomGrid">{rooms.map((room) => <RoomCard key={room._id} room={room} />)}</div>
      </section>
      <section className="band">
        <div><ShieldCheck /><h3>Secure Booking</h3><p>Clear confirmations, protected guest accounts, and a booking reference for every stay.</p></div>
        <div><Utensils /><h3>Dining Nearby</h3><p>Concierge recommendations and practical access to Makati restaurants.</p></div>
        <div><Sparkles /><h3>Business Ready</h3><p>Quiet rooms, reliable Wi-Fi, and front desk support for smooth arrivals.</p></div>
      </section>
      <section className="section split">
        <div>
          <span className="eyebrow">Hotel experience</span>
          <h2>Designed for restful travel</h2>
          <p>Aurora Stay pairs warm interiors with practical service: flexible rooms, transparent pricing, and attentive support throughout your stay.</p>
          <div className="quote">"The room was quiet, the rate breakdown was clear, and check-in took less than five minutes."</div>
        </div>
        <img src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=82" alt="Hotel lobby seating" />
      </section>
    </main>
  );
}

export function RoomCard({ room }) {
  return (
    <article className="roomCard">
      <div className="roomPhoto">
        <img src={room.images?.[0]?.url} alt={room.images?.[0]?.alt || room.name} />
        <span>{room.status || 'available'}</span>
      </div>
      <div className="roomBody">
        <div className="roomKicker"><span>{room.roomType?.name}</span><span>Room {room.roomNumber}</span></div>
        <h3>{room.name}</h3>
        <p>{room.description}</p>
        <div className="roomSpecs">
          <span><BedDouble size={15} /> {room.bedType}</span>
          <span><DoorClosed size={15} /> Up to {room.capacity}</span>
          <span>{room.sizeSqm} sqm</span>
        </div>
        <div className="roomActions">
          <strong>{money(room.nightlyRate)} <small>/ night</small></strong>
          <Link to={`/rooms/${room._id}`}>View details <ArrowRight size={16} /></Link>
        </div>
      </div>
    </article>
  );
}

