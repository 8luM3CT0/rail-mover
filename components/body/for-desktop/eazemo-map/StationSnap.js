//front-end
import React from 'react'
//back-end
import { useEffect, useState } from 'react'
import { creds, store, storage } from '../../../../backend_services/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'
import { EditIcon } from '../../..'


function StationSnap({stationId}) {
    const [stationSnap] = useDocument(
        store.collection('stationsList').doc(stationId)
    )

    const [editTab, setEditTab] = useState(false)
    const [uLineId, setULineId] = useState('')
    const [uName, setUName] = useState('')
    const [uCity, setUCity] = useState('')
    const [uLat, setULat] = useState(0)
    const [uLng, setULng] = useState(0)

  const updateLineId = e => {
    e.preventDefault()
    uLineId !== '' &&   store.collection('stationsList').doc(stationId).set({
      lineId: uLineId
    }, {
      merge: true
    })
    setULineId('')
    }

    const updateName = e => {
      e.preventDefault()
    uName !== '' &&   store.collection('stationsList').doc(stationId).set({
      stationName: uName
    }, {
      merge: true
    })
    setUName('')
    }

    const updateCity = e => {
      e.preventDefault()
    uCity !== '' &&   store.collection('stationsList').doc(stationId).set({
      station: uCity
    }, {
      merge: true
    })
    setUCity('')
    }

    const updateLat = e => {
      e.preventDefault()
    uLat !== 0 &&   store.collection('stationsList').doc(stationId).set({
      stationLat: uLat
    }, {
      merge: true
    })
    setULat('')
    }

    const updateLng = e => {
      e.preventDefault()
    uLng !== 0 &&   store.collection('stationsList').doc(stationId).set({
      stationLng: uLng
    }, {
      merge: true
    })
    setULng('')
    }  

  return (
    <>
    {!editTab ? (
     <div 
    key={stationSnap?.id}
    className='min-h-[240px] max-h-[300px] w-[85%] flex flex-col items-start mx-auto rounded border border-slate-800 bg-inherit hover:border-slate-600 transform transition-all duration-300 ease-in-out cursor-pointer group'>
      <header className="w-full h-[18%] border-b-2 border-slate-800 flex items-center px-3 py-1 justify-between">
        <h3 className="font-montserr font-semibold text-base text-slate-800">
            Line #: {stationSnap?.data()?.lineId}
        </h3>
        <button 
        onClick={() => setEditTab(true)}
        className="p-3 text-lg flex flex-col items-center rounded border border-slate-800 focus:outline-none hover:border-slate-600 transform transition-all duration-300 ease-in-out">
          <EditIcon />
        </button>
      </header>
      <div className="w-full px-3 py-1 h-[82%] flex flex-col items-start space-y-2">
        <h2 className="font-montserr font-bold text-lg text-slate-800">
            {stationSnap?.data()?.stationName}
        </h2>
        <div className="w-[85%] mx-auto flex items-center justify-evenly"></div>
      </div>
    </div> 
    ) : (
      <div 
    key={stationSnap?.id}
    className='min-h-[240px] max-h-[300px] w-[85%] flex flex-col items-start mx-auto rounded border border-slate-800 bg-inherit hover:border-slate-600 transform transition-all duration-300 ease-in-out cursor-pointer group'>
      <header className="w-full h-[18%] border-b-2 border-slate-800 flex items-center justify-evenly px-3 py-1">
        <h3 className="font-montserr font-semibold text-base text-slate-800">
           Edit line # {stationSnap?.data()?.lineId}: 
        </h3>
      <span className="w-[65%] flex items-center space-x-2">
      <input 
        value={uLineId}
        onChange={e => setULineId(e.target.value)}
        type="text" 
        className="w-[55%]" />
        <button 
        onClick={updateLineId}
        className="">
          Edit
        </button>
      </span>
      <button 
        onClick={() => setEditTab(false)}
        className="p-3 text-lg flex flex-col items-center rounded border border-slate-800 focus:outline-none hover:border-slate-600 transform transition-all duration-300 ease-in-out">
          <EditIcon />
        </button>
      </header>
      <div className="w-full px-3 py-1 h-[82%] flex flex-col items-start space-y-2">
        <span className="w-full flex items-center justify-evenly">
          <h2 className="font-montserr font-bold text-base text-slate-800">
          Edit name (`{stationSnap?.data()?.stationName}`)
        </h2>
        <input 
        value={uName}
        onChange={e => setUName(e.target.value)}
        type="text" 
        className="w-[55%]" />
        <button 
        onClick={updateName}
        className="">
          Edit
        </button>
        </span>
        <div className="w-[85%] mx-auto flex flex-col items-center justify-evenly">
            <span className="w-[85%] mx-auto flex items-center">
              <h2 className="font-montserr font-bold text-base text-slate-800">
          Edit city (`{stationSnap?.data()?.stationCity}`)
        </h2>
        <input 
        value={uCity}
        onChange={e => setUCity(e.target.value)}
        type="text" 
        className="w-[55%]" />
        <button 
        onClick={updateCity}
        className="">
          Edit
        </button>
            </span>
          <span className="w-full spae-x-3 flex items-center ">
            <span className="w-[50%] mx-auto flex items-center">
              <h2 className="font-montserr font-bold text-base text-slate-800">
          Edit latitude (`{stationSnap?.data()?.stationLat}`)
        </h2>
        <input 
        value={uLat}
        onChange={e => setULat(e.target.value)}
        type="text" 
        className="w-[55%]" />
        <button 
        onClick={updateLat}
        className="">
          Edit
        </button>
            </span>
            <span className="w-[50%] mx-auto flex items-center">
              <h2 className="font-montserr font-bold text-base text-slate-800">
          Edit longitude (`{stationSnap?.data()?.stationLng}`)
        </h2>
        <input 
        value={uLng}
        onChange={e => setULng(e.target.value)}
        type="text" 
        className="w-[55%]" />
        <button 
        onClick={updateLng}
        className="">
          Edit
        </button>
            </span>
          </span>
        </div>
      </div>
    </div>
    )}
    </>
  )
}

export default StationSnap
