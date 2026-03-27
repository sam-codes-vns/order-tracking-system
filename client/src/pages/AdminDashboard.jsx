import { useEffect, useState } from 'react';
import axios from '../api/axios';
import { useOrders } from '../context/OrderContext';
import toast from 'react-hot-toast';
import StatsCard from '../components/StatsCard';
import WeeklyOrdersTrendChart from '../components/charts/WeeklyOrdersTrendChart';
import OrderStatusDistributionChart from '../components/charts/OrderStatusDistributionChart';
import RevenueTrendChart from '../components/charts/RevenueTrendChart';
import TopPerformingAgents from '../components/TopPerformingAgents';
import RecentActivity from '../components/RecentActivity';
import { useDarkMode } from '../context/DarkModeContext';

const STATUS_OPTIONS = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const AdminDashboard = () => {
  const { orders, loading, fetchAllOrders, updateOrderStatus, assignAgent } = useOrders();
  const { darkMode } = useDarkMode();
  const [agents, setAgents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics');

  // Analytics state
  const [dashboardStats, setDashboardStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topAgents, setTopAgents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchAllOrders();
    loadAgents();
    loadAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAgents = async () => {
    try {
      const res = await axios.get('/api/agents');
      setAgents(res.data);
    } catch {
      toast.error('Failed to load agents');
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [stats, weekly, status, revenue, top, activity] = await Promise.all([
        axios.get('/api/analytics/dashboard'),
        axios.get('/api/analytics/orders/weekly'),
        axios.get('/api/analytics/orders/status'),
        axios.get('/api/analytics/revenue/monthly'),
        axios.get('/api/analytics/agents/top'),
        axios.get('/api/analytics/activity/recent'),
      ]);
      setDashboardStats(stats.data);
      setWeeklyData(weekly.data);
      setStatusData(status.data);
      setRevenueData(revenue.data);
      setTopAgents(top.data);
      setRecentActivity(activity.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleExportReport = async () => {
    setExportLoading(true);
    try {
      const res = await axios.post('/api/analytics/export-report');
      const blob = new Blob([JSON.stringify(res.data.report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ship365-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported!');
    } catch {
      toast.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const filteredOrders =
    statusFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === statusFilter);

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

  const statusColor = {
    Placed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    Packed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Out for Delivery': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    Delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Complete overview of Ship365 operations and analytics
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportReport}
              disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exportLoading ? 'Exporting...' : 'Export Report'}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              View All Orders
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          {[
            { key: 'analytics', label: 'Analytics' },
            { key: 'orders', label: 'Order Management' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── ANALYTICS TAB ────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <>
            {analyticsLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                  <StatsCard
                    title="Total Orders"
                    value={dashboardStats?.totalOrders ?? 0}
                    trend={dashboardStats?.trends?.orders}
                    color="blue"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    }
                  />
                  <StatsCard
                    title="Revenue"
                    value={`$${(dashboardStats?.totalRevenue ?? 0).toLocaleString()}`}
                    trend={dashboardStats?.trends?.revenue}
                    color="green"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                  <StatsCard
                    title="Active Agents"
                    value={dashboardStats?.activeAgents ?? 0}
                    trend={dashboardStats?.trends?.agents}
                    color="purple"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  />
                  <StatsCard
                    title="Delivery Rate"
                    value={`${dashboardStats?.deliveryRate ?? 0}%`}
                    trend={dashboardStats?.trends?.deliveryRate}
                    color="amber"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                      Weekly Order Trends
                    </h2>
                    <WeeklyOrdersTrendChart data={weeklyData} />
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                      Order Status Distribution
                    </h2>
                    <OrderStatusDistributionChart data={statusData} />
                    {/* Legend counts */}
                    <div className="mt-3 flex flex-wrap gap-3">
                      {statusData.map((s) => (
                        <span key={s.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                          {s.name}: {s.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Charts Row 2 */}
                <div className="mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                      Revenue Trend (6 Months)
                    </h2>
                    <RevenueTrendChart data={revenueData} />
                  </div>
                </div>

                {/* Top Agents + Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <TopPerformingAgents agents={topAgents} />
                  <RecentActivity activities={recentActivity} />
                </div>
              </>
            )}
          </>
        )}

        {/* ─── ORDER MANAGEMENT TAB ─────────────────────────────────── */}
        {activeTab === 'orders' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {orders.filter((o) => ['Placed', 'Packed'].includes(o.status)).length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter((o) => ['Shipped', 'Out for Delivery'].includes(o.status)).length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
                <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter((o) => o.status === 'Delivered').length}
                </p>
              </div>
            </div>

            {/* Filter */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filter by status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Orders Table */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-blue-600">
                      <tr>
                        {['Order ID', 'Customer', 'Items', 'Status', 'Agent', 'Actions'].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-white uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                            #{order._id?.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {order.customerId?.name}
                            <br />
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{order.customerId?.email}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            {order.items?.map((i) => `${i.name}(${i.qty})`).join(', ')}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                              disabled={updatingId === order._id}
                              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={order.agentId?._id || ''}
                              onChange={(e) => handleAssignAgent(order._id, e.target.value || null)}
                              disabled={assigningId === order._id}
                              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                            >
                              <option value="">Select Agent</option>
                              {agents.map((a) => (
                                <option key={a._id} value={a._id}>{a.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <button
                              onClick={() => handleStatusUpdate(order._id, order.status)}
                              disabled={updatingId === order._id}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium text-sm"
                            >
                              {updatingId === order._id ? '...' : 'Update'}
                            </button>
                            <a
                              href={`/track/${order._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
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
                  <p className="text-center py-12 text-gray-500 dark:text-gray-400">No orders found</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

