import Navbar from "@/components/admin/AdminNav";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Sidebar from "@/components/admin/AdminSidebar";

export default function Profile() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar fixed width */}
        <div className="w-64">
          <Sidebar />
        </div>

        {/* Main content grows */}
        <div className="flex-1 p-8">
          <AdminDashboard />
        </div>
      </div>
    </div>
  );
}
