//front-end
import React from 'react'
//back-end
import { creds, store, provider } from '../../../../../backend_services/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'

export function Card({children, className= ""}) {
  const [user] = useAuthState(creds)
 
  return (
    <div className={`rounded-xl border bg-slate-100 shadow-lg shadow-slate-800 ${className}`}>
    {children}
    </div>
  )
}

export function CardHeader({children, className= ""}) {
  return (
    <div className={`w-full px-3 py-2 bg-slate-800 bg-opacity-40 rounded-t-md border-b border-slate-600 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({children, className= ""}) {
  return (
    <div className={`w-full px-3 py-2 font-montserr ${className}`}>
      {children}
    </div>
  )
}

