export default function AdminDashboard() {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-8 text-[#00674F]">Admin Dashboard</h1>
  
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow flex flex-col items-left justify-center">
            <div className="text-4xl font-bold mb-2 text-[#00674F]">120</div>
            <div className="text-gray-600">Total Users</div>
          </div>
  
          <div className="bg-white rounded-lg p-6 shadow flex flex-col items-left justify-center">
            <div className="text-4xl font-bold mb-2 text-[#00674F]">45</div>
            <div className="text-gray-600">Projects</div>
          </div>
  
          <div className="bg-white rounded-lg p-6 shadow flex flex-col items-left justify-center">
            <div className="text-4xl font-bold mb-2 text-[#00674F]">20</div>
            <div className="text-gray-600">Docs Downloaded</div>
          </div>
        </div>
  
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-bold mb-4 text-[#00674F]">Recent Activity</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>User 'abc' created project 'Urban Green Spaces'</li>
            <li>Admin downloaded air quality report</li>
            <li>Project 'Heat Map' was updated</li>
          </ol>
        </div>
      </div>
    )
  }
  