'use client'; 

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function Login() {
  const router = useRouter(); 
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
    } else {
      setError("");
      // Proceed with login logic
    }
  };

  return (
    <div className="relative font-sans flex items-center justify-center min-h-screen bg-cover bg-center sm:bg-none" style={{ backgroundImage: "url('/authenticationBg.jpeg')" }}>
      <Card className="w-[30%] max-w-md p-6 ">
        <h2 className="text-2xl font-sans-700 text-center font-semibold text-[#00674F]">Login</h2>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#00674F] mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2 text-[#00674F] " size={20} />
                <Input type="email" placeholder="Type your email" className="pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#00674F] mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2 text-[#00674F]" size={20} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Type your password"
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

            <div className="text-right text-sm text-[#C00F0C] font-semibold cursor-pointer" onClick={() => router.push("/reset")}>Forgot password?</div>

            <Button className="w-full bg-green-800 hover:bg-green-700 text-white cursor-pointer" onClick={handleLogin}>
              Login
            </Button>

            <div className="text-left text-sm text-[#00674F] font-semibold cursor-pointer" onClick={() => router.push("/register")}>Create a new account</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
