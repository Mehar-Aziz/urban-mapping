"use client"
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// Set Mapbox access token
mapboxgl.accessToken = "pk.eyJ1IjoibWVoYXItYXppeiIsImEiOiJjbTdwd3BicDcwMmF5MmxwaHJkeW13cnVvIn0.4MS6keg1jZvx4KOBDsTqug";

export default function TimeSeriesLandCoverMap({activeLayers, availableYears}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [69.3451, 30.3753],
      zoom: 5,
      minZoom: 3,
      maxZoom: 14 // Fixed maximum zoom level
    });

    mapRef.current = map;

    return () => map.remove();
  }, []);

  // Update layers when selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Add or remove layers based on selection
    availableYears.forEach(year => {
      const sourceId = `landcover-${year}`;
      const layerId = `landcover-layer-${year}`;
      
      if (activeLayers[year]) {
        // Add source if not exists
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'raster',
            tiles: [`/tiles/${year}/{z}/{x}/{y}.png`],
            tileSize: 256
          });
        }

        // Add layer if not exists
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            minzoom: 0,
            maxzoom: 24,
            paint: {
              'raster-opacity': 0.8,
              'raster-resampling': 'linear'
            }
          }, 'road-label');
        }
      } else {
        // Remove layer if exists
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        
        // Remove source if exists
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      }
    });
  }, [activeLayers, availableYears]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}