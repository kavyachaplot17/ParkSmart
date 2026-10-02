const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');

// GET /api/admin/stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalLots = await ParkingLot.countDocuments();
    const totalSlots = await ParkingSlot.countDocuments();
    const availableSlots = await ParkingSlot.countDocuments({ status: 'available' });
    const occupiedSlots = await ParkingSlot.countDocuments({ status: 'occupied' });
    const reservedSlots = await ParkingSlot.countDocuments({ status: 'reserved' });
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: { $in: ['confirmed', 'active'] } });

    const revenueResult = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayRevenueResult = await Payment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayRevenue = todayRevenueResult[0]?.total || 0;

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('userId', 'name phone')
      .populate('lotId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalLots, totalSlots, availableSlots, occupiedSlots, reservedSlots,
      totalUsers, totalBookings, activeBookings,
      totalRevenue, todayRevenue,
      occupancyPercent: Math.round((occupiedSlots + reservedSlots) / totalSlots * 100),
      recentBookings
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/lots
router.get('/lots', adminAuth, async (req, res) => {
  try {
    const lots = await ParkingLot.find();
    const lotsWithStats = await Promise.all(lots.map(async (lot) => {
      const available = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'available' });
      const occupied = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'occupied' });
      const reserved = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'reserved' });
      return { ...lot.toObject(), available, occupied, reserved };
    }));
    res.json(lotsWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/lots
router.post('/lots', adminAuth, async (req, res) => {
  try {
    const lot = await ParkingLot.create(req.body);
    // Create slots
    const slots = [];
    for (let i = 1; i <= lot.totalSlots; i++) {
      slots.push({ lotId: lot._id, slotNumber: `S${String(i).padStart(3, '0')}`, floor: Math.ceil(i / 10) });
    }
    await ParkingSlot.insertMany(slots);
    res.status(201).json(lot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/bookings
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name phone')
      .populate('lotId', 'name')
      .populate('slotId', 'slotNumber floor')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
