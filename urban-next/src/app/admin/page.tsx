'use client'

import { useState } from 'react'
import Navbar from '@/components/admin/AdminNav'
import Sidebar from '@/components/admin/AdminSidebar'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function AdminLayout() {
  // State to manage sidebar visibility on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }
  
  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar at the top */}
      <Navbar toggleSidebar={toggleSidebar} />
      
      {/* Main content area with sidebar and dashboard */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - will be hidden on mobile until toggled */}
        <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
        
        {/* Main content area - takes remaining width */}
        <main className="flex-1 overflow-y-auto">
          <AdminDashboard />
        </main>
      </div>
    </div>
  )
}