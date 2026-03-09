import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { OrderProvider } from './context/OrderContext';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Login from './pages/Login';
import OrderTracking from './pages/OrderTracking';
import Register from './pages/Register';

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
