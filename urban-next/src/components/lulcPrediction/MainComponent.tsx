import React, { useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { MapRefs } from "@/types";
import { useMapState } from "@/hooks";
import { useMapInitialization } from "@/hooks";
import { ControlPanel } from "./ControlPanel";
import { MapComponent } from "./MapComponent";
import { MapControls } from "./MapController";
import {
  getGridSpacing,
  createGeoJsonFeatures,
  clearPredictionLayers,
  addPredictionLayers,
  addHoverHandlers,
  getClassCounts,
} from "@/utils/predictionUtils";
import { sendPolygonToBackend } from "@/utils/predictionUtils";

export default function LandCoverPredictionMap() {
  // Refs
  const refs: MapRefs = {
    mapContainer: useRef<HTMLDivElement>(null),
    map: useRef<mapboxgl.Map>(null),
    draw: useRef<MapboxDraw>(null),
    controlContainer: useRef<HTMLDivElement>(null),
  };

  // State management
  const {
    state,
    setLoading,
    setError,
    setPredictions,
    setSelectedModel,
    setHasDrawnPolygon,
    setDrawMode,
    resetState,
  } = useMapState();

  // API call handler
  const handlePolygonData = useCallback(
    async (coordinates: number[][]) => {
      setLoading(true);
      setError(null);

      try {
        const predictions = await sendPolygonToBackend(coordinates);
        setPredictions(predictions);
        visualizePredictions(predictions, coordinates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Prediction failed");
        console.error("Prediction error:", err);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setPredictions]
  );

  // Draw event handlers
  const handleDrawCreate = useCallback(
    (e: any) => {
      setHasDrawnPolygon(true);
      const polygon = e.features[0];
      if (polygon?.geometry?.type === "Polygon") {
        handlePolygonData(polygon.geometry.coordinates[0]);
      }
    },
    [handlePolygonData, setHasDrawnPolygon]
  );

  const handleDrawUpdate = useCallback(
    (e: any) => {
      const polygon = e.features[0];
      if (polygon?.geometry?.type === "Polygon") {
        handlePolygonData(polygon.geometry.coordinates[0]);
      }
    },
    [handlePolygonData]
  );

  const handleDrawDelete = useCallback(() => {
    setHasDrawnPolygon(false);
    setPredictions([]);
    if (refs.map.current) {
      clearPredictionLayers(refs.map.current);
    }
  }, [setHasDrawnPolygon, setPredictions]);

  const handleDrawModeChange = useCallback(
    (mode: string) => {
      setDrawMode(mode === "draw_polygon" ? "drawing" : "idle");
    },
    [setDrawMode]
  );

  // Visualization function
  const visualizePredictions = useCallback(
    (predictionData: any[], polygonCoordinates: number[][]) => {
      if (!refs.map.current) return;

      clearPredictionLayers(refs.map.current);

      const gridSpacing = getGridSpacing(predictionData);
      const features = createGeoJsonFeatures(predictionData, gridSpacing);

      const geojsonData = {
        type: "FeatureCollection" as const,
        features,
      };

      addPredictionLayers(refs.map.current, geojsonData);
      addHoverHandlers(refs.map.current);
    },
    []
  );

  // Clear all function
  const clearAll = useCallback(() => {
    if (refs.draw.current) {
      refs.draw.current.deleteAll();
    }
    if (refs.map.current) {
      clearPredictionLayers(refs.map.current);
    }
    resetState();
  }, [resetState]);

  // Model change handler
  const handleModelChange = useCallback(
    (newModel: string) => {
      setSelectedModel(newModel);

      if (state.hasDrawnPolygon && refs.draw.current) {
        const data = refs.draw.current.getAll();
        if (data.features.length > 0) {
          const polygon = data.features[0];
          if (polygon.geometry.type === "Polygon") {
            const coordinates = polygon.geometry.coordinates[0];
            handlePolygonData(coordinates);
          }
        }
      }
    },
    [setSelectedModel, state.hasDrawnPolygon, handlePolygonData]
  );

  // Map initialization
  useMapInitialization({
    refs,
    onDrawCreate: handleDrawCreate,
    onDrawUpdate: handleDrawUpdate,
    onDrawDelete: handleDrawDelete,
    onDrawModeChange: handleDrawModeChange,
  });

  // Get class counts for legend
  const classCounts = getClassCounts(state.predictions);

return (
  <div className="w-full h-screen bg-gray-50">
    <div className="w-full h-full flex">
      {/* Sidebar Control Panel */}
      <ControlPanel
        state={state}
        classCounts={classCounts}
        onModelChange={handleModelChange}
        onClearAll={clearAll}
      />

      {/* Map Section with controls overlaid */}
      <div className="relative flex-1 h-screen">
        {/* Map Container */}
        <MapComponent mapContainer={refs.mapContainer} state={state} />

        {/* Controls Overlaid on Map */}
        <div className="absolute top-4 left-4 z-10">
          <MapControls
            drawMode={state.drawMode}
            onDraw={() => {
              refs.draw.current?.changeMode("draw_polygon");
              setDrawMode("drawing");
            }}
            onCancel={() => {
              refs.draw.current?.changeMode("simple_select");
              setDrawMode("idle");
            }}
            onClear={clearAll}
          />
        </div>
      </div>
    </div>
  </div>
);


}