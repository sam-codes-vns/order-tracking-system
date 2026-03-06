import { useEffect, useState } from 'react';
import axios from '../api/axios';
import { useOrders } from '../context/OrderContext';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const AdminDashboard = () => {
  const { orders, loading, fetchAllOrders, updateOrderStatus, assignAgent } = useOrders();
  const [agents, setAgents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await axios.get('/api/agents');
        setAgents(res.data);
      } catch (err) {
        toast.error('Failed to load agents');
      }
    };
    loadAgents();
  }, []);

  const filteredOrders =
    statusFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const totalCount = orders.length;
  const pendingCount = orders.filter((o) =>
    ['Placed', 'Packed'].includes(o.status)
  ).length;
  const inTransitCount = orders.filter((o) =>
    ['Shipped', 'Out for Delivery'].includes(o.status)
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;

  const handleStatusUpdate = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignAgent = async (orderId, agentId) => {
    if (!agentId) return;
    setAssigningId(orderId);
    try {
      await assignAgent(agentId, orderId);
      toast.success('Agent assigned');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-primary mb-8">Admin Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-primary">{totalCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">In Transit</p>
            <p className="text-2xl font-bold text-blue-600">{inTransitCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-2xl font-bold text-accent">{deliveredCount}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mr-2">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-primary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">
                        #{order._id?.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.customerId?.name}
                        <br />
                        <span className="text-gray-500 text-xs">
                          {order.customerId?.email}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {order.items?.map((i) => `${i.name}(${i.qty})`).join(', ')}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          disabled={updatingId === order._id}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.agentId?._id || ''}
                          onChange={(e) =>
                            handleAssignAgent(order._id, e.target.value || null)
                          }
                          disabled={assigningId === order._id}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary min-w-[120px]"
                        >
                          <option value="">Select Agent</option>
                          {agents.map((a) => (
                            <option key={a._id} value={a._id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(order._id, order.status)}
                          disabled={updatingId === order._id}
                          className="text-accent hover:text-accent-dark font-medium text-sm"
                        >
                          {updatingId === order._id ? '...' : 'Update'}
                        </button>
                        <a
                          href={`/track/${order._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredOrders.length === 0 && (
              <p className="text-center py-12 text-gray-500">No orders found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
