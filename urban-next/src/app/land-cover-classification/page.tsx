"use client"
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import LayerControl from '@/components/landcover/LayerControl';
import LandCoverLegend from '@/components/landcover/LayerCoverLegend';

// Dynamically load map to prevent SSR issues
const TimeSeriesLandCoverMap = dynamic(
  () => import('@/components/landcover/LULC'),
  { ssr: false }
);

export default function Home() {
  const availableYears = useMemo(() => [2017, 2018, 2019, 2020, 2021, 2022, 2023], []);
  const [activeLayers, setActiveLayers] = useState({});
  
  // Initialize layers state
  useEffect(() => {
    const initialState = {};
    availableYears.forEach(year => {
      initialState[year] = false;
    });
    setActiveLayers(initialState);
  }, [availableYears]);

  const toggleLayer = (year) => {
    setActiveLayers(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <TimeSeriesLandCoverMap 
  activeLayers={activeLayers}
  availableYears={availableYears}
/>

      
      <LayerControl 
        years={availableYears}
        activeLayers={activeLayers}
        onToggle={toggleLayer}
      />
      
      <LandCoverLegend />
    </div>
  );
}