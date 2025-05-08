"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const mockProjects = [
  {
    id: 1,
    title: "Project 1",
    owner: "Mehar Aziz",
    description: "Urban Mapping using Deep Learning techniques",
    documents: ["urban_map.pdf", "vegetation.csv"]
  },
  {
    id: 2,
    title: "Project 2",
    owner: "Mehar Aziz",
    description: "Air Quality Monitoring with Satellite Data",
    documents: ["air_quality.pdf", "aq_data.csv"]
  },
  {
    id: 3,
    title: "Project 3",
    owner: "Mehar Aziz",
    description: "Thermal Imaging for Urban Heat Islands",
    documents: ["thermal_data.pdf"]
  }
]

export default function SeeAllProjectsPage() {
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0)
  const project = mockProjects[currentProjectIndex]

  return (
    <div className="min-h-screen bg-gray-100 p-4 pt-8 ">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">All Projects</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Project Selection - Dropdown on Mobile, List on Larger Screens */}
          <div className="md:col-span-1">
            <div className="md:hidden mb-4">
              <Select
                value={currentProjectIndex.toString()}
                onValueChange={(value) => setCurrentProjectIndex(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {mockProjects.map((proj, index) => (
                    <SelectItem key={proj.id} value={index.toString()}>
                      {proj.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="hidden md:block">
              <ul className="space-y-2">
                {mockProjects.map((proj, index) => (
                  <li
                    key={proj.id}
                    className={`cursor-pointer px-2 py-1 rounded hover:bg-[#00674F10]  ${index === currentProjectIndex ? 'bg-[#00674F30]  font-semibold' : ''}`}
                    onClick={() => setCurrentProjectIndex(index)}
                  >
                    {proj.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Project Details */}
          <div className="col-span-1 md:col-span-3">
            <Card>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h2 className="text-xl font-semibold">{project.title}</h2>
                <p><strong>Owner:</strong> {project.owner}</p>
                <p><strong>Description:</strong> {project.description}</p>
                <div>
                  <strong>Documents:</strong>
                  <ul className="list-disc ml-5">
                    {project.documents.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}