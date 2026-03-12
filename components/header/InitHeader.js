//front-end
import React from 'react'
import { HistoryIcon, MapIcon, ReceiptIcon, UserIcon, DownIcon, UpIcon } from '..'
//back-end
import {useEffect, useState} from 'react'
import { useRouter } from 'next/router'
import {creds, store, provider, storage} from '../../backend_services/firebase'
import {useCollection, useDocument} from 'react-firebase-hooks/firestore'
import {useAuthState} from 'react-firebase-hooks/auth'

function InitHeader() {
    const router = useRouter()

   

  return (
    <>
   <header className="h-[8%] w-full bg-zinc-900 bg-opacity-[0.93] lg:flex items-center hidden">
        <div className="h-full w-full bg-slate-800 bg-opacity-[0.35] flex items-center px-3 py-1 justify-between">
            <button 
            disabled={router.pathname == '/'}
            onClick={() => router.push('/')} className="flex items-center space-x-3 text-slate-100 hover:text-slate-500 transform transition-all duration-300 ease-in-out group">
                <h3 className="font-stack-head font-semibold text-lg">
                    EazeMo
                </h3>
            </button>
            
        </div>
    </header>
    </>
  )
}

export default InitHeader
