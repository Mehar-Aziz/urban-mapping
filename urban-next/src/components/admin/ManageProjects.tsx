"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, X, Calendar, User, FileText, MoreVertical } from "lucide-react";
import axios from "axios";

// Define the Project type
interface Project {
  id: number;
  name: string;
  description: string;
  user_id: number;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        // Direct API call without token
        const response = await axios.get("http://127.0.0.1:8000/projects");
        setProjects(response.data.projects || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return "Invalid date";
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Project card component for mobile view
  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{project.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-full hover:bg-gray-100">
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                Edit Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <User className="h-4 w-4 mr-2" />
            <span>User ID: {project.user_id}</span>
          </div>
          
          <div className="flex items-start text-gray-600">
            <FileText className="h-4 w-4 mr-2 mt-0.5" />
            <span className="flex-1">{project.description || "No description"}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatDate(project.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Projects</h1>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg md:text-xl">All Projects</CardTitle>
            
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search projects..."
                className="pl-8 pr-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="absolute right-2 top-2.5"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading projects...</div>
          ) : (
            <>
              {/* Desktop view */}
              <div className="hidden md:block rounded overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          No projects found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProjects.map((project) => (
                        <TableRow key={project.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>{project.user_id}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {project.description || "No description"}
                          </TableCell>
                          <TableCell>{formatDate(project.created_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile view */}
              <div className="md:hidden">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded">
                    <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p>No projects found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}