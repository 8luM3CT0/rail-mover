//front-end
import React from 'react'
import { AltHomeIcon, MenuIcon, UserIcon } from '..'
//back-end
import { useEffect, useState } from 'react'
import { creds, store, storage } from '../../backend_services/firebase'
import { useCollection } from 'react-firebase-hooks/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useRouter } from 'next/router'
function MainFooter({adminPriv, setAdminPriv, showUserInfoMob, setShowUserInfoMob}) {
    const [user] = useAuthState(creds)
    const router = useRouter()
    //use states
    const [homeBtn, setHomeBtn] = useState(true)
    const [showActivity, setShowActivity] = useState(false)

    
  return (
    <footer className='h-[8%] w-full bg-slate-800 flex items-center justify-evenly lg:hidden'>
      <button 
      disabled={!showUserInfoMob}
      className={`h-[90%] w-[30%] flex flex-col items-center space-y-1 rounded text-amber-500 text-sm hover:text-amber-300 transform transition-all duration-300 ease-in-out ${homeBtn && 'text-amber-50 border-b-4 border-amber-50'}`}>
        <AltHomeIcon className='text-2xl' />
        <p className="font-poppins font-normal">
            Home
        </p>
      </button>
      
      <button 
      disabled={showUserInfoMob}
      onClick={() => setShowUserInfoMob(true)}
      className={`h-[90%] w-[30%] flex flex-col items-center space-y-1 rounded text-amber-500 text-sm hover:text-amber-300 transform transition-all duration-300 ease-in-out ${showUserInfoMob && 'text-amber-500 border-b-4 border-amber-500'}`}>
        <UserIcon className='text-2xl' />
        <p className="font-poppins font-normal">
            Account
        </p>
      </button>
    </footer>
  )
}

export default MainFooter
