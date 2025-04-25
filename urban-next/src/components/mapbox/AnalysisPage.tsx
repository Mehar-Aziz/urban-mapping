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

const INITIAL_CENTER: [number, number] = [69.3451, 30.3753]; // Pakistan
const INITIAL_ZOOM = 3.9;
const MAPBOX_TOKEN = "pk.eyJ1IjoibWVoYXItYXppeiIsImEiOiJjbTdwd3BicDcwMmF5MmxwaHJkeW13cnVvIn0.4MS6keg1jZvx4KOBDsTqug";
const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";
const API_URL = "http://127.0.0.1:8000";

// Use case options
const USE_CASES = [
  { value: "crop-monitoring", label: "Crop Monitoring" },
  { value: "soil-analysis", label: "Soil Analysis" },
  { value: "water-resources", label: "Water Resources" }
];

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  
  // State for use case selection
  const [selectedUseCase, setSelectedUseCase] = useState("crop-monitoring");
  const [useCaseLabel, setUseCaseLabel] = useState("Crop Monitoring");
  
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
      <div className="flex items-center p-4 border-b">
        <div className="flex space-x-2">          
          <Select value={selectedUseCase} onValueChange={handleUseCaseChange}>
            <SelectTrigger className="w-40 h-9">
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

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <div className="w-56 bg-white border-r flex flex-col">
          <div className="p-3 border-b">
            <Button variant="outline" className="w-full justify-start">
              View Report
            </Button>
          </div>
          
          <div className="p-3 border-b">
            <Link href='/main'>
            <Button variant="outline" className="w-full justify-start">
              Change Location
            </Button>
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Controls for Analysis and Date */}
          <div className="flex justify-between items-center p-2 border-b">
            <div className="flex items-center space-x-4">
              <div>
                <Button variant="outline" size="sm">
                  {useCaseLabel}
                </Button>
              </div>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
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
              </div>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
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
            
            
          </div>
          
          {/* Map Container */}
          <div className="flex-1 relative" ref={mapContainerRef}>
            {/* Map will be rendered here by Mapbox GL JS */}
          </div>
        </div>
      </div>
    </div>
  );
}