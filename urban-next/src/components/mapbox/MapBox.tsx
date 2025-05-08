"use client";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, ChevronLeft, ChevronRight, Layers, Search as SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import axios from "axios";
import Link from "next/link";
import { cn } from "@/lib/utils"

const INITIAL_CENTER: [number, number] = [69.3451, 30.3753]; // Pakistan
const INITIAL_ZOOM = 3.9;
const MAPBOX_TOKEN = "pk.eyJ1IjoibWVoYXItYXppeiIsImEiOiJjbTdwd3BicDcwMmF5MmxwaHJkeW13cnVvIn0.4MS6keg1jZvx4KOBDsTqug";
const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";
const API_URL = "http://127.0.0.1:8000"; 

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
  const [assets, setAssets] = useState<Asset[]>([]); 
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null); // State for selected asset
    const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
   const [zoom, setZoom] = useState(INITIAL_ZOOM);
   const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

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
  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile) // Close sidebar by default on mobile
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Wrapper functions to close sidebar on mobile after actions
  const handleSearchWithSidebar = () => {
    handleSearch()
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleAssetSelectionWithSidebar = (assetId: string) => {
    handleAssetSelection(assetId)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleUploadWithSidebar = () => {
    handleUpload()
    if (isMobile) {
      // Set a short timeout to allow the upload to finish before closing
      setTimeout(() => {
        setSidebarOpen(false)
      }, 500)
    }
  }


  return (
    <div className="flex flex-col md:flex-row w-full h-[100vh] relative">
      {/* Mobile Sidebar Toggle Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden absolute top-2 left-2 z-20 bg-white p-2 rounded-md shadow-md"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
      
      {/* Left Sidebar - Desktop */}
      <div 
        className={cn(
          "w-80 md:w-80 lg:w-70 bg-gray-50 shadow-md overflow-y-auto transition-all duration-300",
          isMobile ? "absolute z-10 h-full" : "relative",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0"
        )}
      >
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Upload KML</h2>
          
          {/* File Upload */}
          <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-lg">
            <input 
              type="file" 
              accept=".kml" 
              onChange={handleFileUpload} 
              className="w-full text-sm" 
              id="kml-upload"
            />
            <Button 
              onClick={handleUploadWithSidebar} 
              className="w-full mt-3" 
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>

          {/* Search Functionality */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Search Location</h2>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter location name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={handleSearchWithSidebar} size="icon">
                <SearchIcon size={18} />
              </Button>
            </div>
            
            {/* Error Message */}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          {/* Stored Assets */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Stored Assets</h2>
            {assets.length === 0 ? (
              <p className="text-gray-500 text-sm">No assets found</p>
            ) : (
              <ul className="space-y-2">
                {assets.map((asset) => (
                  <li key={asset.id} className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                    <span className="text-sm font-medium truncate flex-1">{asset.name}</span>
                    <Button 
                      onClick={() => handleAssetSelectionWithSidebar(asset.id)} 
                      size="sm" 
                      variant="outline"
                    >
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className={cn(
        "flex-1 relative transition-all duration-300",
        sidebarOpen && !isMobile ? "md:ml-0" : "ml-0"
      )}>
        {/* Map Info Panel */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-black bg-opacity-75 text-white p-2 md:p-3 rounded-lg shadow-md z-1 text-xs md:text-sm max-w-full">
          <span className="whitespace-nowrap">
            Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)} | Zoom: {zoom.toFixed(2)}
          </span>
        </div>
        
        {/* Mobile Controls - Sheet for small screens */}
        <div className="md:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" className="rounded-full shadow-lg">
                <Layers size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-72">
              <div className="space-y-4 pt-2">
                <Button 
                  onClick={handleReset} 
                  className="w-50" 
                  variant="outline"
                >
                  Reset Map
                </Button>  
                <Link href="/main/analysis" className="block w-full">
                  <Button className="w-50 items-center">
                    Select & Continue
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Map Controls */}
        <Button 
          className="absolute top-16 left-4 z-10 hidden md:flex" 
          onClick={handleReset}
          variant="outline"
        >
          Reset
        </Button>
        
        <Link href="/main/analysis" className="hidden md:block">
          <Button className="absolute bottom-6 right-6 z-10 px-6">
            Select
          </Button>
        </Link>

        {/* Map */}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
};
export default MapBox;