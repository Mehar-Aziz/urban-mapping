export default function LandCoverLegend() {
  const legendItems = [
    { color: "#1A5BAB", label: "Water" },
    { color: "#358221", label: "Trees" },
    { color: "#87D19E", label: "Flooded Vegetation" },
    { color: "#FFDB5C", label: "Crops" },
    { color: "#ED022A", label: "Built Area" },
    { color: "#EDE9E4", label: "Bare Ground" },
    { color: "#F2FAFF", label: "Snow/Ice" },
    { color: "#C8C8C8", label: "Clouds" },
    { color: "#C6AD8D", label: "Rangeland" }
  ];

  return (
    <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg z-10">
      <h3 className="font-bold text-lg mb-2">Land Cover Classes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center">
            <div 
              className="w-5 h-5 mr-2 border border-gray-300" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}