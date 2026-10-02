const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const ParkingLot = require('./models/ParkingLot');
const ParkingSlot = require('./models/ParkingSlot');
const User = require('./models/User');
const Login = require('./models/Login');
const OTP = require('./models/OTP');

const LOTS = [
  {
    name: 'Pink City Parking Hub',
    location: 'MI Road, Near Ajmeri Gate, Jaipur',
    city: 'Jaipur',
    totalSlots: 20,
    pricePerHour: 40,
    coordinates: { lat: 26.9124, lng: 75.7873 },
    amenities: ['CCTV', 'Covered', '24/7 Security', 'EV Charging'],
  },
  {
    name: 'Amer Bazaar Smart Park',
    location: 'Amer Road, Near Hawa Mahal, Jaipur',
    city: 'Jaipur',
    totalSlots: 20,
    pricePerHour: 30,
    coordinates: { lat: 26.9239, lng: 75.8267 },
    amenities: ['CCTV', 'Open', 'Security Guard'],
  },
  {
    name: 'Vaishali Nagar Parking Complex',
    location: 'Vaishali Nagar, Sector 9, Jaipur',
    city: 'Jaipur',
    totalSlots: 20,
    pricePerHour: 25,
    coordinates: { lat: 26.9015, lng: 75.7374 },
    amenities: ['CCTV', 'Covered', 'Handicapped Access', 'Bike Parking'],
  },
  {
    name: 'City Open Free Parking',
    location: 'Central Park Gate 2, Jaipur',
    city: 'Jaipur',
    totalSlots: 50,
    pricePerHour: 0,
    coordinates: { lat: 26.8965, lng: 75.8083 },
    amenities: ['Open', 'Free', 'Guarded'],
  },
  {
    name: 'Rtech Capital High Street',
    location: 'Mahal Road, Near Akshay Patra Temple, Jaipur',
    city: 'Jaipur',
    totalSlots: 100,
    pricePerHour: 40,
    coordinates: { lat: 26.798873, lng: 75.857721 },
    amenities: ['CCTV', 'Covered', '24/7 Security', 'EV Charging'],
  },
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

const SLOT_STATUSES = ['available', 'available', 'available', 'available', 'occupied', 'occupied', 'reserved'];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await ParkingLot.deleteMany({});
    await ParkingSlot.deleteMany({});
    await User.deleteMany({ role: { $ne: 'admin' } });
    await Login.deleteMany({});
    await OTP.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.findOneAndUpdate(
      { phone: '9999999999' },
      { name: 'Admin User', phone: '9999999999', role: 'admin' },
      { upsert: true, new: true }
    );
    console.log(`👤 Admin: ${admin.phone} (OTP: any 6 digits)`);

    // Create lots and slots
    for (const lotData of LOTS) {
      const lot = await ParkingLot.create(lotData);
      console.log(`🏗️  Created lot: ${lot.name}`);

      const slots = [];
      for (let i = 1; i <= lot.totalSlots; i++) {
        const floor = Math.ceil(i / 10);
        const status = SLOT_STATUSES[Math.floor(Math.random() * SLOT_STATUSES.length)];
        const types = ['regular', 'regular', 'regular', 'compact', 'handicapped', 'ev'];
        const type = types[Math.floor(Math.random() * types.length)];
        slots.push({
          lotId: lot._id,
          slotNumber: `${String.fromCharCode(64 + floor)}${String(i).padStart(2, '0')}`,
          floor,
          status,
          type
        });
      }
      await ParkingSlot.insertMany(slots);
      console.log(`   ✅ Created ${slots.length} slots`);
    }

    console.log('\n🎉 Seeding complete!');
    console.log('📱 Admin phone: 9999999999 (use any 6-digit OTP in dev mode)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
