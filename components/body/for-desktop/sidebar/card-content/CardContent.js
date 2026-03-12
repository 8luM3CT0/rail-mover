import React from 'react'

function CardContent({children, className=""}) {
  return (
    <div className={`px-4 py-3`}>
      {children}
    </div>
  )
}

export default CardContent
