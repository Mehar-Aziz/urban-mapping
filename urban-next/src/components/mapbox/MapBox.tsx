"use client"
import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "@/components/ui/button"
import axios from "axios";

const INITIAL_CENTER: [number, number] = [69.3451, 30.3753];
const INITIAL_ZOOM = 3.9;
const MAPBOX_TOKEN = "pk.eyJ1IjoibWVoYXItYXppeiIsImEiOiJjbTdwd3BicDcwMmF5MmxwaHJkeW13cnVvIn0.4MS6keg1jZvx4KOBDsTqug";

export const MapBox = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [region, setRegion] = useState(""); // State for the search input
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper function to get bounds from GeoJSON
  const getBoundsFromGeoJson = (geojson: any): [[number, number], [number, number]] | null => {
    if (!geojson || (!geojson.features && !geojson.geometry)) return null;
    
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    
    // Process features if it's a FeatureCollection
    if (geojson.features) {
      geojson.features.forEach((feature: any) => {
        if (!feature.geometry || !feature.geometry.coordinates) return;
        
        processGeometry(feature.geometry);
      });
    } 
    // Process geometry directly if it's a Feature or a standalone geometry
    else if (geojson.geometry) {
      processGeometry(geojson.geometry);
    } 
    // If it's a standalone geometry
    else if (geojson.coordinates) {
      processGeometry(geojson);
    }
    
    function processGeometry(geometry: any) {
      const { type, coordinates } = geometry;
      
      if (type === 'Point') {
        updateBounds(coordinates);
      } 
      else if (type === 'LineString' || type === 'MultiPoint') {
        coordinates.forEach((coord: number[]) => updateBounds(coord));
      } 
      else if (type === 'Polygon' || type === 'MultiLineString') {
        coordinates.forEach((ring: number[][]) => {
          ring.forEach((coord: number[]) => updateBounds(coord));
        });
      } 
      else if (type === 'MultiPolygon') {
        coordinates.forEach((polygon: number[][][]) => {
          polygon.forEach((ring: number[][]) => {
            ring.forEach((coord: number[]) => updateBounds(coord));
          });
        });
      }
    }
    
    function updateBounds(coord: number[]) {
      const [lng, lat] = coord;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    
    // Return null if we didn't find any valid coordinates
    if (minLng === Infinity || minLat === Infinity) return null;
    
    // Return as [[minLng, minLat], [maxLng, maxLat]]
    return [[minLng, minLat], [maxLng, maxLat]];
  };

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

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Function to remove existing boundary layers
  const removeExistingBoundaries = () => {
    if (mapRef.current) {
      if (mapRef.current.getLayer('region-boundary')) {
        mapRef.current.removeLayer('region-boundary');
      }
      if (mapRef.current.getLayer('region-outline')) {
        mapRef.current.removeLayer('region-outline');
      }
      if (mapRef.current.getSource('region-boundary')) {
        mapRef.current.removeSource('region-boundary');
      }
    }
  };

  const handleButtonClick = () => {
    removeExistingBoundaries();
    setError("");
    mapRef.current?.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });
  };

  const handleSearch = async () => {
    if (!region) return;
    
    removeExistingBoundaries();
    setLoading(true);
    setError("");
    
    try {
      // Fetch the boundary using Nominatim API
      const nominatimResponse = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: region,
            format: 'json',
            polygon_geojson: 1,
            limit: 1
          },
          headers: {
            'User-Agent': 'MapApp/1.0' // Required by Nominatim's terms of use
          }
        }
      );
      
      if (nominatimResponse.data && nominatimResponse.data.length > 0) {
        const result = nominatimResponse.data[0];
        
        // Get the coordinates from the result
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        
        // Center the map to the coordinates
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 10,
        });
        
        if (result.geojson) {
          // Add the boundary to the map
          mapRef.current?.addSource("region-boundary", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: result.geojson
            }
          });
          
          // Add fill layer
          mapRef.current?.addLayer({
            id: "region-boundary",
            type: "fill",
            source: "region-boundary",
            layout: {},
            paint: {
              "fill-color": "#0080ff",
              "fill-opacity": 0.3
            }
          });
          
          // Add outline layer
          mapRef.current?.addLayer({
            id: "region-outline",
            type: "line",
            source: "region-boundary",
            layout: {},
            paint: {
              "line-color": "#000",
              "line-width": 2
            }
          });
          
          // Fit the map to the boundary
          const featureData = {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: result.geojson,
              properties: {}
            }]
          };
          
          const bounds = getBoundsFromGeoJson(featureData);
          if (bounds) {
            mapRef.current?.fitBounds(bounds as mapboxgl.LngLatBoundsLike, {
              padding: 50
            });
          }
        } else {
          // Fall back to the simple square if no boundary found
          mapRef.current?.addSource("region-boundary", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
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
          
          setError("Detailed boundary not available. Using approximate area.");
        }
      } else {
        setError("Could not find the region");
      }
    } catch (error) {
      console.error("Error fetching boundary:", error);
      setError("Failed to get region boundary");
    } finally {
      setLoading(false);
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

          <div className="absolute top-23 left-2 shadow-md">
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Search for a region"
              className="p-2 bg-white rounded-md border"
            />
            <Button 
              onClick={handleSearch}
              className="ml-2"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
};