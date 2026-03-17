import React from 'react';
import { motion } from 'framer-motion';
import { FaBell } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const TopNavbar = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-secondary/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/70 text-gray-300 border border-white/10 shadow-soft-glass"
          >
            <FaBell className="text-sm" />
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-accent shadow-lg" />
          </motion.button>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-gray-400">Welcome back</span>
              <span className="text-sm font-semibold text-gray-100 truncate max-w-[140px]">
                {user?.name}
              </span>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent to-emerald-400 text-secondary font-semibold flex items-center justify-center shadow-soft-glass text-sm">
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;

