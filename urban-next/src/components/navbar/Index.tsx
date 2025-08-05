"use client"
import React, { useState } from "react"
import { usePathname } from "next/navigation"
import { Header } from "./Header"
import CreateProjectModal from "@/components/home/CreateProjectModal"
import { MobileNavigation } from "./Header"

export default function Navbar() {
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const pathname = usePathname()

  const handleCreateProject = () => setIsCreateProjectOpen(true)

  return (
    <>
      <Header pathname={pathname} onCreateProject={handleCreateProject} />
      
      <MobileNavigation 
        pathname={pathname} 
        onCreateProject={handleCreateProject} 
      />

      {/* Mobile bottom padding spacer */}
      <div className="md:hidden" />

      <CreateProjectModal 
        open={isCreateProjectOpen} 
        setOpen={setIsCreateProjectOpen} 
      />
    </>
  )
}