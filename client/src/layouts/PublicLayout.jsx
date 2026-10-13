import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, ChevronRight, Clock, LogOut, Phone, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo } from '../components/Logo.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <div className="utilityBar">
        <span><Phone size={14} /> +63 2 8555 0188</span>
        <span><Clock size={14} /> Check-in 2:00 PM / Check-out 12:00 PM</span>
      </div>
      <header className="topbar">
        <Link to="/" className="brand"><Logo /></Link>
        <nav className="mainNav" aria-label="Primary navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/rooms">Rooms</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
        </nav>
        <div className="navActions">
          {user ? (
            <>
              <NavLink className="accountLink" to="/account"><CalendarDays size={17} /> Account</NavLink>
              {(user.role === 'admin' || user.role === 'receptionist') && <NavLink className="dashboardLink" to="/dashboard">Dashboard <ChevronRight size={16} /></NavLink>}
              <button className="iconButton" onClick={() => setShowLogoutModal(true)} title="Logout" aria-label="Logout"><LogOut size={18} /></button>
            </>
          ) : (
            <>
              <NavLink className="loginLink" to="/login"><UserRound size={17} /> Login</NavLink>
              <NavLink className="reserveLink" to="/rooms">Reserve <ChevronRight size={16} /></NavLink>
            </>
          )}
        </div>
      </header>
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
        title="Confirm Sign Out"
        message="Are you sure you want to log out of Aurora Stay? You will need to sign in again to view your bookings."
        confirmText="Sign out"
      />
      <Outlet />
      <footer className="footer">
        <strong>Aurora Stay Hotel</strong>
        <span>Ayala Avenue, Makati City</span>
        <span>+63 2 8555 0188</span>
      </footer>
    </>
  );
}

