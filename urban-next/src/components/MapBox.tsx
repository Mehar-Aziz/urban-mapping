"use client"
import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "./ui/button";
import axios from "axios";
// Add this import for KML to GeoJSON conversion
// Make sure to install: npm install @tmcw/togeojson
import { kml } from "@tmcw/togeojson";

const INITIAL_CENTER: [number, number] = [69.3451, 30.3753];
const INITIAL_ZOOM = 3.9;
const MAPBOX_TOKEN = "pk.eyJ1IjoibWVoYXItYXppeiIsImEiOiJjbTdwd3BicDcwMmF5MmxwaHJkeW13cnVvIn0.4MS6keg1jZvx4KOBDsTqug";

export const MapBox = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [region, setRegion] = useState(""); // State for the search input
  const [kmlLoaded, setKmlLoaded] = useState(false);
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
      setKmlLoaded(false);
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
          
          setKmlLoaded(true);
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
          setKmlLoaded(true);
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

  // Function to process KML file
  const processKmlFile = async (file: File): Promise<GeoJSON.FeatureCollection | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          if (!e.target || !e.target.result) {
            reject(new Error("Failed to read file"));
            return;
          }
          
          const kmlText = e.target.result as string;
          const kmlDom = new DOMParser().parseFromString(kmlText, 'text/xml');
          const geojson = kml(kmlDom) as GeoJSON.FeatureCollection;
          resolve(geojson);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsText(file);
    });
  };

  // Function to handle KML file upload
  const handleKmlFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setLoading(true);
    setError("");
    
    try {
      const geojson = await processKmlFile(file);
      
      // Remove existing boundary layers
      removeExistingBoundaries();
      
      // Add the KML data to the map
      if (mapRef.current && geojson) {
        // Add source
        mapRef.current.addSource("region-boundary", {
          type: "geojson",
          data: geojson
        });
        
        // Add fill layer for polygons
        mapRef.current.addLayer({
          id: "region-boundary",
          type: "fill",
          source: "region-boundary",
          layout: {},
          paint: {
            "fill-color": "#0080ff",
            "fill-opacity": 0.3,
          },
          filter: ["==", "$type", "Polygon"]
        });
        
        // Add line layer for all geometries
        mapRef.current.addLayer({
          id: "region-outline",
          type: "line",
          source: "region-boundary",
          layout: {},
          paint: {
            "line-color": "#000",
            "line-width": 2,
          }
        });
        
        // Fit the map to the KML bounds
        const bounds = getBoundsFromGeoJson(geojson);
        if (bounds) {
          mapRef.current.fitBounds(bounds as mapboxgl.LngLatBoundsLike, {
            padding: 50
          });
        }
        
        setKmlLoaded(true);
      }
    } catch (error) {
      console.error("Error processing KML file:", error);
      setError("Failed to process KML file");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle KML download
  const handleDownloadKml = () => {
    if (!mapRef.current) return;
    
    try {
      // Get the GeoJSON data from the map
      const source = mapRef.current.getSource('region-boundary') as mapboxgl.GeoJSONSource;
      
      // We need to access the _data property which is technically private
      // This is a bit of a hack but works for simple cases
      // In a production app, you might want to store the original GeoJSON in state
      const sourceData = (source as any)._data;
      
      if (!sourceData) {
        setError("No data to download");
        return;
      }
      
      // Convert GeoJSON to KML
      // This is a simple approach - for complex conversions you may need a library
      let kmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
      kmlContent += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
      kmlContent += '<Document>\n';
      kmlContent += '  <name>Map Export</name>\n';
      
      // Process features
      if (sourceData.features) {
        sourceData.features.forEach((feature: GeoJSON.Feature, index: number) => {
          kmlContent += `  <Placemark>\n`;
          kmlContent += `    <name>Feature ${index + 1}</name>\n`;
          
          if (feature.geometry.type === 'Polygon') {
            kmlContent += '    <Polygon>\n';
            kmlContent += '      <outerBoundaryIs>\n';
            kmlContent += '        <LinearRing>\n';
            kmlContent += '          <coordinates>\n';
            
            // Convert coordinates to KML format (lon,lat,alt)
            const coords = feature.geometry.coordinates[0];
            coords.forEach((coord: number[]) => {
              kmlContent += `            ${coord[0]},${coord[1]},0\n`;
            });
            
            kmlContent += '          </coordinates>\n';
            kmlContent += '        </LinearRing>\n';
            kmlContent += '      </outerBoundaryIs>\n';
            kmlContent += '    </Polygon>\n';
          }
          
          kmlContent += '  </Placemark>\n';
        });
      } else if (sourceData.geometry && sourceData.geometry.type === 'Polygon') {
        kmlContent += `  <Placemark>\n`;
        kmlContent += `    <name>Region</name>\n`;
        kmlContent += '    <Polygon>\n';
        kmlContent += '      <outerBoundaryIs>\n';
        kmlContent += '        <LinearRing>\n';
        kmlContent += '          <coordinates>\n';
        
        // Convert coordinates to KML format (lon,lat,alt)
        const coords = sourceData.geometry.coordinates[0];
        coords.forEach((coord: number[]) => {
          kmlContent += `            ${coord[0]},${coord[1]},0\n`;
        });
        
        kmlContent += '          </coordinates>\n';
        kmlContent += '        </LinearRing>\n';
        kmlContent += '      </outerBoundaryIs>\n';
        kmlContent += '    </Polygon>\n';
        kmlContent += '  </Placemark>\n';
      }
      
      kmlContent += '</Document>\n';
      kmlContent += '</kml>';
      
      // Create a download link
      const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'map_export.kml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error downloading KML:", error);
      setError("Failed to download KML file");
    }
  };

  // Function to clear KML data
  const handleClearKml = () => {
    removeExistingBoundaries();
    setError("");
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
            <Button 
              onClick={handleSearch}
              className="ml-2"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          
          {/* KML File Controls */}
          <div className="absolute top-32 left-2 bg-white p-2 rounded-lg shadow-md">
            <input
              type="file"
              id="kml-file-input"
              accept=".kml"
              onChange={handleKmlFileUpload}
              className="hidden" // Hide the actual file input
            />
            <Button 
              onClick={() => document.getElementById('kml-file-input')?.click()}
              className="w-full mb-2"
              disabled={loading}
            >
              {loading ? "Loading..." : "Add Your KML File"}
            </Button>
            
            {/* Show these buttons when KML is loaded */}
            {kmlLoaded && (
              <>
                <Button 
                  onClick={handleDownloadKml}
                  className="w-full mb-2"
                >
                  Download KML
                </Button>
                <Button 
                  onClick={handleClearKml}
                  className="w-full"
                >
                  Clear
                </Button>
              </>
            )}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
};