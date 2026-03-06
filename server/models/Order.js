const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    default: null
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: 'Order must have at least one item'
    }
  },
  status: {
    type: String,
    enum: ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'],
    default: 'Placed'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  statusHistory: [{
    status: String,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Add initial status to history when order is created (if not already set)
orderSchema.pre('save', function (next) {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{ status: this.status, updatedAt: new Date() }];
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
