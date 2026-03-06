import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import OrderCard from '../components/OrderCard';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { orders, loading, fetchMyOrders, placeOrder } = useOrders();
  const navigate = useNavigate();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderItems, setOrderItems] = useState([
    { name: '', qty: 1, price: 0 }
  ]);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const addItem = () => {
    setOrderItems([...orderItems, { name: '', qty: 1, price: 0 }]);
  };

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
    if (validItems.length === 0) {
      toast.error('Add at least one item with name and price');
      return;
    }
    setPlacing(true);
    try {
      const order = await placeOrder(validItems);
      toast.success('Order placed successfully!');
      setShowOrderForm(false);
      setOrderItems([{ name: '', qty: 1, price: 0 }]);
      navigate(`/track/${order._id}`);
    } catch {
      // Error handled in context
    } finally {
      setPlacing(false);
    }
  };

  const totalOrders = orders.length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;
  const inProgressCount = totalOrders - deliveredCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Hello, {user?.name?.split(' ')[0] || 'Customer'}!
        </h1>
        <p className="text-gray-600 mb-8">Track and manage your orders</p>

        {/* Place Order Button */}
        {user?.role === 'customer' && (
          <div className="mb-8">
            <button
              onClick={() => setShowOrderForm(!showOrderForm)}
              className="bg-accent hover:bg-accent-dark text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {showOrderForm ? 'Cancel' : '+ Place New Order'}
            </button>
            {showOrderForm && (
              <form
                onSubmit={handlePlaceOrder}
                className="mt-4 bg-white rounded-xl shadow-lg p-6 max-w-2xl"
              >
                <h3 className="text-lg font-semibold text-primary mb-4">New Order</h3>
                {orderItems.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-3 flex-wrap">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(i, 'name', e.target.value)}
                      className="flex-1 min-w-[120px] px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateItem(i, 'qty', e.target.value)}
                      className="w-20 px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      value={item.price || ''}
                      onChange={(e) => updateItem(i, 'price', e.target.value)}
                      className="w-24 px-3 py-2 border rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-primary hover:underline text-sm"
                  >
                    + Add item
                  </button>
                  <button
                    type="submit"
                    disabled={placing}
                    className="ml-auto bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg disabled:opacity-50"
                  >
                    {placing ? 'Placing...' : 'Place Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-primary">{totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-2xl font-bold text-accent">{deliveredCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
          </div>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="mt-2 text-gray-500">Your orders will appear here once you place them.</p>
            <p className="mt-4 text-sm text-gray-400">Click &quot;Place New Order&quot; above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
