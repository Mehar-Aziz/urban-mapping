"use client";

import MapboxMap from "@/components/mapbox/LULC";
import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";

const MapBox = dynamic(() => import("@/components/mapbox/MapBox"), { ssr: false });

export default function MainPage() {
  return (
    <div>
      <Navbar/>
      <MapBox />
      {/*<MapboxMap/>*/}
    </div>
  );
}
