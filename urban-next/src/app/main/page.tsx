"use client";

import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";

const MapBox = dynamic(() => import("@/components/mapbox/MapBox"), { ssr: false });

export default function MainPage() {
  return (
    <div>
      <Navbar/>
      <MapBox />
    </div>
  );
}
