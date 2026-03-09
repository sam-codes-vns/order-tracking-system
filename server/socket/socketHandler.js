/**
 * Socket.io handler for real-time order status updates
 * Each order has its own room named by orderId
 */

const Order = require('../models/Order');

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Client joins a specific order room to receive updates
    socket.on('joinOrderRoom', (orderId) => {
      if (orderId) {
        socket.join(orderId.toString());
        console.log(`Socket ${socket.id} joined order room: ${orderId}`);
      }
    });

    // Client leaves order room
    socket.on('leaveOrderRoom', (orderId) => {
      if (orderId) {
        socket.leave(orderId.toString());
        console.log(`Socket ${socket.id} left order room: ${orderId}`);
      }
    });

    socket.on('updateAgentLocation', async ({ orderId, lat, lng }) => {
      try {
        // Save to DB
        await Order.findByIdAndUpdate(orderId, {
          agentLocation: { lat, lng, updatedAt: new Date() }
        });

        // Broadcast to everyone in the order room
        io.to(orderId).emit('agentLocationUpdated', { lat, lng, orderId });
      } catch (err) {
        console.error('Location update error:', err);
      }
    });

    socket.on('joinAgentRoom', (userId) => {
      if (userId) {
        socket.join(`agent_${userId}`);
        console.log(`Agent ${userId} joined their room`);
      }
    });
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = setupSocketHandlers;
