import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import StatusTimeline from '../components/StatusTimeline';
import toast from 'react-hot-toast';

const SAMPLE_ORDERS = [
  { id: 'TRK-ABC12345', label: 'Sample: In Transit' },
  { id: 'TRK-DEF67890', label: 'Sample: Delivered' },
  { id: 'TRK-GHI11223', label: 'Sample: Pending' },
];

const STATUS_COLORS = {
  Placed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Packed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Out for Delivery': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const TrackOrderPage = () => {
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const { fetchOrder } = useOrders();
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e?.preventDefault();
    const query = searchInput.trim();
    if (!query) {
      toast.error('Please enter a tracking number or order ID');
      return;
    }

    // Extract ID if TRK- prefix is used
    const orderId = query.startsWith('TRK-') ? query.replace('TRK-', '') : query;

    setLoading(true);
    setOrder(null);
    try {
      const data = await fetchOrder(orderId);
      if (data) {
        setOrder(data);
      } else {
        toast.error('Order not found. Please check the tracking number.');
      }
    } catch {
      toast.error('Order not found. Please check the tracking number.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if query param exists
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchInput(q);
      // Trigger search after state update
      setTimeout(() => {
        const orderId = q.startsWith('TRK-') ? q.replace('TRK-', '') : q;
        setLoading(true);
        fetchOrder(orderId)
          .then((data) => {
            if (data) setOrder(data);
            else toast.error('Order not found');
          })
          .catch(() => toast.error('Order not found'))
          .finally(() => setLoading(false));
      }, 0);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Track Your Order</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Enter your tracking number or order ID below to get real-time updates on your shipment.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter tracking number (e.g. TRK-ABC12345) or Order ID..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Tracking...
                </span>
              ) : (
                'Track'
              )}
            </button>
          </div>
        </form>

        {/* Sample Tracking Numbers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Sample Tracking Numbers to Test
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_ORDERS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSearchInput(s.id);
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-brand-blue hover:text-brand-blue dark:hover:text-brand-blue transition-colors"
              >
                {s.id}
                <span className="ml-1 text-gray-400">— {s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-blue border-t-transparent"></div>
          </div>
        )}

        {/* Order Results */}
        {!loading && order && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            {/* Order Header */}
            <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs uppercase tracking-wide">Tracking Number</p>
                  <p className="text-white font-mono font-bold text-lg">
                    TRK-{order._id?.slice(-8).toUpperCase()}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Order ID</p>
                  <p className="font-medium text-gray-800 dark:text-white">#{order._id?.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Order Date</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                {order.deliveryAddress?.address && (
                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Destination</p>
                    <p className="font-medium text-gray-800 dark:text-white">{order.deliveryAddress.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Estimated Delivery</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                {order.agentId && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Delivery Agent</p>
                    <p className="font-medium text-gray-800 dark:text-white">{order.agentId.name}</p>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Shipment Progress</h3>
                <StatusTimeline
                  currentStatus={order.status}
                  statusHistory={order.statusHistory || []}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => navigate(`/track/${order._id}`)}
                  className="flex-1 text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity text-sm"
                  style={{ background: 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)' }}
                >
                  Live Track
                </button>
                <a
                  href="mailto:support@ship365.com"
                  className="flex-1 text-center border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        )}

        {/* No results placeholder */}
        {!loading && !order && !searchParams.get('q') && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 dark:text-gray-400">
              Enter a tracking number above to see shipment details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
