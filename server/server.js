// //require('dotenv').config();
// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const setupSocketHandlers = require('./socket/socketHandler');

// const authRoutes = require('./routes/auth');
// const orderRoutes = require('./routes/orders');
// const agentRoutes = require('./routes/agents');

// const app = express();
// const server = http.createServer(app);

// // Socket.io setup with CORS
// const io = new Server(server, {
//   cors: {
//     origin: process.env.CLIENT_URL || 'http://localhost:3000',
//     methods: ['GET', 'POST']
//   }
// });

// // Make io available to routes
// app.set('io', io);
// setupSocketHandlers(io);

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/agents', agentRoutes);

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Server is running' });
// });

// // MongoDB connection
// const connectDB = async () => {
//   try {
//     //await mongoose.connect(process.env.MONGO_URI);
//     console.log('MongoDB connected');
//   } catch (error) {
//     console.error('MongoDB connection failed:', error.message);
//     process.exit(1);
//   }
// };

// const PORT = process.env.PORT || 5000;

// connectDB().then(() => {
//   server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// });
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

// Route imports
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const agentRoutes = require("./routes/agents");
const analyticsRoutes = require("./routes/analytics");

// Socket handler import
const setupSocketHandlers = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
setupSocketHandlers(io);

// ─── Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/analytics", analyticsRoutes);

// ─── Health Check ────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/", (req, res) => {
  res.send("🚀 Server Running");
});

// ─── MongoDB Connection ──────────────────────────────────────────────
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("❌ MONGO_URI is not defined in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");

  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

// ─── Start Server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
  });
});