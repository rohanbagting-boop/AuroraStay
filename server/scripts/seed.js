import dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'development-seed-secret-change-this-value-now';
if (!process.env.CLIENT_ORIGIN) process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const { connectDb } = await import('../config/db.js');
const mongoose = await import('mongoose');
const { User } = await import('../models/User.js');
const { RoomType } = await import('../models/RoomType.js');
const { Room } = await import('../models/Room.js');
const { Reservation } = await import('../models/Reservation.js');
const { Payment } = await import('../models/Payment.js');
const { HotelSettings } = await import('../models/HotelSettings.js');
const { createReservation } = await import('../services/reservationService.js');

await connectDb();

await HotelSettings.findOneAndUpdate(
  {},
  {
    hotelName: 'Aurora Stay Hotel',
    address: 'Ayala Avenue, Makati City, Philippines',
    contactEmail: 'frontdesk@aurorastayhotel.com',
    contactPhone: '+63 2 8555 0188',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    taxRate: 0.12,
    serviceFeeRate: 0.05,
    cancellationHours: 24
  },
  { upsert: true, new: true }
);

const roomTypes = await Promise.all(
  [
    ['Standard', 'Quiet, efficient rooms with warm finishes and all essentials for city stays.', 3200, ['Wi-Fi', 'Air conditioning', 'Private bathroom']],
    ['Deluxe', 'Larger rooms with city views, work space, minibar, and upgraded bath amenities.', 4800, ['Wi-Fi', 'Air conditioning', 'Minibar', 'City view']],
    ['Suite', 'Separate living area, premium linens, bathtub, lounge seating, and skyline views.', 7900, ['Wi-Fi', 'Bathtub', 'Lounge area', 'Coffee machine']],
    ['Family Room', 'Flexible sleeping arrangements and generous storage for family travel.', 6200, ['Wi-Fi', 'Two queen beds', 'Smart TV', 'Extra storage']]
  ].map(([name, description, baseRate, amenities]) =>
    RoomType.findOneAndUpdate({ name }, { name, description, baseRate, amenities, isActive: true }, { upsert: true, new: true })
  )
);

const roomBlueprints = [
  {
    roomNumber: '201',
    name: 'Standard King',
    roomType: roomTypes[0],
    floor: 2,
    capacity: 2,
    bedType: 'King bed',
    sizeSqm: 28,
    nightlyRate: 3200,
    description: 'Standard King offers a polished stay with natural light, layered lighting, practical storage, crisp linens, and a calm palette designed for rest after a full day in the city.',
    images: [
      { url: '/rooms/standard-king.jpeg', alt: 'Standard King bedroom' },
      { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', alt: 'Standard King seating corner' },
      { url: 'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1200&q=80', alt: 'Standard King bath' }
    ]
  },
  {
    roomNumber: '202',
    name: 'Standard Twin',
    roomType: roomTypes[0],
    floor: 2,
    capacity: 2,
    bedType: 'Twin beds',
    sizeSqm: 30,
    nightlyRate: 3350,
    description: 'Standard Twin offers two comfortable twin beds, clean natural textures, and a quiet atmosphere suited for companions and colleagues.',
    images: [
      { url: '/rooms/standard-twin.jpeg', alt: 'Standard Twin room with two separate beds' },
      { url: 'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1200&q=80', alt: 'Ensuite bathroom' }
    ]
  },
  {
    roomNumber: '203',
    name: 'Standard Queen',
    roomType: roomTypes[0],
    floor: 2,
    capacity: 2,
    bedType: 'Queen bed',
    sizeSqm: 27,
    nightlyRate: 3100,
    description: 'Standard Queen delivers an inviting queen mattress, warm timber accents, reading sconces, and space to unwind.',
    images: [
      { url: '/rooms/standard-queen.jpeg', alt: 'Standard Queen bedroom with wood accents and desk' },
      { url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80', alt: 'Queen bed finishings' },
      { url: 'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1200&q=80', alt: 'Clean bathroom' }
    ]
  },
  {
    roomNumber: '301',
    name: 'Deluxe Corner',
    roomType: roomTypes[1],
    floor: 3,
    capacity: 2,
    bedType: 'King bed',
    sizeSqm: 36,
    nightlyRate: 4800,
    description: 'Deluxe Corner features corner-aspect daylight, premium king bed, dedicated work station, and minibar refreshments.',
    images: [
      { url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1400&q=80', alt: 'Deluxe Corner room' },
      { url: 'https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&w=1200&q=80', alt: 'Deluxe lounge chair' },
      { url: 'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1200&q=80', alt: 'Rain shower' }
    ]
  },
  {
    roomNumber: '302',
    name: 'Deluxe Twin View',
    roomType: roomTypes[1],
    floor: 3,
    capacity: 3,
    bedType: 'Twin beds',
    sizeSqm: 38,
    nightlyRate: 5100,
    description: 'Deluxe Twin View offers two twin beds overlooking city horizons with expansive windows, minibar, and rain shower.',
    images: [
      { url: '/rooms/deluxe-twin-view.jpeg', alt: 'Deluxe Twin View room' },
      { url: 'https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&w=1200&q=80', alt: 'Window lounge' }
    ]
  },
  {
    roomNumber: '303',
    name: 'Deluxe Queen',
    roomType: roomTypes[1],
    floor: 3,
    capacity: 2,
    bedType: 'Queen bed',
    sizeSqm: 34,
    nightlyRate: 4600,
    description: 'Deluxe Queen combines a plush queen bed with elevated finishes, soft mood lighting, and panoramic city vistas.',
    images: [
      { url: '/rooms/deluxe-queen-real.jpeg', alt: 'Deluxe Queen room with plush queen bed, sofa and vanity' },
      { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', alt: 'Seating corner' },
      { url: 'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1200&q=80', alt: 'Bath amenities' }
    ]
  },
  {
    roomNumber: '401',
    name: 'Executive Suite',
    roomType: roomTypes[2],
    floor: 4,
    capacity: 3,
    bedType: 'King bed and sofa',
    sizeSqm: 58,
    nightlyRate: 7900,
    description: 'Executive Suite offers an expansive separate living room with sofa, private king bedroom, deep bathtub, and executive work desk.',
    images: [
      { url: '/rooms/exec-suite.jpeg', alt: 'Executive Suite king bedroom with custom headboard' },
      { url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=80', alt: 'Suite lounge' },
      { url: 'https://images.unsplash.com/photo-1629079447777-1e605162dc8d?auto=format&fit=crop&w=1200&q=80', alt: 'Soaking tub' }
    ]
  },
  {
    roomNumber: '402',
    name: 'Aurora Suite',
    roomType: roomTypes[2],
    floor: 4,
    capacity: 3,
    bedType: 'King bed',
    sizeSqm: 64,
    nightlyRate: 8700,
    description: 'Aurora Suite is the pinnacle experience featuring sweeping floor-to-ceiling skyline views, master king suite, designer bathtub, and barista coffee station.',
    images: [
      { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80', alt: 'Aurora Suite master bedroom' },
      { url: '/rooms/suite-penthouse-test.jpeg', alt: 'Aurora Suite luxury skyline penthouse lounge' },
      { url: 'https://images.unsplash.com/photo-1629079447777-1e605162dc8d?auto=format&fit=crop&w=1200&q=80', alt: 'Designer bathtub' }
    ]
  },
  {
    roomNumber: '501',
    name: 'Family Double Queen',
    roomType: roomTypes[3],
    floor: 5,
    capacity: 4,
    bedType: 'Two queen beds',
    sizeSqm: 48,
    nightlyRate: 6200,
    description: 'Family Double Queen is crafted for family comfort with two queen mattresses, large Smart TV, ample wardrobes, and quiet residential floor.',
    images: [
      { url: '/rooms/family-double-queen.jpeg', alt: 'Two queen beds family room' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80', alt: 'Wardrobe and vanity' }
    ]
  },
  {
    roomNumber: '502',
    name: 'Family Studio',
    roomType: roomTypes[3],
    floor: 5,
    capacity: 5,
    bedType: 'Queen bed and bunk',
    sizeSqm: 52,
    nightlyRate: 6600,
    description: 'Family Studio features a flexible layout with Queen bed and bunk setup, two sleeping zones, and easy-access storage for group adventures.',
    images: [
      { url: '/rooms/family-studio.jpeg', alt: 'Family Studio bedroom' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80', alt: 'Storage and seating' }
    ]
  }
];

for (const blueprint of roomBlueprints) {
  await Room.findOneAndUpdate(
    { roomNumber: blueprint.roomNumber },
    {
      roomNumber: blueprint.roomNumber,
      name: blueprint.name,
      roomType: blueprint.roomType._id,
      floor: blueprint.floor,
      capacity: blueprint.capacity,
      bedType: blueprint.bedType,
      sizeSqm: blueprint.sizeSqm,
      nightlyRate: blueprint.nightlyRate,
      amenities: blueprint.roomType.amenities,
      description: blueprint.description,
      images: blueprint.images,
      status: 'available',
      isArchived: false
    },
    { upsert: true, new: true }
  );
}

async function upsertUser(email, password, role, name) {
  let user = await User.findOne({ email }).select('+password');
  if (!user) user = await User.create({ email, password, role, name, phone: '+63 917 555 0100' });
  else {
    user.name = name;
    user.role = role;
    user.password = password;
    user.isActive = true;
    user.deletedAt = null;
    await user.save();
  }
  return user;
}

const admin = await upsertUser(process.env.SEED_ADMIN_EMAIL || 'admin@aurorastay.test', process.env.SEED_ADMIN_PASSWORD || 'ChangeMeAdmin!123', 'admin', 'Aurora Admin');
const receptionist = await upsertUser(process.env.SEED_RECEPTION_EMAIL || 'reception@aurorastay.test', process.env.SEED_RECEPTION_PASSWORD || 'ChangeMeReception!123', 'receptionist', 'Rhea Reception');
const guest = await upsertUser(process.env.SEED_GUEST_EMAIL || 'guest@aurorastay.test', process.env.SEED_GUEST_PASSWORD || 'ChangeMeGuest!123', 'guest', 'Gina Guest');

if ((await Reservation.countDocuments()) === 0) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const checkout = new Date(tomorrow);
  checkout.setDate(checkout.getDate() + 2);
  const reservation = await createReservation({
    user: guest,
    actor: admin,
    payload: {
      roomType: roomTypes[1]._id,
      checkIn: tomorrow.toISOString(),
      checkOut: checkout.toISOString(),
      guests: 2,
      guestInfo: { name: guest.name, email: guest.email, phone: guest.phone },
      specialRequests: 'High floor preferred.',
      idempotencyKey: 'seed-reservation-1'
    }
  });
  await Payment.create({ reservation: reservation._id, recordedBy: receptionist._id, method: 'pay-at-reception', status: 'pending', amount: reservation.price.total, idempotencyKey: 'seed-payment-1' });
}

console.log('Seed complete.');
await mongoose.default.disconnect();
