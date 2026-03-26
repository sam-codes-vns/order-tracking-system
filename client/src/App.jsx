import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { OrderProvider } from './context/OrderContext';
import { useAuth } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Login from './pages/Login';
import OrderTracking from './pages/OrderTracking';
import Register from './pages/Register';
import TrackOrderPage from './pages/TrackOrderPage';

// Root route redirects based on user role
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'agent') return <Navigate to="/agent" replace />;
  return null; // render customer dashboard below
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navbar />
              <OrderProvider>
                <CustomerDashboard />
              </OrderProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/track-order"
          element={
            <ProtectedRoute>
              <Navbar />
              <OrderProvider>
                <TrackOrderPage />
              </OrderProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/track/:orderId"
          element={
            <ProtectedRoute>
              <Navbar />
              <OrderProvider>
                <OrderTracking />
              </OrderProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Navbar />
              <OrderProvider>
                <AdminDashboard />
              </OrderProvider>
            </ProtectedRoute>
          }
        />
        <Route path="/agent" element={
          <ProtectedRoute allowedRoles={['agent']}>
            <Navbar />
            <OrderProvider>
              <AgentDashboard />
            </OrderProvider>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
