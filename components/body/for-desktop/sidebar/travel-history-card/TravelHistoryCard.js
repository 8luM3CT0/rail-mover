//front-end
import React from 'react'
//back-end
import { creds, store, provider } from '../../../../../backend_services/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'

function TravelHistoryCard({stationId}) {
  const [user] = useAuthState(creds)
  const [stationDoc, stationLoading, stationError] = useDocument(
    store?.collection('stations').doc(stationId)
  )

  return (
    <div>
         <div className="min-h-[80px] max-h-[120px] flex flex-col items-start min-w-[240px] max-w-[280px] mx-auto rounded border-2 border-slate-800">
          <header className="w-full flex items-center px-3 py-1 border-b-2 border-slate-800">
            <h3 className="font-montserr font-semibold text-slate-600 text-xs">
              Station #
            </h3>
          </header>
          <div className="w-full flex flex-col items-start px-3 py-1">
            <h3 className="font-montserr font-semibold text-slate-900 text-base">
              Station name
            </h3>
            <h3 className="font-montserr font-semibold text-slate-600 text-sm">
              Station city
            </h3>
          </div>
         </div>
    </div>
  )
}

export default TravelHistoryCard