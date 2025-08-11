// components/MapComponent.tsx
import React from "react";
import { MapState } from "@/types";

interface MapComponentProps {
  mapContainer: React.RefObject<HTMLDivElement>;
  state: MapState;
}

export const MapComponent: React.FC<MapComponentProps> = ({ mapContainer }) => {
  return (
    <div className="flex-1 relative h-full">
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: "400px" }}
      />
      <div id="map-controls-overlay" className="absolute top-4 left-4 z-10" />
    </div>
  );
};
