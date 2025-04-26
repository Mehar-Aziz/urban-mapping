'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white shadow-md p-6 h-128">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <nav className="flex flex-col space-y-4 text-gray-700">
        <Link
          href="/admin"
          className={`hover:text-[#00674F] p-2 rounded ${
            pathname === '/admin' ? 'bg-[#00674F30] font-bold text-[#00674F]' : ''
          }`}
        >
          Dashboard
        </Link>

        <Link
          href="/admin/manage-users"
          className={`hover:text-blue-600 p-2 rounded ${
            pathname === '/admin/manage-users' ? 'bg-blue-100 font-bold text-blue-600' : ''
          }`}
        >
          Manage Users
        </Link>

        <Link
          href="/admin/projects"
          className={`hover:text-blue-600 p-2 rounded ${
            pathname === '/admin/projects' ? 'bg-blue-100 font-bold text-blue-600' : ''
          }`}
        >
          Projects
        </Link>
      </nav>
    </aside>
  )
}
