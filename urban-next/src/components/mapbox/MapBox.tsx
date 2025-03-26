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
const API_URL = "http://127.0.0.1:8000"; // Dynamic backend URL

interface Asset {
  id: string;
  name: string;
  type: "search" | "kml";
  geoJson: any;
}

interface GeoJSON {
  type: string;
  features?: any[];
  geometry?: {
    type: string;
    coordinates: any;
  };
  coordinates?: any;
}

const MapBox = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]); // State for stored assets
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null); // State for selected asset
    const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
   const [zoom, setZoom] = useState(INITIAL_ZOOM);

  // Initialize the map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: center,
      zoom: zoom,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
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

    // Get all existing layers
    const layers = mapRef.current.getStyle()?.layers;

    // Remove all layers
    if (layers && Array.isArray(layers)) {
      layers.forEach((layer) => {
        if (layer.id.startsWith("kml-") || layer.id.startsWith("search-")) {
          mapRef.current?.removeLayer(layer.id);
        }
      });
    }

    // Get all existing sources
    const sources = mapRef.current.getStyle()?.sources;
    if (sources) {
      Object.keys(sources).forEach((source) => {
        if (source.startsWith("kml-") || source.startsWith("search-")) {
          mapRef.current?.removeSource(source);
        }
      });
    }
  };

  // Reset the map to its initial state
  const handleReset = () => {
    removeExistingBoundaries();
    setError("");
    setCoordinates(null); // Clear coordinates
    setSelectedAsset(null); // Clear selected asset
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

        // Store the asset
        const newAsset: Asset = {
          id: `kml-${Date.now()}`,
          name: file.name,
          type: "kml",
          geoJson: response.data.geoJson,
        };
        setAssets((prev) => [...prev, newAsset]);
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
          paint: { "fill-color": "#088F8F", "fill-opacity": 0.3 },
        });
        mapRef.current?.addLayer({
          id: "search-outline",
          type: "line",
          source: "search-boundary",
          paint: { "line-color": "#000000", "line-width": 2 },
        });

        // Process the GeoJSON and fit the map to the bounds
        const processGeoJSON = (geojson: GeoJSON) => {
          const bounds = new mapboxgl.LngLatBounds();

          const processCoordinates = (coords: any) => {
            if (Array.isArray(coords[0])) {
              coords.forEach((coord: any) => processCoordinates(coord));
            } else {
              bounds.extend(coords);
            }
          };

          if (geojson.type === "Polygon") {
            geojson.coordinates?.forEach((ring: any) => processCoordinates(ring));
          } else if (geojson.type === "MultiPolygon") {
            geojson.coordinates?.forEach((polygon: any) => {
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

        // Store the asset
        const newAsset: Asset = {
          id: `search-${Date.now()}`,
          name: searchQuery,
          type: "search",
          geoJson: geojson,
        };
        setAssets((prev) => [...prev, newAsset]);
      } else {
        setError("Location not found.");
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed. Try again.");
    }
  };

  // Handle asset selection
  const handleAssetSelection = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset || !mapRef.current) return;

    setSelectedAsset(assetId);

    // Remove all existing layers and sources
    removeExistingBoundaries();

    // Generate unique source and layer IDs using the asset ID
    const sourceId = `${asset.type}-source-${asset.id}`;
    const layerId = `${asset.type}-layer-${asset.id}`;
    const outlineId = `${asset.type}-outline-${asset.id}`;

    // Validate GeoJSON structure
    if (!asset.geoJson || !asset.geoJson.type) {
      console.error("Invalid GeoJSON: Missing type");
      return;
    }

    // Add GeoJSON source and layers to the map
    mapRef.current.addSource(sourceId, { type: "geojson", data: asset.geoJson });
    mapRef.current.addLayer({
      id: layerId,
      type: "fill",
      source: sourceId,
      paint: { "fill-color": asset.type === "kml" ? "#ff0000" : "#00ff00", "fill-opacity": 0.4 },
    });
    mapRef.current.addLayer({
      id: outlineId,
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000", "line-width": 2 },
    });

    // Adjust the map view to fit the asset's boundaries
    const bounds = new mapboxgl.LngLatBounds();

    const processGeoJSON = (geojson: GeoJSON) => {
      if (!geojson || !geojson.type) {
        console.error("Invalid GeoJSON: Missing type");
        return;
      }

      // Handle FeatureCollection
      if (geojson.type === "FeatureCollection") {
        if (!geojson.features || !Array.isArray(geojson.features)) {
          console.error("Invalid GeoJSON: Missing features array");
          return;
        }

        geojson.features.forEach((feature: any) => {
          if (!feature.geometry || !feature.geometry.coordinates) {
            console.error("Invalid feature: Missing geometry or coordinates");
            return;
          }

          const processCoordinates = (coords: any) => {
            if (Array.isArray(coords[0])) {
              coords.forEach((coord: any) => processCoordinates(coord));
            } else {
              bounds.extend(coords);
            }
          };

          if (feature.geometry.type === "Polygon") {
            feature.geometry.coordinates.forEach((ring: any) => processCoordinates(ring));
          } else if (feature.geometry.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach((polygon: any) => {
              polygon.forEach((ring: any) => processCoordinates(ring));
            });
          } else if (feature.geometry.type === "LineString") {
            processCoordinates(feature.geometry.coordinates);
          } else if (feature.geometry.type === "Point") {
            bounds.extend(feature.geometry.coordinates);
          } else {
            console.error("Unsupported geometry type:", feature.geometry.type);
          }
        });
      }
      // Handle single Feature
      else if (geojson.type === "Feature") {
        if (!geojson.geometry || !geojson.geometry.coordinates) {
          console.error("Invalid feature: Missing geometry or coordinates");
          return;
        }

        const processCoordinates = (coords: any) => {
          if (Array.isArray(coords[0])) {
            coords.forEach((coord: any) => processCoordinates(coord));
          } else {
            bounds.extend(coords);
          }
        };

        if (geojson.geometry.type === "Polygon") {
          geojson.geometry.coordinates.forEach((ring: any) => processCoordinates(ring));
        } else if (geojson.geometry.type === "MultiPolygon") {
          geojson.geometry.coordinates.forEach((polygon: any) => {
            polygon.forEach((ring: any) => processCoordinates(ring));
          });
        } else if (geojson.geometry.type === "LineString") {
          processCoordinates(geojson.geometry.coordinates);
        } else if (geojson.geometry.type === "Point") {
          bounds.extend(geojson.geometry.coordinates);
        } else {
          console.error("Unsupported geometry type:", geojson.geometry.type);
        }
      }
      // Handle standalone Geometry
      else if (geojson.type === "Polygon" || geojson.type === "MultiPolygon" || geojson.type === "LineString" || geojson.type === "Point") {
        const processCoordinates = (coords: any) => {
          if (Array.isArray(coords[0])) {
            coords.forEach((coord: any) => processCoordinates(coord));
          } else {
            bounds.extend(coords);
          }
        };

        if (geojson.type === "Polygon") {
          geojson.coordinates?.forEach((ring: any) => processCoordinates(ring));
        } else if (geojson.type === "MultiPolygon") {
          geojson.coordinates?.forEach((polygon: any) => {
            polygon.forEach((ring: any) => processCoordinates(ring));
          });
        } else if (geojson.type === "LineString") {
          processCoordinates(geojson.coordinates);
        } else if (geojson.type === "Point") {
          bounds.extend(geojson.coordinates);
        }
      } else {
        console.error("Unsupported GeoJSON type:", geojson.type);
      }
    };

    processGeoJSON(asset.geoJson);

    if (!bounds.isEmpty()) {
      // Add padding for Point geometries
      if (bounds.getNorthEast().lng === bounds.getSouthWest().lng && bounds.getNorthEast().lat === bounds.getSouthWest().lat) {
        bounds.extend([bounds.getNorthEast().lng + 0.01, bounds.getNorthEast().lat + 0.01]);
        bounds.extend([bounds.getSouthWest().lng - 0.01, bounds.getSouthWest().lat - 0.01]);
      }

      mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    } else {
      console.error("No valid bounds found for the asset.");
    }
  };

  return (
  <div className="flex w-full h-[100vh]">
    {/* Left Sidebar */}
    <div className="w-[20%] p-4 bg-gray-200">
      <h2 className="text-lg font-semibold">Upload KML</h2>
      <input type="file" accept=".kml" onChange={handleFileUpload} className="mt-2" />
      <Button onClick={handleUpload} className="mt-2" disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </Button>

      {/* Search Functionality */}
      
      <input
           type="text"
           placeholder="Search location"
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           className="w-full mt-2 p-2 border border-[#000] rounded"
         />
         <Button onClick={handleSearch} className="mt-2">Search</Button>

{/* Error Message */}
{error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {/* Coordinates Display */}
      {coordinates && (
        <p className="mt-2 text-sm">
          Coordinates: Lat {coordinates.lat.toFixed(4)}, Lng {coordinates.lng.toFixed(4)}
        </p>
      )}

      

      {/* Stored Assets */}
      <h2 className="text-lg font-semibold mt-4">Stored Assets</h2>
      <ul className="mt-2">
        {assets.map((asset) => (
          <li key={asset.id} className="flex justify-between items-center mt-2">
            <span>{asset.name}</span>
            <Button onClick={() => handleAssetSelection(asset.id)}>View</Button>
          </li>
        ))}
      </ul>
    </div>

    {/* Map Container */}
    <div className="w-[80%] relative">
    <div className="absolute top-2 left-2 bg-[#000000] bg-opacity-90 text-white p-2 rounded-lg shadow-md">
             Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)} | Zoom: {zoom.toFixed(2)}
           </div>
      

      {/* Reset Button */}
      <Button className="absolute top-[10px] left-[12px] z-10 px-5 py-1 rounded-lg" onClick={handleReset}>
        Reset
      </Button>

      {/* Map */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  </div>
);
};
export default MapBox;