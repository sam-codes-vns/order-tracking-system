import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useOrders } from '../context/OrderContext';
import StatusTimeline from '../components/StatusTimeline';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { fetchOrder } = useOrders();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const loadOrder = async () => {
      const data = await fetchOrder(orderId);
      if (data) {
        setOrder(data);
      } else {
        toast.error('Order not found');
        navigate('/');
      }
      setLoading(false);
    };
    loadOrder();
  }, [orderId, fetchOrder, navigate]);

  useEffect(() => {
    if (!orderId) return;

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    const socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('joinOrderRoom', orderId);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('statusUpdated', (data) => {
      if (data.orderId === orderId || data.orderId?.toString() === orderId) {
        setOrder((prev) => {
          if (!prev) return null;
          const newHistory = [...(prev.statusHistory || []), { status: data.status, updatedAt: data.updatedAt }];
          return { ...prev, status: data.status, statusHistory: newHistory };
        });
        toast.success(`Order status updated: ${data.status}`);
      }
    });

    return () => {
      socket.emit('leaveOrderRoom', orderId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const itemsSummary = order.items
    .map((i) => `${i.name} x ${i.qty} @ $${i.price}`)
    .join(', ');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-primary hover:underline mb-2 flex items-center gap-1"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-primary">
              Order #{order._id?.slice(-8).toUpperCase()}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-accent animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-sm text-gray-600">
              {socketConnected ? 'Live' : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline - takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-lg font-semibold text-primary mb-6">Order Status</h2>
            <StatusTimeline
              currentStatus={order.status}
              statusHistory={order.statusHistory || []}
            />
          </div>

          {/* Order Summary Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6 h-fit">
            <h2 className="text-lg font-semibold text-primary mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Items:</span>
                <br />
                <span className="block mt-1">{itemsSummary}</span>
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Total:</span>{' '}
                <span className="font-semibold text-primary">${order.totalAmount?.toFixed(2)}</span>
              </p>
              {order.agentId && (
                <p className="text-gray-600">
                  <span className="font-medium">Delivery Agent:</span>{' '}
                  {order.agentId.name} ({order.agentId.phone})
                </p>
              )}
              <p className="text-gray-600">
                <span className="font-medium">Order Date:</span>{' '}
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
