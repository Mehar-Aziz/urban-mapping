import React from "react";
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
import { MapState, ClassCounts } from "@/types";
import { AVAILABLE_MODELS, CLASS_COLORS } from "@/constants";

interface ControlPanelProps {
  state: MapState;
  classCounts: ClassCounts;
  onModelChange: (model: string) => void;
  onClearAll: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  state,
  classCounts,
  onModelChange,
  onClearAll,
}) => {
  const { isLoading, error, predictions, selectedModel } = state;

  return (
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
            <Select value={selectedModel} onValueChange={onModelChange}>
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
              onClick={onClearAll}
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
                {Object.entries(classCounts).map(([className, count]) => (
                  <div
                    key={className}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{
                        backgroundColor: CLASS_COLORS[className] || "#666666",
                      }}
                    />
                    <span className="flex-1">{className}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};