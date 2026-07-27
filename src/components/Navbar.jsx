import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    // fixed bottom-0 keeps it stuck to the bottom of the screen
    <div className='fixed bottom-0 w-full max-w-md bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50'>
        <div className='flex justify-around items-center h-16'>
            <Link to={"/"} className="flex flex-col items-center text-stone-600 hover:text-orange-600 font-medium">
              <span className="text-xl mb-1">🏪</span>
              <span className="text-xs">Home</span>
            </Link>
            
            <Link to={"/dashboard"} className="flex flex-col items-center text-stone-600 hover:text-orange-600 font-medium">
              <span className="text-xl mb-1">📊</span>
              <span className="text-xs">Dashboard</span>
            </Link>
            
            <Link to={"/khata"} className="flex flex-col items-center text-stone-600 hover:text-orange-600 font-medium">
              <span className="text-xl mb-1">📓</span>
              <span className="text-xs">Khata</span>
            </Link>
        </div>
    </div>
  )
}

export default Navbar;