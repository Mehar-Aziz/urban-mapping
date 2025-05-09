// app/admin/manage-user/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Trash2, MoreVertical, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { getAllUsers, registerUser, deleteUser } from "@/app/auth";

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
}

export default function ManageUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users when search query or tab changes
  useEffect(() => {
    let filtered = users;
    
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeTab !== "all") {
      filtered = filtered.filter((user) => user.role === activeTab);
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, users, activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Get token from localStorage or wherever you store it
      const token = localStorage.getItem("token") || "";
      
      // Use the getAllUsers function from auth.ts
      const data = await getAllUsers(token);
      
      // Add role field to users
      const usersWithRoles = data.map((user: User) => ({
        ...user,
        role: user.email === "urban@gmail.com" ? "admin" : "user"
      }));
      
      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (err) {
      setError("Failed to load users. Please try again.");
      toast.error("Failed to load users", {
        description: "Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Use the registerUser function from auth.ts
      await registerUser(newUser.username, newUser.email, newUser.password);

      // Clear form and close dialog
      setNewUser({ username: "", email: "", password: "" });
      setIsAddUserOpen(false);
      
      // Refresh users list
      fetchUsers();
      
      toast.success("Success", {
        description: "User added successfully"
      });
    } catch (err: any) {
      toast.error("Error adding user", {
        description: err.response?.data?.detail || "Please try again."
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      toast.promise(
        async () => {
          // Get token from localStorage
          const token = localStorage.getItem("token") || "";
          
          // Use the deleteUser function from auth.ts
          await deleteUser(userId, token);

          // Remove user from state
          setUsers(users.filter(user => user.id !== userId));
          return true;
        },
        {
          loading: "Deleting user...",
          success: "User deleted successfully",
          error: "Failed to delete user"
        }
      );
    }
  };
  
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Mobile user card component
  const UserCard = ({ user }: { user: User }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{user.username}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
            <Badge className={`mt-2 ${user.role === "admin" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-green-100 text-green-800 hover:bg-green-100"}`}>
              {user.role}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-500">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Manage Users</h1>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-lg md:text-xl">All Users</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8 pr-8 w-full md:w-64"
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
              
              {!isSmallScreen && (
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="hidden md:flex">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="admin">Admins</TabsTrigger>
                    <TabsTrigger value="user">Users</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              
              {isSmallScreen && (
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="md:hidden">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Filter Users</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <div className="space-y-2">
                        <Button 
                          variant={activeTab === "all" ? "default" : "outline"}
                          className="w-full justify-start" 
                          onClick={() => {
                            setActiveTab("all");
                            setIsFiltersOpen(false);
                          }}
                        >
                          All Users
                        </Button>
                        <Button 
                          variant={activeTab === "admin" ? "default" : "outline"}
                          className="w-full justify-start" 
                          onClick={() => {
                            setActiveTab("admin");
                            setIsFiltersOpen(false);
                          }}
                        >
                          Admins
                        </Button>
                        <Button 
                          variant={activeTab === "user" ? "default" : "outline"}
                          className="w-full justify-start" 
                          onClick={() => {
                            setActiveTab("user");
                            setIsFiltersOpen(false);
                          }}
                        >
                          Regular Users
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-black hover:bg-gray-800 w-full sm:w-auto">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleAddUser}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={newUser.username}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit">Add User</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">Loading users...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="hidden md:block rounded overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={`${user.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile card view */}
              <div className="md:hidden">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))
                ) : (
                  <div className="text-center py-6 bg-white rounded">
                    No users found
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