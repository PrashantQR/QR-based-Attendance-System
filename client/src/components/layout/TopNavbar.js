import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopNavbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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

