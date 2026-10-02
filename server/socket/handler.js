const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join-lot', (lotId) => {
      socket.join(`lot-${lotId}`);
      console.log(`Client ${socket.id} joined lot-${lotId}`);
    });

    socket.on('leave-lot', (lotId) => {
      socket.leave(`lot-${lotId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  // Simulate IoT sensor data - update random slots every 5 seconds
  setInterval(async () => {
    try {
      const lots = await ParkingLot.find();
      
      for (const lot of lots) {
        const slots = await ParkingSlot.find({ lotId: lot._id });
        
        // Randomly change 1-3 slots per lot
        const numChanges = Math.floor(Math.random() * 3) + 1;
        const changedSlots = [];
        
        for (let i = 0; i < numChanges; i++) {
          const randomSlot = slots[Math.floor(Math.random() * slots.length)];
          if (!randomSlot || randomSlot.status === 'reserved') continue;
          
          const newStatus = randomSlot.status === 'available' ? 
            (Math.random() > 0.7 ? 'occupied' : 'available') : 
            (Math.random() > 0.4 ? 'available' : 'occupied');
          
          if (newStatus !== randomSlot.status) {
            await ParkingSlot.findByIdAndUpdate(randomSlot._id, { status: newStatus, updatedAt: new Date() });
            changedSlots.push({ slotId: randomSlot._id, slotNumber: randomSlot.slotNumber, status: newStatus, floor: randomSlot.floor });
          }
        }

        if (changedSlots.length > 0) {
          const available = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'available' });
          const occupied = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'occupied' });
          
          io.to(`lot-${lot._id}`).emit('slot-update', {
            lotId: lot._id,
            changedSlots,
            summary: { available, occupied, total: lot.totalSlots }
          });

          io.emit('lot-occupancy-update', {
            lotId: lot._id,
            available,
            occupied,
            total: lot.totalSlots,
            occupancyPercent: Math.round((occupied / lot.totalSlots) * 100)
          });
        }
      }
    } catch (err) {
      console.error('Socket simulation error:', err.message);
    }
  }, 5000);
};
