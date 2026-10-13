import React, { useState } from 'react';
import { BarChart3, BedDouble, ClipboardList, CreditCard, LogOut, Settings, UsersRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const admin = user?.role === 'admin';

  return (
    <main className="dashShell">
      <aside className="sidebar">
        <h2>Aurora Stay</h2>
        <NavLink to="/dashboard"><BarChart3 size={18} /> Dashboard</NavLink>
        <NavLink to="/dashboard/rooms"><BedDouble size={18} /> Rooms</NavLink>
        <NavLink to="/dashboard/reservations"><ClipboardList size={18} /> Reservations</NavLink>
        {admin && <NavLink to="/dashboard/users"><UsersRound size={18} /> Users</NavLink>}
        <NavLink to="/dashboard/payments"><CreditCard size={18} /> Payments</NavLink>
        {admin && <NavLink to="/dashboard/settings"><Settings size={18} /> Settings</NavLink>}
        <button type="button" onClick={() => setShowLogoutModal(true)}><LogOut size={18} /> Logout</button>
      </aside>
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
        title="Sign Out of Dashboard"
        message="Are you sure you want to end your staff session? You will be returned to the guest portal."
        confirmText="Sign out"
      />
      <section className="dashContent">
        <Outlet />
      </section>
    </main>
  );
}

