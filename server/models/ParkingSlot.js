const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  lotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
  slotNumber: { type: String, required: true },
  floor: { type: Number, default: 1 },
  status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' },
  type: { type: String, enum: ['regular', 'compact', 'handicapped', 'ev'], default: 'regular' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
