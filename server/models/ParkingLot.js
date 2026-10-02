const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  city: { type: String, default: 'Jaipur' },
  totalSlots: { type: Number, required: true },
  availableSlots: { type: Number },
  pricePerHour: { type: Number, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  amenities: [String],
  image: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ParkingLot', parkingLotSchema);
