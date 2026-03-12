//front-end
import React from 'react'
import { HistoryIcon, MapIcon, ReceiptIcon, UserIcon, DownIcon, UpIcon } from '..'
//back-end
import {useEffect, useState} from 'react'
import { useRouter } from 'next/router'
import {creds, store, provider, storage} from '../../backend_services/firebase'
import {useCollection, useDocument} from 'react-firebase-hooks/firestore'
import {useAuthState} from 'react-firebase-hooks/auth'

function MainHeader({adminPriv, setAdminPriv}) {
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
   <header className="h-[8%] w-full bg-zinc-900 bg-opacity-[0.93] lg:flex items-center hidden">
        <div className="h-full w-full bg-slate-800 bg-opacity-[0.35] flex items-center px-3 py-1 justify-between">
            <button 
            disabled={router.pathname == '/'}
            onClick={() => router.push('/')} className="flex items-center space-x-3 text-slate-100 hover:text-slate-500 transform transition-all duration-300 ease-in-out group">
                <h3 className="font-stack-head font-bold text-lg">
                    EazeMo
                </h3>
            </button>
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
        <>
        <div className="hidden z-50 inset-0 fixed h-screen w-screen lg:flex flex-col bg-slate-100 bg-opacity-0">
            <div onClick={() => setShowUserInfo(false)} className="w-full h-[7%]"></div>
            <div className="h-[92%] flex items-center">
                <div onClick={() => setShowUserInfo(false)} className="w-[50%] h-full"></div>
                <div onClick={() => setShowUserInfo(false)} className="w-[50%] h-full">
                    <div className="w-full h-[50%] bg-slate-300 rounded border-2 border-slate-800 transform transition-all duration-300 ease-in-out">
                        <div className="h-[10%] w-full bg-slate-800 rounded-t flex items-center"></div>
                        <div className="h-[90%] w-full flex flex-col items-start px-3 py-1">
                            <div className="h-[70%] w-[90%] bg-slate-800 mx-auto rounded-xl flex flex-col items-start px-3 py-1">
                                <span className="w-full h-[60%] flex items-center justify-between">
                                    <img src={user?.photoURL} alt="" className="h-[120px] w-[120px] rounded-3xl border border-slate-200" />
                                    <span className="flex flex-col items-start space-y-2 px-3">
                                        <h3 className="font-stack-head font-semibold text-xl text-slate-200">
                                            {user?.displayName}
                                        </h3>
                                        <h3 className="font-stack-head font-semibold text-base text-slate-200">
                                            {user?.email}
                                        </h3>
                                    </span>
                                </span>
                                <span className="w-full h-[40%] flex items-center justify-between">
                                    {isUserAnEditor && (
                                        <h3 className="font-stack-head font-semibold text-base text-slate-200">
                                            Editor
                                        </h3>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div onClick={() => setShowUserInfo(false)} className="w-full h-[50%]"></div>
                </div>
            </div>
        </div>
        </>
    )}
    </>
  )
}

export default MainHeader
