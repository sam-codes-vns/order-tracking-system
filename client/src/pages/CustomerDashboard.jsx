import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import toast from 'react-hot-toast';

// Status mapping: backend status → display
const STATUS_MAP = {
  Placed: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', progress: 10 },
  Packed: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', progress: 25 },
  Shipped: { label: 'In Transit', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', progress: 55 },
  'Out for Delivery': { label: 'In Transit', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', progress: 80 },
  Delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', progress: 100 }
};

const TRACKING_STEPS = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
const STATUS_ORDER = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const StatsCard = ({ label, value, icon, gradient }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: gradient }}>
      <span className="text-white text-lg">{icon}</span>
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  </div>
);

const TrackingTimeline = ({ currentStatus }) => {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  return (
    <div className="space-y-3">
      {TRACKING_STEPS.map((step, i) => {
        const isCompleted = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              isCompleted
                ? isCurrent ? 'ring-2 ring-offset-1 ring-brand-blue' : ''
                : 'bg-gray-200 dark:bg-gray-600'
            }`}
              style={isCompleted ? { background: 'linear-gradient(135deg, #5B5EFF, #B84AF3)' } : {}}
            />
            <span className={`text-sm ${
              isCompleted
                ? 'text-gray-800 dark:text-white font-medium'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {step}
            </span>
            {isCurrent && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #5B5EFF, #B84AF3)' }}>
                Current
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { orders, loading, fetchMyOrders, placeOrder } = useOrders();
  const navigate = useNavigate();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderItems, setOrderItems] = useState([{ name: '', qty: 1, price: 0 }]);
  const [placing, setPlacing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackInput, setTrackInput] = useState('');

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  // Stats
  const totalOrders = orders.length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;
  const inTransitCount = orders.filter((o) => ['Shipped', 'Out for Delivery'].includes(o.status)).length;
  const pendingCount = orders.filter((o) => ['Placed', 'Packed'].includes(o.status)).length;

  const addItem = () => setOrderItems([...orderItems, { name: '', qty: 1, price: 0 }]);
  const updateItem = (index, field, value) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'qty') updated[index].qty = Math.max(1, parseInt(value) || 1);
    if (field === 'price') updated[index].price = Math.max(0, parseFloat(value) || 0);
    setOrderItems(updated);
  };
  const removeItem = (index) => {
    if (orderItems.length > 1) setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const validItems = orderItems.filter((i) => i.name.trim() && i.price >= 0);
    if (validItems.length === 0) { toast.error('Add at least one item with a name'); return; }
    setPlacing(true);
    try {
      const order = await placeOrder(validItems);
      toast.success('Order placed successfully!');
      setShowOrderForm(false);
      setOrderItems([{ name: '', qty: 1, price: 0 }]);
      navigate(`/track/${order._id}`);
    } catch { /* Error handled in context */ } finally { setPlacing(false); }
  };

  const handleTrackSearch = (e) => {
    e.preventDefault();
    const trimmed = trackInput.trim();
    if (!trimmed) { toast.error('Enter a tracking number or order ID'); return; }
    navigate(`/track-order?q=${trimmed}`);
  };

  const getStatusInfo = (status) => STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-600', progress: 0 };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Hello, {user?.name?.split(' ')[0] || 'Customer'} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage your orders</p>
          </div>
          {user?.role === 'customer' && (
            <button
              onClick={() => setShowOrderForm(!showOrderForm)}
              className="self-start sm:self-auto text-white px-5 py-2.5 rounded-xl font-medium transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' }}
            >
              {showOrderForm ? 'Cancel' : '+ Place New Order'}
            </button>
          )}
        </div>

        {/* Place Order Form */}
        {showOrderForm && (
          <form onSubmit={handlePlaceOrder} className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-2xl animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">New Order</h3>
            {orderItems.map((item, i) => (
              <div key={i} className="flex gap-2 mb-3 flex-wrap">
                <input type="text" placeholder="Item name" value={item.name}
                  onChange={(e) => updateItem(i, 'name', e.target.value)}
                  className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                <input type="number" placeholder="Qty" min="1" value={item.qty}
                  onChange={(e) => updateItem(i, 'qty', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                <input type="number" placeholder="Price" min="0" step="0.01" value={item.price || ''}
                  onChange={(e) => updateItem(i, 'price', e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 px-2">✕</button>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={addItem} className="text-brand-blue hover:underline text-sm">+ Add item</button>
              <button type="submit" disabled={placing}
                className="ml-auto text-white px-6 py-2 rounded-lg disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' }}>
                {placing ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </form>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Total Orders" value={totalOrders} icon="📦" gradient="linear-gradient(135deg, #5B5EFF, #B84AF3)" />
          <StatsCard label="In Transit" value={inTransitCount} icon="🚚" gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)" />
          <StatsCard label="Delivered" value={deliveredCount} icon="✅" gradient="linear-gradient(135deg, #00D084, #059669)" />
          <StatsCard label="Pending" value={pendingCount} icon="⏳" gradient="linear-gradient(135deg, #F59E0B, #D97706)" />
        </div>

        {/* Track Your Order Search */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Track Your Order</h2>
          <form onSubmit={handleTrackSearch} className="flex gap-3">
            <input
              type="text"
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              placeholder="Enter tracking number or order ID..."
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
            <button
              type="submit"
              className="text-white px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' }}
            >
              Track
            </button>
          </form>
        </div>

        {/* Orders List + Details Panel */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-blue border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">No orders yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Your orders will appear here once you place them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders List */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Your Orders</h2>
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const isSelected = selectedOrder?._id === order._id;
                return (
                  <div
                    key={order._id}
                    onClick={() => setSelectedOrder(isSelected ? null : order)}
                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 cursor-pointer transition-all border-2 ${
                      isSelected ? 'border-brand-blue shadow-md' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
                          TRK-{order._id?.slice(-8).toUpperCase()}
                        </p>
                        <p className="font-medium text-gray-800 dark:text-white text-sm mt-0.5">
                          Order #{order._id?.slice(-6).toUpperCase()}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span>{order.items?.map((i) => i.name).join(', ').substring(0, 30) || 'Items'}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">${order.totalAmount?.toFixed(2)}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${statusInfo.progress}%`,
                          background: 'linear-gradient(90deg, #5B5EFF, #B84AF3)'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <span>Order Placed</span>
                      <span>ETA: {new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Details Panel */}
            <div className="lg:col-span-1">
              {selectedOrder ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 sticky top-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Order Details</h2>
                  <div className="space-y-3 text-sm mb-5">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wide">Order ID</span>
                      <span className="font-mono text-gray-800 dark:text-white">#{selectedOrder._id?.slice(-8).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wide">Tracking No.</span>
                      <span className="font-mono text-gray-800 dark:text-white">TRK-{selectedOrder._id?.slice(-8).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wide">Estimated Delivery</span>
                      <span className="text-gray-800 dark:text-white">
                        {new Date(new Date(selectedOrder.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    {selectedOrder.deliveryAddress?.address && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wide">Destination</span>
                        <span className="text-gray-800 dark:text-white">{selectedOrder.deliveryAddress.address}</span>
                      </div>
                    )}
                    {selectedOrder.agentId && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wide">Delivery Agent</span>
                        <span className="text-gray-800 dark:text-white">{selectedOrder.agentId.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Tracking Timeline */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tracking Timeline</h3>
                    <TrackingTimeline currentStatus={selectedOrder.status} />
                  </div>

                  <button
                    onClick={() => navigate(`/track/${selectedOrder._id}`)}
                    className="w-full text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity mb-2"
                    style={{ background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' }}
                  >
                    Live Track
                  </button>
                  <a
                    href="mailto:support@ship365.com"
                    className="w-full block text-center border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Contact Support
                  </a>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center text-center min-h-48">
                  <div className="text-4xl mb-3">👆</div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Click an order to see details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
