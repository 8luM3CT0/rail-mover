import React from 'react'

function CardHeader({children}) {
  return (
    <div className='border-b px-4 py-2 font-montserr font-semibold'>
        {children}
    </div>
  )
}

export default CardHeader
