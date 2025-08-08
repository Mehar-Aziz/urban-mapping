import mapboxgl from 'mapbox-gl';
import { PredictionPoint, ClassCounts } from '../types';
import { CLASS_COLORS } from '../constants';
import { PolygonCoordinate, ApiPayload } from '../types';

export const API_ENDPOINTS = {
  classifyPolygon: "http://127.0.0.1:8000/api/classify-polygon",
};

export const getGridSpacing = (predictionData: PredictionPoint[]): number => {
  if (predictionData.length < 2) return 0.0001;
  
  const lons = [...new Set(predictionData.map(p => p.longitude))].sort((a, b) => a - b);
  const lats = [...new Set(predictionData.map(p => p.latitude))].sort((a, b) => a - b);
  
  let lonSpacing = 0.0001;
  let latSpacing = 0.0001;
  
  if (lons.length > 1) {
    lonSpacing = lons[1] - lons[0];
  }
  
  if (lats.length > 1) {
    latSpacing = lats[1] - lats[0];
  }
  
  const spacing = Math.min(lonSpacing, latSpacing);
  
  console.log(`Calculated spacing: ${spacing}`);
  console.log(`Lon spacing: ${lonSpacing}, Lat spacing: ${latSpacing}`);
  console.log(`Grid dimensions: ${lons.length} x ${lats.length}`);
  
  return spacing;
};

export const createGridCell = (lon: number, lat: number, halfSpacing: number): number[][] => {
  return [
    [lon - halfSpacing, lat - halfSpacing],
    [lon + halfSpacing, lat - halfSpacing],
    [lon + halfSpacing, lat + halfSpacing],
    [lon - halfSpacing, lat + halfSpacing],
    [lon - halfSpacing, lat - halfSpacing],
  ];
};

export const createGeoJsonFeatures = (
  predictionData: PredictionPoint[],
  gridSpacing: number
) => {
  const halfSpacing = gridSpacing / 2;

  return predictionData.map((point, index) => ({
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
      coordinates: [createGridCell(point.longitude, point.latitude, halfSpacing)],
    },
  }));
};

export const clearPredictionLayers = (map: mapboxgl.Map) => {
  if (map.getLayer("prediction-grids")) {
    map.removeLayer("prediction-grids");
  }
  if (map.getLayer("prediction-grid-stroke")) {
    map.removeLayer("prediction-grid-stroke");
  }
  if (map.getSource("predictions")) {
    map.removeSource("predictions");
  }
};

export const addPredictionLayers = (map: mapboxgl.Map, geojsonData: any) => {
  map.addSource("predictions", {
    type: "geojson",
    data: geojsonData,
  });

  map.addLayer({
    id: "prediction-grids",
    type: "fill",
    source: "predictions",
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": 0.8,
    },
  });
};

export const addHoverHandlers = (map: mapboxgl.Map) => {
  map.on("mouseenter", "prediction-grids", (e) => {
    if (!e.features || e.features.length === 0) return;

    map.getCanvas().style.cursor = "pointer";
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
      .addTo(map);
  });

  map.on("mouseleave", "prediction-grids", () => {
    map.getCanvas().style.cursor = "";
    const popups = document.getElementsByClassName("mapboxgl-popup");
    while (popups.length > 0) {
      popups[0].remove();
    }
  });
};

export const getClassCounts = (predictions: PredictionPoint[]): ClassCounts => {
  const counts: ClassCounts = {};
  predictions.forEach((point) => {
    counts[point.predicted_class] = (counts[point.predicted_class] || 0) + 1;
  });
  return counts;
};


export const sendPolygonToBackend = async (
  coordinates: number[][]
): Promise<PredictionPoint[]> => {
  const polygonCoords: PolygonCoordinate[] = coordinates
    .slice(0, -1)
    .map(([lon, lat]) => ({ lat, lon }));

  const payload: ApiPayload = {
    polygon: polygonCoords,
  };

  const response = await fetch(API_ENDPOINTS.classifyPolygon, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const json = await response.json();
  
  if (!Array.isArray(json.data)) {
    throw new Error("Invalid API response");
  }

  return json.data;
};