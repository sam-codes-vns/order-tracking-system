import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl hover:text-accent transition-colors">
              OrderTracker
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-4">
              <Link
                to="/"
                className="text-white hover:bg-primary-light px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-white hover:bg-primary-light px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Admin
                </Link>
              )}
              {/* ✅ Add this */}
              {user?.role === 'agent' && (
                <Link to="/agent" className="text-white hover:bg-primary-light px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  My Assignments
                </Link>
              )}

            </div>
          </div>
          <div className="flex items-center space-x-4">
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
