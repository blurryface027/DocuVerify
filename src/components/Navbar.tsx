import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X, 
  Layers,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type NavLink = {
  name: string;
  path: string;
  icon: React.ElementType | null;
  primary?: boolean;
};

const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  const navLinks: NavLink[] = user ? [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Single Upload', path: '/upload', icon: Upload },
    { name: 'Bulk Upload', path: '/bulk-upload', icon: Layers },
  ] : [
    { name: 'Login', path: '/auth', icon: null },
    { name: 'Sign Up', path: '/auth?signup=true', icon: null, primary: true },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            DocuVerify
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`text-sm font-medium transition-colors flex items-center space-x-2 ${
                link.primary 
                ? 'btn-primary !px-4 !py-2' 
                : location.pathname === link.path ? 'text-blue-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              {link.icon && <link.icon className="w-4 h-4" />}
              <span>{link.name}</span>
            </Link>
          ))}
          
          {user && (
            <>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{profile?.name || user.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{profile?.role || 'User'}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-slate-300 hover:text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pt-4 border-t border-white/10 space-y-4 pb-4"
          >
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${
                  link.primary 
                  ? 'bg-blue-600 text-white font-bold' 
                  : location.pathname === link.path ? 'bg-blue-500/10 text-blue-400 font-bold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                {link.icon && <link.icon className="w-5 h-5" />}
                <span>{link.name}</span>
              </Link>
            ))}
            
            {user && (
              <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center space-x-3 px-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold">
                    {profile?.name?.[0] || user.email?.[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{profile?.name || user.email}</p>
                    <p className="text-xs text-slate-500">{profile?.role || 'User'}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
