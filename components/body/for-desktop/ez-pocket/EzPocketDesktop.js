//front-end
import React from 'react'
import { NavIcon, NFCIcon, QRIcon, TrainIcon } from '../../..'
//back-end
import {useEffect, useState} from 'react'
import { creds, store, provider } from '../../../../backend_services/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'
import moment from 'moment/moment'

function EzPocketDesktop({
  confirmModal, 
  setConfirmModal, 
  ezPocketModal, 
  setEzPocketModal,
  setEzPocketMap,
  ezWalletTab,
  setEzWalletTab,
  ezRideTab,
  setEzRideTab
}) {
    const [user] = useAuthState(creds)
    const [topUp, setTopUp] = useState(false)

    const [walletDoc] = useDocument(
      store.collection('eazemo_wallets').doc(user?.email)
    )
    const balanceMinor = walletDoc?.data()?.balanceMinor ?? 0
    const balance = balanceMinor / 100

    const [userTravels] = useCollection(
      store.collection('eazemo_users').doc(user?.email).collection('user_rides').orderBy('createdOn', 'asc')
    )

        const [ridesQuery, setRidesQuery] = useState("")
        const [totalRidesByUser, setTotalRidesByUser] = useState(0)
        const [ridesPerPage] = useState(4)
        const [ridesDocs, setRidesDocs] = useState([])
        const [currentPageRides, setCurrentPageRides] = useState(1)
        const [loadingRides, setLoadingRides] = useState(false)
    
       useEffect(() => {
        const fetchRides = async() => {
          setLoadingRides(true)
          let userRidesRef = store.collection('eazemo_users').doc(user?.email).collection('user_rides').orderBy('createdOn', "asc")
          
          const ridesSnapshot = await userRidesRef.get()
          const ridesDocs = ridesSnapshot?.docs
    
          const totalRides = ridesDocs?.map(doc => ({
            id: doc?.id,
            ...doc?.data()
          }))
          const startInd = (currentPageRides - 1) * ridesPerPage
          const endInd = startInd + ridesPerPage
    
          setRidesDocs(totalRides?.slice(startInd, endInd))
          setTotalRidesByUser(Math.ceil(totalRides?.length / ridesPerPage))
          setLoadingRides(false)
        }
        fetchRides()
       }, [ridesQuery, currentPageRides, ridesPerPage])
    
       const handlePageChangeRides = newPage => {
        setCurrentPageRides(newPage)
       }

  return (
    <>
     <div className="h-full w-full rounded-xl flex flex-col items-start">
            <header className="h-[75px] flex items-center w-full bg-slate-100 px-3 py-1 border-2 border-slate-800">
              <h3 className="font-bold text-3xl text-slate-800 font-stack-head">
                Pocket
              </h3>
            </header>
                        <main className="h-[90%] w-full bg-slate-100 border-2 border-b-4 border-slate-800">
              <div className="h-[35%] w-full flex flex-col items-center">
                <div className="w-[92%] h-[95%] m-auto bg-zinc-900 rounded-3xl bg-cover bg-no-repeat">
                 <div className="h-full w-full bg-slate-200 bg-opacity-[0.05] flex flex-col items-start px-3 py-1">
                   <div className="flex flex-col items-start w-full h-[10%] px-3 py-1">
                      <button 
                      onClick={() => {
                        setConfirmModal(true)
                        setEzPocketModal(false)
                      }}
                      className="focus:outline-none border-b-0 border-slate-100 px-3 py-1 hover:border-b-2 transform transition-all duration-300 ease-in-out">
                        <h3 className="font-stack-head font-normal text-xl text-slate-100">
                        Top-up
                    </h3>
                      </button>
                   </div>
                   <div className="flex flex-col items-start w-full h-[70%]"></div>
                   <div className="flex items-center justify-between w-full h-[20%] px-3 py-1">
                    <h3 className="font-stack-head font-bold text-base text-slate-100">
                        {user?.displayName}
                    </h3>
                  <span className="flex flex-col items-end">
                      <h3 className="font-stack-head font-extralight text-sm text-slate-100">
                        Balance
                      </h3>
                      <h3 className="font-stack-head font-extralight text-lg text-slate-100">
                        {balance}
                      </h3>
                  </span>
                   </div>
                 </div>
                </div>
              </div>
              <div className="h-[42.5%] w-[92%] mx-auto bg-yellow-400 rounded-3xl border border-slate-800">
                <div className="h-[80%] w-full mx-auto flex flex-col items-center py-1 space-y-4 overflow-y-scroll scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-amber-300">
                    <header className="bg-inherit w-full px-3 py-1 h-[15%] flex items-center border-b border-slate-800 rounded-t-3xl">
                  <p className="text-lg text-zinc-800 font-stack-head font-normal">
                    History
                  </p>
                </header>
                <body className="h-[70%] w-full mx-auto flex flex-col items-center px-3 py-1 space-y-4 overflow-y-scroll scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-amber-300">
                    {ridesDocs && ridesDocs?.map(trav => (
                      <div 
                      key={trav?.id} 
                      className="w-[85%] mx-auto min-h-[140px] rounded-2xl bg-slate-700 bg-opacity-[0.33] border border-amber-500">
                        <header className="w-full border-b border-amber-500 h-[40px] bg-amber-300 rounded-t-2xl flex items-center space-x-2 px-3">
                          <p className="font-stack-head text-zinc-900 text-lg font-bold">
                            {trav?.stationName} - {trav?.fare}
                          </p>
                        </header>
                        <div className="h-[160px] w-full flex flex-col items-start px-3 py-2 bg-amber-600 bg-opacity-[0.22]">
                          <h3 className="font-stack-head font-semibold text-base text-amber-300">
                            {trav?.city}
                          </h3>
                        </div>
                      </div>
                    ))}
                </body>
                <footer className="h-[15%] w-full border-t border-slate-800 bg-inherit flex items-center justify-evenly overflow-y-hidden overflow-x-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-amber-400 px-3 py-1">
                  {Array.from({length: totalRidesByUser}, (_, index) => index + 1).map(
                            (ridePage) => (
                              <button 
                              key={ridePage}
                              onClick={() => handlePageChangeRides(ridePage)}
                              disabled={ridePage === currentPageRides || loadingRides}
                              className='
                              text-base
                                text-slate-800 
                                hover:bg-slate-800
                                hover:text-amber-400
                                font-stack-head 
                                font-bold 
                                rounded-full 
                                px-3 
                                py-1
                                active:text-amber-200
                                transform
                                transition-all
                                duration-300
                                ease-in-out
                                min-h-[30px]
                                min-w-[30px]
                              '
                              >
                                {ridePage}
                              </button>
                          ))}
                </footer>
                </div>
              </div>
              <div className="h-[22.5%] w-[92%] mx-auto rounded flex flex-col items-center">
                <div className="w-full flex flex-col items-start space-y-2 px-3 py-1">
                 
                 <span className="flex items-center w-full h-full">
                  <button 
                  onClick={() => {
                    setEzPocketMap(true)
                  }}
                  className="focus:outline-none h-[90%] w-[95%] mx-auto flex justify-center items-center space-x-3 text-xl rounded p-2 bg-yellow-400 text-zinc-800 font-stack-head font-light border border-zinc-800 hover:bg-amber-500 hover:text-slate-800 hover:border-slate-800 transform transition-all duration-300 ease-in-out">
                    <TrainIcon 
                    className='text-[30px]'
                    />
                    <p className="font-stack-head font-light">
                      Ride
                    </p>
                  </button>
                 </span>
                </div>
              </div>
            </main>
          </div> 
    </>
  )
}

export default EzPocketDesktop
