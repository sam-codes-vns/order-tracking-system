# Real-Time Order Tracking System

A full-stack MERN application for real-time order tracking with role-based access (Customer, Admin, Agent). Features live status updates via Socket.io, JWT authentication, and a modern responsive UI.

![Screenshots Placeholder - Add your screenshots here]

## Tech Stack

| Layer    | Technology                |
| -------- | ------------------------- |
| Frontend | React.js (JavaScript)     |
| Styling  | Tailwind CSS              |
| State    | Context API               |
| Routing  | React Router v6           |
| HTTP     | Axios (with interceptors) |
| Realtime | Socket.io Client          |
| Backend  | Node.js + Express.js      |
| Database | MongoDB + Mongoose        |
| Auth     | JWT + bcrypt              |
| Realtime | Socket.io Server          |

## Project Structure

```
order-tracking-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── context/        # AuthContext, OrderContext
│   │   ├── components/     # Navbar, StatusTimeline, OrderCard, etc.
│   │   ├── pages/          # Login, Register, Dashboard, etc.
│   │   ├── api/            # Axios instance
│   │   └── App.jsx
├── server/                 # Express backend
│   ├── models/             # User, Order, Agent
│   ├── routes/             # auth, orders, agents
│   ├── middleware/         # authMiddleware
│   ├── socket/             # socketHandler
│   └── server.js
└── .env.example
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone and Install

```bash
cd order-tracking-system

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Variables

Create `.env` in the **server** directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/order-tracking
JWT_SECRET=your_super_secret_key_change_in_production
CLIENT_URL=http://localhost:3000
```

Create `.env` in the **client** directory:

```env
VITE_SERVER_URL=http://localhost:5000
```

### 3. Seed Database

From the server directory:

```bash
npm run seed
```

This creates test users and orders:

| Role    | Email             | Password |
| ------- | ----------------- | -------- |
| Customer| customer@test.com | 123456   |
| Customer| jane@test.com     | 123456   |
| Admin   | admin@test.com    | 123456   |
| Agent   | agent@test.com    | 123456   |

### 4. Run the Application

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

- Client: http://localhost:3000
- Server: http://localhost:5000

## API Documentation

### Auth Routes (`/api/auth`)

| Method | Endpoint  | Description      |
| ------ | --------- | ---------------- |
| POST   | /register | Register user    |
| POST   | /login    | Login, returns JWT |
| GET    | /me       | Get current user (protected) |

### Order Routes (`/api/orders`)

| Method | Endpoint      | Description           | Access   |
| ------ | ------------- | --------------------- | -------- |
| POST   | /             | Place order           | Customer |
| GET    | /my-orders    | Get my orders         | Customer |
| GET    | /all          | Get all orders        | Admin    |
| GET    | /:id          | Get single order      | User     |
| PATCH  | /:id/status   | Update order status   | Admin    |

### Agent Routes (`/api/agents`)

| Method | Endpoint    | Description          | Access |
| ------ | ----------- | -------------------- | ------ |
| GET    | /           | Get all agents       | Admin  |
| PATCH  | /:id/assign | Assign agent to order| Admin  |

### Socket.io Events

**Client → Server:**
- `joinOrderRoom` – payload: `orderId`
- `leaveOrderRoom` – payload: `orderId`

**Server → Client:**
- `statusUpdated` – payload: `{ status, updatedAt, orderId }`

## User Roles

1. **Customer** – Places orders, tracks them in real-time
2. **Admin** – Manages all orders, updates status, assigns agents
3. **Agent** – Assigned to orders for delivery

## Features

- Real-time order status updates via Socket.io
- JWT authentication with protected routes
- Role-based access control
- Responsive design (mobile + desktop)
- Status timeline with timestamps
- Toast notifications on status changes
- Automatic socket reconnection

## License

MIT

## creating new vercel deploy trigger
