const express = require('express');
const Agent = require('../models/Agent');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// All agent routes require admin
router.use(protect, adminOnly);

/**
 * GET /api/agents
 * Get all agents
 */
router.get('/', async (req, res) => {
  try {
    const agents = await Agent.find()
      .populate('assignedOrders');

    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

/**
 * PATCH /api/agents/:id/assign
 * Assign agent to an order
 */
router.patch('/:id/assign', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Remove from previous agent if any
    if (order.agentId) {
      await Agent.findByIdAndUpdate(order.agentId, {
        $pull: { assignedOrders: orderId }
      });
    }

    // Assign to new agent
    order.agentId = agent._id;
    await order.save();

    // Add to agent's assigned orders if not already there
    if (!agent.assignedOrders.includes(orderId)) {
      agent.assignedOrders.push(orderId);
      await agent.save();
    }

    const updatedOrder = await Order.findById(orderId)
      .populate('customerId', 'name email')
      .populate('agentId', 'name phone');

    res.json(updatedOrder);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid ID' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
