import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

export default function ProfilePage() {
  const downloadedDocs = ["urban_map.pdf", "vegetation_data.csv", "air_quality_report.pdf"]

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Left: Profile Info */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="flex flex-col items-center py-6">
              <Image
                src="/user-avatar.png"
                alt="Profile"
                width={100}
                height={100}
                className="rounded-full"
              />
              <h2 className="text-xl font-semibold mt-4">Mehar Aziz</h2>
              <p className="text-sm text-gray-600 mt-1">mehar@example.com</p>
              <p className="text-sm text-gray-500">Interncraft</p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Projects & Docs */}
        <div className="md:col-span-2 space-y-6">
          {/* Total Projects */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Total Projects</h3>
              <p className="text-4xl font-bold text-blue-600">5</p>
            </CardContent>
          </Card>

          {/* Downloaded Documents */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Downloaded Documents</h3>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                {downloadedDocs.map((doc, i) => (
                  <li key={i}>{doc}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
