const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const ParkingLot = require('./models/ParkingLot');
const ParkingSlot = require('./models/ParkingSlot');

const SLOT_STATUSES = ['available', 'available', 'available', 'available', 'occupied', 'occupied', 'reserved'];
const SLOT_TYPES = ['regular', 'regular', 'regular', 'compact', 'handicapped', 'ev'];

const NEW_LOTS = [
  {
    name: 'Gaurav Tower Parking (Malviya Nagar)',
    location: 'Gaurav Tower, Malviya Nagar, Jaipur',
    city: 'Jaipur',
    totalSlots: 60,
    pricePerHour: 30,
    coordinates: { lat: 26.8530, lng: 75.8047 },
    amenities: ['CCTV', 'Covered', '24/7 Security', 'EV Charging', 'Handicapped Access']
  },
  {
    name: 'Raja Park Market Parking (Raja Park)',
    location: 'Raja Park Main Market, Jaipur',
    city: 'Jaipur',
    totalSlots: 40,
    pricePerHour: 35,
    coordinates: { lat: 26.8974, lng: 75.8236 },
    amenities: ['CCTV', 'Open', 'Security Guard', 'Bike Parking']
  },
  {
    name: 'C-Scheme Premium Parking (C-Scheme)',
    location: 'Panch Batti, C-Scheme, Jaipur',
    city: 'Jaipur',
    totalSlots: 80,
    pricePerHour: 50,
    coordinates: { lat: 26.9112, lng: 75.8010 },
    amenities: ['CCTV', 'Covered', '24/7 Security', 'EV Charging', 'Valet Parking']
  }
];

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parksmart';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    for (const lotData of NEW_LOTS) {
      // Check if lot already exists
      const existing = await ParkingLot.findOne({ name: lotData.name });
      if (existing) {
        console.log(`⚠️ Parking lot "${lotData.name}" already exists. Skipping.`);
        continue;
      }

      const lot = await ParkingLot.create(lotData);
      console.log(`🏗️ Created lot: "${lot.name}" with ID: ${lot._id}`);

      const slots = [];
      for (let i = 1; i <= lot.totalSlots; i++) {
        const floor = Math.ceil(i / 10);
        const status = SLOT_STATUSES[Math.floor(Math.random() * SLOT_STATUSES.length)];
        const type = SLOT_TYPES[Math.floor(Math.random() * SLOT_TYPES.length)];
        
        slots.push({
          lotId: lot._id,
          slotNumber: `${String.fromCharCode(64 + floor)}${String(i).padStart(2, '0')}`,
          floor,
          status,
          type
        });
      }

      await ParkingSlot.insertMany(slots);
      console.log(`   ✅ Created ${slots.length} slots for "${lot.name}"`);
    }

    console.log('\n🎉 Finished adding new lots and slots!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error adding lots:', err);
    process.exit(1);
  }
}

run();
