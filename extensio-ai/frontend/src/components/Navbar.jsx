import React from 'react';
import { Menu, LogOut, Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigate('/')}>
            <Code2 className="w-6 h-6 text-purple-main" />
            <span className="font-bold text-lg text-white">Extensio.ai</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => handleNavigate('/generate')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Generate
                </button>
                <button
                  onClick={() => handleNavigate('/dashboard')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Dashboard
                </button>
              </>
            )}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-400 text-sm">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigate('/login')}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigate('/register')}
                  className="px-4 py-2 bg-gradient-main text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-800">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => handleNavigate('/generate')}
                  className="block w-full text-left px-4 py-2 text-gray-300 hover:text-white"
                >
                  Generate
                </button>
                <button
                  onClick={() => handleNavigate('/dashboard')}
                  className="block w-full text-left px-4 py-2 text-gray-300 hover:text-white"
                >
                  Dashboard
                </button>
              </>
            )}
            <div className="px-4 py-2 text-gray-400 text-sm">
              {user?.email}
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
