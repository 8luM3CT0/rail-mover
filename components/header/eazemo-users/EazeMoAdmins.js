//front-end
import React from 'react'
//back-end
import { creds, store, provider } from '../../../backend_services/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useDocument, useCollection } from 'react-firebase-hooks/firestore'
import { useEffect, useState } from 'react'
import { PersonAddIcon } from '../..'

function EazeMoAdmins({adminId}) {
  const [user] = useAuthState(creds)

  const [adminDoc, adminLoading, adminError] = useDocument(
    store?.collection('eazemo_admins').doc(adminId)
  )

  
    return (
    <div 
    key={adminDoc?.id}
    className='w-[80%] mx-auto min-h-[120px] max-h-[150px] flex items-center rounded bg-slate-200 border-2 border-slate-800 hover:bg-slate-300 hover:border-slate-600 transform transition-all duration-300 ease-in-out cursor-pointer'>
      <span className="w-[65%] h-full flex items-center space-x-2 px-3 py-1">
        <img 
        src={adminDoc?.data()?.adminPic} 
        alt="" 
        className="h-[60px] w-[60px] rounded border border-slate-800" />
        <span className="flex flex-col items-start">
          <h1 className="font-montserr font-normal text-xl text-slate-800">
            {adminDoc?.data()?.adminName}
          </h1>
          <h1 className="font-montserr font-bold text-base text-slate-900">
            {adminDoc?.data()?.adminEmail}
          </h1>
        </span>
      </span>
      <span className="w-[35%] h-full flex items-center space-x-2 px-3 py-1">
      </span>
    </div>
  )
}

export default EazeMoAdmins
