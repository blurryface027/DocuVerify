import React from 'react';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        {children}
      </main>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: 'glass text-white border border-white/10',
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
          }
        }}
      />
    </div>
  );
};

export default Layout;
