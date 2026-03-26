const express = require('express');
const rateLimit = require('express-rate-limit');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiter for analytics endpoints (admin-only, but still protect against abuse)
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// All analytics routes require admin auth (rate limiter first to prevent DoS)
router.use(analyticsLimiter, protect, adminOnly);

// ─── GET /api/analytics/dashboard ────────────────────────────────────
// Main dashboard metrics: total orders, revenue, active agents, delivery rate
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [
      totalOrders,
      deliveredOrders,
      activeAgents,
      revenueAgg,
      currentPeriodOrders,
      previousPeriodOrders,
      currentPeriodRevenue,
      previousPeriodRevenue
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Delivered' }),
      Agent.countDocuments({ isAvailable: true }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Order.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const deliveryRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0;

    const calcTrend = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? '+100%' : '0%';
      const pct = (((current - previous) / previous) * 100).toFixed(1);
      return pct >= 0 ? `+${pct}%` : `${pct}%`;
    };

    const currRev = currentPeriodRevenue[0]?.total || 0;
    const prevRev = previousPeriodRevenue[0]?.total || 0;

    res.json({
      totalOrders,
      totalRevenue,
      activeAgents,
      deliveryRate: parseFloat(deliveryRate),
      trends: {
        orders: calcTrend(currentPeriodOrders, previousPeriodOrders),
        revenue: calcTrend(currRev, prevRev),
        agents: activeAgents > 0 ? `${activeAgents} active` : '0 active',
        deliveryRate: `${deliveryRate}%`
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ─── GET /api/analytics/orders/weekly ────────────────────────────────
// Weekly order trends (last 7 days, grouped by calendar date)
router.get('/orders/weekly', async (req, res) => {
  try {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [placed, delivered] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        }
      ]),
      Order.aggregate([
        { $match: { status: 'Delivered', updatedAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$updatedAt' },
              month: { $month: '$updatedAt' },
              day: { $dayOfMonth: '$updatedAt' }
            },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Build result for each of the last 7 calendar days
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();

      const ordersEntry = placed.find(
        (p) => p._id.year === year && p._id.month === month && p._id.day === day
      );
      const deliveredEntry = delivered.find(
        (p) => p._id.year === year && p._id.month === month && p._id.day === day
      );

      result.push({
        day: days[d.getDay()],
        orders: ordersEntry?.count || 0,
        delivered: deliveredEntry?.count || 0
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ─── GET /api/analytics/orders/status ────────────────────────────────
// Order status distribution (for pie chart)
router.get('/orders/status', async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Map to friendly names and colours
    const colorMap = {
      Delivered: '#22c55e',
      Shipped: '#3b82f6',
      'Out for Delivery': '#3b82f6',
      Placed: '#f59e0b',
      Packed: '#f59e0b',
    };

    const labelMap = {
      Delivered: 'Delivered',
      Shipped: 'In Transit',
      'Out for Delivery': 'In Transit',
      Placed: 'Pending',
      Packed: 'Pending',
    };

    // Merge 'In Transit' and 'Pending' groups
    const merged = {};
    stats.forEach(({ _id, count }) => {
      const label = labelMap[_id] || _id;
      merged[label] = (merged[label] || 0) + count;
    });

    const totalOrders = Object.values(merged).reduce((a, b) => a + b, 0);

    const pieColorMap = {
      Delivered: '#22c55e',
      'In Transit': '#3b82f6',
      Pending: '#f59e0b',
      Delayed: '#ef4444'
    };

    const result = Object.entries(merged).map(([name, value]) => ({
      name,
      value,
      percentage: totalOrders > 0 ? ((value / totalOrders) * 100).toFixed(1) : 0,
      color: pieColorMap[name] || '#6b7280'
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ─── GET /api/analytics/revenue/monthly ──────────────────────────────
// Last 6 months revenue (for line chart)
router.get('/revenue/monthly', async (req, res) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const revenueData = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Build result for each of the last 6 months
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth() + 1; // 1-based
      const year = d.getFullYear();
      const entry = revenueData.find((r) => r._id.month === month && r._id.year === year);
      result.push({
        month: months[d.getMonth()],
        revenue: entry?.revenue || 0
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ─── GET /api/analytics/agents/top ───────────────────────────────────
// Top performing agents (by delivered orders this month)
router.get('/agents/top', async (req, res) => {
  // Mock ratings assigned by rank position
  const mockRatings = [4.9, 4.8, 4.7, 4.6, 4.5];

  // Fallback mock data shown when no real delivery data exists
  const mockAgents = [
    { id: 'mock-1', name: 'John Davis',    completedOrders: 45, rating: 4.9, rank: 1 },
    { id: 'mock-2', name: 'Sarah Wilson',  completedOrders: 42, rating: 4.8, rank: 2 },
    { id: 'mock-3', name: 'Mike Brown',    completedOrders: 38, rating: 4.7, rank: 3 },
    { id: 'mock-4', name: 'Emma Garcia',   completedOrders: 35, rating: 4.6, rank: 4 },
  ];

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const topAgents = await Order.aggregate([
      { $match: { status: 'Delivered', agentId: { $ne: null }, updatedAt: { $gte: startOfMonth } } },
      { $group: { _id: '$agentId', completedOrders: { $sum: 1 } } },
      { $sort: { completedOrders: -1 } },
      { $limit: 4 },
      {
        $lookup: {
          from: 'agents',
          localField: '_id',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' }
    ]);

    if (topAgents.length === 0) {
      return res.json(mockAgents);
    }

    const result = topAgents.map((a, index) => ({
      id: a._id,
      name: a.agent.name,
      completedOrders: a.completedOrders,
      rating: mockRatings[index] ?? 4.5,
      rank: index + 1
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ─── GET /api/analytics/activity/recent ──────────────────────────────
// Recent system activities (activity-feed format with event type and icon colour)
router.get('/activity/recent', async (req, res) => {
  const now = new Date();

  // Fallback mock activities shown when no real order data exists
  const mockActivities = [
    {
      id: 'act-1',
      type: 'delivered',
      title: 'Order TRK987654321 delivered',
      description: 'Package successfully delivered to customer',
      timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      id: 'act-2',
      type: 'created',
      title: 'New order ORD-2026-006 created',
      description: 'Customer placed a new shipment order',
      timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'act-3',
      type: 'registered',
      title: 'New agent registered: Alex Martinez',
      description: 'Agent account verified and activated',
      timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'act-4',
      type: 'delayed',
      title: 'Order TRK123456789 delayed',
      description: 'Delivery delayed due to weather conditions',
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      id: 'act-5',
      type: 'maintenance',
      title: 'System maintenance scheduled',
      description: 'Planned downtime on Sunday 02:00–04:00 UTC',
      timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      iconColor: 'text-red-600 dark:text-red-400',
    },
  ];

  const typeMap = {
    Delivered: { type: 'delivered', iconColor: 'text-green-600 dark:text-green-400' },
    Shipped: { type: 'created', iconColor: 'text-blue-600 dark:text-blue-400' },
    'Out for Delivery': { type: 'created', iconColor: 'text-blue-600 dark:text-blue-400' },
    Placed: { type: 'created', iconColor: 'text-blue-600 dark:text-blue-400' },
    Packed: { type: 'created', iconColor: 'text-blue-600 dark:text-blue-400' },
  };

  try {
    const recentOrders = await Order.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('customerId', 'name')
      .select('_id status updatedAt customerId');

    if (recentOrders.length === 0) {
      return res.json(mockActivities);
    }

    const result = recentOrders.map((o) => {
      const shortId = `#${o._id.toString().slice(-8).toUpperCase()}`;
      const mapped = typeMap[o.status] || { type: 'created', iconColor: 'text-blue-600 dark:text-blue-400' };
      const customerName = o.customerId?.name || 'Unknown';
      return {
        id: o._id,
        type: mapped.type,
        title: o.status === 'Delivered'
          ? `Order ${shortId} delivered`
          : `Order ${shortId} status: ${o.status}`,
        description: `Customer: ${customerName}`,
        timestamp: o.updatedAt.toISOString(),
        iconColor: mapped.iconColor,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ─── POST /api/analytics/export-report ───────────────────────────────
// Generate a summary report (returns JSON data for the report)
router.post('/export-report', async (req, res) => {
  try {
    const [totalOrders, deliveredOrders, activeAgents, revenueAgg, statusStats] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Delivered' }),
      Agent.countDocuments({ isAvailable: true }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const deliveryRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0;

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalOrders,
        totalRevenue,
        activeAgents,
        deliveryRate: parseFloat(deliveryRate)
      },
      statusBreakdown: statusStats.map(({ _id, count }) => ({ status: _id, count }))
    };

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
