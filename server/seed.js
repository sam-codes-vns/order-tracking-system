/**
 * Seed script - Populates dummy users, orders, and agents for testing
 * Run: node seed.js (from server directory)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Order = require('./models/Order');
const Agent = require('./models/Agent');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/order-tracking';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Order.deleteMany({});
    await Agent.deleteMany({});
    console.log('Cleared existing data');

    // Create users (passwords will be hashed by pre-save hook)
    const customer1 = await User.create({
      name: 'John Customer',
      email: 'customer@test.com',
      password: '123456',
      role: 'customer'
    });

    const customer2 = await User.create({
      name: 'Jane Doe',
      email: 'jane@test.com',
      password: '123456',
      role: 'customer'
    });

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: '123456',
      role: 'admin'
    });

    const agentUser = await User.create({
      name: 'Mike Agent',
      email: 'agent@test.com',
      password: '123456',
      role: 'agent'
    });

    console.log('Created users');

    // Create agents
    const agent1 = await Agent.create({
      name: 'Mike Agent',
      phone: '+1-555-0101',
      isAvailable: true
    });

    const agent2 = await Agent.create({
      name: 'Sarah Driver',
      phone: '+1-555-0102',
      isAvailable: true
    });

    const agent3 = await Agent.create({
      name: 'Tom Delivery',
      phone: '+1-555-0103',
      isAvailable: false
    });

    console.log('Created agents');

    // Create orders
    const order1 = await Order.create({
      customerId: customer1._id,
      agentId: agent1._id,
      items: [
        { name: 'Laptop', qty: 1, price: 999 },
        { name: 'Mouse', qty: 2, price: 29 }
      ],
      totalAmount: 1057,
      status: 'Placed',
      statusHistory: [{ status: 'Placed', updatedAt: new Date() }]
    });

    const order2 = await Order.create({
      customerId: customer1._id,
      agentId: agent1._id,
      items: [{ name: 'Headphones', qty: 1, price: 149 }],
      totalAmount: 149,
      status: 'Shipped',
      statusHistory: [
        { status: 'Placed', updatedAt: new Date(Date.now() - 86400000 * 2) },
        { status: 'Packed', updatedAt: new Date(Date.now() - 86400000 * 1.5) },
        { status: 'Shipped', updatedAt: new Date(Date.now() - 86400000) }
      ]
    });

    const order3 = await Order.create({
      customerId: customer2._id,
      agentId: agent2._id,
      items: [
        { name: 'Keyboard', qty: 1, price: 79 },
        { name: 'USB Cable', qty: 3, price: 9 }
      ],
      totalAmount: 106,
      status: 'Out for Delivery',
      statusHistory: [
        { status: 'Placed', updatedAt: new Date(Date.now() - 86400000 * 3) },
        { status: 'Packed', updatedAt: new Date(Date.now() - 86400000 * 2) },
        { status: 'Shipped', updatedAt: new Date(Date.now() - 86400000) },
        { status: 'Out for Delivery', updatedAt: new Date() }
      ]
    });

    const order4 = await Order.create({
      customerId: customer1._id,
      items: [{ name: 'Monitor', qty: 1, price: 299 }],
      totalAmount: 299,
      status: 'Delivered',
      statusHistory: [
        { status: 'Placed', updatedAt: new Date(Date.now() - 86400000 * 5) },
        { status: 'Packed', updatedAt: new Date(Date.now() - 86400000 * 4) },
        { status: 'Shipped', updatedAt: new Date(Date.now() - 86400000 * 3) },
        { status: 'Out for Delivery', updatedAt: new Date(Date.now() - 86400000 * 2) },
        { status: 'Delivered', updatedAt: new Date(Date.now() - 86400000) }
      ]
    });

    const order5 = await Order.create({
      customerId: customer2._id,
      agentId: null,
      items: [{ name: 'Webcam', qty: 1, price: 89 }],
      totalAmount: 89,
      status: 'Packed',
      statusHistory: [
        { status: 'Placed', updatedAt: new Date(Date.now() - 3600000) },
        { status: 'Packed', updatedAt: new Date() }
      ]
    });

    // Update agent assigned orders
    agent1.assignedOrders = [order1._id, order2._id];
    agent2.assignedOrders = [order3._id];
    await agent1.save();
    await agent2.save();

    console.log('Created orders');

    console.log('\n--- Seed completed successfully ---\n');
    console.log('Test accounts:');
    console.log('  Customer: customer@test.com / 123456');
    console.log('  Customer: jane@test.com / 123456');
    console.log('  Admin:    admin@test.com / 123456');
    console.log('  Agent:    agent@test.com / 123456');
    console.log('\n');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seed();
