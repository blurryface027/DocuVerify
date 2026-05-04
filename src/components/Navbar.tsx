import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, LayoutDashboard, LogOut, FilePlus } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            DocuVerify
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          {user ? (
            <>
              <Link to="/dashboard" className="text-slate-300 hover:text-white flex items-center space-x-2 transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/upload" className="text-slate-300 hover:text-white flex items-center space-x-2 transition-colors">
                <FilePlus className="w-4 h-4" />
                <span>Upload</span>
              </Link>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{profile?.name || user.email}</p>
                  <p className="text-xs text-slate-400 capitalize">{profile?.role || 'User'}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-slate-300 hover:text-white transition-colors">Login</Link>
              <Link to="/auth?signup=true" className="btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
