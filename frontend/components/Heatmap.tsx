'use client';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function Heatmap({ data }: { data: any[] }) {
  const hotspots: Record<string, any> = {};
  data.forEach((c) => {
    const { lat, lng, district, boothNumber } = c.location || {};
    if (typeof lat !== 'number' || typeof lng !== 'number') return; // skip complaints without coordinates
    const key = `${district}|${boothNumber}`;
    if (!hotspots[key]) hotspots[key] = { lat, lng, district, boothNumber, count: 0, open: 0 };
    hotspots[key].count += 1;
    if (!['resolved', 'rejected'].includes(c.status)) hotspots[key].open += 1;
  });

  const spots = Object.values(hotspots);
  const color = (n: number) => (n >= 5 ? '#ef4444' : n >= 3 ? '#f97316' : '#3b82f6');

  return (
    <div className="relative h-full w-full">
      <MapContainer center={[10.9, 78.4]} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {spots.map((s: any) => (
          <CircleMarker
            key={`${s.district}|${s.boothNumber}`}
            center={[s.lat, s.lng]}
            radius={8 + s.count * 4}
            pathOptions={{ color: color(s.count), fillColor: color(s.count), fillOpacity: 0.55, weight: 1 }}
          >
            <Popup>
              <div>
                <strong>{s.boothNumber}</strong>
                <div>{s.district}</div>
                <div>Complaints: {s.count} (open: {s.open})</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 text-slate-800 text-xs rounded-xl px-3 py-2 shadow">
        <div><span style={{ color: '#3b82f6' }}>●</span> 1-2 complaints</div>
        <div><span style={{ color: '#f97316' }}>●</span> 3-4 complaints</div>
        <div><span style={{ color: '#ef4444' }}>●</span> 5+ complaints</div>
      </div>
    </div>
  );
}