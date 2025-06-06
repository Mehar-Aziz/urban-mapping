"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    console.log(email, password);
    try {
      const response = await fetch("http://localhost:8000/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();

  // Dummy role
  let role = "user";
  if (email === "urban@gmail.com") {
    role = "admin";
  }

  const user = {
    email: email,
    role: role,
    token: data.access_token,
  };

  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", data.access_token);

  if (role === "admin") {
    router.push("/admin"); 
  } else {
    router.push("/"); 
  }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        "Connection error. Please check your internet connection and try again."
      );
    }
  };

  return (
  <div
    className="relative font-sans flex items-center justify-center min-h-screen bg-cover bg-center"
    style={{ backgroundImage: "url('/authenticationBg.jpeg')" }}
  >
    <Card className="w-11/12 sm:w-4/5 md:w-3/5 lg:w-2/5 xl:w-1/3 max-w-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-sans-700 text-center font-semibold text-[#00674F]">
        Login
      </h2>
      <CardContent>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#00674F] mb-1">
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00674F]"
                size={18}
              />
              <Input
                type="email"
                placeholder="Type your email"
                className="pl-10 text-sm sm:text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#00674F] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00674F]"
                size={18}
              />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Type your password"
                className="pl-10 text-sm sm:text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-red-600 text-xs sm:text-sm mt-1">{error}</p>}
          </div>

          <div
            className="text-right text-xs sm:text-sm text-[#C00F0C] font-semibold cursor-pointer"
            onClick={() => router.push("/reset")}
          >
            Forgot password?
          </div>

          <Button
            className="w-full bg-green-800 hover:bg-green-700 text-white cursor-pointer py-2 sm:py-3 text-sm sm:text-base"
            onClick={handleLogin}
          >
            Login
          </Button>

          <div
            className="text-left text-xs sm:text-sm text-[#00674F] font-semibold cursor-pointer"
            onClick={() => router.push("/registration")}
          >
            Create a new account
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
}
