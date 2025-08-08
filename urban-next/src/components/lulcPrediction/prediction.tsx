import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Map, Layers } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PredictionPoint, PolygonCoordinate, ApiPayload } from "@/types";
import { CLASS_COLORS, AVAILABLE_MODELS } from "@/constants";
import * as turf from "@turf/turf";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function LandCoverPredictionMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const controlContainerRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionPoint[]>([]);
  const [selectedModel, setSelectedModel] = useState("LSTM");
  const [hasDrawnPolygon, setHasDrawnPolygon] = useState(false);
  const [drawMode, setDrawMode] = useState<"idle" | "drawing">("idle");

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: [70.8897, 29.1805],
      zoom: 12,
      attributionControl: false,
    });

    // Initialize MapboxDraw
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: false,
        trash: false,
      },
    });

    map.current.addControl(draw.current);
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    // Create custom control container once
    controlContainerRef.current = document.createElement("div");
    controlContainerRef.current.className =
      "mapboxgl-ctrl mapboxgl-ctrl-group flex gap-2 p-2 bg-white/90 backdrop-blur rounded-lg shadow-md";

    map.current.addControl(
      {
        onAdd: () => controlContainerRef.current!,
        onRemove: () => {
          controlContainerRef.current?.parentNode?.removeChild(
            controlContainerRef.current
          );
        },
      },
      "top-right"
    );

    // Handle polygon creation
    map.current.on("draw.create", handlePolygonCreate);
    map.current.on("draw.update", handlePolygonUpdate);
    map.current.on("draw.delete", handlePolygonDelete);
    map.current.on("draw.modechange", (e) => {
      setDrawMode(e.mode === "draw_polygon" ? "drawing" : "idle");
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Update control buttons based on draw state
  useEffect(() => {
    if (!controlContainerRef.current) return;

    controlContainerRef.current.innerHTML = "";

    // Draw Button
    const drawBtn = document.createElement("button");
    drawBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      </svg>
      <span>Draw</span>
    `;
    drawBtn.onclick = () => {
      draw.current?.changeMode("draw_polygon");
      setDrawMode("drawing");
    };
    drawBtn.className = `flex items-center gap-1 px-3 py-1.5 rounded-md ${
      drawMode === "drawing"
        ? "bg-blue-500 text-white"
        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
    } transition-colors`;

    // Cancel Button
    const cancelBtn = document.createElement("button");
    cancelBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
      </svg>
      <span>Cancel</span>
    `;
    cancelBtn.onclick = () => {
      draw.current?.changeMode("simple_select");
      setDrawMode("idle");
    };
    cancelBtn.className =
      "flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors";
    cancelBtn.disabled = drawMode !== "drawing";
    if (drawMode !== "drawing") {
      cancelBtn.classList.add("opacity-50", "cursor-not-allowed");
    }

    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      </svg>
      <span>Clear</span>
    `;
    deleteBtn.onclick = clearAll;
    deleteBtn.className =
      "flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 rounded-md transition-colors";

    // Add buttons to container
    controlContainerRef.current.appendChild(drawBtn);
    controlContainerRef.current.appendChild(cancelBtn);
    controlContainerRef.current.appendChild(deleteBtn);
  }, [drawMode]);

  // Draw event handlers
  const handlePolygonCreate = useCallback(
    (e: any) => {
      setHasDrawnPolygon(true);
      const polygon = e.features[0];
      if (polygon?.geometry?.type === "Polygon") {
        sendPolygonToBackend(polygon.geometry.coordinates[0]);
      }
    },
    [selectedModel]
  );

  const handlePolygonUpdate = useCallback(
    (e: any) => {
      const polygon = e.features[0];
      if (polygon?.geometry?.type === "Polygon") {
        sendPolygonToBackend(polygon.geometry.coordinates[0]);
      }
    },
    [selectedModel]
  );

  const handlePolygonDelete = useCallback(() => {
    setHasDrawnPolygon(false);
    setPredictions([]);
    clearPredictionLayer();
  }, []);

  // API call to backend
  const sendPolygonToBackend = async (coordinates: number[][]) => {
    setIsLoading(true);
    setError(null);

    try {
      const polygonCoords: PolygonCoordinate[] = coordinates
        .slice(0, -1)
        .map(([lon, lat]) => ({ lat, lon }));

      const payload: ApiPayload = {
        polygon: polygonCoords,
      };

      const response = await fetch(
        "http://127.0.0.1:8000/api/classify-polygon",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const json = await response.json();
      if (!Array.isArray(json.data)) throw new Error("Invalid API response");

      setPredictions(json.data);
      visualizePredictions(json.data, coordinates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
      console.error("Prediction error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);

    if (hasDrawnPolygon && draw.current) {
      const data = draw.current.getAll();
      if (data.features.length > 0) {
        const polygon = data.features[0];
        if (polygon.geometry.type === "Polygon") {
          const coordinates = polygon.geometry.coordinates[0];
          // Re-fetch AND re-visualize with new model
          sendPolygonToBackend(coordinates);
        }
      }
    }
  };

  const clearAll = useCallback(() => {
    if (draw.current) {
      draw.current.deleteAll();
    }
    setPredictions([]);
    setHasDrawnPolygon(false);
    setDrawMode("idle");
    clearPredictionLayer();
  }, []);

  const getGridSpacing = (predictionData: PredictionPoint[]): number => {
  if (predictionData.length < 2) return 0.0001;
  
  // Get sorted unique coordinates
  const lons = [...new Set(predictionData.map(p => p.longitude))].sort((a, b) => a - b);
  const lats = [...new Set(predictionData.map(p => p.latitude))].sort((a, b) => a - b);
  
  let lonSpacing = 0.0001;
  let latSpacing = 0.0001;
  
  // Calculate consistent spacing
  if (lons.length > 1) {
    lonSpacing = lons[1] - lons[0]; // Use first difference as reference
  }
  
  if (lats.length > 1) {
    latSpacing = lats[1] - lats[0]; // Use first difference as reference  
  }
  
  // Use the average of lon/lat spacing, or the smaller one
  const spacing = Math.min(lonSpacing, latSpacing);
  
  console.log(`Calculated spacing: ${spacing}`);
  console.log(`Lon spacing: ${lonSpacing}, Lat spacing: ${latSpacing}`);
  console.log(`Grid dimensions: ${lons.length} x ${lats.length}`);
  
  return spacing;
};

  const visualizePredictions = (
  predictionData: PredictionPoint[],
  polygonCoordinates: number[][]
) => {
  if (!map.current) return;
  clearPredictionLayer();

  // Use the new grid spacing calculation
  const gridSpacing = getGridSpacing(predictionData);
  const halfSpacing = gridSpacing / 2;

  console.log(`Grid spacing: ${gridSpacing}, Half spacing: ${halfSpacing}`);
  console.log(`Total points: ${predictionData.length}`);

  // Create non-overlapping grid cells
  const createGridCell = (lon: number, lat: number): number[][] => {
    return [
      [lon - halfSpacing, lat - halfSpacing],
      [lon + halfSpacing, lat - halfSpacing],
      [lon + halfSpacing, lat + halfSpacing],
      [lon - halfSpacing, lat + halfSpacing],
      [lon - halfSpacing, lat - halfSpacing],
    ];
  };

  const features = predictionData.map((point, index) => ({
    type: "Feature" as const,
    id: index,
    properties: {
      class: point.predicted_class,
      confidence: point.confidence,
      color: CLASS_COLORS[point.predicted_class] || "#666666",
      longitude: point.longitude,
      latitude: point.latitude,
    },
    geometry: {
      type: "Polygon" as const,
      coordinates: [createGridCell(point.longitude, point.latitude)],
    },
  }));

  const geojsonData = {
    type: "FeatureCollection" as const,
    features,
  };

  map.current.addSource("predictions", {
    type: "geojson",
    data: geojsonData,
  });

  map.current.addLayer({
    id: "prediction-grids",
    type: "fill",
    source: "predictions",
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": 0.8, 

    },
  });

  // Add stroke layer to better visualize grid boundaries
//   map.current.addLayer({
//     id: "prediction-grid-stroke",
//     type: "line",
//     source: "predictions",
//     paint: {
//       "line-color": "#000000",
//       "line-width": 0.5,
//       "line-opacity": 0.8,
//     },
//   });

  // Enhanced hover functionality
  map.current.on("mouseenter", "prediction-grids", (e) => {
    if (!map.current || !e.features || e.features.length === 0) return;

    map.current.getCanvas().style.cursor = "pointer";
    const feature = e.features[0];
    const properties = feature.properties;

    new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat(e.lngLat)
      .setHTML(
        `
        <div class="p-2 text-xs">
          <strong>Class:</strong> ${properties?.class}<br/>
          <strong>Confidence:</strong> ${(properties?.confidence * 100).toFixed(1)}%<br/>
          <strong>Coordinates:</strong> ${properties?.longitude?.toFixed(6)}, ${properties?.latitude?.toFixed(6)}
        </div>
        `
      )
      .addTo(map.current);
  });

  map.current.on("mouseleave", "prediction-grids", () => {
    if (!map.current) return;
    map.current.getCanvas().style.cursor = "";

    const popups = document.getElementsByClassName("mapboxgl-popup");
    while (popups.length > 0) {
      popups[0].remove();
    }
  });
};

// Updated clearPredictionLayer to handle the new stroke layer
const clearPredictionLayer = () => {
  if (!map.current) return;

  // Remove both fill and stroke layers
  if (map.current.getLayer("prediction-grids")) {
    map.current.removeLayer("prediction-grids");
  }
  if (map.current.getLayer("prediction-grid-stroke")) {
    map.current.removeLayer("prediction-grid-stroke");
  }
  if (map.current.getSource("predictions")) {
    map.current.removeSource("predictions");
  }
};

  const getClassCounts = () => {
    const counts: { [key: string]: number } = {};
    predictions.forEach((point) => {
      counts[point.predicted_class] = (counts[point.predicted_class] || 0) + 1;
    });
    return counts;
  };

  return (
    <div className="w-full h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Control Panel */}
      <div className="w-full lg:w-80 p-4 bg-white shadow-lg z-10 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              Land Cover Prediction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Model
              </label>
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instructions */}
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Draw a polygon on the map</li>
                <li>Wait for predictions to load</li>
                <li>View results in the legend below</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={clearAll}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Clear All
              </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing predictions...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Results Summary */}
            {predictions.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Results ({predictions.length} points)
                </h3>
                <div className="text-sm text-gray-600 mb-3">
                  Model: <Badge variant="secondary">{selectedModel}</Badge>
                </div>
              </div>
            )}

            {/* Legend */}
            {predictions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Class Distribution</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(getClassCounts()).map(
                    ([className, count]) => (
                      <div
                        key={className}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{
                            backgroundColor:
                              CLASS_COLORS[className] || "#666666",
                          }}
                        />
                        <span className="flex-1">{className}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div
          ref={mapContainer}
          className="w-full h-full"
          style={{ minHeight: "400px" }}
        />

        {/* Map Instructions Overlay */}
        {!hasDrawnPolygon && !isLoading && (
          <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg lg:left-auto lg:right-4 lg:w-80">
            <p className="text-sm text-gray-700">
              Click on the map to start drawing a polygon. Complete the polygon
              to get land cover predictions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
