"use client";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import axios from "axios";

const INITIAL_CENTER: [number, number] = [69.3451, 30.3753]; // Pakistan
const INITIAL_ZOOM = 3.9;
const MAPBOX_TOKEN = "pk.eyJ1IjoibWVoYXItYXppeiIsImEiOiJjbTdwd3BicDcwMmF5MmxwaHJkeW13cnVvIn0.4MS6keg1jZvx4KOBDsTqug";
const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";
const API_URL = "http://127.0.0.1:7000"; // Dynamic backend URL

const MapBox = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null); // State for coordinates

  // Initialize the map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  // Remove existing layers and sources from the map
  const removeExistingBoundaries = () => {
    if (!mapRef.current) return;

    const layers = ["kml-layer", "kml-outline", "search-fill", "search-outline"];
    const sources = ["kml-source", "search-boundary"];

    layers.forEach((layer) => {
      if (mapRef.current!.getLayer(layer)) mapRef.current!.removeLayer(layer);
    });

    sources.forEach((source) => {
      if (mapRef.current!.getSource(source)) mapRef.current!.removeSource(source);
    });
  };

  // Reset the map to its initial state
  const handleReset = () => {
    removeExistingBoundaries();
    setError("");
    setCoordinates(null); // Clear coordinates
    mapRef.current?.flyTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM });
  };

  // Handle file selection
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    setFile(event.target.files[0]);
  };

  // Handle file upload and conversion
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a KML file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Send the KML file to the backend
      const response = await axios.post(`${API_URL}/api/convert-kml`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Response from API:", response.data);

      if (response.data.geoJson) {
        removeExistingBoundaries();

        // Add the GeoJSON data to the map
        mapRef.current?.addSource("kml-source", { type: "geojson", data: response.data.geoJson });
        mapRef.current?.addLayer({
          id: "kml-layer",
          type: "fill",
          source: "kml-source",
          paint: { "fill-color": "#ff0000", "fill-opacity": 0.4 },
        });
        mapRef.current?.addLayer({
          id: "kml-outline",
          type: "line",
          source: "kml-source",
          paint: { "line-color": "#000", "line-width": 2 },
        });

        // Adjust the map view to fit the boundaries
        const bounds = new mapboxgl.LngLatBounds();
        response.data.geoJson.features.forEach((feature: any) => {
          feature.geometry.coordinates[0].forEach((coord: any) => {
            bounds.extend(coord);
          });
        });
        mapRef.current?.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      } else {
        setError("Invalid GeoJSON received.");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload the file.");
    } finally {
      setLoading(false);
    }
  };

  // Handle location search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapRef.current) return;

    try {
      const response = await axios.get(NOMINATIM_API, {
        params: { q: searchQuery, format: "json", polygon_geojson: 1, limit: 1 },
      });

      console.log("Nominatim API Response:", response.data); // Debugging log

      if (response.data.length > 0) {
        const { lat, lon, geojson } = response.data[0];

        console.log("GeoJSON Data:", geojson); // Debugging log

        // Set the coordinates state
        setCoordinates({ lat: parseFloat(lat), lng: parseFloat(lon) });

        // Center the map on the location
        mapRef.current?.flyTo({
          center: [parseFloat(lon), parseFloat(lat)],
          zoom: 10,
        });

        if (!geojson) {
          setError("Detailed boundary not available. Using approximate location.");
          return;
        }

        removeExistingBoundaries();

        // Add the search result to the map
        mapRef.current?.addSource("search-boundary", { type: "geojson", data: geojson });
        mapRef.current?.addLayer({
          id: "search-fill",
          type: "fill",
          source: "search-boundary",
          paint: { "fill-color": "#00ff00", "fill-opacity": 0.3 },
        });
        mapRef.current?.addLayer({
          id: "search-outline",
          type: "line",
          source: "search-boundary",
          paint: { "line-color": "#0000ff", "line-width": 2 },
        });

        // Process the GeoJSON and fit the map to the bounds
        const processGeoJSON = (geojson: any) => {
          const bounds = new mapboxgl.LngLatBounds();

          const processCoordinates = (coords: any) => {
            if (Array.isArray(coords[0])) {
              coords.forEach((coord: any) => processCoordinates(coord));
            } else {
              bounds.extend(coords);
            }
          };

          if (geojson.type === "Polygon") {
            geojson.coordinates.forEach((ring: any) => processCoordinates(ring));
          } else if (geojson.type === "MultiPolygon") {
            geojson.coordinates.forEach((polygon: any) => {
              polygon.forEach((ring: any) => processCoordinates(ring));
            });
          } else if (geojson.type === "LineString") {
            processCoordinates(geojson.coordinates);
          } else if (geojson.type === "Point") {
            bounds.extend(geojson.coordinates);
          }

          return bounds;
        };

        const bounds = processGeoJSON(geojson);
        if (!bounds.isEmpty()) {
          mapRef.current?.fitBounds(bounds, { padding: 50, maxZoom: 14 });
        } else {
          setError("Invalid boundary data for this location.");
        }
      } else {
        setError("Location not found.");
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed. Try again.");
    }
  };

  return (
    <div className="flex w-full h-[100vh]">
      <div className="w-[20%] p-4 bg-gray-200">
        <h2 className="text-lg font-semibold">Upload KML</h2>
        <input type="file" accept=".kml" onChange={handleFileUpload} className="mt-2" />
        <Button onClick={handleUpload} className="mt-2" disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </Button>
        <input
          type="text"
          placeholder="Search location"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mt-2 p-2 border rounded"
        />
        <Button onClick={handleSearch} className="mt-2">Search</Button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {coordinates && (
          <p className="mt-2 text-sm">
            Coordinates: Lat {coordinates.lat.toFixed(4)}, Lng {coordinates.lng.toFixed(4)}
          </p>
        )}
      </div>

      <div className="w-[80%] relative">
        <div ref={mapContainerRef} className="w-full h-full" />
        <Button className="absolute top-[10px] left-[12px] z-10 px-3 py-1 rounded-lg" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
};

const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log("Backend health:", response.data);
  } catch (err) {
    console.error("Backend is not reachable:", err);
  }
};

// Call this function when the app loads
checkBackendHealth();
export default MapBox;