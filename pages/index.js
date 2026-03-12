//front-end
"use client";
import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { CashIcon, EzPocketDesktop, InitFooter, InitHeader, MainHeader, MapIcon, NavIcon, NFCIcon, QRIcon, SidebarMob, TrainIcon, UsersIcon, WalletIcon } from '../components'
import MapPage from './indexInit';
import MobileMainHeader from '../components/header/MobileMainHeader';
import MainFooter from '../components/footer/MainFooter';
import InitLogin from '../components/body/for-desktop/init-login/InitLogin';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'
import StationSnap from '../components/body/for-desktop/eazemo-map/StationSnap';
import EzXpress from '../components/body/for-desktop/ez-xpress/EzXpress';
import EzPocket from '../components/body/for-desktop/ez-pocket/EzPocket';
import ConfirmModal from '../components/body/for-desktop/sidebar/confirm-modal/ConfirmModal';
import EzPocketMap from './ezIndex';
import EzPocketMapDesktop from './ezIndexDesktop';
//back-end
import { creds, store, storage } from '../backend_services/firebase';
import {useAuthState} from 'react-firebase-hooks/auth'
import Image from 'next/image';

export default function Home () {
  const [user] = useAuthState(creds)

    const [adminPriv, setAdminPriv] = useState(false)
    //for adding stations to the firestore collection "stations"
    const [stationOptionsOpen, setStationsOptionsOpen] = useState(false)
    const [stationsOptions, setStationsOptions] = useState(true)
    const [stationsOptionsClose, setStationsOptionsClose] = useState(false)   
    const [stationName, setStationName] = useState("")
    const [lineId, setLineId] = useState("")
    const [stationCity, setStationCity] = useState("")
    const [stationLat, setStationLat] = useState(0)
    const [stationLng, setStationLng] = useState(0)
     function handleFocusStations(point){
        setRouteCoords([])
        setEndpoints(null)
        setFocusPoint(point)
      }
    function handleRouteFound(path, meta){
    setFocusPoint(null)
    setRouteCoords(Array.isArray(path) ? path : [])
    setEndpoints(meta || null)
  }
    
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

  //for use of tap modal
  const [openTapModal, setOpenTapModal] = useState(false)
  const [tapModal, setTapModal] = useState(false)
  const [closeTapModal, setCloseTapModal] = useState(false)
  //for use of subscription plan
  const [openSubModal, setOpenSubModal] = useState(false)
  const [subModal, setSubModal] = useState(false)
  const [closeSubModal, setCloseSubModal] = useState(false)
  //for opening map modal
  const [openMapModal, setOpenMapModal] = useState(false)
  const [mapModal, setMapModal] = useState(false)
  const [closeMapModal, setCloseMapModal] = useState(false)
  
  useEffect(() => {
    if(mapModal && !openMapModal){
      setTimeout(() => {
        setOpenMapModal(true)
      }, 10)
    } else if(!mapModal){
      setOpenMapModal(false)
    }
  }, [mapModal])

    const [isUserAnEditor, setIsUserAnEditor] = useState(false)
      const checkUserIfEditor = async() => {
          if(user){
              try{
                  const querySnapshot = await store.collection('eazemo_admins')
                  .where('adminEmail', '==', user?.email)
                  .get()
  
                  const isEditor = querySnapshot?.size > 0;
                  setIsUserAnEditor(isEditor)
              }catch(error){
                  console.error('Error checking editor status >>>', error)
              }
          }
      }
  
      useEffect(() => {
          checkUserIfEditor()
      }, [user])

  const [ifUserIsSub, setIfUserIsSub] = useState(false)

  const checkUserIfSub = async() => {
    if(user){
      try{
        const subSnapshot = await store.collection('eazemo_subs')
        .where('email', '==', user?.email)
        .get()

        const isSub = subSnapshot?.size > 0;
        setIfUserIsSub(isSub)
      }catch(error){
        console.error("Error checking subscription status >>>", erro)
      }
    }
  }

  useEffect(() => {
    checkUserIfSub()
  }, [user])

  //for eazemoWallet modal
  const [openEzPocket, setOpenEzPocket] = useState(false)
  const [ezPocketModal, setEZPocketModal] = useState(false)
  const [closeEzPocket, setCloseEzPocket] = useState(false)
  
  useEffect(() => {
    if(ezPocketModal && !openEzPocket){
      setTimeout(() => {
        setOpenEzPocket(true)
      }, 10)
    } else if(!ezPocketModal){
      setOpenEzPocket(false)
    }
  }, [ezPocketModal])

  //for eazeMoSubs modal
  const [openEzXpress, setOpenEzXpress] = useState(false)
  const [ezXpressModal, setEzxpressModal] = useState(false)
  const [closeEzXpress, setCloseEzXpress] = useState(false)

  useEffect(() => {
    if(ezXpressModal && !openEzXpress){
      setTimeout(() => {
        setOpenEzXpress(true)
      }, 10)
    } else if(!ezXpressModal){
      setOpenEzXpress(false)
    }
  }, [ezXpressModal])

  const [openShowUserInfoMob, setOpenShowUserInfoMob] = useState(false)
  const [showUserInfoMob, setShowUserInfoMob] = useState(false)
  const [closeShowUserInfoMob, setCloseShowUserInfoMob] = useState(false)

  useEffect(() => {
    if(showUserInfoMob && !openShowUserInfoMob){
      setTimeout(() => {
        setOpenShowUserInfoMob(true)
      }, 10)
    } else if(!showUserInfoMob){
      setOpenShowUserInfoMob(false)
    }
  }, [showUserInfoMob])


  const [openTopUp, setOpenTopUp] = useState(false)
  const [topUpModal, setTopUpModal] = useState(false)
  const [closeTopUp, setCloseTopUp] = useState(false)

  useEffect(() => {
    if(topUpModal && !openTopUp){
      setTimeout(() => {
        setOpenTopUp(true)
      }, 10)
    } else if(!topUpModal){
      setOpenTopUp(false)
    }
  }, [topUpModal])


  const [ezPocketMap, setEzPocketMap] = useState(false)

  //for ezPocket tabs
  const [ezPocketTab, setEzPocketTab] = useState(true)
  const [ezWalletTab, setEzWalletTab] = useState(true)
  const [ezRideTab, setEzRideTab] = useState(false)
  const [ezMapTab, setEzMapTab] = useState(false)

  const signOut = () => {
    creds.signOut();
  }

  return (
    <>
     <div className="h-screen w-screen overflow-hidden bg-slate-100">
      <Head>
        <title>EazeMo - Pasahero Payment App</title>
      </Head>
      {user ? (
        <>
          <MainHeader 
          adminPriv={adminPriv}
          setAdminPriv={setAdminPriv}
          />
          {/** 
           * 
           * 
           * 
           * ----- for desktop screens 
           * 
           * 
           * 
           * ------ */}
              <main className="h-[92%] w-[85%] mx-auto lg:flex flex-col items-center justify-evenly hidden">
                <div className="h-[98%] m-auto w-full flex flex-col items-center bg-amber-500 rounded bg-opacity-[0.53] border-2 border-slate-800">
                  
                  <div className="h-[98%] w-full mx-auto flex flex-col items-center bg-slate-100 bg-opacity-[0.07]">
                    {ezPocketTab && (
                      <>
                        {ezWalletTab && (
                          <EzPocketDesktop 
                    confirmModal={topUpModal}
                    setConfirmModal={setTopUpModal}
                    setEzPocketMap={setEzPocketMap}
                    ezPocketModal={ezPocketModal}
                    setEzPocketModal={setEZPocketModal}
                    ezRideTab={ezRideTab}
                    setEzRideTab={setEzRideTab}
                    ezWalletTab={ezWalletTab}
                    setEzWalletTab={setEzWalletTab}
                    />
                        )}
                      </>
                    )}
                    {ezRideTab && (
                          <div className="h-full w-[90%] flex items-center mx-auto">
                          <EzPocketMapDesktop 
                          mapModal={mapModal}
                          closeMapModal={closeMapModal}
                          openMapModal={openMapModal}
                          setCloseMapModal={setCloseMapModal}
                          setMapModal={setMapModal}
                          setOpenMapModal={setOpenMapModal}
                          ezRideTab={ezRideTab}
                          ezWalletTab={ezWalletTab}
                          setEzRideTab={setEzRideTab}
                          setEzWalletTab={setEzWalletTab}
                          />
                          </div>
                        )}
                  </div>
                </div>

              </main>
               {/**
                 * 
                 * 
                 * ----- for mobile screens ----- 
                 * 
                 * 
                 * 
                 * */}
              <MobileMainHeader />
              <main className="lg:hidden h-[84%] w-[98%] mx-auto">
                <div className="h-full w-full bg-amber-500 bg-opacity-[0.53] flex items-center justify-evenly rounded border-2 border-slate-800 lg:hidden">
                  {(!ifUserIsSub || isUserAnEditor || user?.email == "rumlowb@gmail.com") ? (
                    <button 
                    onClick={() => setEZPocketModal(true)}
                    className={`focus:outline-none h-[30%] w-[33%] border-2  rounded-md  border-slate-800 flex flex-col items-center justify-center bg-inherit hover:bg-slate-200 hover:border-slate-600 transform transition-all duration-300 ease-in-out cursor-pointer text-lg ${(ifUserIsSub || isUserAnEditor || user?.email == "rumlowb@gmail.com") && "hover:bg-amber-500"}`}>
                    <WalletIcon 
                    className='text-[90px]'
                    />
                    <p className="font-stack-head font-normal text-lg text-slate-800">
                      EZPocket
                    </p>
                  </button>
                  ): (
                    <button 
                    onClick={() => setEZPocketModal(true)}
                    className="focus:outline-none h-[30%] w-[33%] border-2  rounded-md  border-slate-800 flex flex-col items-center justify-center bg-inherit hover:bg-amber-300 hover:border-slate-600 transform transition-all duration-300 ease-in-out cursor-pointer text-lg">
                    <WalletIcon 
                    className='text-[90px]'
                    />
                    <p className="font-stack-head font-normal text-lg text-slate-800">
                      EZPocket
                    </p>
                  </button>
                  )}
                  
                  <button 
                  disabled={mapModal}
                  onClick={() => setMapModal(true)}
                  className={`focus:outline-none h-[30%] w-[33%] border-2 rounded-md border-slate-800 flex flex-col items-center justify-center bg-inherit hover:bg-slate-200 hover:border-slate-600 transform transition-all duration-300 ease-in-out cursor-pointer text-lg ${(ifUserIsSub || isUserAnEditor || user?.email == "rumlowb@gmail.com") && "hover:bg-amber-500"} `}>
                    <MapIcon 
                    className='text-[90px]'
                    />
                    <p className="font-stack-head font-normal text-lg text-slate-800">
                      EZ-Map
                    </p>
                  </button>
                </div>
              </main>
              <MainFooter 
              showUserInfoMob={showUserInfoMob}
              setShowUserInfoMob={setShowUserInfoMob}
              />
        </>
      ): (
        <>
              {/**
               * 
               * 
               * 
               * 
               * for desktop screen 
               * 
               * 
               * 
               * 
               * 
               * */}
               <InitHeader />
               <main className="h-[92%] w-full mx-auto lg:flex items-center hidden">
                <div className="w-[50%] h-full flex flex-col items-start">
                  <div className="h-[50%] w-full bg-gradient-to-br from-slate-100 to-amber-500">
                    <div className="h-full bg-slate-100 bg-opacity-[0.3]"></div>
                  </div>
                  <div className="h-[50%] w-full bg-gradient-to-tr from-slate-100 to-amber-500">
                     <div className="h-full bg-slate-100 bg-opacity-[0.3]"></div>
                  </div>
                </div>
                <div className="h-full w-[50%] flex flex-col items-center justify-center bg-slate-200 bg-opacity-[0.68]">
                  <InitLogin />
                </div>
              </main>
               {/**
                * 
                * 
                * 
                * 
                * 
                for mobile screen
                *
                *
                *
                *
                */}
                <main className="lg:hidden h-full w-full mx-auto flex flex-col items-center overflow-hidden bg-gradient-to-br from-slate-200 to-amber-500">
                  <div className="h-[92%] w-full bg-yellow-400 bg-opacity-[0.75] flex flex-col items-center justify-center">
                    <Image 
                    src="/eazemo_logo.jpg"
                    alt="EAZEMO_LOGO"
                    width={400}
                    height={300}
                    />
                  </div>
                   <InitFooter />
                </main>
              </>
      )}
    </div> 
        {adminPriv && (
          <div className="h-screen w-screen fixed z-50 inset-0 overflow-hidden flex items-center bg-slate-800 bg-opacity-[0.35]">
            <div onClick={() => setAdminPriv(false)} className="h-full w-[5%]"></div>
            <div className="h-full w-[90%] flex flex-col items-center">
              <div onClick={() => setAdminPriv(false)} className="h-[7%]"></div>
              <div className="h-[86%] w-full mx-auto bg-slate-100 rounded-md border-2 border-slate-800 flex flex-col items-start">
                <header className="h-[8%] w-full border-b-2 border-slate-800 flex items-center justify-between px-3 py-1">
                  <h3 className="font-stack-head font-semibold text-slate-800 text-xl">
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
                        <h3 className="font-stack-head font-semibold text-slate-800 text-lg">
                        Station name:
                      </h3>
                      </span>
                      <input 
                      placeholder={`Name of the station...`}
                      value={stationName}
                      onChange={e => setStationName(e.target.value)}
                      type="text" 
                      className="w-[80%] h-[45px] px-3  border-b-2 outline-none focus:outline-none border-slate-800 placeholder-slate-600 bg-transparent text-slate-800 font-stack-head font-semibold" />
                    </span>
                    <span className="flex items-center space-x-3 w-[95%] mx-auto">
                      <span className="w-[50%] flex items-center space-x-1">
                        
                    <input 
                      placeholder={`Within what city...`}
                      value={stationCity}
                      onChange={e => setStationCity(e.target.value)}
                      type="text" 
                      className="w-[80%] h-[45px] px-3 border-b-2 outline-none focus:outline-none border-slate-800 placeholder-slate-600 bg-transparent text-base text-slate-800 font-stack-head font-semibold" />
                      </span>
                      <span className="w-[50%] flex items-center space-x-1">
                      
                    <input 
                      placeholder={`Line id (format: lrt1, lrt2, mrt3, etc...)`}
                      value={lineId}
                      onChange={e => setLineId(e.target.value)}
                      type="text" 
                      className="w-[80%] h-[45px] px-3 border-b-2 outline-none focus:outline-none border-slate-800 placeholder-slate-600 bg-transparent text-base text-slate-800 font-stack-head font-semibold" />
                      </span>
                    </span>
                    <span className="flex items-center space-x-3 w-[95%] mx-auto">
                      <span className="w-[50%] flex flex-col items-start space-y-1">
                    <h3 className="font-stack-head font-semibold text-base text-slate-800">
                      Latitude
                    </h3>
                    <input 
                      placeholder='Latitude...'
                      value={stationLat}
                      onChange={e => setStationLat(e.target.value)}
                      type="text" 
                      className="w-[80%] h-[45px] px-3 border-b-2 outline-none focus:outline-none border-slate-800 placeholder-slate-600 bg-transparent text-base text-slate-800 font-stack-head font-semibold" />
                      </span>
                      <span className="w-[50%] flex flex-col items-start space-y-1">
                      <h3 className="font-stack-head font-semibold text-base text-slate-800">
                        Longitude
                      </h3>
                    <input 
                      placeholder={`Longitude...`}
                      value={stationLng}
                      onChange={e => setStationLng(e.target.value)}
                      type="text" 
                      className="w-[80%] h-[45px] px-3 border-b-2 outline-none focus:outline-none border-slate-800 placeholder-slate-600 bg-transparent text-base text-slate-800 font-stack-head font-semibold" />
                      </span>
                    </span>
                    </div>
                    <footer className="h-[25%] w-full border-2 border-slate-800 flex items-center px-3 py-1">
                      <span className="w-[75%]"></span>
                      <button 
                      onClick={addStationToFirestore}
                      className="text-lg w-[25%] rounded border-2 bg-inherit border-slate-800 text-slate-800 font-stack-head font-semibold hover:border-slate-600 hover:text-slate-600 transform transition-all duration-300">
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
                                font-stack-head 
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
                          <h3 className="font-stack-head font-bold text-slate-800 text-base">
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
                                font-stack-head 
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
                          <h3 className="font-stack-head font-bold text-slate-800 text-base">
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
                                font-stack-head 
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
    {mapModal && (
      <div 
      onTransitionEnd={() => {
        if(closeMapModal){
          setMapModal(false)
          setCloseMapModal(false)
        }
      }}
      className={`h-screen w-screen flex items-center fixed inset-0 z-50 transform transition-all duration-200 ease-in-out ${(openMapModal && !closeMapModal) ? 'translate-y-0' : '-translate-y-full' }`}>
        <MapPage 
        openMapModal={openMapModal}
        setOpenMapModal={setOpenMapModal}
        mapModal={mapModal}
        setMapModal={setMapModal}
        closeMapModal={closeMapModal}
        setCloseMapModal={setCloseMapModal}
        />
      </div>
    )}
        {ezPocketModal && (
      <div className="h-screen w-screen bg-slate-100 bg-opacity-10 fixed inset-0 z-50 flex items-center overflow-hidden">
        <div onClick={() => setCloseEzPocket(true)} className="h-full w-[7%]"></div>
        <div 
        onTransitionEnd={() => {
          if(closeEzPocket){
            setEZPocketModal(false)
            setCloseEzPocket(false)
          }
        }}
        className={`h-full w-[84%] flex flex-col items-center transform transition-all duration-300 ease-in-out ${(openEzPocket && !closeEzPocket) ? 'translate-y-0' : 'translate-y-full'}`}>
          <div onClick={() => setCloseEzPocket(true)} className="h-[6.5%] w-full"></div>
          <EzPocket 
          confirmModal={topUpModal}
          setConfirmModal={setTopUpModal}
          ezPocketModal={ezPocketModal}
          setEzPocketModal={setEZPocketModal}
          ezPocketMap={ezPocketMap}
          setEzPocketMap={setEzPocketMap}
          />
          <div onClick={() => setCloseEzPocket(true)} className="h-[6.5%] w-full"></div>
        </div>
        <div onClick={() => setCloseEzPocket(true)} className="h-full w-[7%]"></div>
      </div>
    )}
    {ezXpressModal && (
      <div className="h-screen w-screen bg-slate-100 bg-opacity-10 fixed inset-0 z-50 flex items-center overflow-hidden">
        <div onClick={() => setCloseEzXpress(true)} className="h-full w-[7%]"></div>
        <div 
        onTransitionEnd={() => {
          if(closeEzXpress){
            setEzxpressModal(false)
            setCloseEzXpress(false)
          }
        }}
        className={`h-full w-[84%] flex flex-col items-center transform transition-all duration-300 ease-in-out ${(openEzXpress && !closeEzXpress) ? 'translate-y-0' : 'translate-y-full'}`}>
          <div onClick={() => setCloseEzXpress(true)} className="h-[6.5%] w-full"></div>
          <EzXpress />
          <div onClick={() => setCloseEzXpress(true)} className="h-[6.5%] w-full"></div>
        </div>
        <div onClick={() => setCloseEzXpress(true)} className="h-full w-[7%]"></div>
      </div>
    )}
    {showUserInfoMob && (
      <div className="lg:hidden fixed inset-0 z-50 h-screen w-screen bg-slate-200 bg-opacity-[0.05] flex flex-col items-center overflow-hidden">
        <div onClick={() => setCloseShowUserInfoMob(true)} className="h-[15%] w-full"></div>
        <div 
        onTransitionEnd={() => {
        if(closeShowUserInfoMob){
          setShowUserInfoMob(false)
          setCloseShowUserInfoMob(false)
        }
      }}
        className={`h-[85%] w-[95%] mx-auto flex flex-col items-center bg-amber-500 rounded-xl border border-slate-800 transform transition-all duration-200 ease-in-out ${(openShowUserInfoMob && !closeShowUserInfoMob) ? '-translate-y-0' : 'translate-y-full' }`}>
          <header className="h-[10%] w-full px-3 py-1 bg-slate-800 border-b border-amber-500 flex items-center">
            <h3 className="font-stack-head font-semibold text-lg text-amber-500">
              User Information
            </h3>
          </header>
          <main className="h-[90%] w-full border border-slate-800 flex flex-col items-center space-y-3 py-1">
            <div className="h-[280px] w-[95%] mx-auto bg-slate-800 rounded-xl border-2 border-amber-100 flex flex-col items-start px-3 py-1">
              <span className="h-[50%] w-full">
                <img src={user?.photoURL} alt="" className="h-[120px] w-[120px] mx-auto rounded-3xl" />
              </span>
              <span className="h-[50%] w-full flex items-center">
                <span className="h-full w-[50%] flex flex-col items-start px-3 py-1">
                  <h3 className="font-stack-head font-semibold text-amber-500 text-lg">
                    {user?.displayName}
                  </h3>
                  <h3 className="font-stack-head font-semibold text-amber-500 text-sm">
                    {user?.email}
                  </h3>
                </span>
                <span className="h-full w-[50%] flex flex-col items-end px-3 py-1">
                  {isUserAnEditor && (
                    <h3 className="font-stack-head font-semibold text-amber-500 text-sm">
                    Editor
                  </h3>
                  )}
                </span>
              </span>
            </div>
            {(isUserAnEditor || user?.email == "rumlowb@gmail.com") && (
              <button 
              onClick={() => {
                setAdminPriv(true)
                setCloseShowUserInfoMob(true)
              }}
              className="w-[95%] h-[60px] mx-auto border border-slate-800 text-slate-800 rounded-lg bg-inherit font-stack-head font-semibold hover:bg-slate-800 hover:border-amber-500 hover:text-amber-500 transform transition-all duration-300 ease-in-out">
                Admin privileges
              </button>
              )}
            {(user) && (
              <button 
              onClick={() => {
                signOut()
                setCloseShowUserInfoMob(true)
              }}
              className="w-[95%] h-[60px] mx-auto border border-slate-800 text-slate-800 rounded-lg bg-inherit font-stack-head font-semibold hover:bg-slate-800 hover:border-amber-500 hover:text-amber-500 transform transition-all duration-300 ease-in-out">
                Sign out
              </button>
              )}
          </main>
        </div>
      </div>
    )}
        {topUpModal && (
      <div className="h-screen w-screen fixed z-50 inset-0 overflow-hidden flex items-center bg-slate-800 bg-opacity-[0.35]">
        <div onClick={() => setTopUpModal(false)} className="h-full w-[5%]"></div>
        <div className="h-full w-[90%] flex flex-col items-center">
          <div onClick={(() => setTopUpModal(false))} className="h-[5%] w-full"></div>
          <div className="h-[90%] w-full">
            <ConfirmModal />
          </div>
          <div onClick={(() => setTopUpModal(false))} className="h-[5%] w-full"></div>
        </div>
        <div onClick={() => setTopUpModal(false)} className="h-full w-[5%]"></div>
      </div>
    )}
    {ezPocketMap && (
      <div className="h-screen w-screen fixed z-50 inset-0 overflow-hidden flex flex-col items-center bg-slate-800 bg-opacity-[0.35]">
        <div onClick={() => setEzPocketMap(false)} className="h-[10%] w-full"></div>
        <div className="h-[80%] w-full flex items-center">
          <div onClick={() => setEzPocketMap(false)} className="h-full w-[2%]"></div>
          <div className="h-full w-[96%] flex items-center">
            <EzPocketMap 
                    openMapModal={openMapModal}
        setOpenMapModal={setOpenMapModal}
        mapModal={mapModal}
        setMapModal={setMapModal}
        closeMapModal={closeMapModal}
        setCloseMapModal={setCloseMapModal}
            />
          </div>
          <div onClick={() => setEzPocketMap(false)} className="h-full w-[2%]"></div>
        </div>
        <div onClick={() => setEzPocketMap(false)} className="h-[10%] w-full"></div>
      </div>
    )}
    </>
  )
}

