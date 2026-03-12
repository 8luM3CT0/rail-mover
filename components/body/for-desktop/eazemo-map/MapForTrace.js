//front-end
"use client";
import React, { useEffect, useMemo, useState } from 'react'
//back-end
import dynamic from 'next/dynamic'
import { creds, store, storage } from '../../../../backend_services/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'


const items_per_page = 10

const isFiniteNum = (n) => typeof n === "number" && Number.isFinite(n)
const inLat = (x) => isFiniteNum(x) && x >= -90 && x <= 90
const inLng = (x) => isFiniteNum(x) && x >= -180 && x <= 180

function sanitizeStations(snap) {
  if (!snap) return [];
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .map(s => {
      const lat = Number(s.stationLat);
      const lng = Number(s.stationLng);
      const name = String(s.stationName);
      const stationNameLower = String(s.stationNameLower || name?.toLowerCase())
      const city = String(s.stationCity)
      return {...s, lat, lng, name, city, stationNameLower}
    })
    .filter(s => inLat(s.lat) && inLng(s.lng) && s.lineId && s.name);
}

const toNum = (v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const s = v.trim().replace(/[^\d.\-]/g, "").replace(",", ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    }
    return NaN;
  };

function fixLatLng(rawLat, rawLng) {
  let lat = toNum(rawLat);
  let lng = toNum(rawLng);

  const latOK = inLat(lat);
  const lngOK = inLng(lng);
  const revLatOK = inLat(lng);
  const revLngOK = inLng(lat);

  if ((!latOK || !lngOK) && revLatOK && revLngOK) [lat, lng] = [lng, lat];
  if (!inLat(lat) || !inLng(lng)) return null;
  return { lat, lng };
}

function groupByLine(stations) {
  const out = {};
  for (const s of stations) {
    if (s?.active === false) continue;
    (out[s?.lineId] ||= []).push(s);
  }
  return out;
}

const LINE_ORDER = {lrt1: 1, lrt2: 2, mrt3: 3}

function sortLineStations(arr) {
  return [...arr].sort((a, b) => {
    const oa = LINE_ORDER[a.lineId] ?? 999;
    const ob = LINE_ORDER[b.lineId] ?? 999;
    if (oa !== ob) return oa - ob;
    return b?.lat - a?.lat;
  });
}

function MapForTrace ({
  openMapModal, 
  setOpenMapModal, 
  mapModal, 
  setMapModal, 
  closeMapModal, 
  setCloseMapModal
}) {
  const [user] = useAuthState(creds)

  
  /*  useEffect(() => {
      if(mapModal && !openMapModal){
        setTimeout(() => {
          setOpenMapModal(true)
        }, 10)
      } else if(!mapModal){
        setOpenMapModal(false)
      }
    }, [mapModal])
    */
  //for opening station options
    const [stationOptionsOpen, setStationsOptionsOpen] = useState(false)
    const [stationsOptions, setStationsOptions] = useState(true)
    const [stationsOptionsClose, setStationsOptionsClose] = useState(false)
    

  const TraceMap = dynamic(() => import("../eazemo-map/TraceMap"), {
    ssr: false,
    loading: () => <div className="p-4 text-sm font-stack-head text-slate-500">
      Loading map...
    </div>
  })


  const [adminPriv, setAdminPriv] = useState(false)
  //for adding stations to the firestore collection "stations"
  const [stationName, setStationName] = useState("")
  const [lineId, setLineId] = useState("")
  const [stationCity, setStationCity] = useState("")
  const [stationLat, setStationLat] = useState(0)
  const [stationLng, setStationLng] = useState(0)
  
  const addStationToFirestore = e => {
    e.preventDefault()

    store.collection('stationsList').add({
      addedBy: user?.displayName,
      stationName,
      stationNameLower: stationName?.toLowerCase(),
      stationCity,
      lineId,
      stationLat,
      stationLng
    })
    {stationName && setStationName("")}
    {lineId && setLineId("")}
    {stationCity && setStationCity("")}
    {stationLat && setStationLat("")}
    {stationLng && setStationLng("")}
  }

  const [userQu, setUserQu] = useState("")
  const [currentPageUser, setCurrentPageUser] = useState(1)
  const [usersPerPage] = useState(10)
  const [userDocs, setUserDocs] = useState([])
  const [totalPageUsers, setTotalPageUsers] = useState(0)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    const fetchUsers = async() => {
      setLoadingUsers(true)

      let usersQueryRef = store.collection('eazemo_users').orderBy('displayName', 'asc')

      const usersSnapshot = await usersQueryRef.get()
      const userDocs = usersSnapshot?.docs

      const totalUsers = userDocs?.map((doc) => ({
        id: doc?.id,
        ...doc?.data()
      }))

      const startInd = (currentPageUser - 1) * usersPerPage
      const endInd = startInd + usersPerPage

      setUserDocs(totalUsers?.slice(startInd, endInd))
      setTotalPageUsers(Math.ceil(totalUsers?.length / usersPerPage))
      setLoadingUsers(false)
    }
    fetchUsers()
  }, [userQu, currentPageUser, usersPerPage])

  const handlePageChange = newPage => {
    setCurrentPageUser(newPage)
  }

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

  
  const [adminQu, setAdminQu] = useState("")
  const [currentPageAdmin, setCurrentPageAdmin] = useState(1)
  const [adminsPerPage] = useState(10)
  const [adminDocs, setAdminDocs] = useState([])
  const [totalPageAdmins, setTotalPageAdmins] = useState(0)
  const [loadingAdmins, setLoadingAdmins] = useState(false)

  useEffect(() => {
    const fetchAdmins = async() => {
      setLoadingAdmins(true)

      let adminsQueryRef = store.collection('eazemo_admins').orderBy('adminName', 'asc')

      const adminsSnapshot = await adminsQueryRef.get()
      const adminDocs = adminsSnapshot?.docs
      
      const totalAdmins = adminDocs?.map((doc) => ({
        id: doc?.id,
        ...doc?.data()
      }))

      const startInd = (currentPageAdmin - 1) * adminsPerPage
      const endInd = startInd + adminsPerPage

      setAdminDocs(totalAdmins?.slice(startInd, endInd))
      setTotalPageAdmins(Math.ceil(totalAdmins?.length / adminsPerPage))
      setLoadingAdmins(false)
    }
    fetchAdmins()
  }, [adminQu, currentPageAdmin, adminsPerPage])

  const handlePageChangeAdmin = newPage => {
    setCurrentPageAdmin(newPage)
  }

  
  const [stationQu, setStationQu] = useState("")
  const [currentPageStations, setCurrentPageStations] = useState(1)
  const [stationsPerPage] = useState(4)
  const [stationsDocs, setStationsDocs] = useState([])
  const [totalPageStations, setTotalPageStations] = useState(0)
  const [loadingStations, setLoadingStations] = useState(false)

  useEffect(() => {
    const fetchStations = async() => {
      setLoadingStations(true)

      let stationsQueryRef = store.collection('stationsList').orderBy('lineId', 'asc')

      const stationsSnapshot = await stationsQueryRef.get()
      const stationsDocs = stationsSnapshot?.docs

      const totalStations = stationsDocs?.map(doc => ({
        id: doc?.id,
        ...doc?.data()
      }))

      const startInd = (currentPageStations - 1) * stationsPerPage
      const endInd = startInd + stationsPerPage

      setStationsDocs(totalStations?.slice(startInd, endInd))
      setTotalPageStations(Math.ceil(totalStations?.length / stationsPerPage))
      setLoadingStations(false)
    }
    fetchStations()
  }, [stationQu, currentPageStations, stationsPerPage])

  
  //for tracing
  const [routeCoords, setRouteCoords] = useState([])
  const [endpoints, setEndpoints] = useState(null)
  const [focusPoint, setFocusPoint] = useState(null)
  const [fromQ, setFromQ] = useState("")
  const [toQ, setToQ] = useState("")
  const [activeField, setActiveField] = useState("from")
  const [fromStation, setFromStation] = useState(null)
  const [toStation, setToStation] = useState(null)
  const [traceBusy, setTraceBusy] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const [stationSnap] = useCollection(store.collection('stationsList'))
  const stations = useMemo(() => sanitizeStations(stationSnap), [stationSnap])

  const searchText = (activeField === "from" ? fromQ : toQ).trim().toLowerCase()

  const searchResults = useMemo(() => {
    if(!searchText) return stations.slice(0, 15)
      return stations.filter((s) => (s?.stationNameLower || s?.name?.toLowerCase()).includes(searchText)).slice(0, 15)
  }, [stations, searchText])

  const lines = useMemo(() => {
    const g = groupByLine(stations)
    const out = {}
    for (const [k,arr] of Object.entries(g)) out[k] = sortLineStations(arr);
    return out;
  }, [stations])


  const allCoords = useMemo(() => {
  const v = [];
  Object.values(lines).forEach(arr => {
    arr.forEach(s => {
      if (inLat(s?.lat) && inLng(s?.lng)) v.push([s?.lat, s?.lng]);
    });
  });
  return v;
}, [lines]);

  function handleRouteFound(path, meta){
    setFocusPoint(null)
    setRouteCoords(Array.isArray(path) ? path : [])
    setEndpoints(meta || null)
  }
 
  function handleFocusStations(point){
    setRouteCoords([])
    setEndpoints(null)
    setFocusPoint(point)
  }

  function pickStation(s){
 if(!s) return
 
 if(activeField ==="from"){
  setFromStation(s)
  setFromQ(s?.name)
  setActiveField('to')
 } else {
  setToStation(s)
  setToQ(s?.name)
 }
 setSearchOpen(false)
 setFocusPoint({last: s?.lat, lng: s?.lng, name: s?.name })
}

async function traceNow(){
  if(!fromStation || !toStation) return;

  const o = [toNum(fromStation?.lat), toNum(fromStation?.lng)]
  const d = [toNum(toStation?.lat), toNum(toStation?.lng)]

  if(!inLat(o[0]) || !inLng(o[1]) || !inLat(d[0]) || !inLng(d[1])) return;
  setTraceBusy(true)
    try {
    const path = await osrmRoute(o, d);
    setRouteCoords(Array.isArray(path) ? path : []);
    setEndpoints({
      from: { stationName: fromStation.name, lat: o[0], lng: o[1] },
      to: { stationName: toStation.name, lat: d[0], lng: d[1] },
    });
    setFocusPoint(null); // let Fit() choose bounds via route
  } catch (e) {
    console.error("traceNow failed >>>", e);
    setRouteCoords([]);
    setEndpoints(null);
  } finally {
    setTraceBusy(false);
  }
}

  return (
    <div className='h-full w-full flex flex-col items-center'>
            {/**map search area */}
            <div className="h-[45%] w-full px-2 bg-slate-950 bg-opacity-[0.55]">
  <div className="h-full w-full rounded-t-3xl border border-slate-700 bg-slate-900/60 overflow-hidden">
    {/* handle bar */}
    <div className="w-full flex justify-center pt-2">
      <div className="h-1.5 w-14 rounded-full bg-slate-500/60" />
    </div>

    <div className="px-4 pt-3 pb-2">
      <div className="text-slate-100 font-stack-head font-bold text-lg">
        Trace a route
      </div>
      <div className="text-slate-400 text-[11px]">
        Pick From and To stations. Then press Trace.
      </div>
    </div>

    <div className="h-[85%] px-4 space-y-2">
      {/* FROM */}
      <div className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2">
        <div className="text-[10px] text-slate-400 font-stack-head">FROM</div>
        <input
          value={fromQ}
          onFocus={() => { setActiveField("from"); setSearchOpen(true); }}
          onChange={(e) => { setFromQ(e.target.value); setActiveField("from"); setSearchOpen(true); }}
          placeholder="Search origin station…"
          className="w-full bg-transparent outline-none text-slate-100 font-stack-head text-sm"
        />
        {fromStation && (
          <div className="text-[10px] text-slate-400 mt-1">
            Selected: {fromStation.name} • {String(fromStation.lineId).toUpperCase()}
          </div>
        )}
      </div>

      {/* TO */}
      <div className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2">
        <div className="text-[10px] text-slate-400 font-stack-head">TO</div>
        <input
          value={toQ}
          onFocus={() => { setActiveField("to"); setSearchOpen(true); }}
          onChange={(e) => { setToQ(e.target.value); setActiveField("to"); setSearchOpen(true); }}
          placeholder="Search destination station…"
          className="w-full bg-transparent outline-none text-slate-100 font-stack-head text-sm"
        />
        {toStation && (
          <div className="text-[10px] text-slate-400 mt-1">
            Selected: {toStation.name} • {String(toStation.lineId).toUpperCase()}
          </div>
        )}
      </div>

      {/* SEARCH RESULTS */}
      {searchOpen && (
        <div className="rounded-xl border min-h-[150px] fixed z-[99999]  border-slate-700 bg-slate-900 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
            <span className="text-[11px] font-stack-head font-semibold text-slate-200">
              {activeField === "from" ? "Pick origin" : "Pick destination"}
            </span>
            <button
              onClick={() => setSearchOpen(false)}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>
          <div className="max-h-[140px] overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400">No results</div>
            ) : (
              searchResults.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pickStation(s)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800/50 border-b last:border-b-0 border-slate-800"
                >
                  <div className="text-sm text-slate-100 font-stack-head font-semibold truncate">
                    {s.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {s.city || "—"} • {String(s.lineId).toUpperCase()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => {
            setFromQ(""); setToQ("");
            setFromStation(null); setToStation(null);
            setRouteCoords([]); setEndpoints(null); setFocusPoint(null);
            setActiveField("from"); setSearchOpen(false);
          }}
          className="w-[35%] px-3 py-3 rounded-xl border border-slate-700 text-slate-200 font-stack-head font-semibold text-sm"
        >
          Reset
        </button>

        <button
          disabled={!fromStation || !toStation || traceBusy}
          onClick={traceNow}
          className="w-[65%] px-3 py-3 rounded-xl bg-slate-200 text-slate-900 font-stack-head font-bold text-sm disabled:opacity-50"
        >
          {traceBusy ? "Tracing…" : "Trace"}
        </button>
      </div>
    </div>
  </div>
</div>
            {/**end of map search area */}
            {/**map area */}
            <div className="h-[50%] flex flex-col justify-center w-full px-2 bg-slate-900 bg-opacity-[0.4]">
              <TraceMap
            routeCoords={routeCoords}
            focusPoint={focusPoint} 
            allCoords={allCoords} 
            lines={lines}
            />
            </div>
            {/**end of map area */}
    </div>
  )
}


export default MapForTrace