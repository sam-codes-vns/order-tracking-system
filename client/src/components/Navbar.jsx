import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primary dark:bg-gray-900 shadow-lg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2 text-white font-bold text-xl hover:text-accent transition-colors">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              Ship365
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-4">
              <Link
                to="/dashboard"
                className="text-white hover:bg-primary-light dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-white hover:bg-primary-light dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
              {user?.role === 'agent' && (
                <Link to="/agent" className="text-white hover:bg-primary-light dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  My Assignments
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            {user ? (
              <>
                <span className="text-white text-sm">
                  {user.name} <span className="text-gray-300">({user.role})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

