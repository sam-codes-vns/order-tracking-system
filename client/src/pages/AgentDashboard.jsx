import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import axios from '../api/axios';

// GPS / Location Capture Icon component
const LocationIcon = ({ active }) => (
  <svg
    className={`w-5 h-5 ${active ? 'text-white' : 'text-white'}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

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

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    socketRef.current = io(serverUrl);

    const user = JSON.parse(localStorage.getItem('user'));
    socketRef.current.on('connect', () => {
      socketRef.current.emit('joinAgentRoom', user?._id);
    });

    socketRef.current.on('orderAssigned', () => {
      fetchOrders();
      toast.success('New order assigned to you!');
    });

    return () => socketRef.current?.disconnect();
  }, []);

  const startSharing = (orderId) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device');
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
    toast.success('Live location sharing started 📍');
  };

  const stopSharing = (orderId) => {
    navigator.geolocation.clearWatch(watchIds.current[orderId]);
    delete watchIds.current[orderId];
    setSharing((prev) => ({ ...prev, [orderId]: false }));
    toast.success('Location sharing stopped');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Assignments</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage deliveries and share live location with customers
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 dark:text-gray-400">No assignments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono font-medium text-gray-800 dark:text-white">
                        #{order._id?.slice(-8).toUpperCase()}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span className="font-medium">Customer:</span> {order.customerId?.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Address:</span> {order.deliveryAddress?.address || 'N/A'}
                    </p>
                    {sharing[order._id] && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live location active</span>
                      </div>
                    )}
                  </div>

                  {/* Live Location Capture Button with GPS Icon */}
                  <button
                    onClick={() =>
                      sharing[order._id]
                        ? stopSharing(order._id)
                        : startSharing(order._id)
                    }
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      sharing[order._id]
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-200 dark:shadow-red-900/30'
                        : 'text-white shadow-md hover:opacity-90'
                    }`}
                    style={!sharing[order._id] ? { background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' } : {}}
                    title={sharing[order._id] ? 'Stop sharing location' : 'Start live location sharing'}
                  >
                    <LocationIcon active={sharing[order._id]} />
                    <span className="hidden sm:inline">
                      {sharing[order._id] ? 'Stop' : 'Share Location'}
                    </span>
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

export default AgentDashboard;