const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Agent name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: false,
    default: 'N/A', 
    // trim: true
  },
  assignedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Agent', agentSchema);
