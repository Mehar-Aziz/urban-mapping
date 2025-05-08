"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token"); // Get the token from the URL

    const handleReset = async () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/password-reset-confirm", { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    token: token, 
                    new_password: password 
                }),
            });

            if (response.ok) {
                setSuccess("Password changed successfully! Redirecting to login...");
                setTimeout(() => router.push("/login"), 3000);
            } else {
                const data = await response.json();
                setError(data.message || "Failed to reset password.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        }
    };

    return (
        <div
          className="flex items-center justify-center min-h-screen bg-cover bg-center"
          style={{ backgroundImage: "url('/authenticationBg.jpeg')" }}
        >
          <Card className="w-11/12 sm:w-4/5 md:w-3/5 lg:w-2/5 xl:w-1/3 max-w-md p-4 sm:p-6 shadow-lg">
            <CardContent className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#00674F]">Reset Password</h2>
      
              {error && <p className="text-red-500 text-xs sm:text-sm mt-2">{error}</p>}
              {success && <p className="text-green-500 text-xs sm:text-sm mt-2">{success}</p>}
      
              <div className="mt-3 sm:mt-4 text-left">
                <label className="text-xs sm:text-sm text-[#00674F] font-semibold">New Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                  <Input
                    type="password"
                    className="pl-10 w-full text-sm sm:text-base"
                    placeholder="Type Your New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
      
              <div className="mt-3 sm:mt-4 text-left">
                <label className="text-xs sm:text-sm text-[#00674F] font-semibold">Retype Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                  <Input
                    type="password"
                    className="pl-10 w-full text-sm sm:text-base"
                    placeholder="Retype Your Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
      
              <Button
                onClick={handleReset}
                className="w-full mt-4 sm:mt-6 bg-green-700 hover:bg-green-800 text-white font-semibold py-2 sm:py-3 text-sm sm:text-base"
              >
                Change Password
              </Button>
              
              {/* Added link to go back to login page for better UX */}
              <div 
                className="mt-3 text-xs sm:text-sm text-[#00674F] font-semibold cursor-pointer"
                onClick={() => router.push("/login")}
              >
                Back to Login
              </div>
            </CardContent>
          </Card>
        </div>
      );
}
