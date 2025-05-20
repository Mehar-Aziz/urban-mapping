'use client'

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Plus, Home, Map, HelpCircle, User } from "lucide-react"
import { useState, useEffect } from "react"
import CreateProjectModal from "./home/CreateProjectModal"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  // Check screen size on mount and when window resizes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkScreenSize()

    // Add event listener
    window.addEventListener('resize', checkScreenSize)

    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <>
      {/* Top header with logo and desktop navigation */}
      <header className="sticky top-0 z-40 bg-white shadow-md">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          {/* Logo */}
          <div className="text-xl font-bold text-[#00674F] mx-auto md:mx-0">Geomapping</div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex space-x-6">
            <Link 
              href="/" 
              className={`${pathname === '/' ? 'text-green-800 font-medium' : 'text-gray-700'} hover:text-green-800`}
            >
              Home
            </Link>
            <Link 
              href="/main" 
              className={`${pathname === '/main' ? 'text-green-800 font-medium' : 'text-gray-700'} hover:text-green-800`}
            >
              Map
            </Link>
            <Link 
              href="/help" 
              className={`${pathname === '/help' ? 'text-green-800 font-medium' : 'text-gray-700'} hover:text-green-800`}
            >
              Help
            </Link>
          </nav>

          {/* Right-side actions for desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Create Project
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer h-10 w-10">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/profile" passHref legacyBehavior>
                  <DropdownMenuItem asChild>
                    <a>My Profile</a>
                  </DropdownMenuItem>
                </Link>
                <Link href="/login" passHref legacyBehavior>
                <DropdownMenuItem>Logout</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          <Link 
            href="/" 
            className={`flex flex-col items-center justify-center hover:text-green-800 ${
              pathname === '/' 
                ? 'text-[#00674F] font-medium' 
                : 'text-[#00674F]'
            }`}
          >
            <Home className={`w-6 h-6 ${pathname === '/' ? 'fill-[#00674F]' : ''}`} />
            <span className="text-xs mt-1">Home</span>
            {pathname === '/' && <div className="h-1 w-6 bg-[#00674F] rounded-full mt-1"></div>}
          </Link>
          
          <Link 
            href="/main" 
            className={`flex flex-col items-center justify-center hover:text-green-800 ${
              pathname === '/main' 
                ? 'text-[#00674F] font-medium' 
                : 'text-[#00674F]'
            }`}
          >
            <Map className={`w-6 h-6 ${pathname === '/main' ? 'fill-[#00674F]' : ''}`} />
            <span className="text-xs mt-1">Map</span>
            {pathname === '/main' && <div className="h-1 w-6 bg-[#00674F] rounded-full mt-1"></div>}
          </Link>
          
          <Button 
            onClick={() => setOpen(true)}
            variant="outline"
            className="rounded-full h-12 w-12 p-0 flex items-center justify-center bg-[#00674F] text-white border-none shadow-md hover:bg-[#00674F30]"
          >
            <Plus className="w-6 h-6" />
          </Button>
          
          <Link 
            href="/help" 
            className={`flex flex-col items-center justify-center hover:text-green-800 ${
              pathname === '/help' 
                ? 'text-[#00674F] font-medium' 
                : 'text-[#00674F]'
            }`}
          >
            <HelpCircle className={`w-6 h-6 ${pathname === '/help' ? 'fill-[#00674F]' : ''}`} />
            <span className="text-xs mt-1">Help</span>
            {pathname === '/help' && <div className="h-1 w-6 bg-[#00674F] rounded-full mt-1"></div>}
          </Link>
          
          <Link 
            href="/profile" 
            className={`flex flex-col items-center justify-center hover:text-green-800 ${
              pathname === '/profile' 
                ? 'text-[#00674F] font-medium' 
                : 'text-[#00674F]'
            }`}
          >
            <User className={`w-6 h-6 ${pathname === '/profile' ? 'fill-[#00674F]' : ''}`} />
            <span className="text-xs mt-1">Profile</span>
            {pathname === '/profile' && <div className="h-1 w-6 bg-[#00674F] rounded-full mt-1"></div>}
          </Link>
        </div>
      </nav>

      {/* Add padding to the bottom of the page on mobile to account for the bottom navbar */}
      <div className="md:hidden"></div>

      <CreateProjectModal open={open} setOpen={setOpen} />
    </>
  )
}