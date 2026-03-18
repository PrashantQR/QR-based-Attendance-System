import React from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-black text-gray-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNavbar />
        <main className="flex-1">
          <div className="w-full max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

