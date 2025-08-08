import { useState, useEffect } from 'react'
import { MapState, PredictionPoint } from '@/types';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { MapRefs, DrawEventHandler } from '@/types';
import { MAP_CONFIG } from '@/constants';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return isMobile
}


//////////////////PREDICTIONS/////////////////////
// components/MapComponent.tsx


export const useMapState = () => {
  const [state, setState] = useState<MapState>({
    isLoading: false,
    error: null,
    predictions: [],
    selectedModel: "LSTM",
    hasDrawnPolygon: false,
    drawMode: "idle",
  });

  const updateState = (updates: Partial<MapState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const setLoading = (isLoading: boolean) => {
    updateState({ isLoading });
  };

  const setError = (error: string | null) => {
    updateState({ error });
  };

  const setPredictions = (predictions: PredictionPoint[]) => {
    updateState({ predictions });
  };

  const setSelectedModel = (selectedModel: string) => {
    updateState({ selectedModel });
  };

  const setHasDrawnPolygon = (hasDrawnPolygon: boolean) => {
    updateState({ hasDrawnPolygon });
  };

  const setDrawMode = (drawMode: 'idle' | 'drawing') => {
    updateState({ drawMode });
  };

  const resetState = () => {
    setState({
      isLoading: false,
      error: null,
      predictions: [],
      selectedModel: state.selectedModel,
      hasDrawnPolygon: false,
      drawMode: "idle",
    });
  };

  return {
    state,
    updateState,
    setLoading,
    setError,
    setPredictions,
    setSelectedModel,
    setHasDrawnPolygon,
    setDrawMode,
    resetState,
  };
};



mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface UseMapInitializationProps {
  refs: MapRefs;
  onDrawCreate: DrawEventHandler;
  onDrawUpdate: DrawEventHandler;
  onDrawDelete: DrawEventHandler;
  onDrawModeChange: (mode: string) => void;
}

export const useMapInitialization = ({
  refs,
  onDrawCreate,
  onDrawUpdate,
  onDrawDelete,
  onDrawModeChange,
}: UseMapInitializationProps) => {
  useEffect(() => {
    if (!refs.mapContainer.current) return;

    // Initialize map
    refs.map.current = new mapboxgl.Map({
      container: refs.mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      attributionControl: false,
    });

    // Initialize MapboxDraw
    refs.draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: false,
        trash: false,
      },
    });

    const map = refs.map.current;
    const draw = refs.draw.current;

    map.addControl(draw);
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    // Create custom control container
    refs.controlContainer.current = document.createElement("div");
    refs.controlContainer.current.className =
      "mapboxgl-ctrl mapboxgl-ctrl-group flex gap-2 p-2 bg-white/90 backdrop-blur rounded-lg shadow-md";

    map.addControl(
      {
        onAdd: () => refs.controlContainer.current!,
        onRemove: () => {
          refs.controlContainer.current?.parentNode?.removeChild(
            refs.controlContainer.current
          );
        },
      },
      "top-right"
    );

    // Add event handlers
    map.on("draw.create", onDrawCreate);
    map.on("draw.update", onDrawUpdate);
    map.on("draw.delete", onDrawDelete);
    map.on("draw.modechange", (e) => {
      onDrawModeChange(e.mode);
    });

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);
};