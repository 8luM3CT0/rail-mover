"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

// helpers
const isFiniteNum = (n) => typeof n === "number" && Number.isFinite(n);
const inLat = (x) => isFiniteNum(x) && x >= -90 && x <= 90;
const inLng = (x) => isFiniteNum(x) && x >= -180 && x <= 180;

const toNum = (v) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const s = v.trim().replace(/[^\d.\-]/g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
};

const km = ([lat1, lng1], [lat2, lng2]) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const la1 = lat1 * Math.PI / 180;
  const la2 = lat2 * Math.PI / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
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

const GeoTraceMap = dynamic(() => import("../eazemo-map/GeoTraceMap"), { ssr: false });

export default function MapForGeoTrace({
  destStation,           // REQUIRED: { id, name/stationName, city, lineId, lat, lng }
  lines = {},
  allCoords = [],
  onClose,
}) {
  const [loc, setLoc] = useState(null);            // { lat, lng, accuracy, ts }
  const [locErr, setLocErr] = useState("");
  const [watching, setWatching] = useState(false);

  const [routeCoords, setRouteCoords] = useState([]);
  const [focusPoint, setFocusPoint] = useState(null);
  const [busy, setBusy] = useState(false);

  // internal gates
  const lastRouteAtRef = useRef(0);
  const lastOriginRef = useRef(null);

  const dest = useMemo(() => {
    if (!destStation) return null;
    const lat = toNum(destStation.lat ?? destStation.stationLat);
    const lng = toNum(destStation.lng ?? destStation.stationLng);
    if (!inLat(lat) || !inLng(lng)) return null;
    return {
      id: destStation.id,
      name: destStation.name || destStation.stationName || "Destination",
      city: destStation.city || destStation.stationCity || "",
      lineId: String(destStation.lineId || "").toLowerCase(),
      lat,
      lng,
    };
  }, [destStation]);

  // start geolocation watch
  useEffect(() => {
    if (!dest) return;

    if (typeof window === "undefined") return;
    if (!("geolocation" in navigator)) {
      setLocErr("Geolocation not supported on this device/browser.");
      return;
    }

    setLocErr("");
    setWatching(true);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = toNum(pos.coords.latitude);
        const lng = toNum(pos.coords.longitude);
        if (!inLat(lat) || !inLng(lng)) return;

        setLoc({
          lat,
          lng,
          accuracy: pos.coords.accuracy,
          ts: Date.now(),
        });
      },
      (err) => {
        setLocErr(err?.message || "Location permission denied.");
        setWatching(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 15_000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(id);
      setWatching(false);
    };
  }, [dest]);

  // recompute route when user moves enough OR enough time passed
  useEffect(() => {
    if (!dest || !loc) return;

    const origin = [loc.lat, loc.lng];
    const destination = [dest.lat, dest.lng];

    // throttle: min 4s between OSRM calls
    const now = Date.now();
    if (now - lastRouteAtRef.current < 4000) return;

    // distance gate: recompute only if moved >= 0.05 km (50m)
    const prev = lastOriginRef.current;
    if (prev && km(prev, origin) < 0.05) return;

    lastRouteAtRef.current = now;
    lastOriginRef.current = origin;

    let cancelled = false;

    (async () => {
      setBusy(true);
      try {
        const path = await osrmRoute(origin, destination);
        if (cancelled) return;
        setRouteCoords(path);
        setFocusPoint(null); // Fit to route
      } catch (e) {
        if (!cancelled) setRouteCoords([]);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dest, loc]);

  // focus destination on mount
  useEffect(() => {
    if (!dest) return;
    setFocusPoint({ lat: dest.lat, lng: dest.lng, name: dest.name });
  }, [dest]);

  const etaText = useMemo(() => {
    if (!loc || !dest) return "—";
    const d = km([loc.lat, loc.lng], [dest.lat, dest.lng]);
    return `${d.toFixed(2)} km`;
  }, [loc, dest]);

  return (
    <div className="h-full w-full flex flex-col items-center">
      {/* TOP: MAP 55% */}
      <div className="h-[55%] w-full px-2 bg-slate-900 bg-opacity-[0.4]">
        <GeoTraceMap
          routeCoords={routeCoords}
          focusPoint={focusPoint}
          allCoords={allCoords}
          lines={lines}
          // INSERTED: user position + destination marker support (see TraceMap changes below)
          userPoint={loc ? { lat: loc.lat, lng: loc.lng } : null}
          destPoint={dest ? { lat: dest.lat, lng: dest.lng, name: dest.name } : null}
        />
      </div>

      {/* BOTTOM: INFO 45% */}
      <div className="h-[45%] w-full px-2 bg-slate-950 bg-opacity-[0.55]">
        <div className="h-full w-full rounded-t-3xl border border-slate-700 bg-slate-900/60 overflow-hidden">
          <div className="w-full flex justify-center pt-2">
            <div className="h-1.5 w-14 rounded-full bg-slate-500/60" />
          </div>

          <div className="px-4 pt-3 pb-2 flex items-start justify-between">
            <div>
              <div className="text-slate-100 font-stack-head font-bold text-lg">
                Geo-Trace
              </div>
              <div className="text-slate-400 text-[11px]">
                Real-time route from your location to selected station.
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-600 text-slate-200"
            >
              Close
            </button>
          </div>

          <div className="px-4 space-y-3">
            <div className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3">
              <div className="text-[10px] text-slate-400 font-stack-head">DESTINATION</div>
              <div className="text-slate-100 font-stack-head font-semibold text-sm">
                {dest ? `${dest.name}` : "No destination"}
              </div>
              <div className="text-[11px] text-slate-400">
                {dest ? `${dest.city || "—"} • ${dest.lineId.toUpperCase()}` : "—"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3">
                <div className="text-[10px] text-slate-400 font-stack-head">STATUS</div>
                <div className="text-slate-100 font-stack-head font-semibold text-sm">
                  {locErr ? "Blocked" : watching ? "Tracking" : "Idle"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {busy ? "Updating route…" : routeCoords.length ? "Route ready" : "—"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3">
                <div className="text-[10px] text-slate-400 font-stack-head">DISTANCE</div>
                <div className="text-slate-100 font-stack-head font-semibold text-sm">
                  {etaText}
                </div>
                <div className="text-[11px] text-slate-400">
                  {loc ? `Accuracy ~ ${Math.round(loc.accuracy)}m` : "No GPS fix"}
                </div>
              </div>
            </div>

            {locErr && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-3 text-[11px] text-red-200">
                {locErr}
              </div>
            )}

            <div className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3">
              <div className="text-[10px] text-slate-400 font-stack-head">NOTES</div>
              <div className="text-[11px] text-slate-300">
                Route refresh is throttled and only re-runs when you move ~50m or more.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
