//front-end
import { MapIcon } from 'lucide-react'
import React from 'react'
//back-end
import { creds, store, provider } from '../../../../../backend_services/firebase'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import {useEffect, useMemo, useState} from 'react'
import {v4 as uuidv4} from 'uuid'
import QRCode from 'react-qr-code'

const LS_HISTORY_KEY = "eazemo_travel_history"

              {/**<div className="h-[85%] flex flex-col items-start px-3 py-1 space-y-2">
                <h3 className="font-montserr font-bold text-slate-800 text-lg">
                  Where would you want to go today, {user?.displayName?.split(" ")[0]}?
                </h3>
                <h3 className="font-montserr font-semibold text-slate-800 text-base">
                  From:
                </h3>
                <input 
                placeholder='Origin'
                type="text" 
                className="border-b-2 border-slate-800 outline-none px-3 py-1 text-lg text-slate-800 w-[85%] mx-auto font-montserr font-semibold bg-transparent placeholder-slate-500" />
                <h3 className="font-montserr font-semibold text-slate-800 text-base">
                  To:
                </h3>
                <input 
                placeholder='Destination'
                type="text" 
                className="border-b-2 border-slate-800 outline-none px-3 py-1 text-lg text-slate-800 w-[85%] mx-auto font-montserr font-semibold bg-transparent placeholder-slate-500" />
              </div>
              <footer className="bottom-0 h-[15%] bg-amber-500 bg-opacity-[0.15] space-x-1 w-full flex items-center px-3 py-1 border-t-2 border-slate-800">
                <span className="w-[45%]"></span>
                <button className="focus:outline-none bg-slate-100 outline-none w-[45%] text-lg font-montserr font-semibold text-slate-800 border-slate-800 rounded border-2 hover:text-slate-600 hover:border-slate-600 transform transition-all duration-300 ease-in-out">
                  Trace
                </button>
                
                )}
              </footer> */}
              

function MapPageSidebarMob({onFocusStation, onRouteFound, stationsOptions, setStationsOptions, subscribeModal, setSubscribeModal}) {
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
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon=(lon2 - lon1) * Math.PI / 180
  const la1 = lat1 * Math.PI / 180, la2 = lat2 * Math.PI / 180
  const h = Math.sin(dLat / 2)**2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2*R*Math.asin(Math.sqrt(h))
}

 const normalizeStation = (raw) => {
    const lat = toNum(raw.stationLat);
    const lng = toNum(raw.stationLng);
    const name = String(raw.stationName || "Unknown");
    const city = String(raw.stationCity || "");
    const lineId = String(raw.lineId || "").toLowerCase();
    return { ...raw, lat, lng, name, city, lineId };
  };
  
  // -------------state-----------------
  const [user] = useAuthState(creds)
  const [query, setQuery] = useState("")
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [isUserAnEditor, setIsUserAnEditor] = useState(false)
  const [isUserASub, setIsUserASub] = useState(false)
  const [traceTab, setTraceTab] = useState(true)
  const [historyTab, setHistoryTab] = useState(false)
  const [lrt1Tab, setLrt1Tab] = useState(true)
  const [lrt2Tab, setLrt2Tab] = useState(false)
  const [mrt3Tab, setMrt3Tab] = useState(false)

  const signIn = () => {
          creds.signInWithPopup(provider).catch(alert)
      }
  
  useEffect(() => {
          if(user){
              store.collection('eazemo_users').doc(user.uid).set({
                  email: user.email,
                  displayName: user.displayName,
                  photoURL: user.photoURL,
              }, {
                  merge: true
              })
          }
      }, [user])

  const checkUserIfEditor = async() => {
    if(user){
      try{
          const querySnapshot = await store.collection('eazemo_admins')
          .where('adminEmail', '==', user?.email)
          .get()

          const isEditor = querySnapshot?.size > 0
          setIsUserAnEditor(isEditor)
      }catch(error){
        console.error('Error in checking editor status >>>>', error)
      }
  }
  }
  
  useEffect(() => {
    checkUserIfEditor()
  }, [user])

const checkUserIfSubscribed = async() => {
    if(user){
      try{
        const subSnapshot = await store.collection('eazemo_subs')
        .where('email', '==', user?.email)
        .get()

        const isSub = subSnapshot?.size > 0;
        setIsUserASub(isSub)
      }catch(error){
        console.error('Error in checking if user is a subscriber >>>', error)
      }
    }
  }

  useEffect(() => {
    checkUserIfSubscribed()
  },[user])
  
  const uid = user?.uid
  const userEmail = user?.email

  //---------------Firestore: stations search ---------------
  const baseStationsRef = useMemo(() => store.collection('stationsList'), [])
  const stationQuery = useMemo(() => {
    const qq = query?.trim().toLowerCase()
    try{
      return qq 
      ? baseStationsRef?.orderBy("stationNameLower").startAt(qq).endAt(qq + "\uf8ff").limit(15)
      : baseStationsRef?.orderBy("stationNameLower").limit(15)
    }catch{
      return baseStationsRef.limit(15)
    }
  }, [baseStationsRef])

  const [stationsSnap, stationsLoading, stationsError] = useCollection(stationQuery)

  console.log("Stations snapshot >>>", stationsSnap)
  useEffect(() => {
    if(stationsError) console.error("Stations read error >>>>", stationsError)
  }, [stationsError])

  const stations = useMemo(() => {
    if (!stationsSnap) return [];
    return stationsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .map(normalizeStation)
      .filter((s) => inLat(s.lat) && inLng(s.lng) && s.lineId && s.name);
  }, [stationsSnap])

  const filteredStations = useMemo(() => {
    const activeLines = []
    if(lrt1Tab) activeLines.push("lrt1")
    if(lrt2Tab) activeLines.push("lrt2")
    if(mrt3Tab) activeLines.push("mrt3")

      if(activeLines.length === 0) return stations
      return stations?.filter(s => activeLines.includes(s?.lineId))
  }, [stations, lrt1Tab, lrt2Tab, mrt3Tab])

  // ---------- Travel history: Firestore read (per user) + local cache fallback ----------
  const historyQuery = useMemo(
    () =>
      store
        .collection("eazemo_users")
        .doc(uid) // "anon" will just be an empty bucket until the user logs in
        .collection("travelHistory")
        .orderBy("ts", "desc")
        .limit(100),
    [uid]
  );

  const [userTravelHistory, userTravelLoading, userTravelErr] = useCollection(
    store?.collection('eazemo_users').doc(uid).collection('travelHistory')
  )

  useEffect(() => {
      if(userTravelErr) console.error("History read error >>>", error)
  }, [userTravelErr])

  const [localTravHist, setLocalTravHist] = useState(() => {
    try{
      const raw = localStorage.getItem("eazemo_travel_history")
      return raw ? JSON.parse(raw) : [];
    }catch{
      return []
    }
  })

  const history = userTravelHistory ? userTravelHistory?.docs.map((d) => d.data()) : localTravHist;

  const pushToLocal = e => {
    try{
      const next = [e, ...localTravHist].slice(0, 50)
      setLocalTravHist(next)
      localStorage.setItem("eazemo_travel_history", JSON.stringify(next))
    }catch{}
  }

  const pushRemoteHistory = async e => {
    try{
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
    } catch(e){
      console.error("Adding to user travel history failed >>>>", e)
    }
  }

  const pushHistory = async e => {
    pushToLocal(e)
    await pushRemoteHistory(e)
  }

  // --------- Routing (OSRM) ---------
  async function osrmRoute([olat, olng], [dlat, dlng]){
    const url = `https://router.project-osrm.org/route/v1/driving/${Number(olng)},${Number(
      olat
    )};${Number(dlng)},${Number(dlat)}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("routing_failed");
    const json = await res.json();
    const coords = json?.routes?.[0]?.geometry?.coordinates || [];
    // [lng,lat] → [lat,lng] with validation
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
      // even if OSRM fails, still notify map to focus endpoints
      onRouteFound([], { from: from, to: to });
    } finally {
      setBusy(false);
      {stationsOptions && setStationsOptions(false)}
    }
  }

  //for generating qr && nfc e-ticket
  const [showQR, setShowQR] = useState(false)
  const [qrValue, setQRValue] = useState("")
  const [nfcMsg, setNfcMsg] = useState("")
  const [busyGen, setBusyGen] = useState(false)

  async function generateTicket(type) {
    if (!isUserASub || !user) return;
    setBusyGen(true);
    try {
      const token = `${type}-${uuidv4()}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      await store.collection("user_passes").doc(user.uid).set(
        {
          [`${type}Data`]: token,
          createdAt: new Date(),
          expiresAt,
        },
        { merge: true }
      );

      if (type === "qrCode") {
        setQRValue(token);
        setShowQR(true);
      } else if (type === "nfc") {
        setNfcMsg(`NFC token ${token} written.`);
        try {
          if ("NDEFReader" in window) {
            const ndef = new window.NDEFReader();
            await ndef.write(token);
            setNfcMsg("✅ NFC tag written successfully");
          } else {
            setNfcMsg("⚠ Browser doesn't support Web NFC");
          }
        } catch (e) {
          console.error(e);
          setNfcMsg("NFC write failed");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusyGen(false);
    }
  }

  return (
    <>
      <div className='border-8 min-h-[480px] max-h-[680px] w-full border-slate-800 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50'>
      <header className="h-[10%] space-x-3 w-full border-b-2 border-slate-800 flex items-center px-3"></header>
      <div className="h-[90%] w-full flex flex-col space-y-2 items-start">
         <header className="w-full h-[10%] border-y-2 border-slate-800 flex items-center justify-evenly space-x-4 px-3 py-1 overflow-x-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-200">
          <button
          onClick={() => {
            setLrt1Tab(true)
            setLrt2Tab(false)
            setMrt3Tab(false)
          }}
          className={`h-[85%] min-w-[120px] rounded-md bg-inherit border border-slate-800 text-slate-800 hover:bg-slate-300 hover:border-slate-600 hover:text-slate-600 transform transition-all duration-300 ease-in-out ${lrt1Tab ? 'bg-amber-500 border-2 border-zinc-800' : ''} `}>
            LRT-1
          </button>
          <button 
          onClick={() => {
            setLrt1Tab(false)
            setLrt2Tab(true)
            setMrt3Tab(false)
          }}
          className={`h-[85%] min-w-[120px] rounded-md bg-inherit border border-slate-800 text-slate-800 hover:bg-slate-300 hover:border-slate-600 hover:text-slate-600 transform transition-all duration-300 ease-in-out ${lrt2Tab ? 'bg-amber-500 border-2 border-zinc-800' : ''} `}>
            LRT-2
          </button>
          <button 
          onClick={() => {
            setLrt1Tab(false)
            setLrt2Tab(false)
            setMrt3Tab(true)
          }}
          className={`h-[85%] min-w-[120px] rounded-md bg-inherit border border-slate-800 text-slate-800 hover:bg-slate-300 hover:border-slate-600 hover:text-slate-600 transform transition-all duration-300 ease-in-out ${mrt3Tab ? 'bg-amber-500 border-2 border-zinc-800' : ''} `}>
            MRT-3
          </button>
        </header>
        <div className="h-[80%] w-full my-auto overflow-y-scroll scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-100 border-2 border-slate-800">
          <>
            <div className="px-4 py-3">
              
                            <div className="mt-2 h-[85%] overflow-y-scroll scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-200 border border-slate-800 rounded bg-slate-600 bg-opacity-[0.12]">
                              {stationsLoading && <div className='px-3 py-2 text-xs text-slate-800 font-montserr font-bold'>Loading...</div>}
                              {!stationsLoading && filteredStations.length === 0 && (
                                <div className="px-3 py-2 text-xs text-slate-800 font-montserr font-bold">
                                  No results
                                </div>
                              )}
                              {filteredStations.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{s.name}</div>
                <div className="text-[11px] text-gray-600">{s.city || "—"} • {s.lineId.toUpperCase()}</div>
              </div>
                <div className="flex gap-2 shrink-0">
                <button
                  className="px-2 py-1 border rounded text-xs"
                  onClick={() => {
                    onFocusStation({ lat: s.lat, lng: s.lng, name: s.name })
                    setStationsOptions(false)
                  }}
                >
                  Focus
                </button>
              </div>
            </div>
          ))}
          </div>
            </div>
             {/* Selected endpoints */}
        
        {/* Trace button */}
       
            </>
        </div>
        {/*traceTab && (
          <div className="h-[85%] my-auto w-full border-2 border-slate-800 overflow-y-scroll scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-100">
          {user ? (
            <>
            <div className="px-4 py-3">
              
                            <div className="mt-2 h-[70%] overflow-y-scroll scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-200 border border-slate-800 rounded bg-slate-600 bg-opacity-[0.12]">
                              {stationsLoading && <div className='px-3 py-2 text-xs text-slate-800 font-montserr font-bold'>Loading...</div>}
                              {!stationsLoading && stations.length === 0 && (
                                <div className="px-3 py-2 text-xs text-slate-800 font-montserr font-bold">
                                  No results
                                </div>
                              )}
                              {stations.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{s.name}</div>
                <div className="text-[11px] text-gray-600">{s.city || "—"} • {s.lineId.toUpperCase()}</div>
              </div>
              {(isUserASub || isUserAnEditor) && (
                <div className="flex gap-2 shrink-0">
                <button
                  className="px-2 py-1 border rounded text-xs"
                  onClick={() => {
                    onFocusStation({ lat: s.lat, lng: s.lng, name: s.name });
                    setStationsOptions(false)
                  }}
                >
                  Focus
                </button>
                {/*<button
                  className={`px-2 py-1 border rounded text-xs ${from?.id === s.id ? "bg-black text-white" : ""}`}
                  onClick={() => setFrom(s)}
                >
                  From
                </button>
                <button
                  className={`px-2 py-1 border rounded text-xs ${to?.id === s.id ? "bg-black text-white" : ""}`}
                  onClick={() => setTo(s)}
                >
                  To
                </button>}
              </div>
              )}
            </div>
          ))}
          </div>
            </div>
             { Selected endpoints }
        {<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="border rounded p-2">
            <div className="text-[11px] text-gray-500">From</div>
            <div className="font-semibold truncate">{from?.name || "—"}</div>
          </div>
          <div className="border rounded p-2">
            <div className="text-[11px] text-gray-500">To</div>
            <div className="font-semibold truncate">{to?.name || "—"}</div>
          </div>
        </div>}

        {Trace button }
       {(isUserAnEditor || isUserASub) ? (
        <div className="w-full px-3 flex flex-col items-center space-y-2">
         {<button
          disabled={!from || !to || busy}
          onClick={trace}
          className="mt-3 w-[90%] mx-auto px-3 font-montserr font-bold rounded bg-amber-600 text-slate-100 py-2 disabled:opacity-50"
        >
          {busy ? "Tracing…" : "Trace"}
        </button>*/}
        {/*<span className="flex items-center space-x-2">
          <button 
          onClick={() => generateTicket("qrCode")}
          disabled={busyGen}
          className="font-montserr font-semibold text-slate-100 text-sm focus:outline-none bg-amber-600 px-3 py-2 rounded border-slate-800 hover:text-slate-200 hover:border-slate-200 transform transition-all duration-300 ease-in-out">
            Generate QR
          </button>
          <button 
          disabled={busyGen}
          className="font-montserr font-semibold text-slate-100 text-sm focus:outline-none bg-amber-600 px-3 py-2 rounded border-slate-800 hover:text-slate-200 hover:border-slate-200 transform transition-all duration-300 ease-in-out">
           Generate NFC - TBA
          </button>
        </span>}
                {showQR && (
                <div className="absolute bottom-24 right-8 bg-white p-3 rounded shadow border">
                  <QRCode value={qrValue} size={150} />
                  <div className="text-xs text-center mt-1">{qrValue}</div>
                </div>
              }
       </div>
       ): (
        <>
        <div className="w-full px-3 flex flex-col items-center">
          <button
          onClick={() => setSubscribeModal(true)}
          className="focus:outline-none mt-3 w-[90%] mx-auto px-3 font-montserr font-bold rounded bg-amber-600 text-slate-100 hover:bg-amber-700 hover:test-slate-200 transform transiton-all duration-300 ease-in-out py-2"
        >
          Subscribe
        </button>
        </div>}
        </>
       )}
            </>
          ): (
            <>
            <div className="flex flex-col items-start h-full justify-evenly px-3 py-1">
              <h3 className="font-montserr font-semibold text-slate-800 text-xl">
                Sign in to access more features.
              </h3>
              <button 
              onClick={signIn}
              className="focus:outline-none h-[60px] w-[85%] mx-auto border-2 border-slate-800 font-montserr font-semibold text-xl text-slate-800 rounded-md">
                Log in with Google
              </button>
            </div>
            </>
          )}
        </div>)*/}
        {/**bottom div has travel history */}
        
      </div>
    </div>
    </>
  )
}

export default MapPageSidebarMob
