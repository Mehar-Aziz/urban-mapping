import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken =
  "pk.eyJ1IjoibWVoYXItYXppeiIsImEiOiJjbTdwd3BicDcwMmF5MmxwaHJkeW13cnVvIn0.4MS6keg1jZvx4KOBDsTqug";

export default function MapboxMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [69.3451, 30.3753], // Pakistan center
      zoom: 5,
    });

    map.on("load", () => {
      // CORRECTED: Path should match your actual folder structure
      const tilePath = `/output_tiles2/{z}/{x}/{y}.png`;

      // Add raster source
      map.addSource("lulc-2023", {
        type: "raster",
        tiles: [tilePath],
        tileSize: 256, // Standard tile size
        minzoom: 0,
        maxzoom: 20,
      });

      // Add layer
      map.addLayer({
        id: "lulc-layer",
        type: "raster",
        source: "lulc-2023",
        minzoom: 0,
        maxzoom: 20,
        layout: {
          visibility: "visible",
        },
        paint: {
          "raster-opacity": 0.8,
          "raster-resampling": "linear",
        },
      });
    });

    // Error handling for tile loading
    map.on("error", (e) => {
      console.error("Map error:", e);
    });

    map.on("sourcedata", (e) => {
      if (e.sourceId === "lulc-2023" && e.isSourceLoaded) {
        console.log("LULC tiles loaded successfully");
      }
    });

    return () => map.remove();
  }, []);

  const dict = {
    names: [
      "Water",
      "Trees",
      "Flooded Vegetation",
      "Crops",
      "Built Area",
      "Bare Ground",
      "Snow/Ice",
      "Clouds",
      "Rangeland",
    ],
    colors: [
      "#1A5BAB",
      "#358221",
      "#87D19E",
      "#FFDB5C",
      "#ED022A",
      "#EDE9E4",
      "#F2FAFF",
      "#C8C8C8",
      "#C6AD8D",
    ],
  };

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Top right info box */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          fontSize: "12px",
        }}
      >
        <div>Pakistan LULC 2023</div>
        <div>Zoom: 0-12 levels</div>
      </div>

      {/* Bottom left legend */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: 10,
          background: "rgba(255,255,255,0.9)",
          color: "black",
          padding: "10px",
          borderRadius: "5px",
          fontSize: "12px",
          maxHeight: "50vh",
          overflowY: "auto",
        }}
      >
        <strong>Legend</strong>
        <div style={{ marginTop: "5px" }}>
          {dict.names.map((name, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: dict.colors[index],
                  marginRight: "8px",
                  border: "1px solid #000",
                }}
              ></div>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
