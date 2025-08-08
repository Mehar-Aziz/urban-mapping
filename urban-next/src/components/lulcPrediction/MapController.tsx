import React from "react";
import { MdOutlineDraw, MdCancel, MdDelete } from "react-icons/md";
import { Button } from "@/components/ui/button";

interface MapControlsProps {
  drawMode: "idle" | "drawing";
  onDraw: () => void;
  onCancel: () => void;
  onClear: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  drawMode,
  onDraw,
  onCancel,
  onClear,
}) => {
  return (
    <div className="absolute top-4 left-4 z-10  flex gap-2 p-2 bg-white/90 backdrop-blur rounded-lg shadow-md">
      {/* Draw Button */}
      <Button
        onClick={onDraw}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
          drawMode === "drawing"
            ? "bg-blue-500 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-800"
        }`}
      >
        <MdOutlineDraw size={16} />
      </Button>

      {/* Cancel Button */}
      <Button
        onClick={onCancel}
        disabled={drawMode !== "drawing"}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
          drawMode !== "drawing"
            ? "bg-gray-100 text-gray-800 opacity-50 cursor-not-allowed"
            : "bg-gray-100 hover:bg-gray-200 text-gray-800"
        }`}
      >
        <MdCancel size={16} />
      </Button>

      {/* Clear Button */}
      <Button
        onClick={onClear}
        className="flex items-center gap-1 px-3 py-1.5  bg-red-100 hover:bg-red-500 hover:text-white text-red-600 transition-colors"
      >
        <MdDelete size={16} />
      </Button>
    </div>
  );
};
