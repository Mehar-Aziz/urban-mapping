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
const API_URL = "http://127.0.0.1:8000";

const USE_CASES = [
  { value: "air-quality-analysis", label: "Air Quality Analysis" },
  { value: "ndvi-analysis", label: "NDVI Analysis" },
  { value: "thermal-analysis", label: "Thermal Analysis" }
];

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center space-x-2">
    <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }}></span>
    <span>{label}</span>
  </div>
);

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [center, setCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [selectedUseCase, setSelectedUseCase] = useState("");
  const [useCaseLabel, setUseCaseLabel] = useState("Select Use Case");
  const [fromDate, setFromDate] = useState<Date | undefined>(new Date());
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      center,
      zoom,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
    });

    mapRef.current = map;

    // Add Lahore UC boundaries
    fetch(`${API_URL}/geojson/lahore-ucs`)
      .then(res => res.json())
      .then(geojson => {
        map.on("load", () => {
          map.addSource("lahore-ucs", {
            type: "geojson",
            data: geojson
          });

          map.addLayer({
            id: "lahore-uc-lines",
            type: "line",
            source: "lahore-ucs",
            paint: {
              "line-color": "#FF0000",
              "line-width": 3
            }
          });

          map.addLayer({
            id: "uc-labels",
            type: "symbol",
            source: "lahore-ucs",
            layout: {
              "text-field": ["get", "UC"],
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-size": 10,
              "text-offset": [0, 0.6],
              "text-anchor": "top"
            },
            paint: {
              "text-color": "#000000",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1
            }
          });

          if (selectedUseCase === "ndvi-analysis") loadNDVILayer(map);
          if (selectedUseCase === "thermal-analysis") loadThermalLayer(map);
        });
      });

    map.on("move", () => {
      const center = map.getCenter();
      setCenter([center.lng, center.lat]);
      setZoom(map.getZoom());
    });

    return () => map.remove();
  }, []);

  useEffect(() => {
  const map = mapRef.current;
  if (!map || !map.isStyleLoaded() || !selectedUseCase) return;

  removeNDVILayer(map);
  removeThermalLayer(map);
  removeAirQualityLayer(map);

  if (selectedUseCase === "ndvi-analysis") loadNDVILayer(map);
  if (selectedUseCase === "thermal-analysis") loadThermalLayer(map);
  if (selectedUseCase === "air-quality-analysis") loadAirQualityLayer(map);
}, [selectedUseCase]);


  const loadNDVILayer = (map: mapboxgl.Map) => {
    fetch(`${API_URL}/uc-data/ndvi`)
      .then(res => res.json())
      .then(geojson => {
        map.addSource("ndvi-data", {
          type: "geojson",
          data: geojson
        });

        map.addLayer({
          id: "ndvi-fill",
          type: "fill",
          source: "ndvi-data",
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "NDVI"],
              0.0, '#ffffcc',  // Very pale green (bare soil/urban)
              0.1, '#e6f5b3',  // Light lime
              0.2, '#1c7d3e',  // Pale green
              0.3, '#9ed97f',  // Medium-light green
              0.4, '#006837',  // Fresh green
              0.5, '#56bf4b',  // Healthy vegetation
              0.6, '#31a354',  // Dense vegetation
              0.7, '#1c7d3e',  // Mature forest
              0.8, '#006837' 
            ],
          }
        }, "lahore-uc-lines");
      });
  };

  const removeNDVILayer = (map: mapboxgl.Map) => {
    if (map.getLayer("ndvi-fill")) map.removeLayer("ndvi-fill");
    if (map.getSource("ndvi-data")) map.removeSource("ndvi-data");
  };

  const loadThermalLayer = (map: mapboxgl.Map) => {
    fetch(`${API_URL}/geojson/thermal`)
      .then(res => res.json())
      .then(geojson => {
        map.addSource("thermal-data", {
          type: "geojson",
          data: geojson
        });

        map.addLayer({
          id: "thermal-fill",
          type: "fill",
          source: "thermal-data",
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "mean"],
              285, "#313695",
              288, "#4575b4",
              291, "#74add1",
              294, "#abd9e9",
              297, "#e0f3f8",
              300, "#ffffbf",
              303, "#fee090",
              306, "#fdae61",
              309, "#f46d43",
              312, "#d73027",
              315, "#a50026"
            ],
          }
        }, "lahore-uc-lines");
      });
  };

  const removeThermalLayer = (map: mapboxgl.Map) => {
    if (map.getLayer("thermal-fill")) map.removeLayer("thermal-fill");
    if (map.getSource("thermal-data")) map.removeSource("thermal-data");
  };

  const loadAirQualityLayer = (map: mapboxgl.Map) => {
  fetch(`${API_URL}/geojson/air-quality`)
    .then(res => res.json())
    .then(geojson => {
      map.addSource("air-quality-data", {
        type: "geojson",
        data: geojson
      });

      map.addLayer({
        id: "air-quality-fill",
        type: "fill",
        source: "air-quality-data",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "AQI"],
      0, "#a1dab4",     // Good
      50, "#41b6c4",    // Moderate
      100, "#2c7fb8",   // Unhealthy for Sensitive Groups
      231.82, "#253494",   // Unhealthy
      232.21, "#fed976",   // Very Unhealthy
      300, "#fd8d3c"],
        }
      }, "lahore-uc-lines");
    });
};

const removeAirQualityLayer = (map: mapboxgl.Map) => {
  if (map.getLayer("air-quality-fill")) map.removeLayer("air-quality-fill");
  if (map.getSource("air-quality-data")) map.removeSource("air-quality-data");
};


  const handleUseCaseChange = (value: string) => {
    setSelectedUseCase(value);
    const selected = USE_CASES.find(option => option.value === value);
    if (selected) setUseCaseLabel(selected.label);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-col sm:flex-row items-center p-2 sm:p-4 border-b space-y-2 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:space-x-2 w-full sm:w-auto">
          <Select>
            <SelectTrigger className="w-full sm:w-40 h-9">
              <SelectValue placeholder="Lahore" />
            </SelectTrigger>
            <SelectContent>
            </SelectContent>
          </Select>
          <Select value={selectedUseCase} onValueChange={handleUseCaseChange}>
            <SelectTrigger className="w-full sm:w-40 h-9">
              <SelectValue placeholder="Select Use Case" />
            </SelectTrigger>
            <SelectContent>
              {USE_CASES.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-1 flex-col sm:flex-row">
        <div className="sm:w-56 bg-white border-r sm:flex sm:flex-col hidden">
          <div className="p-3 border-b">
            <Link href='/main/analysis/viewreport'>
              <Button variant="outline" className="w-full justify-start">View Report</Button>
            </Link>
          </div>
          <div className="p-3 border-b">
            <Link href='/main'>
              <Button variant="outline" className="w-full justify-start">Change Location</Button>
            </Link>
          </div>
        </div>

        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-10">
          <Link href='/main/analysis/viewreport'>
            <Button variant="outline" size="sm" className="flex-1 mx-1">View Report</Button>
          </Link>
          <Link href='/main'>
            <Button variant="outline" size="sm" className="flex-1 mx-1">Change Location</Button>
          </Link>
        </div>

        <div className="flex-1 flex flex-col">
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

          {/* Legend Section */}
          <div className="absolute bottom-20 right-4 z-10 space-y-4 bg-white p-3 border rounded shadow-md text-sm max-w-xs">
            {selectedUseCase === "ndvi-analysis" && (
              <div>
                <h4 className="font-semibold mb-1">NDVI Legend</h4>
                <LegendItem color="#ffffcc" label="0 - 0.2 (Bare Soil)" />
                <LegendItem color="#c2e699" label="0.2 - 0.4" />
                <LegendItem color="#78c679" label="0.4 - 0.6" />
                <LegendItem color="#31a354" label="0.6 - 0.8" />
                <LegendItem color="#006837" label="0.8 - 1 (Vegetation)" />
              </div>
            )}
            {selectedUseCase === "thermal-analysis" && (
              <div>
                <h4 className="font-semibold mb-1">Thermal Legend (K)</h4>
                <LegendItem color="#313695" label="285-288" />
                <LegendItem color="#4575b4" label="288-291" />
                <LegendItem color="#74add1" label="291-294" />
                <LegendItem color="#abd9e9" label="294-297" />
                <LegendItem color="#e0f3f8" label="297-300" />
                <LegendItem color="#ffffbf" label="300-303" />
                <LegendItem color="#fee090" label="303-306" />
                <LegendItem color="#fdae61" label="306-309" />
                <LegendItem color="#f46d43" label="309-312" />
                <LegendItem color="#d73027" label="312-315" />
                <LegendItem color="#a50026" label=">315" />
              </div>
            )}
            {selectedUseCase === "air-quality-analysis" && (
  <div>
    <h4 className="font-semibold mb-1">Air Quality Index (AQI)</h4>
    <LegendItem color="#a1dab4" label="0 - 50 (Good)" />
    <LegendItem color="#41b6c4" label="51 - 100 (Moderate)" />
    <LegendItem color="#2c7fb8" label="101 - 150 (Unhealthy for Sensitive Groups)" />
    <LegendItem color="#253494" label="151 - 200 (Unhealthy)" />
    <LegendItem color="#fed976" label="201 - 300 (Very Unhealthy)" />
    <LegendItem color="#fd8d3c" label="301 - 400 (Hazardous)" />
    <LegendItem color="#e31a1c" label="> 400 (Extremely Hazardous)" />
  </div>
)}

          </div>

          <div className="flex-1 relative pb-16 sm:pb-0" ref={mapContainerRef}></div>
        </div>
      </div>
    </div>
  );
}

