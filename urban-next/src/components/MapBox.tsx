"use client"
import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "./ui/button";
import axios from "axios";

const INITIAL_CENTER: [number, number] = [69.3451, 30.3753];
const INITIAL_ZOOM = 3.9;

export const MapBox = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [center, setCenter] = useState(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [region, setRegion] = useState(""); // State for the search input

  // Function to get coordinates for a region using the Mapbox Geocoding API
  const getCoordinates = async (region: string) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${region}.json`,
        {
          params: {
            access_token:
              "pk.eyJ1IjoibWVoYXItYXppeiIsImEiOiJjbTdwd3BicDcwMmF5MmxwaHJkeW13cnVvIn0.4MS6keg1jZvx4KOBDsTqug",
            limit: 1,
          },
        }
      );
      const data = response.data;
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates;
        return coordinates; // Return the coordinates
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
    }
    return null;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken =
      "pk.eyJ1IjoibWVoYXItYXppeiIsImEiOiJjbTdwd3BicDcwMmF5MmxwaHJkeW13cnVvIn0.4MS6keg1jZvx4KOBDsTqug";

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: center,
      zoom: zoom,
      style: "mapbox://styles/mapbox/light-v11",
    });

    if (mapRef.current) {
      mapRef.current.on("move", () => {
        const mapInstance = mapRef.current;
        if (!mapInstance) return;

        const mapCenter = mapInstance.getCenter();
        const mapZoom = mapInstance.getZoom();

        setCenter([mapCenter.lng, mapCenter.lat]);
        setZoom(mapZoom);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  const handleButtonClick = () => {
    mapRef.current?.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });
  };

  const handleSearch = async () => {
    if (!region) return; // Don't search if the input is empty
    const coordinates = await getCoordinates(region);
    if (coordinates) {
      // Center the map to the coordinates
      const [longitude, latitude] = coordinates;

      mapRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: 10,
      });

      // Create a boundary (polygon) for the region (assuming you get the polygon coordinates)
      mapRef.current?.addSource("region-boundary", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                // Here, you can define the polygon coordinates, or you can call another API to get the region's polygon.
                [longitude - 0.05, latitude - 0.05],
                [longitude + 0.05, latitude - 0.05],
                [longitude + 0.05, latitude + 0.05],
                [longitude - 0.05, latitude + 0.05],
                [longitude - 0.05, latitude - 0.05],
              ],
            ],
          },
        },
      });

      mapRef.current?.addLayer({
        id: "region-boundary",
        type: "fill",
        source: "region-boundary",
        layout: {},
        paint: {
          "fill-color": "#0080ff",
          "fill-opacity": 0.5,
        },
      });

      mapRef.current?.addLayer({
        id: "region-outline",
        type: "line",
        source: "region-boundary",
        layout: {},
        paint: {
          "line-color": "#000",
          "line-width": 3,
        },
      });
    }
  };

  return (
    <>
      <div className="flex w-full h-[100vh]">
        <div className="w-[20%]">
          {/* Sidebar space left empty for future addition */}
        </div>

        <div className="w-[80%] relative">
          <div ref={mapContainerRef} className="w-full h-full" />
          <div className="absolute top-2 left-2 bg-[#000000] bg-opacity-90 text-white p-2 rounded-lg shadow-md">
            Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)} | Zoom: {zoom.toFixed(2)}
          </div>
          <Button
            className="absolute top-[50px] left-[12px] z-10 px-3 py-1 rounded-lg cursor-pointer"
            onClick={handleButtonClick}
          >
            Reset
          </Button>

          <div className="absolute top-16 left-2 bg-white p-2 rounded-lg shadow-md">
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Search for a region"
              className="p-2 rounded-md border"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </div>
      </div>
    </>
  );
};
