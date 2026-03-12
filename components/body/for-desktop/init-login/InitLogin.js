//front-end
import React from 'react'
//back-end
import { useEffect, useState } from 'react'
import { creds, store, provider } from '../../../../backend_services/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'

function InitLogin() {
    const [user] = useAuthState(creds)
    
        const signIn = () => {
                creds.signInWithPopup(provider).catch(alert)
            }
    
            useEffect(() => {
                if(user){
                    store.collection('eazemo_users').doc(user?.email).set({
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        loggedIn: new Date().toLocaleDateString()
                    }, {
                        merge: true
                    })
                }
            }, [user])

  return (
    <div className='h-[50%] w-[50%] bg-amber-500 rounded-xl border border-slate-800 flex flex-col items-center justify-center px-3 py-1 spacey-2'>
      <h3 className="font-stack-head font-normal text-lg text-slate-800 mx-auto">
        Welcome to EazeMo! Please log in to continue.
      </h3>
      <button 
      onClick={signIn} 
      className="h-[45px] w-[85%] rounded-xl mx-auto focus:outline-none font-stack-head font-semibold bg-slate-800 text-amber-500 hover:bg-amber-500 hover:text-slate-800 hover:border hover:border-slate-800 transform transition-all duration-300 ease-in-out">
        Log-in
      </button>
    </div>
  )
}

export default InitLogin
