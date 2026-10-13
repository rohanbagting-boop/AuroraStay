export const demoRooms = [
  {
    _id: 'demo-standard-king',
    roomNumber: '201',
    name: 'Standard King',
    roomType: { _id: 'demo-standard', name: 'Standard' },
    floor: 2,
    capacity: 2,
    bedType: 'King bed',
    sizeSqm: 28,
    nightlyRate: 3200,
    status: 'available',
    amenities: ['Wi-Fi', 'Air conditioning', 'Private bathroom', 'Work desk'],
    description:
      'Standard King offers a polished stay with natural light, layered lighting, practical storage, crisp linens, and a calm palette designed for rest after a full day in the city.',
    images: [
      { url: '/rooms/standard-king.jpeg', alt: 'Standard King bedroom' },
      { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', alt: 'Standard King seating corner' },
      { url: 'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1200&q=80', alt: 'Standard King bath' }
    ]
  },
  {
    _id: 'demo-standard-twin',
    roomNumber: '202',
    name: 'Standard Twin',
    roomType: { _id: 'demo-standard', name: 'Standard' },
    floor: 2,
    capacity: 2,
    bedType: 'Twin beds',
    sizeSqm: 30,
    nightlyRate: 3350,
    status: 'available',
    amenities: ['Wi-Fi', 'Air conditioning', 'Private bathroom', 'Work desk'],
    description:
      'Standard Twin offers two comfortable twin beds, clean natural textures, and a quiet atmosphere suited for companions and colleagues.',
    images: [
      { url: '/rooms/standard-twin.jpeg', alt: 'Standard Twin room with two separate beds' },
      { url: 'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1200&q=80', alt: 'Bathroom' }
    ]
  },
  {
    _id: 'demo-standard-queen',
    roomNumber: '203',
    name: 'Standard Queen',
    roomType: { _id: 'demo-standard', name: 'Standard' },
    floor: 2,
    capacity: 2,
    bedType: 'Queen bed',
    sizeSqm: 27,
    nightlyRate: 3100,
    status: 'available',
    amenities: ['Wi-Fi', 'Air conditioning', 'Private bathroom', 'Work desk'],
    description:
      'Standard Queen delivers an inviting queen mattress, warm timber accents, reading sconces, and space to unwind.',
    images: [
      { url: '/rooms/standard-queen.jpeg', alt: 'Standard Queen bedroom with wood accents and desk' },
      { url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80', alt: 'Queen bed finishings' },
      { url: 'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1200&q=80', alt: 'Clean bathroom' }
    ]
  },
  {
    _id: 'demo-deluxe-corner',
    roomNumber: '301',
    name: 'Deluxe Corner',
    roomType: { _id: 'demo-deluxe', name: 'Deluxe' },
    floor: 3,
    capacity: 2,
    bedType: 'King bed',
    sizeSqm: 36,
    nightlyRate: 4800,
    status: 'available',
    amenities: ['Wi-Fi', 'City view', 'Minibar', 'Rain shower', 'Coffee service'],
    description:
      'Deluxe Corner features corner-aspect daylight, premium king bed, dedicated work station, and minibar refreshments.',
    images: [
      { url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1400&q=80', alt: 'Deluxe Corner room' },
      { url: 'https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&w=1200&q=80', alt: 'Deluxe lounge chair' },
      { url: 'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1200&q=80', alt: 'Rain shower' }
    ]
  },
  {
    _id: 'demo-deluxe-twin-view',
    roomNumber: '302',
    name: 'Deluxe Twin View',
    roomType: { _id: 'demo-deluxe', name: 'Deluxe' },
    floor: 3,
    capacity: 3,
    bedType: 'Twin beds',
    sizeSqm: 38,
    nightlyRate: 5100,
    status: 'available',
    amenities: ['Wi-Fi', 'City view', 'Minibar', 'Rain shower', 'Coffee service'],
    description:
      'Deluxe Twin View offers two twin beds overlooking city horizons with expansive windows, minibar, and rain shower.',
    images: [
      { url: '/rooms/deluxe-twin-view.jpeg', alt: 'Deluxe Twin View room' },
      { url: 'https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&w=1200&q=80', alt: 'Window lounge' }
    ]
  },
  {
    _id: 'demo-deluxe-queen',
    roomNumber: '303',
    name: 'Deluxe Queen',
    roomType: { _id: 'demo-deluxe', name: 'Deluxe' },
    floor: 3,
    capacity: 2,
    bedType: 'Queen bed',
    sizeSqm: 34,
    nightlyRate: 4600,
    status: 'available',
    amenities: ['Wi-Fi', 'City view', 'Minibar', 'Rain shower', 'Coffee service'],
    description:
      'Deluxe Queen combines a plush queen bed with elevated finishes, soft mood lighting, and panoramic city vistas.',
    images: [
      { url: '/rooms/deluxe-queen-real.jpeg', alt: 'Deluxe Queen room with plush queen bed, sofa and vanity' },
      { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', alt: 'Seating corner' },
      { url: 'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?auto=format&fit=crop&w=1200&q=80', alt: 'Bath amenities' }
    ]
  },
  {
    _id: 'demo-executive-suite',
    roomNumber: '401',
    name: 'Executive Suite',
    roomType: { _id: 'demo-suite', name: 'Suite' },
    floor: 4,
    capacity: 3,
    bedType: 'King bed and sofa',
    sizeSqm: 58,
    nightlyRate: 7900,
    status: 'available',
    amenities: ['Wi-Fi', 'Bathtub', 'Lounge area', 'Coffee machine', 'Skyline view'],
    description:
      'Executive Suite offers an expansive separate living room with sofa, private king bedroom, deep bathtub, and executive work desk.',
    images: [
      { url: '/rooms/exec-suite.jpeg', alt: 'Executive Suite king bedroom with custom headboard' },
      { url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1200&q=80', alt: 'Suite lounge' },
      { url: 'https://images.unsplash.com/photo-1629079447777-1e605162dc8d?auto=format&fit=crop&w=1200&q=80', alt: 'Soaking tub' }
    ]
  },
  {
    _id: 'demo-aurora-suite',
    roomNumber: '402',
    name: 'Aurora Suite',
    roomType: { _id: 'demo-suite', name: 'Suite' },
    floor: 4,
    capacity: 3,
    bedType: 'King bed',
    sizeSqm: 64,
    nightlyRate: 8700,
    status: 'available',
    amenities: ['Separate lounge', 'Bathtub', 'Coffee machine', 'Skyline view', 'Premium linens'],
    description:
      'Aurora Suite is the pinnacle experience featuring sweeping floor-to-ceiling skyline views, master king suite, designer bathtub, and barista coffee station.',
    images: [
      { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80', alt: 'Aurora Suite master bedroom' },
      { url: '/rooms/suite-penthouse-test.jpeg', alt: 'Aurora Suite luxury skyline penthouse lounge' },
      { url: 'https://images.unsplash.com/photo-1629079447777-1e605162dc8d?auto=format&fit=crop&w=1200&q=80', alt: 'Designer bathtub' }
    ]
  },
  {
    _id: 'demo-family-double-queen',
    roomNumber: '501',
    name: 'Family Double Queen',
    roomType: { _id: 'demo-family', name: 'Family Room' },
    floor: 5,
    capacity: 4,
    bedType: 'Two queen beds',
    sizeSqm: 48,
    nightlyRate: 6200,
    status: 'available',
    amenities: ['Wi-Fi', 'Two queen beds', 'Smart TV', 'Extra storage', 'Child-friendly layout'],
    description:
      'Family Double Queen is crafted for family comfort with two queen mattresses, large Smart TV, ample wardrobes, and quiet residential floor.',
    images: [
      { url: '/rooms/family-double-queen.jpeg', alt: 'Two queen beds family room' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80', alt: 'Wardrobe and vanity' }
    ]
  },
  {
    _id: 'demo-family-studio',
    roomNumber: '502',
    name: 'Family Studio',
    roomType: { _id: 'demo-family', name: 'Family Room' },
    floor: 5,
    capacity: 5,
    bedType: 'Queen bed and bunk',
    sizeSqm: 52,
    nightlyRate: 6600,
    status: 'available',
    amenities: ['Two sleeping zones', 'Smart TV', 'Extra storage', 'Private bathroom', 'Child-friendly layout'],
    description:
      'Family Studio features a flexible layout with Queen bed and bunk setup, two sleeping zones, and easy-access storage for group adventures.',
    images: [
      { url: '/rooms/family-studio.jpeg', alt: 'Family Studio bedroom' },
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80', alt: 'Storage and seating' }
    ]
  }
];

export const demoRoomTypes = [
  { _id: 'demo-standard', name: 'Standard' },
  { _id: 'demo-deluxe', name: 'Deluxe' },
  { _id: 'demo-suite', name: 'Suite' },
  { _id: 'demo-family', name: 'Family Room' }
];

export function findDemoRoom(id) {
  return demoRooms.find((room) => room._id === id);
}
