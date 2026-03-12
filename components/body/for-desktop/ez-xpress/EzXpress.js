//front-end
import React from 'react'
import { NavIcon, NFCIcon, QRIcon } from '../../..'
//back-end
import { creds, store, provider } from '../../../../backend_services/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'

function EzXpress() {
    const [user] = useAuthState(creds)

  return (
    <>
     <div className="h-[87%] w-full rounded-xl flex flex-col items-start">
            <header className="h-[75px] w-full bg-yellow-400 px-3 py-1 border-2 border-slate-800 rounded-t-3xl flex items-center">
              <h3 className="font-bold text-3xl text-slate-800 font-stack-head">
                Xpress
              </h3>
            </header>
            <main className="h-[90%] w-full bg-slate-100 border-2 border-b-4 border-slate-800">
              <div className="h-[35%] w-full flex flex-col items-center">
                <div className="w-[92%] h-[95%] m-auto bg-zinc-900 rounded-3xl bg-cover bg-no-repeat">
                 <div className="h-full w-full bg-slate-200 bg-opacity-[0.05] flex flex-col items-start px-3 py-1">
                   <div className="flex flex-col items-start w-full h-[10%] px-3 py-1">
                    <h3 className="font-stack-head font-normal text-2xl text-slate-100">
                        Basic
                      </h3>
                    <h3 className="font-stack-head font-normal text-xl text-slate-100">
                        499.00
                      </h3>
                   </div>
                   <div className="flex flex-col items-start w-full h-[80%]"></div>
                   <div className="flex items-center justify-between w-full h-[10%] px-3 py-1">
                    <h3 className="font-stack-head font-normal text-lg text-slate-100">
                        08/25/2026
                      </h3>
                      <h3 className="font-stack-head font-normal text-lg text-slate-100">
                        09/24/2026
                      </h3>
                   </div>
                 </div>
                </div>
              </div>
              <div className="h-[42.5%] w-[92%] mx-auto bg-yellow-400 rounded-3xl border border-slate-800">
                <header className="bg-inherit w-full px-3 py-1 h-[45px] flex items-center border-b border-slate-800 rounded-t-3xl">
                  <p className="text-lg text-zinc-800 font-stack-head font-normal">
                    History
                  </p>
                </header>
              </div>
              <div className="h-[22.5%] w-[92%] mx-auto rounded flex flex-col items-center">
                <div className="w-full flex items-center justify-evenly px-3 py-1">
                 <span className="flex flex-col items-start space-y-2 w-[25%]">
                   <button className="focus:outline-none text-xl rounded p-2 bg-yellow-400 text-zinc-800 border border-zinc-800 font-stack-head font-light hover:bg-amber-500 hover:text-slate-800 hover:border-slate-800 transform transition-all duration-300 ease-in-out">
                    <QRIcon 
                    className='text-[30px]'
                    />
                  </button>
                   <button className="focus:outline-none text-xl rounded p-2 bg-yellow-400 text-zinc-800 border border-zinc-800 font-stack-head font-light hover:bg-amber-500 hover:text-slate-800 hover:border-slate-800 transform transition-all duration-300 ease-in-out">
                    <NFCIcon 
                    className='text-[30px]'
                    />
                  </button>
                 </span>
                 <span className="flex items-center w-[75%] h-full">
                  <button className="focus:outline-none h-[90%] w-[95%] flex justify-evenly items-center space-x-3 text-xl rounded p-2 bg-yellow-400 text-zinc-800 font-stack-head font-light border border-zinc-800 hover:bg-amber-500 hover:text-slate-800 hover:border-slate-800 transform transition-all duration-300 ease-in-out">
                    <NavIcon 
                    className='text-[30px]'
                    />
                    <p className="font-stack-head font-light">
                      Trace
                    </p>
                  </button>
                 </span>
                </div>
              </div>
            </main>
          </div> 
    </>
  )
}

export default EzXpress
