import React from 'react';
import { BarChart3, BedDouble, ClipboardList, CreditCard, LogOut, Settings, UsersRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
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
        <button onClick={logout}><LogOut size={18} /> Logout</button>
      </aside>
      <section className="dashContent">
        <Outlet />
      </section>
    </main>
  );
}

