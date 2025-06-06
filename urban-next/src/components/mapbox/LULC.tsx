import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = "pk.eyJ1IjoibWVoYXItYXppeiIsImEiOiJjbTdwd3BicDcwMmF5MmxwaHJkeW13cnVvIn0.4MS6keg1jZvx4KOBDsTqug";

export default function MapboxMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [69.3451, 30.3753], // Pakistan center
      zoom: 5
    });

    map.on('load', () => {
      // CORRECTED: Path should match your actual folder structure
      const tilePath = `/output_tiles2/{z}/{x}/{y}.png`;

      // Add raster source
      map.addSource('lulc-2023', {
        type: 'raster',
        tiles: [tilePath],
        tileSize: 256, // Standard tile size
        minzoom: 0,
        maxzoom: 12
      });

      // Add layer
      map.addLayer({
        id: 'lulc-layer',
        type: 'raster',
        source: 'lulc-2023',
        minzoom: 0,
        maxzoom: 12,
        layout: {
          visibility: 'visible'
        },
        paint: {
          'raster-opacity': 0.8,
          'raster-resampling': 'linear'
        }
      });
    });

    // Error handling for tile loading
    map.on('error', (e) => {
      console.error('Map error:', e);
    });

    map.on('sourcedata', (e) => {
      if (e.sourceId === 'lulc-2023' && e.isSourceLoaded) {
        console.log('LULC tiles loaded successfully');
      }
    });

    return () => map.remove();
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: '100%', 
          height: '100%'
        }} 
      />
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        <div>Pakistan LULC 2023</div>
        <div>Zoom: 0-12 levels</div>
      </div>
    </div>
  );
}