"use client"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProfilePage() {
  const downloadedDocs = ["urban_map.pdf", "vegetation_data.csv", "air_quality_report.pdf"]

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("Mehar Aziz")
  const [email, setEmail] = useState("mehar@example.com")
  const [university, setUniversity] = useState("Comsats University")

  const [tempName, setTempName] = useState(name)
  const [tempEmail, setTempEmail] = useState(email)
  const [tempUniversity, setTempUniversity] = useState(university)

  const handleEdit = () => {
    setTempName(name)
    setTempEmail(email)
    setTempUniversity(university)
    setIsEditing(true)
  }

  const handleSave = () => {
    setName(tempName)
    setEmail(tempEmail)
    setUniversity(tempUniversity)
    setIsEditing(false)
  }


  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
         {/* Left: Profile Info */}
        <div className="md:col-span-1">
          <Card className="relative h-105">
            <CardContent className="flex flex-col items-center py-6 space-y-2">
              {/* Edit/Save Button */}
              {isEditing ? (
                <Button
                  className="absolute top-2 right-2 text-sm"
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                >
                  Save
                </Button>
              ) : (
                <Button
                  className="absolute top-2 right-2 text-sm"
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  Edit
                </Button>
              )}

              <Image
                src="/user-avatar.png"
                alt="Profile"
                width={200}
                height={200}
                className="rounded-full"
              />

              {isEditing ? (
                <>
                  <input
                    className="text-xl font-semibold mt-4 text-center bg-transparent border-b border-gray-300 focus:outline-none"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                  />
                  <input
                    className="text-sm text-gray-600 text-center bg-transparent border-b border-gray-200 focus:outline-none"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                  />
                  <input
                    className="text-sm text-gray-500 text-center bg-transparent border-b border-gray-200 focus:outline-none"
                    value={tempUniversity}
                    onChange={(e) => setTempUniversity(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mt-4">{name}</h2>
                  <p className="text-sm text-gray-600">{email}</p>
                  <p className="text-sm text-gray-500">{university}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Projects & Docs */}
        <div className="md:col-span-2 space-y-6">
          {/* Total Projects */}
<Card className="relative">
  <CardContent className="p-6">
  <Link href="/profile/seeprojects">
    <button
      className="absolute top-4 right-4 text-sm font-semibold border p-2 border-2px-solid rounded-lg shadow cursor-pointer"
    >
      See All Projects
    </button>
    </Link>

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
