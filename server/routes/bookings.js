const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');

// Dynamic pricing
const getDynamicPrice = (basePrice, hour) => {
  const peakHours = [9, 10, 18, 19, 20];
  const offPeakHours = [0, 1, 2, 3, 4, 5, 23];
  if (peakHours.includes(hour)) return basePrice * 1.5;
  if (offPeakHours.includes(hour)) return basePrice * 0.8;
  return basePrice;
};

// POST /api/bookings
router.post('/', auth, async (req, res) => {
  try {
    const { slotId, lotId, startTime, endTime, vehicleNumber, paymentMethod } = req.body;
    
    const slot = await ParkingSlot.findById(slotId);
    if (!slot || slot.status !== 'available') {
      return res.status(400).json({ message: 'Slot not available' });
    }

    const lot = await ParkingLot.findById(lotId);
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = Math.ceil((end - start) / (1000 * 60 * 60));
    
    const dynamicPrice = getDynamicPrice(lot.pricePerHour, start.getHours());
    const totalCost = dynamicPrice * durationHours;

    // Generate QR code
    const bookingData = {
      userId: req.user._id,
      slotId,
      lotId,
      startTime: start,
      endTime: end,
      vehicleNumber,
      timestamp: Date.now()
    };
    const qrCode = await QRCode.toDataURL(JSON.stringify(bookingData));

    // Create booking
    const booking = await Booking.create({
      userId: req.user._id,
      slotId,
      lotId,
      startTime: start,
      endTime: end,
      duration: durationHours,
      totalCost,
      qrCode,
      vehicleNumber,
      status: 'confirmed'
    });

    // Update slot status
    await ParkingSlot.findByIdAndUpdate(slotId, { status: 'reserved' });

    // Create payment record
    await Payment.create({
      bookingId: booking._id,
      userId: req.user._id,
      amount: totalCost,
      method: paymentMethod || 'upi',
      status: 'success',
      transactionId: `TXN${Date.now()}`
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('slotId')
      .populate('lotId', 'name location');

    res.status(201).json(populatedBooking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/my
router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('slotId')
      .populate('lotId', 'name location')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/:userId
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .populate('slotId')
      .populate('lotId', 'name location')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bookings/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('slotId')
      .populate('lotId', 'name location address');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    await ParkingSlot.findByIdAndUpdate(booking.slotId, { status: 'available' });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
