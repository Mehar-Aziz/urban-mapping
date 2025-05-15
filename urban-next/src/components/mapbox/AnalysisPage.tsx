"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { format } from "date-fns";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const INITIAL_CENTER: [number, number] = [74.3587, 31.5204]; // Lahore
const INITIAL_ZOOM = 9;
const MAPBOX_TOKEN = "pk.eyJ1IjoibWVoYXItYXppeiIsImEiOiJjbTdwd3BicDcwMmF5MmxwaHJkeW13cnVvIn0.4MS6keg1jZvx4KOBDsTqug";
const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";
const API_URL = "http://127.0.0.1:8000";

// Use case options
const USE_CASES = [
  { value: "air-quality-analysis", label: "Air Quality Analysis" },
  { value: "ndvi-analysis", label: "NDVI Analysis" },
  { value: "thermal-analysis", label: "Thermal Analysis" }
];

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [selectedUseCase, setSelectedUseCase] = useState("air-quality-analysis");
  const [useCaseLabel, setUseCaseLabel] = useState("Air Quality Analysis");
  // State for calendar dates
  const [fromDate, setFromDate] = useState<Date | undefined>(new Date());
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  // Initialize the map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: center,
      zoom: zoom,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
    });

    mapRef.current = map;

     fetch("http://127.0.0.1:8000/geojson/lahore-ucs")
    .then((res) => res.json())
    .then((geojson) => {
      map.addSource("lahore-ucs", {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: "lahore-uc-lines",
        type: "line",
        source: "lahore-ucs",
        paint: {
          "line-color": "#FF0000",
          "line-width": 3,
        },
      });

      
    });

    map.on('move', () => {
      const center = map.getCenter();
      setCenter([center.lng, center.lat]);
      setZoom(map.getZoom());
    });

    return () => map.remove();
  }, []);

  // Handle use case change
  const handleUseCaseChange = (value: string) => {
    setSelectedUseCase(value);
    const selectedCase = USE_CASES.find(option => option.value === value);
    if (selectedCase) {
      setUseCaseLabel(selectedCase.label);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center p-2 sm:p-4 border-b space-y-2 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:space-x-2 w-full sm:w-auto">
          <Select value={selectedUseCase} onValueChange={handleUseCaseChange}>
            <SelectTrigger className="w-full sm:w-40 h-9">
              <SelectValue placeholder="Select Use Case" />
            </SelectTrigger>
            <SelectContent>
              {USE_CASES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-1 flex-col sm:flex-row">
        {/* Sidebar for larger screens, Bottom Nav for mobile */}
        <div className="sm:w-56 bg-white border-r sm:flex sm:flex-col hidden">
          <div className="p-3 border-b">
            <Link href='/main/analysis/viewreport'>
              <Button variant="outline" className="w-full justify-start">
                View Report
              </Button>
            </Link>
          </div>
          <div className="p-3 border-b">
            <Link href='/main'>
              <Button variant="outline" className="w-full justify-start">
                Change Location
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom Navigation for Mobile */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-10">
          <Link href='/main/analysis/viewreport'>
            <Button variant="outline" size="sm" className="flex-1 mx-1">
              View Report
            </Button>
          </Link>
          <Link href='/main'>
            <Button variant="outline" size="sm" className="flex-1 mx-1">
              Change Location
            </Button>
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Controls for Analysis and Date */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-2 border-b space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                {useCaseLabel}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    {fromDate ? format(fromDate, "PPP") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    {toDate ? format(toDate, "PPP") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Map Container */}
          <div className="flex-1 relative pb-16 sm:pb-0" ref={mapContainerRef}>
            {/* Map will be rendered here by Mapbox GL JS */}
          </div>
        </div>
      </div>
    </div>
  );
}