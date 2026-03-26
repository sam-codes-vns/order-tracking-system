import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { DarkModeProvider } from './context/DarkModeContext';
import { OrderProvider } from './context/OrderContext';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import OrderTracking from './pages/OrderTracking';
import Register from './pages/Register';

function App() {
  return (
    <DarkModeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
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
    </DarkModeProvider>
  );
}

export default App;

