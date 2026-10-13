import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { RoomCard } from './Home.jsx';
import { demoRooms, demoRoomTypes } from '../data/demoRooms.js';

export default function Rooms() {
  const [params, setParams] = useSearchParams();
  const [rooms, setRooms] = useState(demoRooms);
  const [types, setTypes] = useState(demoRoomTypes);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/room-types')
      .then((r) => setTypes(r.data.data.length ? r.data.data : demoRoomTypes))
      .catch(() => setTypes(demoRoomTypes));
  }, []);
  useEffect(() => {
    setLoading(true);
    api.get(`/rooms?${params.toString()}`)
      .then((r) => setRooms(r.data.data.length ? r.data.data : demoRooms))
      .catch(() => setRooms(demoRooms))
      .finally(() => setLoading(false));
  }, [params]);
  function update(e) {
    const next = new URLSearchParams(params);
    e.target.value ? next.set(e.target.name, e.target.value) : next.delete(e.target.name);
    setParams(next);
  }
  return (
    <main className="page">
      <div className="sectionHead roomListingHead">
        <div><span className="eyebrow">Rooms and suites</span><h1>Choose Your Stay</h1><p>Search by date, guest capacity, room type, and nightly rate.</p></div>
      </div>
      <div className="filters">
        <select name="roomType" onChange={update} defaultValue={params.get('roomType') || ''}><option value="">All room types</option>{types.map((t) => <option value={t._id} key={t._id}>{t.name}</option>)}</select>
        <input name="guests" type="number" min="1" placeholder="Guests" onChange={update} defaultValue={params.get('guests') || ''} />
        <input name="minPrice" type="number" placeholder="Min price" onChange={update} />
        <input name="maxPrice" type="number" placeholder="Max price" onChange={update} />
        <select name="sort" onChange={update}><option value="">Newest</option><option value="price-asc">Price ascending</option><option value="price-desc">Price descending</option></select>
      </div>
      {loading ? <div className="loader">Loading rooms</div> : rooms.length ? <div className="roomGrid">{rooms.map((room) => <RoomCard key={room._id} room={room} />)}</div> : <div className="empty">No rooms match those filters.</div>}
    </main>
  );
}

