import React from 'react';
import { Menu, LogOut, Code2, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
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

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/60 dark:bg-[#05010D]/70 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => handleNavigate('/')}
          >
            <div className="bg-purple-main/10 dark:bg-purple-main/20 p-1.5 rounded-lg border border-purple-main/20 dark:border-purple-main/30">
              <Code2 className="w-6 h-6 text-purple-main" />
            </div>
            <span className="font-extrabold text-xl text-transparent bg-clip-text bg-gradient-main tracking-tight">
              Extensio.ai
            </span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => handleNavigate('/templates')}
              className={`transition-colors font-medium ${isActive('/templates') ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Templates
            </button>
            <button
              onClick={() => handleNavigate('/gallery')}
              className={`transition-colors font-medium ${isActive('/gallery') ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Community
            </button>
            {isAuthenticated && (
              <>
                <button
                  onClick={() => handleNavigate('/generate')}
                  className={`flex items-center gap-2 transition-colors font-medium ${isActive('/generate') ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  <Sparkles className="w-4 h-4" /> Generate
                </button>
                <button
                  onClick={() => handleNavigate('/dashboard')}
                  className={`transition-colors font-medium ${isActive('/dashboard') ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Dashboard
                </button>
              </>
            )}
          </div>

          {/* Desktop User Menu & Theme Toggle */}
          <div className="hidden md:flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            
            {isAuthenticated ? (
              <>
                <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-full border border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors">
                  {user?.email}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigate('/login')}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
                >
                  Login
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavigate('/register')}
                  className="px-5 py-2.5 bg-gradient-main text-white rounded-xl hover:opacity-90 transition-opacity font-bold shadow-lg shadow-purple-900/20 btn-shimmer"
                >
                  Sign Up
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white p-2 rounded-lg bg-gray-800/50 border border-gray-700/50"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="pb-4 pt-2 border-t border-gray-800/50 space-y-2 mt-2">
              <button
                  onClick={() => handleNavigate('/templates')}
                  className={`block w-full text-left px-4 py-3 rounded-lg ${isActive('/templates') ? 'bg-purple-main/10 text-purple-400' : 'text-gray-300 hover:bg-gray-800/50'}`}
                >
                  Templates
                </button>
                <button
                  onClick={() => handleNavigate('/gallery')}
                  className={`block w-full text-left px-4 py-3 rounded-lg ${isActive('/gallery') ? 'bg-purple-main/10 text-purple-400' : 'text-gray-300 hover:bg-gray-800/50'}`}
                >
                  Community
                </button>
                {isAuthenticated && (
                  <>
                    <button
                      onClick={() => handleNavigate('/generate')}
                      className={`block w-full text-left px-4 py-3 rounded-lg ${isActive('/generate') ? 'bg-purple-main/10 text-purple-400' : 'text-gray-300 hover:bg-gray-800/50'}`}
                    >
                      Generate
                    </button>
                    <button
                      onClick={() => handleNavigate('/dashboard')}
                      className={`block w-full text-left px-4 py-3 rounded-lg ${isActive('/dashboard') ? 'bg-purple-main/10 text-purple-400' : 'text-gray-300 hover:bg-gray-800/50'}`}
                    >
                      Dashboard
                    </button>
                  </>
                )}
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 text-gray-400 text-sm border-t border-gray-800/50 mt-2">
                      Logged in as {user?.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 p-2">
                    <button
                      onClick={() => handleNavigate('/login')}
                      className="w-full py-3 bg-gray-800 text-white rounded-lg"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => handleNavigate('/register')}
                      className="w-full py-3 bg-gradient-main text-white rounded-lg"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
