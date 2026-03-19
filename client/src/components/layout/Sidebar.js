import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaQrcode,
  FaHistory,
  FaUser,
  FaTachometerAlt,
  FaClipboardList,
  FaChartBar
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();

  // Student sidebar keeps full navigation
  const studentMenu = [
    { to: '/student', label: 'Dashboard', icon: FaTachometerAlt },
    { to: '/student/scan', label: 'Scan QR', icon: FaQrcode },
    { to: '/student/exam/scan', label: 'Exam', icon: FaClipboardList },
    { to: '/student/results', label: 'Results', icon: FaChartBar },
    { to: '/student/my-attendance', label: 'My Attendance', icon: FaHistory },
    { to: '/profile', label: 'Profile', icon: FaUser }
  ];

  // Teacher sidebar
  const teacherMenu = [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { to: '/teacher/qr-generate', label: 'Generate QR', icon: FaQrcode },
    { to: '/teacher/attendance', label: 'View Attendance', icon: FaClipboardList },
    { to: '/teacher/exams', label: 'Exams', icon: FaClipboardList },
    { to: '/teacher/results', label: 'Results', icon: FaChartBar },
    { to: '/profile', label: 'Profile', icon: FaUser }
  ];

  const menuItems = user?.role === 'teacher' ? teacherMenu : studentMenu;

  return (
    <aside
      className={[
        'bg-secondary/90 backdrop-blur-xl border-r border-white/5 shadow-soft-glass w-64 min-h-screen',
        // Layout
        'flex flex-col',
        // Desktop pinned sidebar
        'md:sticky md:top-0',
        // Mobile slide-in drawer
        'fixed top-0 left-0 z-50 md:z-auto md:static',
        'transform transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0'
      ].join(' ')}
    >
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-2xl bg-accent/20 flex items-center justify-center text-accent transition-transform duration-300 hover:scale-110 shadow-lg shadow-green-500/20 animate-[float_3s_ease-in-out_infinite]"
          >
            <FaQrcode />
          </div>
          <div className="opacity-0 animate-fadeIn">
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
            onClick={() => onClose?.()}
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

