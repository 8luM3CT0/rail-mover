//front-end
import React from 'react'
import { HistoryIcon, MapIcon, ReceiptIcon, UserIcon, DownIcon, UpIcon, AltHomeIcon } from '..'
//back-end
import {useEffect, useState} from 'react'
import { useRouter } from 'next/router'
import {creds, store, provider, storage} from '../../backend_services/firebase'
import {useCollection, useDocument} from 'react-firebase-hooks/firestore'
import {useAuthState} from 'react-firebase-hooks/auth'

function MapHeader({
    adminPriv, 
    setAdminPriv,
    openMapModal, 
    setOpenMapModal, 
    mapModal, 
    setMapModal, 
    closeMapModal, 
    setCloseMapModal
}) {
    const router = useRouter()
    const [isUserAnEditor, setIsUserAnEditor] = useState(false)
    const date = new Date().toLocaleDateString()
    const [user] = useAuthState(creds)
    const [userInfoOpening, setUserInfoOpening] = useState(false)
    const [showUserInfo, setShowUserInfo] = useState(false)
    const [userInfoClosing, setUserInfoClosing] = useState(false)
    
    const signIn = () => {
        creds.signInWithPopup(provider).catch(alert)
    }

    useEffect(() => {
        if(showUserInfo && !userInfoOpening){
            setTimeout(() => {
                setUserInfoOpening(true)
            }, 10)
        }else if(!showUserInfo){
            setUserInfoOpening(false)
        }
    }, [showUserInfo])

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

    const signOut = () => {
        creds.signOut()
    }

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

  return (
    <>
   <header className="h-[8%] w-full bg-zinc-900 bg-opacity-[0.93] top-0 z-50 fixed">
        <div className="h-full w-full bg-slate-800 bg-opacity-[0.35] flex items-center px-3 py-1 justify-between">
            <span 
            className="flex items-center space-x-3 text-slate-100 hover:text-slate-500 transform transition-all duration-300 ease-in-out group">
                <button onClick={() => setMapModal(false)} className="focus:outline-none flex flex-col items-center h-[85%] w-[45px] rounded  text-slate-200 hover:text-slate-100 hover:border-slate-100">
                    <AltHomeIcon className='text-[30px]'/>
                </button>
                <h3 className="font-stack-head font-normal text-lg">
                    EazeMo
                </h3>
            </span>
            <span className="flex items-center space-x-4">
               {!user ? (
                 <button 
                 onClick={signIn}
                 className="px-2 py-2 font-stack-head font-normal text-lg text-slate-100  hover:border-slate-500 rounded-full hover:text-slate-500 transform transition-all duration-300 ease-in-out">
                    Sign in
                </button>
               ): (
                <span 
                className="rounded-full  hover:border-slate-300 transform transition-all duration-300 ease-in-out flex items-center space-x-3">
                    <h2 className="font-stack-head font-normal text-base text-slate-100">
                        Hello, {user?.displayName}
                    </h2>
                {!showUserInfo ? (
                    <button 
                    onClick={() => setShowUserInfo(true)}
                    className="px-2 py-2 text-lg text-slate-100 border border-slate-100 hover:border-slate-500 rounded-full hover:text-slate-500 transform transition-all duration-300 ease-in-out">
                    <DownIcon />
                    </button>
                ): (
                    <button 
                    onClick={() => setShowUserInfo(false)}
                    className="px-2 py-2 text-lg text-slate-100 border border-slate-100 hover:border-slate-500 rounded-full hover:text-slate-500 transform transition-all duration-300 ease-in-out">
                    <UpIcon />
                </button>
                )}
                </span>
               )}
             
            </span>
        </div>
    </header>
    {showUserInfo && (
        <div className="h-[0.8] w-full z-50 inset-0 fixed bg-opacity-5 bg-slate-800 flex flex-col items-start justify-self-end">
            <div onClick={() => setShowUserInfo(false)} className="w-full h-[8%]"></div>
            <div className="h-[50%] w-full flex items-center">
                <span 
                onClick={() => setShowUserInfo(false)}
                className="h-full w-[50%]"></span>
                <div className="absolute right-0 mt-1 mx-2  w-[50%] h-[390px] origin-top-right flex flex-col items-start bg-slate-200 border border-slate-800 rounded-lg  shadow-lg shadow-slate-700 z-50 overflow-hidden py-2">
            <main className="w-full h-[85%] flex flex-col items-start space-y-3">
                <span className="flex items-center min-h-[120px] max-h-[180px] w-[85%] mx-auto bg-slate-800 rounded-md justify-evenly px-4">
                <h3 className="font-stack-head font-normal text-2xl text-slate-200">
                    {user?.displayName}
                </h3>
                <img 
                src={user?.photoURL} 
                alt="" 
                className="h-[60px] w-[60px] rounded-xl border-2 border-slate-800" />
            </span>
            {(user?.email == 'rumlowb@gmail.com' || isUserAnEditor) && (
                <span 
                disabled
                onClick={() => {
                    setAdminPriv(true)
                    setShowUserInfo(false)
                }}
                className="w-full h-[80px] px-3 py-2 border-y border-slate-800 hover:bg-slate-300 hover:border-slate-600 flex items-center space-x-4 transform transition-all duration-300 ease-in-out group cursor-pointer">
                <button 
                    onClick={() => setAdminPriv(true)}
                    className="px-2 py-2 text-lg text-slate-800 border border-slate-800 rounded-full group-hover:border-slate-600 transform transition-all duration-300 ease-in-out">
                </button>
                 <h3 className="font-stack-head font-normal text-lg text-slate-800  group-hover:border-slate-600 transform transition-all duration-300 ease-in-out">
                    Admin privileges
                </h3>
            </span>
            )}
            {/*<span className="w-full cursor-pointer rounded px-3 py-2 mx-auto flex items-center font-montserr font-normal text-lg text-slate-700 hover:text-slate-900 hover:bg-slate-300 transform transition-all duration-300 ease-in-out">
                Manage account
            </span>*/}
            {/**
             * <span className="w-full cursor-pointer rounded px-3 py-2 mx-auto flex items-center font-montserr font-normal text-lg text-slate-700 hover:text-slate-900 hover:bg-slate-300 transform transition-all duration-300 ease-in-out">
                Help
            </span>
             */}
            </main>
            <footer className="bottom-0 flex items-center justify-between w-full h-[15%] px-4">
                <span></span>
                <button 
                onClick={() => {
                    setShowUserInfo(false);
                    signOut()
                }}
                className="h-[45px] w-[40%] rounded bg-red-600 text-lg text-slate-100 font-stack-head font-normal hover:bg-red-800 hover:text-slate-50 transform transition-all duration-300 ease-in-out">
                    Sign out
                </button>
            </footer>
        </div>
            </div>
            <div 
            onClick={() => setShowUserInfo(false)}
            className="h-[40%] w-full flex items-center">
                <span className="h-full w-[50%]"></span>
                <span className="h-full w-[50%]"></span>
            </div>
        </div>
    )}
    </>
  )
}

export default MapHeader
