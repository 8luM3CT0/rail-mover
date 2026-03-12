//front-end
import { MapIcon } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import MapForTrace from '../eazemo-map/MapForTrace'
import TraceMap from '../eazemo-map/TraceMap'
import QRCode from 'react-qr-code'
//back-end
import { creds, store, provider } from '../../../../backend_services/firebase'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { v4 as uuidv4 } from 'uuid'
import dynamic from 'next/dynamic'
import MapForGeoTrace from '../eazemo-map/MapForGeoTrace'

const LS_HISTORY_KEY = "eazemo_travel_history"
const FARE_PRICE = 15; // static fare (PHP 15)

// ----------------- COMPONENT -----------------
function EzPocketSidebarMob({ onFocusStation, onRouteFound, stationsOptions, setStationsOptions }) {

  const MapForTrace = dynamic(() => import("../eazemo-map/MapForTrace"), {
      ssr: false,
      loading: () => <div className="p-4 text-sm font-montserr text-slate-500">
        Loading map...
      </div>
    })
      
  // ---------- helpers (guards + normalization) ----------
  const isFiniteNum = (n) => typeof n === "number" && Number.isFinite(n);
  const toNum = (v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const s = v.replace(/[^\d.\-]/g, "").replace(",", ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  };
  const inLat = (x) => isFiniteNum(x) && x >= -90 && x <= 90;
  const inLng = (x) => isFiniteNum(x) && x >= -180 && x <= 180;

  const km = (a, b) => {
    const [lat1, lon1] = a, [lat2, lon2] = b
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180
    const la1 = lat1 * Math.PI / 180, la2 = lat2 * Math.PI / 180
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(h))
  }

  const normalizeStation = (raw) => {
    const lat = toNum(raw.stationLat);
    const lng = toNum(raw.stationLng);
    const name = String(raw.stationName || "Unknown");
    const city = String(raw.stationCity || "");
    const lineId = String(raw.lineId || "").toLowerCase();
    return { ...raw, lat, lng, name, city, lineId };
  };

  // ------------- state -----------------
  const [user] = useAuthState(creds)
  const [query, setQuery] = useState("")          // search input
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [isUserAnEditor, setIsUserAnEditor] = useState(false)
  const [traceTab, setTraceTab] = useState(true)
  const [historyTab, setHistoryTab] = useState(false)
  const [lrt1Tab, setLrt1Tab] = useState(true)
  const [lrt2Tab, setLrt2Tab] = useState(false)
  const [mrt3Tab, setMrt3Tab] = useState(false)

  // wallet + balance
  const uid = user?.uid
  const userEmail = user?.email
  const walletRef = useMemo(
    () => (userEmail ? store.collection("eazemo_wallets").doc(userEmail) : null),
    [userEmail]
  );
  const [walletSnap, walletLoading, walletError] = useDocument(walletRef);
  const balanceMinor = walletSnap?.data()?.balanceMinor ?? 0;
  const balance = balanceMinor / 100; // PHP

  const signIn = () => {
    creds.signInWithPopup(provider).catch(alert)
  }

  useEffect(() => {
    if (user) {
      store.collection('eazemo_users').doc(user.email).set({
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }, {
        merge: true
      })
    }
  }, [user])

  const checkUserIfEditor = async () => {
    if (user) {
      try {
        const querySnapshot = await store.collection('eazemo_admins')
          .where('adminEmail', '==', user?.email)
          .get()

        const isEditor = querySnapshot?.size > 0
        setIsUserAnEditor(isEditor)
      } catch (error) {
        console.error('Error in checking editor status >>>>', error)
      }
    }
  }

  useEffect(() => {
    checkUserIfEditor()
  }, [user])

  //--------------- Firestore: stations search ---------------
  const baseStationsRef = useMemo(() => store.collection('stationsList'), [])
  const stationQuery = useMemo(() => {
    const qq = query?.trim().toLowerCase()
    try {
      return qq
        ? baseStationsRef?.orderBy("stationNameLower").startAt(qq).endAt(qq + "\uf8ff").limit(15)
        : baseStationsRef?.orderBy("stationNameLower").limit(15)
    } catch {
      return baseStationsRef.limit(15)
    }
  }, [baseStationsRef, query]) // include query

  const [stationsSnap, stationsLoading, stationsError] = useCollection(stationQuery)

  useEffect(() => {
    if (stationsError) console.error("Stations read error >>>>", stationsError)
  }, [stationsError])

  const stations = useMemo(() => {
    if (!stationsSnap) return [];
    return stationsSnap.docs
      .map((d) => ({ id: d?.id, ...d?.data() }))
      .map(normalizeStation)
      .filter((s) => inLat(s?.lat) && inLng(s?.lng) && s?.lineId && s?.name);
  }, [stationsSnap])

  const filteredStations = useMemo(() => {
    const activeLines = []
    if (lrt1Tab) activeLines.push("lrt1")
    if (lrt2Tab) activeLines.push("lrt2")
    if (mrt3Tab) activeLines.push("mrt3")

    if (activeLines.length === 0) return stations
    return stations?.filter(s => activeLines.includes(s?.lineId))
  }, [stations, lrt1Tab, lrt2Tab, mrt3Tab])

  // ---------- Travel history: Firestore read (per user) + local cache fallback ----------
  const historyQuery = useMemo(
    () =>
      store
        .collection("eazemo_users")
        .doc(uid)
        .collection("travelHistory")
        .orderBy("ts", "desc")
        .limit(100),
    [uid]
  );

  const [userTravelHistory, userTravelLoading, userTravelErr] = useCollection(
    uid ? store.collection('eazemo_users').doc(uid).collection('travelHistory') : null
  )

  useEffect(() => {
    if (userTravelErr) console.error("History read error >>>", userTravelErr)
  }, [userTravelErr])

  const [localTravHist, setLocalTravHist] = useState(() => {
    try {
      const raw = localStorage.getItem("eazemo_travel_history")
      return raw ? JSON.parse(raw) : [];
    } catch {
      return []
    }
  })

  const history = userTravelHistory ? userTravelHistory?.docs.map((d) => d.data()) : localTravHist;

  const pushToLocal = e => {
    try {
      const next = [e, ...localTravHist].slice(0, 50)
      setLocalTravHist(next)
      localStorage.setItem("eazemo_travel_history", JSON.stringify(next))
    } catch { }
  }

  const pushRemoteHistory = async entry => {
    try {
      const doc = {
        uid,
        email: userEmail,
        from: entry.from,
        to: entry.to,
        distKm: entry.distKm,
        ts: entry.ts,
        createdOn: new Date().toLocaleDateString(),
        app: "web"
      }
      await store.collection('eazemo_users').doc(uid).collection("travelHistory").add(doc)
    } catch (e) {
      console.error("Adding to user travel history failed >>>>", e)
    }
  }

  const pushHistory = async e => {
    pushToLocal(e)
    await pushRemoteHistory(e)
  }

  // --------- Routing (OSRM) ---------
  async function osrmRoute([olat, olng], [dlat, dlng]) {
    const url = `https://router.project-osrm.org/route/v1/driving/${Number(olng)},${Number(
      olat
    )};${Number(dlng)},${Number(dlat)}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("routing_failed");
    const json = await res.json();
    const coords = json?.routes?.[0]?.geometry?.coordinates || [];
    return coords
      .map(([lng, lat]) => [toNum(lat), toNum(lng)])
      .filter(([la, ln]) => inLat(la) && inLng(ln));
  }

  async function trace() {
    if (!from || !to) return;
    const o = [toNum(from.lat), toNum(from.lng)];
    const d = [toNum(to.lat), toNum(to.lng)];
    if (!inLat(o[0]) || !inLng(o[1]) || !inLat(d[0]) || !inLng(d[1])) return;

    setBusy(true);
    try {
      const path = await osrmRoute(o, d);
      onRouteFound(path, { from: from, to: to });
      await pushHistory({
        ts: Date.now(),
        from: { name: from.name, city: from.city || "", lat: o[0], lng: o[1] },
        to: { name: to.name, city: to.city || "", lat: d[0], lng: d[1] },
        distKm: Number(km(o, d).toFixed(2)),
      });
    } catch (e) {
      console.error("trace failed", e);
      onRouteFound([], { from: from, to: to });
    } finally {
      setBusy(false);
      if (stationsOptions && setStationsOptions) setStationsOptions(false)
    }
  }

  // --------- Ticket generation + fare charge (pay-per-use) ----------
  const [showQR, setShowQR] = useState(false)
  const [qrValue, setQRValue] = useState("")
  const [qrStation, setQrStation] = useState(null)
  const [nfcMsg, setNfcMsg] = useState("")
  const [busyGen, setBusyGen] = useState(false)
  const [overlayMode, setOverlayMode] = useState("qr") // "qr" | "guide"
  const [guideLoading, setGuideLoading] = useState(false)
  const [guideText, setGuideText] = useState("")
  const [userGuideInput, setUserGuideInput] = useState("")


async function handleGuideAsk() {
  if (!qrStation) return;

  setOverlayMode("guide");
  setGuideLoading(true);
  setGuideText("");

  try {
    const res = await fetch("/api/ride-guide", {
      method: "POST",                           // <-- MUST be POST
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationName: qrStation.name,
        lineId: qrStation.lineId,
        city: qrStation.city,
        qrToken: qrValue,
        userQuestion: userGuideInput || null,
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "guide_failed");

    setGuideText(json?.text || "No guide available.");
  } catch (e) {
    console.error("AI guide error >>>>", e);
    setGuideText("Error loading guide. Please try again.");
  } finally {
    setGuideLoading(false);
  }
}


  async function generateTicket(type, token, station) {
    if (!user) return;
    try {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      await store.collection("eazemo_passes").doc(user?.email).set(
        {
          [`${type}Data`]: token,
          createdAt: new Date(),
          expiresAt,
        },
        { merge: true }
      );

      if (type === "qrCode") {
        setQRValue(token);
        setQrStation({
          name: station?.name || "",
          lineId: station?.lineId || "",
          city: station?.city || "",
        });
        setShowQR(true);
        setOverlayMode("qr");
      } else if (type === "nfc") {
        setNfcMsg(`NFC token ${token} written.`);
        try {
          if ("NDEFReader" in window) {
            const ndef = new window.NDEFReader();
            await ndef.write(token);
            setNfcMsg("NFC tag written successfully");
          } else {
            setNfcMsg("Browser doesn't support Web NFC");
          }
        } catch (e) {
          console.error(e);
          setNfcMsg("NFC write failed");
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleFare(type, station) {
    if (!user || !userEmail) {
      alert("Sign in first to pay a fare.");
      return;
    }

    if (balance < FARE_PRICE) {
      alert("Insufficient balance.");
      return;
    }

    setBusyGen(true);
    const token = `${type}-${uuidv4()}`;

    try {
      const res = await fetch("/api/wallet/charge-fare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          amount: FARE_PRICE + 7.01,
          lineId: station.lineId,
          rideId: token,
          meta: {
            stationId: station.id,
            stationName: station.name,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        console.error(json);
        if (json.error === "insufficient_funds") {
          alert("Insufficient balance.");
        } else {
          alert("Fare charge failed.");
        }
        return;
      }

      // log ride
      try {
        if (uid) {
          await store
            .collection("eazemo_users")
            .doc(user?.email)
            .collection("user_rides")
            .add({
              uid,
              email: userEmail,
              rideId: token,
              type, // "qrCode" or "nfc"
              stationId: station.id || null,
              stationName: station.name || "",
              lineId: station.lineId || "",
              city: station.city || "",
              fare: FARE_PRICE,
              fareMinor: FARE_PRICE * 100,
              ts: Date.now(),
              createdOn: new Date(),
              app: "web",
            });
        }
      } catch (logErr) {
        console.error("Logging user ride failed >>>", logErr);
      }

      await generateTicket(type, token, station);
    } catch (e) {
      console.error(e);
      alert("Fare processing error.");
    } finally {
      setBusyGen(false);
    }
  }

  async function openAIGuide(){
    setOverlayMode("guide")
    setGuideText("")

    if(!qrStation) return

    setGuideLoading(true)
    try{
      const res = await fetch("/api/ride-guide", {
        method: "POST",
        headers: {"Content-Type": "aplication/json"},
        body: JSON.stringify({
          stationName: qrStation?.name,
          lineId: qrStation?.lineId,
          city: qrStation?.city,
          qrToken: qrValue
        })
      })
    }catch(e){
      console.error("AI Guide error >>>",e)
      setGuideText("Error loading guide. Please try again")
    }finally{
      setGuideLoading(false)
    }
  }

  //for trace
  const [traceFrom, setTraceFrom] = useState(null)
  const [traceTo, setTraceTo] = useState(null)
  const [traceMsg, setTraceMsg] = useState("")
  const [traceBusy, setTraceBusy] = useState(false);
const [traceErr, setTraceErr] = useState("");
const [traceResultsOpen, setTraceResultsOpen] = useState(false); // optional list toggle

 //for geo-trace
  const [geoTo, setGeoTo] = useState(null)
  const [userLoc, setUserLoc] = useState(null)
  const geoWatchIdRef = useRef(null)
  const [geoLive, setGeoLive] = useState(false)
  const [geoMsg, setGeoMsg] = useState("")

  //Route builders
  async function routeStations(fromStation, toStation){
      const o = [toNum(fromStation.lat), toNum(fromStation.lng)];
  const d = [toNum(toStation.lat), toNum(toStation.lng)];

  if (!inLat(o[0]) || !inLng(o[1]) || !inLat(d[0]) || !inLng(d[1])) {
    setTraceErr("Invalid coordinates for routing.");
    return;
  }

  setTraceBusy(true);
  setTraceErr("");
  try {
    const path = await osrmRoute(o, d);
    onRouteFound(path, { from: fromStation, to: toStation }); // map draws it
  } catch (e) {
    console.error("trace overlay routing failed >>>", e);
    setTraceErr("Routing failed.");
    onRouteFound([], { from: fromStation, to: toStation });
  } finally {
    setTraceBusy(false);
  }
   }

   async function routeFromGeoToStation(loc, station){
    const o = [toNum(loc?.lat), toNum(loc?.ln)]
    const d = [toNum(station?.lat), toNum(station?.lng)]
    const path = await osrmRoute(o, d)
    onRouteFound(path, {
      from: {stationName: "You", lat: o[0], lng: o[1]},
      to: station
    })
   }
   //FOR TRACE MODE
   function startTraceFromAny(station){
    setTraceFrom(station);
  setTraceErr("");
  // if same station was set as TO, clear TO
  if (traceTo && traceTo?.id === station?.id) setTraceTo(null);

  if (onFocusStation) onFocusStation({ lat: station?.lat, lng: station?.lng, name: station?.name });
   }

   async function setTraceDestination(station){
    setTraceTo(station);
  setTraceErr("");
  if (traceFrom && traceFrom?.id === station?.id) return; // prevent identical from/to
  if (onFocusStation) onFocusStation({ lat: station?.lat, lng: station?.lng, name: station?.name });

  // auto-run trace once both are selected
  if (traceFrom) await runTraceRoute(traceFrom, station);
   }

   const resetTrace = () => {
    setTraceFrom(null)
    setTraceTo(null)
    onRouteFound([], { from: null, to: null})
   }
   //End of TRACE MODE code
   //FOR GEO-TRACE MODE
   function stopGeoTrace(){
    {geoLive && setGeoLive(false)}
    {geoTo && setGeoTo(null)}
    {geoMsg && (setGeoMsg(""))}
    if(geoWatchIdRef?.current !== null && typeof window !== "undefined" && navigator?.geolocation){
      navigator.geolocation.clearWatch(geoWatchIdRef?.current)
      geoWatchIdRef.current = null
    }
   }

   useEffect(() => {
    stopGeoTrace()
   }, [])

   async function startGeoTraceToStation(station) {
  setGeoTo(station);
  setOverlayMode("geo-trace");
  setGeoMsg("")


  if (typeof window === "undefined") {
    setGeoMsg("Geo-trace unavailble (server render)")
    return
  }
  if (!navigator?.geolocation) {
    setGeoMsg("Geolocation nut supported")
    return
  }
  setGeoLive(true);

  // clear previous watch
  if (geoWatchIdRef.current !== null) {
    navigator.geolocation.clearWatch(geoWatchIdRef.current);
    geoWatchIdRef.current = null;
  }

  // watch live location
  geoWatchIdRef.current = navigator.geolocation.watchPosition(
    async function (pos) {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLoc(loc);

      try {
        await routeFromGeoToStation(loc, station);
        setGeoMsg("Tracking → " + (station && station.name ? station.name : "destination"));
      } catch (e) {
        console.error("geo-trace routing failed >>>", e);
        setGeoMsg("Live routing failed (retrying on next update).");
      }
    },
    function (err) {
      console.error("geo-trace geolocation error >>>", err);
      setGeoMsg("Location error. Stopping.");
      stopGeoTrace();
    },
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
  );
}

    useEffect(() => {
      return() => stopGeoTrace()
    }, [])
   //End of GEO-TRACE MODE code

  return (
    <>
      <div className='border-8 h-[35%] w-[90%] mx-auto border-slate-800 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50'>
        <header className="h-[10%] space-x-3 w-full border-b-2 border-slate-800 flex items-center px-3">
          <div className="flex flex-col space-y-1 w-full">
            <span className="text-base font-stack-head font-bold text-slate-900">
              {user
                ? walletLoading
                  ? "Loading…"
                  : `₱${balance.toFixed(2)}`
                : "Sign in to view balance"}
            </span>
          </div>
        </header>

        <div className="h-[90%] w-full flex flex-col space-y-2 items-start">
          {/* line filters + search */}
          <header className="w-full h-[20%] border-y-2 border-slate-800 flex items-center justify-evenly px-3 py-1 space-x-3">
            <div className="flex items-center space-x-2">
              <button
                disabled={showQR}
                onClick={() => {
                  setLrt1Tab(true)
                  setLrt2Tab(false)
                  setMrt3Tab(false)
                }}
                className={`h-[85%] min-w-[80px] rounded-md bg-inherit border border-slate-800 text-xs font-montserr text-slate-800 hover:bg-slate-300 hover:border-slate-600 hover:text-slate-600 transform transition-all duration-300 ease-in-out ${lrt1Tab ? 'bg-amber-500 border-2 border-zinc-800' : ''} `}
              >
                LRT-1
              </button>
              <button
                disabled={showQR}
                onClick={() => {
                  setLrt1Tab(false)
                  setLrt2Tab(true)
                  setMrt3Tab(false)
                }}
                className={`h-[85%] min-w-[80px] rounded-md bg-inherit border border-slate-800 text-xs font-montserr text-slate-800 hover:bg-slate-300 hover:border-slate-600 hover:text-slate-600 transform transition-all duration-300 ease-in-out ${lrt2Tab ? 'bg-amber-500 border-2 border-zinc-800' : ''} `}
              >
                LRT-2
              </button>
              <button
                disabled={showQR}
                onClick={() => {
                  setLrt1Tab(false)
                  setLrt2Tab(false)
                  setMrt3Tab(true)
                }}
                className={`h-[85%] min-w-[80px] rounded-md bg-inherit border border-slate-800 text-xs font-montserr text-slate-800 hover:bg-slate-300 hover:border-slate-600 hover:text-slate-600 transform transition-all duration-300 ease-in-out ${mrt3Tab ? 'bg-amber-500 border-2 border-zinc-800' : ''} `}
              >
                MRT-3
              </button>
            </div>
            <div className="flex-1 justify-end">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search station…"
                className="w-full max-w-[180px] px-2 py-1 text-xs border border-slate-800 rounded bg-white text-slate-800 font-montserr"
              />
            </div>
          </header>

          <div className="h-[80%] w-full my-auto overflow-y-scroll scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-100 border-2 border-slate-800">
            <>
              <div className="px-4 py-3">
                <div className="mt-2 h-[80%] overflow-y-scroll scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-200 border border-slate-800 rounded bg-slate-600 bg-opacity-[0.12]">
                  {stationsLoading && (
                    <div className='px-3 py-2 text-xs text-slate-800 font-montserr font-bold'>
                      Loading...
                    </div>
                  )}
                  {!stationsLoading && filteredStations.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-800 font-montserr font-bold">
                      No results
                    </div>
                  )}
                  {filteredStations.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {s.name}
                        </div>
                        <div className="text-[11px] text-gray-600">
                          {s.city || "—"} • {s.lineId.toUpperCase()}
                        </div>
                        <div className="text-[11px] text-gray-700 mt-1">
                          Fare: ₱{FARE_PRICE.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0 items-end">
                        <button
                          className="px-2 py-1 border rounded text-[11px] font-montserr"
                          onClick={() => {
                            onFocusStation({ lat: s.lat, lng: s.lng, name: s.name })
                            if (setStationsOptions) setStationsOptions(false)
                          }}
                        >
                          Focus
                        </button>
                        <div className="flex gap-1">
                          <button
                            className="px-2 py-1 border rounded text-[11px] font-montserr bg-amber-600 text-white disabled:opacity-50"
                            disabled={busyGen || !user}
                            onClick={() => handleFare("qrCode", s)}
                          >
                            QR
                          </button>
                          <button
                            className="px-2 py-1 border rounded text-[11px] font-montserr bg-slate-800 text-white disabled:opacity-50"
                            disabled={busyGen || !user}
                            onClick={() => handleFare("nfc", s)}
                          >
                            NFC
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          </div>
        </div>
      </div>
      {showQR && (
                <div className="h-screen w-screen fixed inset-0 z-50 bg-slate-100 bg-opacity-[0.33]">
                  <div className=" h-[90%] w-[85%] mx-auto flex flex-col items-center bg-slate-800 p-3 rounded shadow border">
                  <header className="px-3 py-2 w-full flex items-center justify-between space-x-2 border-b border-amber-400">
                    <div className="flex items-center gap-2 w-[75%] justify-evenly">
                      <button
                        onClick={() => setOverlayMode("qr")}
                        className={`px-2 py-1 text-[10px] rounded border font-montserr ${
                          overlayMode === "qr"
                            ? "bg-amber-500 border-amber-300 text-slate-900"
                            : "border-amber-400 text-amber-300"
                        }`}
                      >
                        QR
                      </button>
                      <button
                        onClick={() => {
                          if (qrValue && qrStation && user) {
                            generateTicket("nfc", qrValue, qrStation);
                          }
                        }}
                        className="px-2 py-1 text-[10px] rounded border border-amber-400 text-amber-300 font-montserr"
                      >
                        NFC
                      </button>
                      <button
                        onClick={() => setOverlayMode("guide")}
                        className={`px-2 py-1 text-[10px] rounded border font-montserr ${
                          overlayMode === "guide"
                            ? "bg-amber-500 border-amber-300 text-slate-900"
                            : "border-amber-400 text-amber-300"
                        }`}
                      >
                        Guide
                      </button>
                      <button
                        onClick={() => setOverlayMode("trace")}
                        className={`px-2 py-1 text-[10px] rounded border font-montserr ${
                          overlayMode === "trace"
                            ? "bg-amber-500 border-amber-300 text-slate-900"
                            : "border-amber-400 text-amber-300"
                        }`}
                      >
                        Trace
                      </button>
                      <button
                        onClick={() => setOverlayMode("geo-trace")}
                        className={`px-2 py-1 text-[10px] rounded border font-montserr ${
                          overlayMode === "geo-trace"
                            ? "bg-amber-500 border-amber-300 text-slate-900"
                            : "border-amber-400 text-amber-300"
                        }`}
                      >
                        Geo-trace
                      </button>
                    </div>
                    <span className="w-[25%] flex items-center justify-end">
                      <button 
                        onClick={() => setShowQR(false)}
                        className="px-2 rounded-full border flex flex-col items-center border-red-400 text-red-400 text-xs">
                        X
                      </button>
                    </span>
                  </header>
                  {/* QR is always shown; QR button just "returns" to this state */}
                  <div className="h-[92%] w-full flex flex-col items-center">
                    {overlayMode === "qr" && (
                      <>
                        <QRCode value={qrValue} className='h-[280px] my-auto' />
                        <div className="w-full mx-auto flex items-center space-x-3">
                          <h3 className="font-stack-head font-bold text-sm text-amber-300 justify-self-center items-center">
                            {`${qrStation?.name} - ${qrStation?.lineId?.toUpperCase()} - ${qrStation?.city}`}
                          </h3>
                        </div>
                      </>
                    )}
                    {nfcMsg && (
                      <div className="text-[10px] text-center text-amber-200 mt-1">
                        {nfcMsg}
                      </div>
                    )}
                    {overlayMode === "guide" && (
                    <>
{overlayMode === "guide" && (
  <div className="mt-2 px-2 w-full max-h-[220px] flex flex-col gap-2">
    <div className="text-[11px] font-montserr font-semibold text-amber-300">
      AI Ride Guide
      {qrStation?.name
        ? ` — ${qrStation.name}${
            qrStation.lineId ? ` • ${qrStation.lineId.toUpperCase()}` : ""
          }`
        : ""}
    </div>

    <div className="w-full">
      <textarea
        rows={2}
        value={userGuideInput}
        onChange={(e) => setUserGuideInput(e.target.value)}
        placeholder="Ask the AI how to proceed (e.g., 'How do I transfer from LRT-2 to MRT-3 from here?')"
        className="w-full text-[10px] font-montserr rounded border border-amber-400 bg-slate-900/60 text-amber-50 px-2 py-1 resize-none scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600"
      />
      <div className="mt-1 flex justify-end">
        <button
          onClick={handleGuideAsk}
          disabled={guideLoading}
          className="px-3 py-1 rounded text-[10px] font-montserr border border-amber-400 bg-amber-500 text-slate-900 disabled:opacity-50"
        >
          {guideLoading ? "Asking AI…" : "Ask AI"}
        </button>
      </div>
    </div>

    <div className="flex-1 w-full max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 border border-amber-400/40 rounded px-2 py-1">
      {guideLoading ? (
        <div className="text-[10px] text-amber-100">
          Generating step-by-step guide for this ride…
        </div>
      ) : guideText ? (
        <div className="space-y-1">
          {(guideText || "")
            .split(/\n+/)
            .filter(Boolean)
            .map((line, idx) => (
              <p
                key={idx}
                className="text-[10px] leading-snug text-amber-100 whitespace-pre-wrap"
              >
                {line}
              </p>
            ))}
        </div>
      ) : (
        <div className="text-[10px] text-amber-100">
          Type a question above and press “Ask AI” to get guidance for this station and ticket.
        </div>
      )}
    </div>
  </div>
)}
                    </>
                    )}
        {overlayMode === "trace" && (
          <div className="mt-2 h-[98%] w-full flex flex-col items-center">
            <MapForTrace 
            toNum={toNum}
            />
          </div>
        )}
        {overlayMode === "geo-trace" && (
          <div className="mt-2 w-full h-[98%] flex flex-col items-center">
            <MapForGeoTrace 
              toNum={toNum}
            />
          </div>
        )}
                  </div>
                </div>
                </div>
              )}
    </>
  )
}

export default EzPocketSidebarMob
