import { Users, FileText, FolderOpen } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 w-full">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-[#00674F]">Admin Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="hidden sm:flex p-2 bg-green-50 rounded-full mr-3">
                <Users className="h-5 w-5 text-[#00674F]" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 text-[#00674F]">120</div>
                <div className="text-gray-600 text-sm sm:text-base">Total Users</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 sm:p-6 shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="hidden sm:flex p-2 bg-green-50 rounded-full mr-3">
                <FolderOpen className="h-5 w-5 text-[#00674F]" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 text-[#00674F]">45</div>
                <div className="text-gray-600 text-sm sm:text-base">Projects</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 sm:p-6 shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="hidden sm:flex p-2 bg-green-50 rounded-full mr-3">
                <FileText className="h-5 w-5 text-[#00674F]" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 text-[#00674F]">20</div>
                <div className="text-gray-600 text-sm sm:text-base">Docs Downloaded</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-[#00674F]">Recent Activity</h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center py-2 border-b border-gray-100">
              <div className="hidden sm:flex p-1 bg-green-50 rounded-full mr-3">
                <Users className="h-4 w-4 text-[#00674F]" />
              </div>
              <span className="text-gray-700 text-sm sm:text-base">User 'abc' created project 'Urban Green Spaces'</span>
            </div>
            <div className="flex items-center py-2 border-b border-gray-100">
              <div className="hidden sm:flex p-1 bg-green-50 rounded-full mr-3">
                <FileText className="h-4 w-4 text-[#00674F]" />
              </div>
              <span className="text-gray-700 text-sm sm:text-base">Admin downloaded air quality report</span>
            </div>
            <div className="flex items-center py-2">
              <div className="hidden sm:flex p-1 bg-green-50 rounded-full mr-3">
                <FolderOpen className="h-4 w-4 text-[#00674F]" />
              </div>
              <span className="text-gray-700 text-sm sm:text-base">Project 'Heat Map' was updated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}