const express = require('express');
const Order = require('../models/Order');
const Agent = require('../models/Agent');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * POST /api/orders
 * Place a new order (customer only)
 */
router.post('/', protect, async (req, res) => {
  try {
    const { items, agentId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one item' });
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const order = await Order.create({
      customerId: req.user._id,
      agentId: agentId || null,
      items,
      totalAmount,
      status: 'Placed'
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name email')
      .populate('agentId', 'name phone');

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

/**
 * GET /api/orders/my-orders
 * Get current user's orders (customer)
 */
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate('agentId', 'name phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

/**
 * GET /api/orders/all
 * Get all orders (admin only)
 */
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name email')
      .populate('agentId', 'name phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// GET /api/orders/my-assignments - for agents
router.get('/my-assignments', protect, async (req, res) => {
  try {
    // First try userId match
    let agent = await Agent.findOne({ userId: req.user._id });
    
    // Fallback: match by name if userId not set
    if (!agent) {
      agent = await Agent.findOne({ name: req.user.name });
    }

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const orders = await Order.find({ agentId: agent._id })
      .populate('customerId', 'name email');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/orders/:id
 * Get single order by ID
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('agentId', 'name phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Customer can only view their own orders
    if (req.user.role === 'customer' && order.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});


/**
 * PATCH /api/orders/:id/status
 * Update order status (admin only)
 */
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    order.statusHistory.push({ status, updatedAt: new Date() });
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name email')
      .populate('agentId', 'name phone');

    // Emit socket event (attached by server.js)
    const io = req.app.get('io');
    if (io) {
      io.to(order._id.toString()).emit('statusUpdated', {
        status: order.status,
        updatedAt: new Date(),
        orderId: order._id
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
