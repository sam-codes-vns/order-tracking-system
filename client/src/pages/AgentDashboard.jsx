import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from '../api/axios';

// ─── Mock data for demo purposes ─────────────────────────────────────────────
const MOCK_ORDERS = [
  {
    _id: 'mock-001',
    trackingNumber: 'TRK-2024-001',
    customerId: { name: 'Alice Johnson', email: 'alice@example.com', phone: '+1 555-0101' },
    status: 'In Transit',
    priority: 'high',
    origin: 'New York, NY',
    destination: 'Los Angeles, CA',
    eta: '2024-12-20',
    deliveryAddress: { address: '123 Main St, Los Angeles, CA' },
    items: [{ name: 'Electronics Package', qty: 1, price: 299 }],
  },
  {
    _id: 'mock-002',
    trackingNumber: 'TRK-2024-002',
    customerId: { name: 'Bob Smith', email: 'bob@example.com', phone: '+1 555-0102' },
    status: 'Pending',
    priority: 'medium',
    origin: 'Chicago, IL',
    destination: 'Houston, TX',
    eta: '2024-12-22',
    deliveryAddress: { address: '456 Oak Ave, Houston, TX' },
    items: [{ name: 'Clothing Box', qty: 2, price: 89 }],
  },
  {
    _id: 'mock-003',
    trackingNumber: 'TRK-2024-003',
    customerId: { name: 'Carol White', email: 'carol@example.com', phone: '+1 555-0103' },
    status: 'In Transit',
    priority: 'low',
    origin: 'Miami, FL',
    destination: 'Seattle, WA',
    eta: '2024-12-25',
    deliveryAddress: { address: '789 Pine Rd, Seattle, WA' },
    items: [{ name: 'Books & Documents', qty: 3, price: 45 }],
  },
];

// ─── Helper: priority color classes ──────────────────────────────────────────
const priorityConfig = {
  high:   { bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-600 dark:text-red-400',    dot: 'bg-red-500 dark:bg-red-400',    label: 'High' },
  medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500 dark:bg-yellow-400', label: 'Medium' },
  low:    { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500 dark:bg-green-400',  label: 'Low' },
};

const statusConfig = {
  'In Transit': { bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400' },
  'Pending':    { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  'Delivered':  { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  'Placed':     { bg: 'bg-gray-100 dark:bg-gray-700',      text: 'text-gray-600 dark:text-gray-400' },
};

// ─── PriorityBadge ────────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const cfg = priorityConfig[priority] || priorityConfig.low;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig['Placed'];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {status}
    </span>
  );
};

// ─── StatsCard ───────────────────────────────────────────────────────────────
const StatsCard = ({ label, value, valueColor = 'text-gray-800 dark:text-gray-100' }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700">
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
  </div>
);

// ─── LocationTrackingCard ─────────────────────────────────────────────────────
const LocationTrackingCard = ({ onEnable, locationActive }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-blue-400 dark:border-blue-500 shadow-lg p-6 mb-6">
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Icon area */}
      <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      {/* Text */}
      <div className="flex-1 text-center sm:text-left">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Live Location Tracking</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Share your real-time location with customers</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          {locationActive
            ? '📡 Location sharing is active — customers can see your position.'
            : 'Enable location tracking to share your position with customers'}
        </p>
      </div>
      {/* Button */}
      <button
        onClick={onEnable}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow ${
          locationActive
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {locationActive ? 'Stop Sharing' : 'Enable Live Location'}
      </button>
    </div>
  </div>
);

// ─── OrderCard ────────────────────────────────────────────────────────────────
const OrderCard = ({ order, selected, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-gray-800 rounded-xl shadow p-4 cursor-pointer transition-all border-2 ${
      selected
        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
        : 'border-transparent hover:border-blue-200 dark:hover:border-gray-600'
    }`}
  >
    <div className="flex justify-between items-start mb-2">
      <span className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
        {order.trackingNumber || `#${order._id?.slice(-8).toUpperCase()}`}
      </span>
      <div className="flex gap-1.5 flex-wrap justify-end">
        <StatusBadge status={order.status} />
        {order.priority && <PriorityBadge priority={order.priority} />}
      </div>
    </div>
    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
      {order.customerId?.name || 'Unknown Customer'}
    </p>
    {order.origin && order.destination && (
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {order.origin} → {order.destination}
      </p>
    )}
    {order.eta && (
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ETA: {order.eta}</p>
    )}
  </div>
);

// ─── OrderManagementPanel ─────────────────────────────────────────────────────
const OrderManagementPanel = ({ order, onClose }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [newStatus, setNewStatus] = useState(order.status);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      await axios.patch(`/api/orders/${order._id}/status`, { status: newStatus });
      toast.success('Status updated!');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const STATUS_OPTIONS = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-gray-100">Manage Order</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
            {order.trackingNumber || `#${order._id?.slice(-8).toUpperCase()}`}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700 px-5">
        {['details', 'updateStatus'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab === 'details' ? 'Details' : 'Update Status'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {activeTab === 'details' && (
          <dl className="space-y-3">
            {[
              { label: 'Order ID', value: order._id?.slice(-8).toUpperCase() },
              { label: 'Customer', value: order.customerId?.name },
              { label: 'Email', value: order.customerId?.email },
              { label: 'Origin', value: order.origin || 'N/A' },
              { label: 'Destination', value: order.destination || order.deliveryAddress?.address || 'N/A' },
              { label: 'ETA', value: order.eta || 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <dt className="text-gray-500 dark:text-gray-400 font-medium">{label}</dt>
                <dd className="text-gray-800 dark:text-gray-100 text-right max-w-[55%] truncate">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between text-sm items-center">
              <dt className="text-gray-500 dark:text-gray-400 font-medium">Priority</dt>
              <dd>{order.priority && <PriorityBadge priority={order.priority} />}</dd>
            </div>
            <div className="flex justify-between text-sm items-center">
              <dt className="text-gray-500 dark:text-gray-400 font-medium">Status</dt>
              <dd><StatusBadge status={order.status} /></dd>
            </div>
          </dl>
        )}

        {activeTab === 'updateStatus' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === order.status}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
        <button
          onClick={() => navigate(`/track/${order._id}`)}
          disabled={order._id?.startsWith('mock-')}
          className="w-full flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Full Details
        </button>

        {order.customerId?.email && (
          <a
            href={`mailto:${order.customerId.email}`}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Customer
          </a>
        )}
      </div>
    </div>
  );
};

// ─── SearchOrders ─────────────────────────────────────────────────────────────
const SearchOrders = ({ value, onChange }) => (
  <div className="relative">
    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search by tracking number, customer name, or order ID..."
      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

// ─── Main AgentDashboard ──────────────────────────────────────────────────────
const AgentDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [locationActive, setLocationActive] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  // Fetch real orders; fall back to mock data if none
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('/api/orders/my-assignments');
        const fetched = res.data;
        setOrders(fetched.length > 0 ? fetched : MOCK_ORDERS);
      } catch {
        setOrders(MOCK_ORDERS);
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

    return () => {
      socketRef.current?.disconnect();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Live location toggle (global, not per-order)
  const toggleLocation = () => {
    if (locationActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setLocationActive(false);
      toast.success('Location sharing stopped');
      return;
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        // Broadcast to all assigned orders
        orders.forEach((o) => {
          if (!o._id.startsWith('mock-')) {
            socketRef.current?.emit('updateAgentLocation', { orderId: o._id, lat, lng });
          }
        });
      },
      (err) => {
        toast.error('Location error: ' + err.message);
        setLocationActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    watchIdRef.current = id;
    setLocationActive(true);
    toast.success('Location sharing started');
  };

  // Stats
  const assignedCount = orders.length;
  const inTransitCount = orders.filter((o) => o.status === 'In Transit').length;
  const deliveredTodayCount = orders.filter((o) => {
    if (o.status !== 'Delivered') return false;
    const today = new Date().toDateString();
    return o.updatedAt ? new Date(o.updatedAt).toDateString() === today : false;
  }).length;
  const highPriorityCount = orders.filter((o) => o.priority === 'high').length;

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.trackingNumber || '').toLowerCase().includes(q) ||
      (o.customerId?.name || '').toLowerCase().includes(q) ||
      (o._id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Manage assigned shipments and update order statuses
            </p>
          </div>
          <button
            onClick={() => toast('New Shipment feature coming soon!', { icon: '🚚' })}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Shipment
          </button>
        </div>

        {/* Live Location Card */}
        <LocationTrackingCard onEnable={toggleLocation} locationActive={locationActive} />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard label="Assigned Orders" value={assignedCount} />
          <StatsCard label="In Transit" value={inTransitCount} valueColor="text-blue-600 dark:text-blue-400" />
          <StatsCard label="Today's Deliveries" value={deliveredTodayCount} valueColor="text-green-600 dark:text-green-400" />
          <StatsCard label="High Priority" value={highPriorityCount} valueColor="text-red-600 dark:text-red-400" />
        </div>

        {/* Search */}
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Search Orders</h2>
          <SearchOrders value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Orders + Management Panel */}
        <div className={`grid gap-6 ${selectedOrder ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Left: Order List */}
          <div>
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Assigned Orders
              {filteredOrders.length !== orders.length && (
                <span className="ml-2 text-xs text-gray-400">({filteredOrders.length} results)</span>
              )}
            </h2>
            {filteredOrders.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-10 text-center border border-gray-100 dark:border-gray-700">
                <svg className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No orders found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    selected={selectedOrder?._id === order._id}
                    onClick={() => setSelectedOrder(
                      selectedOrder?._id === order._id ? null : order
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Management Panel */}
          {selectedOrder && (
            <div className="lg:sticky lg:top-4 lg:self-start">
              <OrderManagementPanel
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;