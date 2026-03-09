import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import axios from '../api/axios';

const AgentDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [sharing, setSharing] = useState({});
  const socketRef = useRef(null);
  const watchIds = useRef({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('/api/orders/my-assignments');
        setOrders(res.data);
      } catch {
        toast.error('Failed to load assignments');
      }
    };
    fetchOrders();

    /// Inside useEffect, update socket setup:
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    socketRef.current = io(serverUrl);

    // ✅ Join agent's own room to receive assignment notifications
    const user = JSON.parse(localStorage.getItem('user'));
    socketRef.current.on('connect', () => {
    socketRef.current.emit('joinAgentRoom', user?._id);
    });

    socketRef.current.on('orderAssigned', () => {
    fetchOrders(); // re-fetch assignments
    toast.success('New order assigned to you!');
  });

    return () => socketRef.current?.disconnect();
  }, []);

  const startSharing = (orderId) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        socketRef.current?.emit('updateAgentLocation', { orderId, lat, lng });
      },
      (err) => toast.error('Location error: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    watchIds.current[orderId] = watchId;
    setSharing((prev) => ({ ...prev, [orderId]: true }));
    toast.success('Location sharing started');
  };

  const stopSharing = (orderId) => {
    navigator.geolocation.clearWatch(watchIds.current[orderId]);
    delete watchIds.current[orderId];
    setSharing((prev) => ({ ...prev, [orderId]: false }));
    toast.success('Location sharing stopped');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-6">
          My Assignments
        </h1>
        {orders.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No assignments yet</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono font-medium">
                      #{order._id?.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Customer: {order.customerId?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Address: {order.deliveryAddress?.address || 'N/A'}
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {order.status}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      sharing[order._id]
                        ? stopSharing(order._id)
                        : startSharing(order._id)
                    }
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      sharing[order._id]
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {sharing[order._id] ? '🔴 Stop Sharing' : '📍 Share Location'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard; // ✅ make sure this line exists