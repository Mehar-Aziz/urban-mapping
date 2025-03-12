"use client";

import dynamic from "next/dynamic";

const MapBox = dynamic(() => import("@/components/mapbox/MapBox"), { ssr: false });

export default function MainPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 w-full h-screen">
      <MapBox />
    </div>
  );
}
