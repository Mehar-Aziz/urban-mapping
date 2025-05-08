'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, LayoutDashboard, Users, FolderOpen } from 'lucide-react'

type SidebarProps = {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed left-0 top-0 bottom-0 w-64 bg-white shadow-md p-4 z-30
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-auto
        `}
      >
        <div className="flex items-center justify-between md:hidden mb-6">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <button 
            onClick={closeSidebar}
            className="p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        
        <h2 className="text-xl font-bold mb-6 hidden md:block">Admin Panel</h2>
        
        <nav className="flex flex-col space-y-4 text-gray-700">
          <Link
            href="/admin"
            className={`hover:text-[#00674F] p-2 rounded flex items-center ${
              pathname === '/admin' ? 'bg-[#00674F30] font-bold text-[#00674F]' : ''
            }`}
            onClick={closeSidebar}
          >
            <LayoutDashboard size={18} className="mr-2" />
            Dashboard
          </Link>

          <Link
            href="/admin/manageusers"
            className={`hover:text-[#00674F] p-2 rounded flex items-center ${
              pathname === '/admin/manageusers' ? 'bg-[#00674F30] font-bold text-[#00674F]' : ''
            }`}
            onClick={closeSidebar}
          >
            <Users size={18} className="mr-2" />
            Manage Users
          </Link>

          <Link
            href="/admin/manageprojects"
            className={`hover:text-[#00674F] p-2 rounded flex items-center ${
              pathname === '/admin/manageprojects' ? 'bg-[#00674F30] font-bold text-[#00674F]' : ''
            }`}
            onClick={closeSidebar}
          >
            <FolderOpen size={18} className="mr-2" />
            Projects
          </Link>
        </nav>
      </aside>
    </>
  )
}