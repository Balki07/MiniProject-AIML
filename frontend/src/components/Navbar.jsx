// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, PlusCircle, Shield, Zap } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-lg text-white">
              Ad<span className="text-brand-400">Express</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-2">
            <Link to="/ads" className="text-white/70 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
              Browse Ads
            </Link>

            {user ? (
              <>
                <Link to="/post-ad" className="flex items-center gap-1.5 btn-primary text-sm py-2">
                  <PlusCircle size={15} /> Post Ad
                </Link>
                <Link to="/dashboard" className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm px-3 py-2 rounded-lg hover:bg-amber-500/10 transition-all">
                    <Shield size={15} /> Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white/70 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5 transition-all">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
