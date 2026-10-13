import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import { RequireAuth } from './components/RequireAuth.jsx';
import Home from './pages/Home.jsx';
import Rooms from './pages/Rooms.jsx';
import RoomDetails from './pages/RoomDetails.jsx';
import Account from './pages/Account.jsx';
import { ForgotPassword, Login, Register } from './pages/AuthPages.jsx';
import { About, Contact, FAQ, NotFound, Privacy, Terms } from './pages/StaticPages.jsx';
import { DashboardHome, PaymentsAdmin, ReservationsAdmin, RoomsAdmin, SettingsAdmin, UsersAdmin } from './pages/Dashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Route>
      <Route path="/dashboard" element={<RequireAuth roles={['admin', 'receptionist']}><DashboardLayout /></RequireAuth>}>
        <Route index element={<DashboardHome />} />
        <Route path="rooms" element={<RoomsAdmin />} />
        <Route path="reservations" element={<ReservationsAdmin />} />
        <Route path="users" element={<RequireAuth roles={['admin']}><UsersAdmin /></RequireAuth>} />
        <Route path="payments" element={<PaymentsAdmin />} />
        <Route path="settings" element={<RequireAuth roles={['admin']}><SettingsAdmin /></RequireAuth>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

