"use client";

import Navbar from "@/components/navbar/Index";
import dynamic from "next/dynamic";

const Prediction = dynamic(() => import("@/components/lulcPrediction/MainComponent"), { ssr: false });

export default function MainPage() {
  return (
    <div>
      <Navbar/>
      <Prediction />
    </div>
  );
}
