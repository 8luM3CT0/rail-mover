//front-end
"use client";
import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { MainHeader, MapHeader, MapPageSidebar, SidebarMob } from '../components'
import EazeMoUsers from '../components/header/eazemo-users/EazeMoUsers';
import EazeMoAdmins from '../components/header/eazemo-users/EazeMoAdmins';
import StationSnap from '../components/body/for-desktop/eazemo-map/StationSnap';
import ConfirmModal from '../components/body/for-desktop/sidebar/confirm-modal/ConfirmModal';
import MapPageSidebarMob from '../components/body/for-desktop/sidebar/map-page-sidebar/MapPageSidebarMob';
//back-end
import dynamic from 'next/dynamic'
import { creds, store, storage } from '../backend_services/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'
import { TrainIcon, UsersIcon } from 'lucide-react';

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
      const city = String(s.stationCity)
      return {...s, lat, lng, name, city}
    })
    .filter(s => inLat(s.lat) && inLng(s.lng) && s.lineId && s.name);
}

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

function MapPage ({
  openMapModal, 
  setOpenMapModal, 
  mapModal, 
  setMapModal, 
  closeMapModal, 
  setCloseMapModal}) {
  const [user] = useAuthState(creds)

  
    useEffect(() => {
      if(mapModal && !openMapModal){
        setTimeout(() => {
          setOpenMapModal(true)
        }, 10)
      } else if(!mapModal){
        setOpenMapModal(false)
      }
    }, [mapModal])
    
  //for opening station options
    const [stationOptionsOpen, setStationsOptionsOpen] = useState(false)
    const [stationsOptions, setStationsOptions] = useState(true)
    const [stationsOptionsClose, setStationsOptionsClose] = useState(false)
    

  const EazeMoMap = dynamic(() => import("../components/body/for-desktop/eazemo-map/EazeMoMap"), {
    ssr: false,
    loading: () => <div className="p-4 text-sm font-montserr text-slate-500">
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

  const handlePageChangeStations = newPage => {
    setCurrentPageStations(newPage)
  }
  //for admin panel
  const [addStationsTab, setAddStationsTab] = useState(true)
  const [addAdminsTab, setAddAdminsTab] = useState(false)

  //for tracing
  const [routeCoords, setRouteCoords] = useState([])
  const [endpoints, setEndpoints] = useState(null)
  const [focusPoint, setFocusPoint] = useState(null)

  const [stationSnap] = useCollection(store.collection('stationsList'))
  const stations = useMemo(() => sanitizeStations(stationSnap), [stationSnap])

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

  const [subscribeModal, setSubscribeModal] = useState(false)
  

  return (
    <>
      <div
        className='h-screen w-screen overflow-hidden bg-slate-200 bg-opacity-[0.55]'
      >
        <Head>
          <link
            rel='icon'
            href='https://scontent.fmnl3-2.fna.fbcdn.net/v/t39.30808-6/272327113_4737476893035391_5246286791413601509_n.jpg?_nc_cat=105&ccb=1-5&_nc_sid=09cbfe&_nc_eui2=AeECrnO_8dXVAWxCpCk_RmpH7jTvern-F6PuNO96uf4Xo7_yjIJ-5o2CMr-603hL1WNa0Jl80SHf-RzZV6SIAqj5&_nc_ohc=3ztfyHPMq2MAX9eglgo&tn=LgHqoGaPnVNjG6Fp&_nc_zt=23&_nc_ht=scontent.fmnl3-2.fna&oh=00_AT9QVTclQ2qQduyjB1X8cZV7lXR6v7K4jnKetPgNzmthcg&oe=61FEF020'
          />
          <title>
            Eazemo - Pasahero Payment App
          </title>
        </Head>
        <MapHeader
          adminPriv={adminPriv}
          setAdminPriv={setAdminPriv}
          mapModal={mapModal}
          setMapModal={setMapModal}
        />
        <main className="w-[93%] h-full border-x-2 border-zinc-800 mx-auto">
          <div className="h-full w-full bg-slate-800 bg-opacity-[0.05] flex items-center">
            <MapPageSidebar onRouteFound={handleRouteFound} onFocusStation={handleFocusStations} subscribeModal={subscribeModal} setSubscribeModal={setSubscribeModal} />
            <EazeMoMap 
            routeCoords={routeCoords}
            endpoints={endpoints}
            focusPoint={focusPoint}
            allCoords={allCoords}
            lines={lines}
            />
          </div>
            <button 
            onClick={() => setStationsOptions(true)}
            className={`lg:hidden flex items-center font-montserr left-1/2 -translate-x-1/2  font-semibold fixed z-[2000] bottom-[calc(1rem+env(safe-area-inset-bottom,0))] text-slate-800 px-4 py-3 mx-auto bg-slate-200 rounded border-2 border-slate-800 ${stationsOptions && 'hidden'}`}>
              Stations options
            </button>
        </main>
          </div>
    {adminPriv && (
      <div className="h-screen w-screen fixed z-50 inset-0 overflow-hidden flex items-center bg-slate-800 bg-opacity-[0.35]">
        <div onClick={() => setAdminPriv(false)} className="h-full w-[5%]"></div>
        <div className="h-full w-[90%] flex flex-col items-center">
          <div onClick={() => setAdminPriv(false)} className="h-[7%]"></div>
          <div className="h-[86%] w-full mx-auto bg-slate-100 rounded-md border-2 border-slate-800 flex flex-col items-start">
            <header className="h-[8%] w-full border-b-2 border-slate-800 flex items-center justify-between px-3 py-1">
              <h3 className="font-montserr font-semibold text-slate-800 text-xl">
                Admin Panel
              </h3>
            <span className="w-[50%] justify-end flex items-center space-x-3">
              {user?.email == 'rumlowb@gmail.com' && (
                <>
              <button 
              disabled={addStationsTab}
              onClick={() => {
                setAddStationsTab(true)
                setAddAdminsTab(false)}
              }
              className={`focus:outline-none outline-none text-xl px-3 py-1 rounded-full flex flex-col font-merriweather font-bold items-center text-slate-800 border-2 border-slate-800 hover:text-slate-400 hover:border-slate-400 transform transition-all duration-300 ease-in-out ${addStationsTab && 'text-slate-500 border-slate-500 hover:text-slate-500 hover:border-slate-500'}`}>
                <TrainIcon className={`${addStationsTab && 'text-slate-500'}`} />
              </button>
              <button 
              disabled={addAdminsTab}
              onClick={() => {
                setAddStationsTab(false)
                setAddAdminsTab(true)}
              }
              className={`focus:outline-none outline-none text-xl px-3 py-1 rounded-full flex flex-col font-merriweather font-bold items-center text-slate-800 border-2 border-slate-800 hover:text-amber-500 hover:border-amber-500 transform transition-all duration-300 ease-in-out ${addAdminsTab && 'text-amber-500 border-amber-500 hover:border-amber-500 hover:text-amber-500'}`}>
                <UsersIcon className={`${addAdminsTab && ('text-amber-500')}`} />
              </button>
                </>
              )}
              <button 
              onClick={() => setAdminPriv(false)}
              className="focus:outline-none outline-none text-xl px-3 py-1 rounded-full flex flex-col font-merriweather font-bold items-center text-slate-800 border-2 border-slate-800 hover:text-red-600 hover:border-red-600 transform transition-all duration-300 ease-in-out">
                X
              </button>
            </span>
            </header>
            <div className="h-[92%] w-full flex flex-col items-start">
              {/**add stations within the Firestore collection (titled "stations") */}
                {addStationsTab && (
                  <>
                   <div className="h-[45%] w-full rounded border border-slate-700 flex flex-col items-start">
                  <div className="h-[75%] w-full flex flex-col items-start px-4 py-2">
                  <span className="flex items-center space-x-3 w-[85%] mx-auto px-3">
                  <span className="w-[20%]">
                    <h3 className="font-montserr font-semibold text-slate-800 text-lg">
                    Station name:
                  </h3>
                  </span>
                  <input 
                  placeholder={`Name of the station...`}
                  value={stationName}
                  onChange={e => setStationName(e.target.value)}
                  type="text" 
                  className="w-[80%] h-[45px] px-3  border-b-2 outline-none focus:outline-none border-slate-800 placeholder-slate-600 bg-transparent text-slate-800 font-montserr font-semibold" />
                </span>
                <span className="flex items-center space-x-3 w-[95%] mx-auto">
                  <span className="w-[50%] flex items-center space-x-1">
                    
                <input 
                  placeholder={`Within what city...`}
                  value={stationCity}
                  onChange={e => setStationCity(e.target.value)}
                  type="text" 
                  className="w-[80%] h-[45px] px-3 border-b-2 outline-none focus:outline-none border-slate-800 placeholder-slate-600 bg-transparent text-base text-slate-800 font-montserr font-semibold" />
                  </span>
                  <span className="w-[50%] flex items-center space-x-1">
                  
                <input 
                  placeholder={`Line id (format: lrt1, lrt2, mrt3, etc...)`}
                  value={lineId}
                  onChange={e => setLineId(e.target.value)}
                  type="text" 
                  className="w-[80%] h-[45px] px-3 border-b-2 outline-none focus:outline-none border-slate-800 placeholder-slate-600 bg-transparent text-base text-slate-800 font-montserr font-semibold" />
                  </span>
                </span>
                <span className="flex items-center space-x-3 w-[95%] mx-auto">
                  <span className="w-[50%] flex flex-col items-start space-y-1">
                <h3 className="font-montserr font-semibold text-base text-slate-800">
                  Latitude
                </h3>
                <input 
                  placeholder='Latitude...'
                  value={stationLat}
                  onChange={e => setStationLat(e.target.value)}
                  type="text" 
                  className="w-[80%] h-[45px] px-3 border-b-2 outline-none focus:outline-none border-slate-800 placeholder-slate-600 bg-transparent text-base text-slate-800 font-montserr font-semibold" />
                  </span>
                  <span className="w-[50%] flex flex-col items-start space-y-1">
                  <h3 className="font-montserr font-semibold text-base text-slate-800">
                    Longitude
                  </h3>
                <input 
                  placeholder={`Longitude...`}
                  value={stationLng}
                  onChange={e => setStationLng(e.target.value)}
                  type="text" 
                  className="w-[80%] h-[45px] px-3 border-b-2 outline-none focus:outline-none border-slate-800 placeholder-slate-600 bg-transparent text-base text-slate-800 font-montserr font-semibold" />
                  </span>
                </span>
                </div>
                <footer className="h-[25%] w-full border-2 border-slate-800 flex items-center px-3 py-1">
                  <span className="w-[75%]"></span>
                  <button 
                  onClick={addStationToFirestore}
                  className="text-lg w-[25%] rounded border-2 bg-inherit border-slate-800 text-slate-800 font-montserr font-semibold hover:border-slate-600 hover:text-slate-600 transform transition-all duration-300">
                    Add station
                  </button>
                </footer>
                </div>
         
                <div className="h-[45%] w-full rounded border border-slate-700 px-4 py-2 flex flex-col items-start overflow-y-scroll space-y-7 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-100">
                  {stationsDocs && stationsDocs?.map(station => (
                    <StationSnap 
                    stationId={station?.id}
                    />
                  ))}
                </div>
                <footer className="w-full h-[10%] px-3 py-1 flex items-center space-x-3 border-t border-slate-800">
                  {Array.from({length: totalPageStations}, (_, index) => index + 1).map(
                        (stationPage) => (
                          <button 
                          key={stationPage}
                          onClick={() => handlePageChangeStations(stationPage)}
                          disabled={stationPage === currentPageStations || loadingStations}
                          className='
                          text-base
                            text-slate-800 
                            font-montserr 
                            font-bold 
                            border 
                            border-sky-800 
                            rounded-full 
                            px-3 
                            py-1
                            active:text-slate-600
                            active:border-slate-600
                            active:border-2
                          '
                          >
                            {stationPage}
                          </button>
                      ))}
                </footer>
                </>
                )}                

              {/**display stations within the firestore */}
             
              {addAdminsTab && (
                  <>
                  <div className="h-[90%] w-full flex flex-col items-start space-y-2">
                  <div className="h-[50%] w-full border-slate-800 flex flex-col items-start">
                    <header className="w-full h-[14%] bg-inherit border-b border-slate-800 px-3 py-1">
                      <h3 className="font-montserr font-bold text-slate-800 text-base">
                        Users
                      </h3>
                    </header>
                    <div className="w-full h-[72%] flex flex-col items-start bg-inherit overflow-y-scroll space-y-3 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-200">
                      {userDocs && userDocs?.map(doc => (
                        <EazeMoUsers 
                        userId={doc?.id}
                        />
                      ))}
                    </div>
                    <footer className="w-full h-[14%] px-3 py-1 bg-inherit flex items-center border-t border-slate-800">
                      {Array.from({length: totalPageUsers}, (_, index) => index + 1).map(
                        (userPage) => (
                          <button 
                          key={userPage}
                          onClick={() => handlePageChange(userPage)}
                          disabled={userPage === currentPageUser || loadingUsers}
                          className='
                          text-base
                            text-slate-800 
                            font-montserr 
                            font-bold 
                            border 
                            border-sky-800 
                            rounded-full 
                            px-3 
                            py-1
                            active:text-slate-600
                            active:border-slate-600
                            active:border-2
                          '
                          >
                            {userPage}
                          </button>
                      ))}
                    </footer>
                  </div>
                  <div className="h-[50%] w-full border-y-2 border-slate-800 flex flex-col items-start">
                    <header className="w-full h-[14%] border-b border-slate-800 px-3 py-1">
                      <h3 className="font-montserr font-bold text-slate-800 text-base">
                        Admins
                      </h3>
                    </header>
                    <div className="w-full h-[72%] flex flex-col items-start bg-inherit overflow-y-scroll space-y-3 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-200">
                      {adminDocs && adminDocs?.map(admin => (
                        <EazeMoAdmins 
                        adminId={admin?.id}
                        />
                      ))}
                    </div>
                    <footer className=" border-t border-slate-800 w-full h-[14%] px-3 py-1 flex items-center bg-inherit">
                      {Array.from({length: totalPageAdmins}, (_, index) => index + 1).map(
                        (adminPage) => (
                          <button 
                          key={adminPage}
                          onClick={() => handlePageChangeAdmin(adminPage)}
                          disabled={adminPage === currentPageAdmin || loadingAdmins}
                          className='
                          text-base
                            text-slate-800 
                            font-montserr 
                            font-bold 
                            border 
                            border-sky-800 
                            rounded-full 
                            px-3 
                            py-1
                            active:text-slate-600
                            active:border-slate-600
                            active:border-2
                          '
                          >
                            {adminPage}
                          </button>
                      ))}
                    </footer>
                  </div>
                </div>

                </>
                )}
            </div>
          </div>
          <div onClick={() => setAdminPriv(false)} className="h-[7%]"></div>
        </div>
        <div onClick={() => setAdminPriv(false)} className="h-full w-[5%]"></div>
      </div>
    )}
    {stationsOptions && (
      <div className="forMobile fixed inset-0 z-50 h-full w-full bg-slate-800 bg-opacity-[0.26] overflow-hidden items-center">
        <div onClick={() => setStationsOptions(false)} className="h-full w-[2.5%]"></div>
        <div className="h-full w-[95%] flex flex-col items-center">
          <div onClick={() => setStationsOptions(false)} className="h-[5%] w-full"></div>
          <MapPageSidebarMob 
          onFocusStation={handleFocusStations}
          onRouteFound={handleRouteFound}
          setStationsOptions={setStationsOptions}
          stationsOptions={stationsOptions}
          subscribeModal={subscribeModal}
          setSubscribeModal={setSubscribeModal}
          />
          <div onClick={() => setStationsOptions(false)} className="h-[5%] w-full"></div>
        </div>
        <div onClick={() => setStationsOptions(false)} className="h-full w-[2.5%]"></div>
      </div>
    )}
    {subscribeModal && (
      <div className="h-screen w-screen fixed z-50 inset-0 overflow-hidden flex items-center bg-slate-800 bg-opacity-[0.35]">
        <div onClick={() => setSubscribeModal(false)} className="h-full w-[5%]"></div>
        <div className="h-full w-[90%] flex flex-col items-center">
          <div onClick={(() => setSubscribeModal(false))} className="h-[5%] w-full"></div>
          <div className="h-[90%] w-full">
            <ConfirmModal />
          </div>
          <div onClick={(() => setSubscribeModal(false))} className="h-[5%] w-full"></div>
        </div>
        <div onClick={() => setSubscribeModal(false)} className="h-full w-[5%]"></div>
      </div>
    )}
    </>
  )
}


export default MapPage