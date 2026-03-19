import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaBars } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopNavbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const menuRef = useRef(null);

  const handleLogout = () => {
    // Clear auth state and redirect to login
    logout();
    sessionStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) {
      window.addEventListener('mousedown', onClickOutside);
    }
    return () => {
      window.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  useEffect(() => {
    const loadNotifications = () => {
      try {
        const raw = localStorage.getItem('qr_notifications');
        if (!raw) {
          setNotifications([]);
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setNotifications(parsed.slice(0, 10));
        }
      } catch {
        setNotifications([]);
      }
    };

    loadNotifications();

    const onStorage = (event) => {
      if (event.key === 'qr_notifications') {
        loadNotifications();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-secondary/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/70 text-gray-200 border border-white/10 shadow-soft-glass mr-3"
          aria-label="Open sidebar"
        >
          <FaBars />
        </button>

        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 max-w-xl"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search sessions, classes..."
              className="w-full bg-primary/80 border border-white/10 rounded-full py-2.5 pl-4 pr-10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent/70 shadow-soft-glass"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-gray-500 text-xs">
              ⌘K
            </span>
          </div>
        </motion.div>

        <div className="flex items-center gap-4 ml-4">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/70 text-gray-300 border border-white/10 shadow-soft-glass"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <FaBell className="text-sm" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-[1rem] px-0.5 rounded-full bg-accent text-[10px] font-semibold text-secondary shadow-lg">
                  {notifications.length}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && notifications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 bg-secondary/95 border border-white/10 rounded-2xl shadow-soft-glass backdrop-blur-xl overflow-hidden z-30"
                >
                  <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-200">
                      Recent activity
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {notifications.length} new
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="px-3 py-2 text-xs text-gray-200 border-b border-white/5 last:border-b-0 hover:bg-white/5"
                      >
                        <div className="font-semibold truncate">{n.title}</div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {n.description}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {n.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-gray-400">Welcome back</span>
                <span className="text-sm font-semibold text-gray-100 truncate max-w-[140px]">
                  {user?.name}
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent to-emerald-400 text-secondary font-semibold flex items-center justify-center shadow-soft-glass text-sm">
                {user?.name?.[0] || 'U'}
              </div>
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 bg-secondary/95 border border-white/10 rounded-2xl shadow-soft-glass backdrop-blur-xl overflow-hidden z-30"
                >
                  <div className="py-1">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-200 hover:bg-white/10 transition-all duration-200"
                      onClick={() => {
                        setOpen(false);
                        navigate('/profile');
                      }}
                    >
                      <Settings className="w-4 h-4 text-gray-300" />
                      <span>Profile</span>
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-all duration-200"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;

