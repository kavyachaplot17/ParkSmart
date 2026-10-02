# 🅿️ ParkSmart — Smart Parking Management System

ParkSmart is a full-stack MERN smart parking management system that enables users to discover parking locations, view real-time slot availability, make bookings, and manage parking through an admin dashboard.

## ✨ Features

- **📱 OTP Authentication** — Phone number + OTP login (no passwords)
- **🗺️ Live Map** — Interactive Leaflet map showing parking zones in Jaipur
- **🔴 Real-time Slots** — Socket.io powered live slot updates every 5 seconds
- **💰 Dynamic Pricing** — 1.5x during peak hours (9-11am, 6-8pm), 0.8x off-peak
- **📊 Demand Forecast** — Hourly parking-demand forecast chart
- **📱 QR Codes** — Auto-generated QR for entry/exit after booking
- **💳 UPI Payments** — Mock UPI/card/net banking payment UI
- **👨‍💼 Admin Panel** — Revenue stats, occupancy analytics, booking management
- **🌙 Dark Theme** — Modern navy + green color scheme

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.io |
| Auth | JWT + OTP (phone-based) |
| Maps | Leaflet.js / React-Leaflet |
| Charts | Chart.js / React-Chartjs-2 |
| QR Code | `qrcode` npm package |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Clone & Install

```bash
# Install root dependencies
npm install

# Install all (client + server)
npm run install-all
```

### 2. Configure Environment

Edit `server/.env`:
```
MONGO_URI=mongodb://localhost:27017/smart-parking
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

### 3. Seed Database

```bash
npm run seed
```
This creates:
- 3 Jaipur parking lots with 20 slots each
- Admin user (phone: `9999999999`)

### 4. Start Development

```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 👤 Test Accounts

| Role | Phone | OTP |
|------|-------|-----|
| Admin | 9999999999 | *(shown in dev mode)* |
| User | Any valid Indian number | *(shown in dev mode)* |

> In development mode, the OTP is displayed in the UI automatically.

## 📁 Project Structure

```
smart-parking/
├── client/                     # React Frontend
│   └── src/
│       ├── pages/
│       │   ├── Landing.js      # Hero landing page
│       │   ├── Login.js        # OTP authentication
│       │   ├── Dashboard.js    # Parking search + map
│       │   ├── LotView.js      # Slot grid view
│       │   ├── BookingPage.js  # Booking form + payment
│       │   ├── BookingSuccess.js # QR code display
│       │   ├── MyBookings.js   # User booking history
│       │   └── AdminDashboard.js # Admin analytics
│       ├── components/
│       │   └── Navbar.js
│       ├── context/
│       │   └── AuthContext.js  # JWT + OTP auth state
│       └── utils/
│           ├── api.js          # Axios client
│           └── pricing.js      # Dynamic pricing + AI prediction
│
├── server/                     # Node.js Backend
│   ├── models/
│   │   ├── User.js
│   │   ├── OTP.js
│   │   ├── ParkingLot.js
│   │   ├── ParkingSlot.js
│   │   ├── Booking.js
│   │   └── Payment.js
│   ├── routes/
│   │   ├── auth.js             # OTP endpoints
│   │   ├── parking.js          # Lots & slots
│   │   ├── bookings.js         # Booking CRUD
│   │   └── admin.js            # Admin stats
│   ├── middleware/
│   │   └── auth.js             # JWT middleware
│   ├── socket/
│   │   └── handler.js          # Real-time IoT simulation
│   ├── seed.js                 # Database seeder
│   └── server.js
│
└── package.json                # Root scripts (concurrently)
```

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Verify OTP + login |
| GET | `/api/auth/me` | Get current user |

### Parking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parking/lots` | All parking lots |
| GET | `/api/parking/lots/:id` | Single lot details |
| GET | `/api/parking/lots/:id/slots` | Lot's slots |
| PUT | `/api/parking/slots/:id/status` | Update slot status |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/my` | User's bookings |
| GET | `/api/bookings/:id` | Single booking |
| PUT | `/api/bookings/:id/cancel` | Cancel booking |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Revenue & occupancy stats |
| GET | `/api/admin/bookings` | All bookings |
| POST | `/api/admin/lots` | Create new lot |

## 💰 Dynamic Pricing Logic

```js
Peak hours (9, 10, 18, 19, 20):  basePrice × 1.5
Off-peak (0-5, 23):               basePrice × 0.8  
Normal:                           basePrice × 1.0
```

## 🔌 Real-time Events (Socket.io)

- `join-lot` — Subscribe to a parking lot's updates
- `leave-lot` — Unsubscribe
- `slot-update` — Emitted when slot status changes
- `lot-occupancy-update` — Broadcast occupancy % to all clients

## 🌆 Parking Zones (Seeded Data)

1. **Pink City Parking Hub** — MI Road, ₹40/hr
2. **Amer Bazaar Smart Park** — Amer Road, ₹30/hr
3. **Vaishali Nagar Parking Complex** — Vaishali Nagar, ₹25/hr

## 📱 Future SMS Integration
The current application displays OTPs in development mode. Real SMS delivery can be integrated using providers such as:
- **MSG91** (Indian SMS provider)
- **Twilio**
- **Fast2SMS**

Replace the `console.log` OTP line with your SMS API call.
