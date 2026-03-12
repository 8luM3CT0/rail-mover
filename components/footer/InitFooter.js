//front-end
import React from 'react'
import { HistoryIcon, MapIcon, ReceiptIcon, UserIcon, DownIcon, UpIcon } from '..'
//back-end
import {useEffect, useState} from 'react'
import { useRouter } from 'next/router'
import {creds, store, provider, storage} from '../../backend_services/firebase'
import {useCollection, useDocument} from 'react-firebase-hooks/firestore'
import {useAuthState} from 'react-firebase-hooks/auth'

function InitFooter() {
    const router = useRouter()
    const [user] = useAuthState(creds)

    const signIn = () => {
            creds.signInWithPopup(provider).catch(alert)
        }

        useEffect(() => {
            if(user){
                store.collection('eazemo_users').doc(user.uid).set({
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
    <>
   <footer className="h-[8%] w-full flex items-center lg:hidden">
            <button
            onClick={signIn}  
            className="h-full w-full bg-slate-800 border-t-0 border-slate-800 flex items-center justify-center space-x-3 text-amber-500 hover:text-slate-800 hover:bg-amber-500 hover:border-t transform transition-all duration-300 ease-in-out group">
                <h3 className="font-stack-head font-semibold text-lg">
                    Log in
                </h3>
            </button>
    </footer>
    </>
  )
}

export default InitFooter
