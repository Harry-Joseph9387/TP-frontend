import React, { useState } from "react";
import Select from "react-select";
import Map from "./components/Map";
import "./App.css";

const API_KEY = "9a921f555eac4c8cbd4bb4ff9af0542a";

function App() {
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [path, setPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [totalDistance, setTotalDistance] = useState(null);

  // Fetch place suggestions
  const fetchSuggestions = async (inputValue) => {
    if (!inputValue || inputValue.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(inputValue)}&key=${API_KEY}`
      );
      const data = await response.json();
      if (data.results) {
        const options = data.results.map((result) => ({
          value: result.formatted,
          label: result.formatted,
          coordinates: [result.geometry.lat, result.geometry.lng]
        }));
        setSuggestions(options);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  // Handle place selection
  const handlePlaceSelect = (selectedOption) => {
    if (selectedOption && !selectedPlaces.some(p => p.name === selectedOption.value)) {
      setSelectedPlaces([...selectedPlaces, {
        name: selectedOption.value,
        coords: selectedOption.coordinates
      }]);
    }
  };

  // Remove selected place
  const removePlace = (placeName) => {
    setSelectedPlaces(selectedPlaces.filter((place) => place.name !== placeName));
  };

  // Find shortest path
  const fetchShortestPath = async () => {
    if (selectedPlaces.length < 2) {
      alert("Select at least two places.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("https://tp-backend-l6ki.onrender.com/shortest-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ places: selectedPlaces }),
      });

      const data = await response.json();
      setPath(data.path.map(p => p.coords));
      setTotalDistance(data.total_distance);
    } catch (error) {
      console.error("Error finding path:", error);
      alert("Error finding path. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Travel Planner</h1>

      {/* Place Search */}
      <div className="select-container">
        <Select
          options={suggestions}
          onInputChange={(newValue, { action }) => {
            // Only fetch suggestions when the input value changes
            if (action === "input-change") {
              fetchSuggestions(newValue);
            }
            return newValue; // Return the new value to update the input
          }}
          onChange={handlePlaceSelect}
          placeholder="Type a place..."
          isClearable
          isSearchable
          value={null}
          filterOption={(option, input) => {
            if (!input) return true;
            return option.label.toLowerCase().includes(input.toLowerCase());
          }}
          noOptionsMessage={({ inputValue }) => 
            !inputValue 
              ? "Start typing to search places..." 
              : inputValue.length < 3 
                ? "Type at least 3 characters" 
                : "No places found"
          }
          loadingMessage={() => "Loading suggestions..."}
        />
      </div>

      {/* Selected Places */}
      <div className="selected-places">
        {selectedPlaces.map((place, index) => (
          <div key={index} className="place-item">
            {place.name}
            <button 
              onClick={() => removePlace(place.name)}
              className="remove-btn"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={fetchShortestPath} 
        disabled={loading || selectedPlaces.length < 2}
        className="find-path-btn"
      >
        {loading ? <span className="loader"></span> : "Find Shortest Path"}
      </button>

      {/* Map Component */}
      <Map places={selectedPlaces} path={path} totalDistance={totalDistance} />
    </div>
  );
}

export default App;
