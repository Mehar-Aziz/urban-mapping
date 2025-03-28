"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Mail } from "lucide-react"; 
import axios from 'axios';

export default function Reset() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isRequestSent, setIsRequestSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleResetRequest = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/password-reset-request', { email });
      setIsRequestSent(true);
      setError("");
      // In a real app, you'd show a message to check email
      alert("Password reset link sent to your email");
    } catch (err) {
      setError("Failed to send reset request. Please try again.");
    }
  };

  const handleResetConfirm = async () => {
    // Validate inputs
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/password-reset-confirm', { 
        token, 
        new_password: password 
      });
      
      alert("Password reset successful");
      router.push("/login");
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/authenticationBg.jpeg')" }}
    >
      <Card className="w-[30%] max-w-md p-6 shadow-lg">
        <CardContent className="text-center">
          <h2 className="text-2xl font-semibold text-[#00674F]">
            {token ? "Reset Password" : "Password Reset Request"}
          </h2>

          {!token && (
            <div className="mt-4 text-left">
              <label className="text-sm text-[#00674F] font-semibold">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                <Input
                  type="email"
                  className="pl-10 w-full"
                  placeholder="Enter Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {token && (
            <>
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
            </>
          )}

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          <Button
            onClick={token ? handleResetConfirm : handleResetRequest}
            className="w-full mt-6 bg-green-700 hover:bg-green-800 text-white font-semibold"
          >
            {token ? "Reset Password" : "Send Reset Link"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
