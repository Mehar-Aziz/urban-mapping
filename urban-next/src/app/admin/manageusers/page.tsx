import Navbar from "@/components/admin/AdminNav";
import ManageUserPage from "@/components/admin/ManageUsers";
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
          <ManageUserPage />
        </div>
      </div>
    </div>
  );
}
