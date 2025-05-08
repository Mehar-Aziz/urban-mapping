'use client'

import { Menu } from 'lucide-react'
type NavbarProps = {
  toggleSidebar: () => void;
}
export default function Navbar({ toggleSidebar }: NavbarProps) {
  return (
    <div className="flex items-center justify-between bg-white px-4 sm:px-6 py-4 shadow-md sticky top-0 z-10">
      <div className="flex items-center">
        {/* Mobile menu button */}
        <button 
          onClick={toggleSidebar}
          className="mr-4 p-1 rounded-md hover:bg-gray-100 md:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        <div className="text-xl sm:text-2xl font-bold text-[#00674F]">Geomapping</div>
      </div>
      <div className="border rounded-md px-3 py-1 sm:px-4 sm:py-2 text-gray-700 font-medium text-sm sm:text-base">
        Admin
      </div>
    </div>
  )
}