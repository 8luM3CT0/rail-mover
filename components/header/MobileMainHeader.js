import React from 'react'
import { TrainIcon } from '..'

function MobileMainHeader() {
  return (
    <header className='h-[8%] w-full flex items-center justify-evenly bg-slate-800 lg:hidden'>
      <button disabled className="h-full w-full flex items-center justify-center space-x-3 border-b-4 border-amber-500">
        <TrainIcon className="text-amber-500 text-2xl"/>
        <h3 className="text-slate-100 text-xl font-poppins font-normal">
            Train
        </h3>
      </button>
    </header>
  )
}

export default MobileMainHeader
