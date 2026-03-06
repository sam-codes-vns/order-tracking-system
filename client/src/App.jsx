import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import OrderTracking from './pages/OrderTracking';
import AdminDashboard from './pages/AdminDashboard';
import { OrderProvider } from './context/OrderContext';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
