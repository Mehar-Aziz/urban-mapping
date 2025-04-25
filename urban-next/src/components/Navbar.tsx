'use client'

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Plus } from "lucide-react"
import { useState } from "react"
import CreateProjectModal from "./home/CreateProjectModal"
import Link from "next/link"


export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="text-xl font-bold text-[#00674F]">Geomapping</div>

        {/* Center Links */}
        <nav className="space-x-6">
  <Link href="/main" className="text-gray-700 hover:text-blue-600">Map</Link>
  <Link href="#help" className="text-gray-700 hover:text-blue-600">Help</Link>
</nav>


        {/* Right-side actions */}
        <div className="flex items-center space-x-4 ">
          <Button variant="outline" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Project
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
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
