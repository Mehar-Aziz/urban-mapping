'use client';

import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });
  
      if (response.ok) {
        router.push("/login"); 
      } else {
        setError("Registration failed");
      }
    } catch (error) {
      setError("Something went wrong");
    }
  };
  
  
  return (
    <div className="relative font-sans flex items-center justify-center min-h-screen bg-cover bg-center sm:bg-none" 
      style={{ backgroundImage: "url('/authenticationBg.jpeg')" }}>
      
      <Card className="w-[30%] max-w-md p-6">
        <h2 className="text-2xl font-sans-700 text-center font-semibold text-[#00674F]">Register</h2>
        <CardContent>
          <div className="space-y-3">
            
            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-[#00674F] mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2 text-[#00674F]" size={20} />
                <Input 
                  type="text" 
                  placeholder="Type Your Username" 
                  className="pl-10" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-[#00674F] mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2 text-[#00674F]" size={20} />
                <Input 
                  type="email" 
                  placeholder="Type Your Email" 
                  className="pl-10" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-[#00674F] mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2 text-[#00674F]" size={20} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Type Your Password"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
            </div>

            {/* Register Button */}
            <Button 
              className="w-full bg-green-800 mt-4 hover:bg-green-700 text-white cursor-pointer" 
              onClick={handleRegister}
            >
              Register
            </Button>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
