import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { toast } from 'react-toastify';
import L from 'leaflet';
import io from 'socket.io-client';
import api from '../utils/api';
import { formatCurrency, getDynamicPrice } from '../utils/pricing';
import { useAuth } from '../context/AuthContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

const localIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const publicIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const JAIPUR_CENTER = [26.9124, 75.7873];
const QUICK_LOCATIONS = ['MI Road', 'Hawa Mahal', 'Vaishali Nagar', 'Malviya Nagar', 'Mansarovar', 'C-Scheme'];
const FALLBACK_LOCATIONS = [
  { id: 'fb-mi-road', name: 'MI Road', label: 'MI Road, Jaipur, Rajasthan, India', lat: 26.9124, lng: 75.7873 },
  { id: 'fb-hawa-mahal', name: 'Hawa Mahal', label: 'Hawa Mahal, Jaipur, Rajasthan, India', lat: 26.9239, lng: 75.8267 },
  { id: 'fb-vaishali', name: 'Vaishali Nagar', label: 'Vaishali Nagar, Jaipur, Rajasthan, India', lat: 26.9115, lng: 75.7442 },
  { id: 'fb-malviya', name: 'Malviya Nagar', label: 'Malviya Nagar, Jaipur, Rajasthan, India', lat: 26.8467, lng: 75.8133 },
  { id: 'fb-mansarovar', name: 'Mansarovar', label: 'Mansarovar, Jaipur, Rajasthan, India', lat: 26.8561, lng: 75.7658 },
  { id: 'fb-cscheme', name: 'C-Scheme', label: 'C-Scheme, Jaipur, Rajasthan, India', lat: 26.9077, lng: 75.7906 },
  { id: 'fb-raja-park', name: 'Raja Park', label: 'Raja Park, Jaipur, Rajasthan, India', lat: 26.8986, lng: 75.8260 },
  { id: 'fb-jagatpura', name: 'Jagatpura', label: 'Jagatpura, Jaipur, Rajasthan, India', lat: 26.8398, lng: 75.8472 },
  { id: 'fb-amer-road', name: 'Amer Road', label: 'Amer Road, Jaipur, Rajasthan, India', lat: 26.9302, lng: 75.8404 },
  { id: 'fb-wtp', name: 'World Trade Park', label: 'World Trade Park, Jaipur, Rajasthan, India', lat: 26.8519, lng: 75.8057 }
];

const getFallbackSuggestions = (query) => {
  const term = query.trim().toLowerCase();

  if (term.length < 2) {
    return [];
  }

  return FALLBACK_LOCATIONS.filter((location) =>
    location.name.toLowerCase().includes(term) || location.label.toLowerCase().includes(term)
  ).slice(0, 8);
};

export default function Dashboard() {
  const [lots, setLots] = useState([]);
  const [publicLots, setPublicLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const [loadingPublicLots, setLoadingPublicLots] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [occupancyData, setOccupancyData] = useState({});
  const [mapCenter, setMapCenter] = useState(JAIPUR_CENTER);
  const [mapZoom, setMapZoom] = useState(13);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const { user } = useAuth();
  const currentHour = new Date().getHours();

  useEffect(() => {
    fetchLots();
    const socket = io('http://localhost:5000');
    socket.on('lot-occupancy-update', (data) => {
      setOccupancyData((prev) => ({ ...prev, [data.lotId]: data }));
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const trimmed = search.trim();

    if (trimmed.length < 2 || selectedPlace?.label === search) {
      setSuggestions([]);
      setSearchingLocations(false);
      setActiveSuggestionIndex(-1);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      setSearchingLocations(true);
      const fallbackSuggestions = getFallbackSuggestions(trimmed);

      try {
        const res = await api.get('/parking/location-search', {
          params: { q: trimmed }
        });
        const nextSuggestions = res.data && res.data.length > 0 ? res.data : fallbackSuggestions;
        setSuggestions(nextSuggestions);
        setActiveSuggestionIndex(nextSuggestions.length ? 0 : -1);
      } catch (err) {
        setSuggestions(fallbackSuggestions);
        setActiveSuggestionIndex(fallbackSuggestions.length ? 0 : -1);
      } finally {
        setSearchingLocations(false);
      }
    }, 220);

    return () => clearTimeout(timeoutId);
  }, [search, selectedPlace]);

  const fetchLots = async () => {
    try {
      const res = await api.get('/parking/lots');
      setLots(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load parking lots');
    } finally {
      setLoading(false);
    }
  };

  const resetLocationResults = () => {
    setSelectedPlace(null);
    setPublicLots([]);
    setMapCenter(JAIPUR_CENTER);
    setMapZoom(13);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);

    if (selectedPlace && selectedPlace.label !== value) {
      resetLocationResults();
    }
  };

  const handleLocationPick = async (place) => {
    setSelectedPlace(place);
    setSearch(place.label);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    setLoadingPublicLots(true);
    setMapCenter([place.lat, place.lng]);
    setMapZoom(15);

    try {
      const res = await api.get('/parking/public-nearby', {
        params: {
          lat: place.lat,
          lng: place.lng,
          radius: 2200
        }
      });

      setPublicLots(res.data || []);

      if (!(res.data || []).length) {
        toast.info('No parking data found nearby for that location');
      }
    } catch (err) {
      setPublicLots([]);
      toast.error(err.response?.data?.message || 'Failed to fetch nearby parking data');
    } finally {
      setLoadingPublicLots(false);
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const fallbackSuggestions = getFallbackSuggestions(search);

    if (selectedPlace) {
      await handleLocationPick(selectedPlace);
      return;
    }

    if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
      await handleLocationPick(suggestions[activeSuggestionIndex]);
      return;
    }

    if (suggestions.length > 0) {
      await handleLocationPick(suggestions[0]);
      return;
    }

    if (fallbackSuggestions.length > 0) {
      await handleLocationPick(fallbackSuggestions[0]);
      return;
    }

    if (search.trim().length < 2) {
      toast.info('Type at least 2 characters to search a Jaipur location');
      return;
    }

    toast.info('Try MI Road, Hawa Mahal, Malviya Nagar, Mansarovar, or Raja Park.');
  };

  const handleSearchKeyDown = (event) => {
    if (!suggestions.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    }

    if (event.key === 'Escape') {
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
    }
  };

  const clearSearch = () => {
    setSearch('');
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    resetLocationResults();
  };

  const localFiltered = lots.filter((lot) => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return true;
    }

    return lot.name.toLowerCase().includes(term) || lot.location.toLowerCase().includes(term);
  });

  const displayedLots = publicLots.length > 0 ? [...publicLots, ...localFiltered] : localFiltered;

  const getLotOccupancy = (lot) => {
    if (lot.external) {
      return {
        available: lot.capacity ?? null,
        occupied: null,
        pct: null
      };
    }

    const live = occupancyData[lot._id];
    if (live) {
      return {
        available: live.available,
        occupied: live.occupied,
        pct: live.occupancyPercent
      };
    }

    return {
      available: lot.availableSlots || 0,
      occupied: lot.occupiedSlots || 0,
      pct: lot.occupancyPercent || 0
    };
  };

  const renderCardAction = (lot, isFull) => {
    if (lot.external) {
      return (
        <a href={lot.mapUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <button className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            Open Map
          </button>
        </a>
      );
    }

    return (
      <Link to={`/lot/${lot._id}`}>
        <button className="btn-primary" disabled={isFull} style={{ whiteSpace: 'nowrap' }}>
          {isFull ? 'Full' : 'View Slots'}
        </button>
      </Link>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', paddingTop: '64px' }}>
      <div style={{ padding: '40px 24px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>
          Find Parking, <span style={{ color: 'var(--green)' }}>{user?.name?.split(' ')[0]}</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '16px', marginBottom: '28px' }}>
          Search Jaipur locations with faster suggestions, keyboard navigation, and fallback parking results.
        </p>

        <form onSubmit={handleSearchSubmit} style={{ maxWidth: 760 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '14px',
                pointerEvents: 'none'
              }}>JP</span>
              <input
                className="input"
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search Jaipur locations: MI Road, Raja Park, WTP, Jagatpura"
                style={{ fontSize: '16px', height: '56px', paddingLeft: '48px', paddingRight: search ? '44px' : '16px' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  x
                </button>
              )}
              {(searchingLocations || suggestions.length > 0) && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  background: '#111d35',
                  border: '1px solid var(--navy-border)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  zIndex: 20,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.35)'
                }}>
                  {searchingLocations && (
                    <div style={{ padding: '12px 16px', color: 'var(--text-dim)' }}>Searching locations...</div>
                  )}
                  {!searchingLocations && suggestions.map((place, index) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleLocationPick(place)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        textAlign: 'left',
                        border: 'none',
                        background: index === activeSuggestionIndex ? 'rgba(0, 232, 122, 0.08)' : 'transparent',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        borderBottom: index === suggestions.length - 1 ? 'none' : '1px solid rgba(26,45,74,0.6)'
                      }}
                    >
                      <div style={{ fontWeight: '700', marginBottom: '4px' }}>{place.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{place.label}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-primary" type="submit" style={{ height: '56px', justifyContent: 'center', minWidth: '150px' }}>
              Search Nearby
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
          {QUICK_LOCATIONS.map((location) => (
            <button
              key={location}
              type="button"
              className="btn-ghost"
              onClick={() => setSearch(location)}
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              {location}
            </button>
          ))}
        </div>

        {selectedPlace && (
          <div style={{
            marginTop: '18px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.25)',
            color: '#c7f4ff'
          }}>
            <span style={{ fontWeight: '700' }}>Selected:</span>
            <span>{selectedPlace.label}</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{displayedLots.length} Parking Results</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--green)' }}>
              <span style={{ width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', animation: 'pulse-green 2s infinite' }} />
              ParkSmart + Jaipur fallback
            </div>
          </div>

          {(loading || loadingPublicLots) ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 160 }} />)}
            </div>
          ) : displayedLots.length === 0 ? (
            <div className="card" style={{ color: 'var(--text-dim)' }}>
              No parking data found for this search yet. Try MI Road, Malviya Nagar, Raja Park, Jagatpura, or Amber Fort.
            </div>
          ) : displayedLots.map((lot) => {
            const { available, pct } = getLotOccupancy(lot);
            const pricing = lot.external ? { price: null, label: 'Map Data' } : getDynamicPrice(lot.pricePerHour, currentHour);
            const isFull = lot.external ? false : available === 0;

            return (
              <div key={lot._id} className="card" style={{ marginBottom: '16px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s' }}>
                {!lot.external && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '3px',
                    width: `${pct}%`,
                    background: pct > 80 ? '#ef4444' : pct > 60 ? 'var(--amber)' : 'var(--green)',
                    transition: 'width 1s ease'
                  }} />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{lot.name}</h3>
                      <span className={`badge ${lot.external ? 'badge-blue' : 'badge-green'}`}>
                        {lot.external ? 'Nearby Parking' : 'ParkSmart'}
                      </span>
                      {!lot.external && pricing.label !== 'Normal' && (
                        <span className={`badge ${pricing.label === 'Peak' ? 'badge-red' : 'badge-blue'}`}>
                          {pricing.label}
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '16px' }}>
                      {lot.location}
                    </p>

                    <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--green)', fontFamily: 'JetBrains Mono' }}>
                          {lot.external ? (lot.capacity ?? 'N/A') : available}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {lot.external ? 'Capacity' : 'Available'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'JetBrains Mono' }}>
                          {lot.external ? 'Visible' : `${pct}%`}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {lot.external ? 'Status' : 'Occupied'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                          {lot.external ? 'N/A' : formatCurrency(pricing.price)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {lot.external ? 'Pricing' : 'Per Hour'}
                        </div>
                      </div>
                    </div>

                    {lot.external ? (
                      <div style={{ color: 'var(--text-dim)', fontSize: '13px', lineHeight: 1.6 }}>
                        {lot.openingHours ? `Hours: ${lot.openingHours}. ` : ''}
                        {lot.operator ? `Operator: ${lot.operator}. ` : ''}
                        Nearby parking data is shown from Jaipur fallback and public map sources.
                      </div>
                    ) : lot.amenities && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {lot.amenities.slice(0, 3).map((amenity) => (
                          <span key={amenity} className="badge badge-blue" style={{ fontSize: '11px' }}>{amenity}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginLeft: '16px' }}>
                    {renderCardAction(lot, isFull)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 120px)' }}>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{selectedPlace ? selectedPlace.name : 'Jaipur Map'}</h2>
          </div>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: 'calc(100% - 40px)', width: '100%', borderRadius: '16px', border: '1px solid var(--navy-border)' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            />
            {displayedLots.map((lot) => (
              <Marker
                key={lot._id}
                position={[lot.coordinates.lat, lot.coordinates.lng]}
                icon={lot.external ? publicIcon : localIcon}
              >
                <Popup>
                  <div style={{ fontFamily: 'Outfit, sans-serif', minWidth: 180 }}>
                    <strong>{lot.name}</strong><br />
                    <span style={{ color: '#666', fontSize: '12px' }}>{lot.location}</span><br /><br />
                    {lot.external ? (
                      <span style={{ color: '#0ea5e9' }}>Nearby public parking shown</span>
                    ) : (
                      <span style={{ color: '#00b85e' }}>Available: {getLotOccupancy(lot).available} slots</span>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
