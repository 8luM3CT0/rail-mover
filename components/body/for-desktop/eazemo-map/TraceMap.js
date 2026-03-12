// components/EazeMoMap.jsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const LINE_COLOR = { lrt1:"#16a34a", lrt2:"#2563eb", mrt3:"#c026d3" };


const isFiniteNum = (n) => typeof n === "number" && Number.isFinite(n)
const inLat = (x) => isFiniteNum(x) && x >= -90 && x <= 90
const inLng = (x) => isFiniteNum(x) && x >= -180 && x <= 180

function centerOf(coords) {
  if (!Array.isArray(coords) || coords.length === 0) return [14.5760, 121.0242];
  const lats = coords.map(c => Number(c?.[0])).filter(isFiniteNum);
  const lngs = coords.map(c => Number(c?.[1])).filter(isFiniteNum);
  if (!lats.length || !lngs.length) return [14.5760, 121.0242];
  const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  return (inLat(lat) && inLng(lng)) ? [lat, lng] : [14.5760, 121.0242];
}

function cleanRouteCoords(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const p of arr) {
    const lat = Number(p?.[0]), lng = Number(p?.[1]);
    if (inLat(lat) && inLng(lng)) out.push([lat, lng]);
  }
  return out;
}


export default function TraceMap({ routeCoords=[], endpoints=null, focusPoint=null, allCoords=[], lines={} }) {
  const [RL, setRL] = useState(null);
  useEffect(() => { let c=false; import("react-leaflet").then(m=>!c&&setRL(m)); return ()=>{c=true}; }, []);

  const safeRoute = useMemo(() => cleanRouteCoords(routeCoords),[routeCoords])
  const mapCenter = useMemo(() => centerOf(allCoords.length ? allCoords : safeRoute), [allCoords, safeRoute]);
  const safeCenter = useMemo(
  () => (inLat(mapCenter?.[0]) && inLng(mapCenter?.[1])) ? mapCenter : [14.5760, 121.0242],
  [mapCenter]
);

useEffect(() => {
    let cancelled = false;

    (async () => {
      const leaflet = await import("leaflet"); // CLIENT ONLY
      const L = leaflet.default || leaflet;

      // Fix Leaflet marker paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x?.src || markerIcon2x,
        iconUrl: markerIcon?.src || markerIcon,
        shadowUrl: markerShadow?.src || markerShadow,
      });

      const rl = await import("react-leaflet");
      if (!cancelled) setRL(rl);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!RL) return <div className="h-full w-full grid place-items-center font-montserr font-bold text-sm text-slate-800">Loading map…</div>;
  const { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } = RL;

  function Fit() {
  const map = useMap();
  useEffect(() => {
    if (focusPoint && inLat(focusPoint?.lat) && inLng(focusPoint?.lng)) {
      map.flyTo([focusPoint?.lat, focusPoint?.lng], 16, { duration: 0.8 }); return;
    }
    if (safeRoute.length > 1) { map.fitBounds(safeRoute, { padding: [24,24] }); return; }
    if (allCoords.length > 1) { map.fitBounds(allCoords, { padding: [24,24] }); return; }
    map.setView(safeCenter, 12);
  }, [map, focusPoint, safeRoute, allCoords, safeCenter]);
  return null;
}

// --- ONLY-LRT2 FIX HELPERS (bounds + swap + sorting) ---
  const inLatMM = (x) => isFiniteNum(x) && x >= 14.50 && x <= 14.75;
  const inLngMM = (x) => isFiniteNum(x) && x >= 120.90 && x <= 121.20;
  const toNum = (v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const s = v.trim().replace(/[^\d.\-]/g, "").replace(",", ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  };
  async function osrmRoute([olat, olng], [dlat, dlng]) {
  const url = `https://router.project-osrm.org/route/v1/driving/${Number(olng)},${Number(
    olat
  )};${Number(dlng)},${Number(dlat)}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("routing_failed");
  const json = await res.json();
  const coords = json?.routes?.[0]?.geometry?.coordinates || [];

  // [lng,lat] -> [lat,lng]
  return coords
    .map(([lng, lat]) => [toNum(lat), toNum(lng)])
    .filter(([la, ln]) => inLat(la) && inLng(ln));
}
  function fixLatLng(rawLat, rawLng) {
    let lat = toNum(rawLat);
    let lng = toNum(rawLng);
    const latOK = inLatMM(lat), lngOK = inLngMM(lng);
    const rLatOK = inLatMM(lng), rLngOK = inLngMM(lat);
    if ((!latOK || !lngOK) && rLatOK && rLngOK) [lat, lng] = [lng, lat];
    if (!inLatMM(lat) || !inLngMM(lng)) return null;
    return { lat, lng };
  }

  return (
    <div className="h-[85%] lg:w-[75%] w-full m-auto">
          <MapContainer center={safeCenter} zoom={12.15} className="h-full w-full z-0">
      <Fit />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap & CARTO' />

      {/* Render each line (from Firestore) */}
       {Object.entries(lines || {}).map(([lineId, stops]) => {
    let coords = (stops || [])
    .map(s => [Number(s?.lat), Number(s?.lng)])
    .filter(([la,ln]) => inLat(la) && inLng(ln));

    let markerStops = stops;

    if(lineId === "lrt2"){
       const cleaned = (stops || [])
              .map(s => {
                const pos = fixLatLng(s?.stationLat ?? s?.lat, s?.stationLng ?? s?.lng);
                if (!pos) return null;
                return { ...s, lat: pos.lat, lng: pos.lng };
              })
              .filter(Boolean)
              .sort((a, b) => a.lng - b.lng); // Recto → Masinag

            coords = cleaned.map(s => [s.lat, s.lng]);
            markerStops = cleaned;
    }

    if (coords.length === 0) return null;
    const color = LINE_COLOR[lineId] || "#22c55e";
    return (
      <React.Fragment key={lineId}>
        <Polyline positions={coords} pathOptions={{ color, weight: 10, opacity: 0.25 }} />
        <Polyline positions={coords} pathOptions={{ color, weight: 4,  opacity: 0.95 }} />
        {markerStops.map(s => {
          const lat = Number(s?.lat), lng = Number(s?.lng);
          if (!inLat(lat) || !inLng(lng)) return null;
          return (
            <Marker key={s?.id || `${lineId} - ${s?.stationName}-${lat}`} position={[lat, lng]}>
              <Tooltip>{s?.stationName}{s?.stationCity ? ` • ${s.stationCity}` : ""}</Tooltip>
            </Marker>
          );
        })}
      </React.Fragment>
    );
  })}

      {/* Optional: active traced route overlay */}
       {safeRoute.length > 1 && (
    <>
      <Polyline positions={safeRoute} pathOptions={{ color: "#00ffd5", weight: 10, opacity: 0.25 }} />
      <Polyline positions={safeRoute} pathOptions={{ color: "#00ffd5", weight: 4,  opacity: 0.95 }} />
    </>
  )}


  {endpoints?.from && inLat(Number(endpoints?.from?.lat)) && inLng(Number(endpoints?.from?.lng)) && (
    <Marker position={[Number(endpoints?.from?.lat), Number(endpoints?.from?.lng)]}>
      <Tooltip>From: {endpoints?.from?.stationName}</Tooltip>
    </Marker>
  )}
  {endpoints?.to && inLat(Number(endpoints?.to?.lat)) && inLng(Number(endpoints?.to?.lng)) && (
    <Marker position={[Number(endpoints?.to?.lat), Number(endpoints?.to?.lng)]}>
      <Tooltip>To: {endpoints?.to?.stationName}</Tooltip>
    </Marker>
  )}
    </MapContainer>
    </div>
  );
}
