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
          href="/admin/manageusers"
          className={`hover:text-[#00674F] p-2 rounded ${
            pathname === '/admin/manageusers' ? 'bg-[#00674F30] font-bold text-[#00674F]' : ''
          }`}
        >
          Manage Users
        </Link>

        <Link
          href="/admin/manageprojects"
          className={`hover:text-[#00674F] p-2 rounded ${
            pathname === '/admin/projects' ? 'bg-[#00674F30] font-bold text-[#00674F]' : ''
          }`}
        >
          Projects
        </Link>
      </nav>
    </aside>
  )
}
