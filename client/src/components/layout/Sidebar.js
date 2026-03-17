import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaQrcode, FaHistory, FaUser, FaTachometerAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  // Student sidebar keeps full navigation
  const studentMenu = [
    { to: '/student', label: 'Dashboard', icon: FaTachometerAlt },
    { to: '/student/scan', label: 'Scan QR', icon: FaQrcode },
    { to: '/student/my-attendance', label: 'My Attendance', icon: FaHistory },
    { to: '/profile', label: 'Profile', icon: FaUser }
  ];

  // Teacher sidebar is minimal – only Dashboard
  const teacherMenu = [
    { to: '/teacher', label: 'Dashboard', icon: FaTachometerAlt }
  ];

  const menuItems = user?.role === 'teacher' ? teacherMenu : studentMenu;

  return (
    <aside className="hidden md:flex md:flex-col bg-secondary/90 backdrop-blur-xl border-r border-white/5 shadow-soft-glass w-64 min-h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
            <FaQrcode />
          </div>
          <div>
            <p className="text-xs tracking-widest text-gray-400 uppercase">QR</p>
            <p className="font-semibold text-gray-100">Attendance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent/20 text-accent shadow-soft-glass'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              ].join(' ')
            }
          >
            <Icon className="text-base" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

