"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react"; 

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleReset = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    alert("Password changed successfully!");
    router.push("/login"); 
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/authenticationBg.jpeg')" }}
    >
      <Card className="w-[30%] max-w-md p-6 shadow-lg">
        <CardContent className="text-center">
          <h2 className="text-2xl font-semibold text-[#00674F]">Reset Password</h2>

          <div className="mt-4 text-left">
            <label className="text-sm text-[#00674F] font-semibold">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <Input
                type="password"
                className="pl-10 w-full"
                placeholder="Type Your New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 text-left">
            <label className="text-sm text-[#00674F] font-semibold">Retype Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
              <Input
                type="password"
                className="pl-10 w-full"
                placeholder="Retype Your Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleReset}
            className="w-full mt-6 bg-green-700 hover:bg-green-800 text-white font-semibold"
          >
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
