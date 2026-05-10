'use client';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function Heatmap({ data }: { data: any[] }) {
  // Aggregate complaints by location to show intensity
  const hotspots = data.reduce((acc: any, curr: any) => {
    const key = `${curr.location.lat},${curr.location.lng}`;
    if (!acc[key]) {
      acc[key] = { ...curr.location, count: 0 };
    }
    acc[key].count += 1;
    return acc;
  }, {});

  return (
    <MapContainer 
      center={[12.9716, 77.5946]} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {Object.values(hotspots).map((spot: any, idx: number) => (
        <Circle
          key={idx}
          center={[spot.lat, spot.lng]}
          radius={spot.count * 200}
          pathOptions={{
            fillColor: spot.count > 5 ? 'red' : spot.count > 2 ? 'orange' : 'blue',
            color: 'transparent',
            fillOpacity: 0.6
          }}
        >
          <Popup>
            <div className="p-1">
              <h4 className="font-bold text-sm">Booth {spot.boothNumber}</h4>
              <p className="text-xs text-muted">Complaints: {spot.count}</p>
              <p className="text-[10px] uppercase font-bold mt-1 text-primary">{spot.district}</p>
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}
