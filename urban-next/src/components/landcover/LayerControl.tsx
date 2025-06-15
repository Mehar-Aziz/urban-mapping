"use client"
import { useState } from 'react';

export default function LayerControl({ years, activeLayers, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 font-medium text-gray-700 flex items-center"
      >
        <span>Layers</span>
        <svg 
          className={`ml-2 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="p-4 border-t">
          <h3 className="font-medium mb-2">Select Years</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {years.map(year => (
              <div key={year} className="flex items-center">
                <input
                  type="checkbox"
                  id={`layer-${year}`}
                  checked={activeLayers[year] || false}
                  onChange={() => onToggle(year)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label 
                  htmlFor={`layer-${year}`} 
                  className="ml-2 text-sm text-gray-700"
                >
                  {year} Land Cover
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}