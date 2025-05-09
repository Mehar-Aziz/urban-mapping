'use client'

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Plus, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import CreateProjectModal from "./home/CreateProjectModal"
import Link from "next/link"

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        {/* Hamburger Menu for Mobile */}
        <div className="block md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-700 hover:text-blue-600">
                <Menu className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
            <Link href="/" passHref legacyBehavior>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a>Home</a>
                </DropdownMenuItem>
              </Link>
              <Link href="/main" passHref legacyBehavior>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a>Map</a>
                </DropdownMenuItem>
              </Link>
              <Link href="/help" passHref legacyBehavior>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a>Help</a>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Logo */}
        <div className="text-xl font-bold text-[#00674F]">Geomapping</div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex space-x-6">
        <Link href="/" className="text-gray-700 hover:text-green-800">Home</Link>
          <Link href="/main" className="text-gray-700 hover:text-green-800">Map</Link>
          <Link href="/help" className="text-gray-700 hover:text-green-800">Help</Link>
        </nav>

        {/* Right-side actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setOpen(true)}
            className="hidden md:flex"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Project
          </Button>
          
          {/* Mobile-only plus button */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setOpen(true)}
            className="md:hidden"
          >
            <Plus className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer h-8 w-8 md:h-10 md:w-10">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href="/profile" passHref legacyBehavior>
                <DropdownMenuItem asChild>
                  <a>My Profile</a>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CreateProjectModal open={open} setOpen={setOpen} />
    </header>
  )
}