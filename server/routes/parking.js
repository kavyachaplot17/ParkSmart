const express = require('express');

const router = express.Router();
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const { auth } = require('../middleware/auth');

const DEFAULT_RADIUS = 1500;
const DEFAULT_CITY = 'Jaipur';
const EXTERNAL_CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const createLocation = (id, name, label, lat, lng, type, aliases = []) => ({
  id,
  name,
  label,
  lat,
  lng,
  type,
  aliases,
  source: 'parksmart-local'
});

const CURATED_LOCATIONS = [
  createLocation('loc-mi-road', 'MI Road', 'MI Road, Jaipur, Rajasthan, India', 26.9124, 75.7873, 'road', ['m i road', 'mirza ismail road']),
  createLocation('loc-hawa-mahal', 'Hawa Mahal', 'Hawa Mahal, Jaipur, Rajasthan, India', 26.9239, 75.8267, 'landmark', ['hawa mahal palace']),
  createLocation('loc-vaishali-nagar', 'Vaishali Nagar', 'Vaishali Nagar, Jaipur, Rajasthan, India', 26.9115, 75.7442, 'area', ['vaishali']),
  createLocation('loc-ajmeri-gate', 'Ajmeri Gate', 'Ajmeri Gate, Jaipur, Rajasthan, India', 26.9154, 75.8011, 'landmark', ['ajmeri']),
  createLocation('loc-amer-road', 'Amer Road', 'Amer Road, Jaipur, Rajasthan, India', 26.9302, 75.8404, 'road', ['amber road']),
  createLocation('loc-sindhi-camp', 'Sindhi Camp', 'Sindhi Camp, Jaipur, Rajasthan, India', 26.9228, 75.7996, 'area', ['sindhi camp bus stand']),
  createLocation('loc-cscheme', 'C-Scheme', 'C-Scheme, Jaipur, Rajasthan, India', 26.9077, 75.7906, 'area', ['c scheme', 'c-scheme']),
  createLocation('loc-mansarovar', 'Mansarovar', 'Mansarovar, Jaipur, Rajasthan, India', 26.8561, 75.7658, 'area'),
  createLocation('loc-malviya-nagar', 'Malviya Nagar', 'Malviya Nagar, Jaipur, Rajasthan, India', 26.8467, 75.8133, 'area', ['malviya']),
  createLocation('loc-raja-park', 'Raja Park', 'Raja Park, Jaipur, Rajasthan, India', 26.8986, 75.8260, 'area', ['rajapark']),
  createLocation('loc-jagatpura', 'Jagatpura', 'Jagatpura, Jaipur, Rajasthan, India', 26.8398, 75.8472, 'area'),
  createLocation('loc-tonk-road', 'Tonk Road', 'Tonk Road, Jaipur, Rajasthan, India', 26.8525, 75.8045, 'road'),
  createLocation('loc-bapu-nagar', 'Bapu Nagar', 'Bapu Nagar, Jaipur, Rajasthan, India', 26.8921, 75.8156, 'area'),
  createLocation('loc-bani-park', 'Bani Park', 'Bani Park, Jaipur, Rajasthan, India', 26.9309, 75.7905, 'area'),
  createLocation('loc-vidhyadhar-nagar', 'Vidhyadhar Nagar', 'Vidhyadhar Nagar, Jaipur, Rajasthan, India', 26.9553, 75.7788, 'area', ['vidhyadhar nagar', 'vidhyadhar']),
  createLocation('loc-jhotwara', 'Jhotwara', 'Jhotwara, Jaipur, Rajasthan, India', 26.9559, 75.7412, 'area'),
  createLocation('loc-amber-fort', 'Amber Fort', 'Amber Fort, Jaipur, Rajasthan, India', 26.9855, 75.8513, 'landmark', ['amer fort', 'amber fort']),
  createLocation('loc-jal-mahal', 'Jal Mahal', 'Jal Mahal, Jaipur, Rajasthan, India', 26.9536, 75.8468, 'landmark'),
  createLocation('loc-birla-mandir', 'Birla Mandir', 'Birla Mandir, Jaipur, Rajasthan, India', 26.8922, 75.8150, 'landmark'),
  createLocation('loc-albert-hall', 'Albert Hall Museum', 'Albert Hall Museum, Jaipur, Rajasthan, India', 26.9128, 75.8191, 'landmark', ['albert hall']),
  createLocation('loc-jaipur-junction', 'Jaipur Junction', 'Jaipur Junction Railway Station, Jaipur, Rajasthan, India', 26.9196, 75.7881, 'transit', ['railway station', 'jaipur station']),
  createLocation('loc-world-trade-park', 'World Trade Park', 'World Trade Park, Jaipur, Rajasthan, India', 26.8519, 75.8057, 'landmark', ['wtp']),
  createLocation('loc-gopalpura', 'Gopalpura', 'Gopalpura, Jaipur, Rajasthan, India', 26.8735, 75.7802, 'area', ['gopalpura bypass']),
  createLocation('loc-shyam-nagar', 'Shyam Nagar', 'Shyam Nagar, Jaipur, Rajasthan, India', 26.8899, 75.7605, 'area'),
  createLocation('loc-durgapura', 'Durgapura', 'Durgapura, Jaipur, Rajasthan, India', 26.8558, 75.7976, 'area'),
  createLocation('loc-chitrakoot', 'Chitrakoot', 'Chitrakoot, Jaipur, Rajasthan, India', 26.9096, 75.7187, 'area'),
  createLocation('loc-kukas', 'Kukas', 'Kukas, Jaipur, Rajasthan, India', 27.0326, 75.8861, 'area')
];

const CURATED_PUBLIC_PARKING = [
  {
    _id: 'public-mi-road-plaza',
    name: 'MI Road Public Parking Plaza',
    location: 'Near Ajmeri Gate, MI Road, Jaipur',
    city: 'Jaipur',
    coordinates: { lat: 26.9132, lng: 75.7901 },
    amenities: ['Public Parking', 'Covered'],
    capacity: 120,
    openingHours: '24/7',
    operator: 'Jaipur Smart Mobility',
    mapUrl: 'https://www.openstreetmap.org',
    source: 'parksmart-local',
    external: true,
    bookingEnabled: false,
    availabilityStatus: 'estimated',
    totalSlots: 120,
    availableSlots: null,
    occupiedSlots: null,
    occupancyPercent: null,
    pricePerHour: 0
  },
  {
    _id: 'public-hawa-mahal-deck',
    name: 'Hawa Mahal Visitor Parking',
    location: 'Badi Chopad, Jaipur',
    city: 'Jaipur',
    coordinates: { lat: 26.9244, lng: 75.8282 },
    amenities: ['Public Parking', 'Tourist Access'],
    capacity: 80,
    openingHours: '8:00-22:00',
    operator: 'Tourism Parking Zone',
    mapUrl: 'https://www.openstreetmap.org',
    source: 'parksmart-local',
    external: true,
    bookingEnabled: false,
    availabilityStatus: 'estimated',
    totalSlots: 80,
    availableSlots: null,
    occupiedSlots: null,
    occupancyPercent: null,
    pricePerHour: 0
  },
  {
    _id: 'public-vaishali-complex',
    name: 'Vaishali Nagar Public Parking',
    location: 'Amrapali Circle, Vaishali Nagar, Jaipur',
    city: 'Jaipur',
    coordinates: { lat: 26.9121, lng: 75.7428 },
    amenities: ['Public Parking', 'Open Lot'],
    capacity: 95,
    openingHours: '24/7',
    operator: 'City Parking Services',
    mapUrl: 'https://www.openstreetmap.org',
    source: 'parksmart-local',
    external: true,
    bookingEnabled: false,
    availabilityStatus: 'estimated',
    totalSlots: 95,
    availableSlots: null,
    occupiedSlots: null,
    occupancyPercent: null,
    pricePerHour: 0
  },
  {
    _id: 'public-amer-road',
    name: 'Amer Road Street Parking Hub',
    location: 'Amer Road, Jaipur',
    city: 'Jaipur',
    coordinates: { lat: 26.9294, lng: 75.8388 },
    amenities: ['Public Parking', 'Bus Access'],
    capacity: 60,
    openingHours: '7:00-23:00',
    operator: 'Heritage Parking Zone',
    mapUrl: 'https://www.openstreetmap.org',
    source: 'parksmart-local',
    external: true,
    bookingEnabled: false,
    availabilityStatus: 'estimated',
    totalSlots: 60,
    availableSlots: null,
    occupiedSlots: null,
    occupancyPercent: null,
    pricePerHour: 0
  },
  {
    _id: 'public-sindhi-camp',
    name: 'Sindhi Camp Transit Parking',
    location: 'Sindhi Camp Bus Stand, Jaipur',
    city: 'Jaipur',
    coordinates: { lat: 26.9233, lng: 75.7981 },
    amenities: ['Public Parking', 'Transit Hub'],
    capacity: 75,
    openingHours: '24/7',
    operator: 'Transit Parking Services',
    mapUrl: 'https://www.openstreetmap.org',
    source: 'parksmart-local',
    external: true,
    bookingEnabled: false,
    availabilityStatus: 'estimated',
    totalSlots: 75,
    availableSlots: null,
    occupiedSlots: null,
    occupancyPercent: null,
    pricePerHour: 0
  },
  {
    _id: 'public-mansarovar-hub',
    name: 'Mansarovar Sector Parking',
    location: 'Mansarovar Metro Corridor, Jaipur',
    city: 'Jaipur',
    coordinates: { lat: 26.8568, lng: 75.7691 },
    amenities: ['Public Parking', 'Metro Access'],
    capacity: 110,
    openingHours: '6:00-23:00',
    operator: 'Metro Parking Services',
    mapUrl: 'https://www.openstreetmap.org',
    source: 'parksmart-local',
    external: true,
    bookingEnabled: false,
    availabilityStatus: 'estimated',
    totalSlots: 110,
    availableSlots: null,
    occupiedSlots: null,
    occupancyPercent: null,
    pricePerHour: 0
  },
  {
    _id: 'public-malviya-nagar',
    name: 'Malviya Nagar Market Parking',
    location: 'Malviya Nagar, Jaipur',
    city: 'Jaipur',
    coordinates: { lat: 26.8479, lng: 75.8126 },
    amenities: ['Public Parking', 'Market Access'],
    capacity: 70,
    openingHours: '8:00-22:30',
    operator: 'Local Market Parking',
    mapUrl: 'https://www.openstreetmap.org',
    source: 'parksmart-local',
    external: true,
    bookingEnabled: false,
    availabilityStatus: 'estimated',
    totalSlots: 70,
    availableSlots: null,
    occupiedSlots: null,
    occupancyPercent: null,
    pricePerHour: 0
  },
  {
    _id: 'public-raja-park',
    name: 'Raja Park Public Parking',
    location: 'Raja Park Main Road, Jaipur',
    city: 'Jaipur',
    coordinates: { lat: 26.8993, lng: 75.8252 },
    amenities: ['Public Parking', 'Street Access'],
    capacity: 55,
    openingHours: '7:00-23:00',
    operator: 'City Parking Services',
    mapUrl: 'https://www.openstreetmap.org',
    source: 'parksmart-local',
    external: true,
    bookingEnabled: false,
    availabilityStatus: 'estimated',
    totalSlots: 55,
    availableSlots: null,
    occupiedSlots: null,
    occupancyPercent: null,
    pricePerHour: 0
  }
];

const getCache = (key) => {
  const cached = EXTERNAL_CACHE.get(key);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    EXTERNAL_CACHE.delete(key);
    return null;
  }

  return cached.value;
};

const setCache = (key, value) => {
  EXTERNAL_CACHE.set(key, {
    value,
    timestamp: Date.now()
  });
};

const getRequestHeaders = () => ({
  'User-Agent': process.env.APP_USER_AGENT || 'ParkSmart/1.0 (smart parking student project)',
  Accept: 'application/json'
});

const buildLocationText = (tags = {}) => {
  const parts = [
    tags['addr:housename'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:state']
  ].filter(Boolean);

  return parts.join(', ');
};

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizePublicParking = (element) => {
  const latitude = toNumber(element.lat ?? element.center?.lat);
  const longitude = toNumber(element.lon ?? element.center?.lon);

  if (latitude === null || longitude === null) {
    return null;
  }

  const tags = element.tags || {};
  const capacity = Number.parseInt(tags.capacity, 10);
  const location = buildLocationText(tags);

  return {
    _id: `osm-${element.type}-${element.id}`,
    name: tags.name || 'Public Parking',
    location: location || 'Location details from OpenStreetMap',
    city: tags['addr:city'] || DEFAULT_CITY,
    totalSlots: Number.isFinite(capacity) ? capacity : 0,
    availableSlots: null,
    occupiedSlots: null,
    occupancyPercent: null,
    pricePerHour: 0,
    coordinates: {
      lat: latitude,
      lng: longitude
    },
    amenities: ['Public Parking', tags.access ? `Access: ${tags.access}` : null, tags.supervised === 'yes' ? 'Supervised' : null].filter(Boolean),
    source: 'openstreetmap',
    external: true,
    bookingEnabled: false,
    availabilityStatus: 'unknown',
    capacity: Number.isFinite(capacity) ? capacity : null,
    openingHours: tags.opening_hours || null,
    operator: tags.operator || null,
    osmType: element.type,
    osmId: element.id,
    mapUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`
  };
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`External API failed with status ${response.status}`);
  }

  return response.json();
};

const normalizeText = (value) => (value || '').toLowerCase().trim().replace(/\s+/g, ' ');

const scoreTextMatch = (text, search) => {
  if (!text || !search) {
    return 0;
  }

  const normalizedText = normalizeText(text);

  if (normalizedText === search) {
    return 120;
  }

  if (normalizedText.startsWith(search)) {
    return 90;
  }

  if (normalizedText.includes(` ${search}`)) {
    return 70;
  }

  if (normalizedText.includes(search)) {
    return 50;
  }

  const searchParts = search.split(' ');
  const matchedParts = searchParts.filter((part) => normalizedText.includes(part));

  if (matchedParts.length === searchParts.length) {
    return 35;
  }

  return 0;
};

const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getCuratedLocationMatches = (query) => {
  const search = normalizeText(query);

  return CURATED_LOCATIONS
    .map((location) => {
      const aliasScore = location.aliases.length
        ? Math.max(...location.aliases.map((alias) => scoreTextMatch(alias, search)))
        : 0;
      const score = Math.max(
        scoreTextMatch(location.name, search),
        scoreTextMatch(location.label, search),
        aliasScore
      );

      return score > 0 ? { ...location, score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 10)
    .map(({ score, ...location }) => location);
};

const getCuratedPublicParking = (lat, lng, radius) => CURATED_PUBLIC_PARKING.filter((lot) =>
  getDistanceMeters(lat, lng, lot.coordinates.lat, lot.coordinates.lng) <= radius
);

const mergeUniqueById = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = item?._id || item?.id;
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

router.get('/location-search', async (req, res) => {
  const query = req.query.q?.trim();

  if (!query || query.length < 2) {
    return res.json([]);
  }

  try {
    const cacheKey = `location:${query.toLowerCase()}`;
    const cached = getCache(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const curated = getCuratedLocationMatches(query);
    let external = [];

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('q', query);
      url.searchParams.set('countrycodes', 'in');
      url.searchParams.set('limit', '8');
      url.searchParams.set('addressdetails', '1');

      const results = await fetchJson(url.toString(), {
        headers: getRequestHeaders()
      });

      external = results.map((item) => ({
        id: String(item.place_id),
        name: item.name || item.display_name?.split(',')[0] || query,
        label: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
        type: item.type,
        source: 'nominatim'
      }));
    } catch (err) {
      external = [];
    }

    const merged = mergeUniqueById([...curated, ...external]).slice(0, 12);
    setCache(cacheKey, merged);
    res.json(merged);
  } catch (err) {
    res.json(getCuratedLocationMatches(query));
  }
});

router.get('/public-nearby', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Math.min(Number(req.query.radius) || DEFAULT_RADIUS, 5000);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'Valid lat and lng are required' });
    }

    const cacheKey = `public:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
    const cached = getCache(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const curated = getCuratedPublicParking(lat, lng, radius);
    let external = [];

    try {
      const overpassQuery = `
[out:json][timeout:25];
(
  node["amenity"="parking"](around:${radius},${lat},${lng});
  way["amenity"="parking"](around:${radius},${lat},${lng});
  relation["amenity"="parking"](around:${radius},${lat},${lng});
);
out center tags;
`.trim();

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          ...getRequestHeaders(),
          'Content-Type': 'text/plain'
        },
        body: overpassQuery
      });

      if (response.ok) {
        const data = await response.json();
        external = (data.elements || []).map(normalizePublicParking).filter(Boolean);
      }
    } catch (err) {
      external = [];
    }

    const merged = mergeUniqueById([...curated, ...external]).slice(0, 20);
    setCache(cacheKey, merged);
    res.json(merged);
  } catch (err) {
    res.json([]);
  }
});

router.get('/lots', async (req, res) => {
  try {
    const { city, search } = req.query;
    const query = {};

    if (city) {
      query.city = city;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const lots = await ParkingLot.find(query);

    const lotsWithAvailability = await Promise.all(lots.map(async (lot) => {
      const availableSlots = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'available' });
      const occupiedSlots = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'occupied' });

      return {
        ...lot.toObject(),
        availableSlots,
        occupiedSlots,
        occupancyPercent: Math.round((occupiedSlots / lot.totalSlots) * 100),
        source: 'parksmart',
        external: false,
        bookingEnabled: true
      };
    }));

    res.json(lotsWithAvailability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/lots/:id', async (req, res) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);

    if (!lot) {
      return res.status(404).json({ message: 'Lot not found' });
    }

    const availableSlots = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'available' });
    const occupiedSlots = await ParkingSlot.countDocuments({ lotId: lot._id, status: 'occupied' });

    res.json({
      ...lot.toObject(),
      availableSlots,
      occupiedSlots,
      occupancyPercent: Math.round((occupiedSlots / lot.totalSlots) * 100),
      source: 'parksmart',
      external: false,
      bookingEnabled: true
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/lots/:id/slots', async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ lotId: req.params.id }).sort({ floor: 1, slotNumber: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/slots/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const slot = await ParkingSlot.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
