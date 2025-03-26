import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const Map = ({ places, path, totalDistance }) => {
  const center = [28.6139, 77.2090]; // Default center (Delhi)
  const [orderedPlaces, setOrderedPlaces] = useState([]);
  const [pathData, setPathData] = useState([]);
  const [journeySummary, setJourneySummary] = useState([]);

  const customIcon = new L.Icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41], // Default Leaflet marker size
    iconAnchor: [12, 41], // Anchor point of the marker
    popupAnchor: [1, -34], // Where the popup appears relative to the marker
    shadowSize: [41, 41],
  });

  const getNumberedIcon = (number) =>
    new L.DivIcon({
      className: "custom-number-marker",
      html: `<div style="
        background-color: blue;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
      ">${number}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

  const calculateDistance = (coords1, coords2) => {
    if (!coords1 || !coords2 || !Array.isArray(coords1) || !Array.isArray(coords2)) {
      console.error("Invalid coordinates:", coords1, coords2);
      return 0;
    }
    
    const [lat1, lon1] = coords1;
    const [lat2, lon2] = coords2;
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deepLog = (obj) => {
    console.log(JSON.stringify(obj, null, 2));
  };

  useEffect(() => {
    console.log("Raw path data:", path);
    
    if (path && path.length > 0) {
      const isObjectArray = typeof path[0] === 'object' && !Array.isArray(path[0]);
      
      let extractedCoords;
      if (isObjectArray) {
        console.log("Path is array of objects");
        extractedCoords = path.map(item => item.coords || item);
      } else {
        console.log("Path is array of arrays");
        extractedCoords = path;
      }
      
      setPathData(extractedCoords);
    }
  }, [path]);

  useEffect(() => {
    if (pathData.length > 0 && places.length > 0) {
      const matched = [];
      
      for (const pathCoord of pathData) {
        let bestMatch = null;
        let bestDistance = Infinity;
        
        for (const place of places) {
          if (!place.coords) continue;
          
          const distance = calculateDistance(
            Array.isArray(pathCoord) ? pathCoord : pathCoord.coords,
            place.coords
          );
          
          if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = place;
          }
        }
        
        if (bestMatch) {
          matched.push(bestMatch);
        } else {
          console.warn("No match found for path coordinate:", pathCoord);
        }
      }
      
      setOrderedPlaces(matched);

      // Create journey summary
      const summary = [];
      let totalDist = 0;
      
      for (let i = 0; i < matched.length - 1; i++) {
        const distance = calculateDistance(matched[i].coords, matched[i+1].coords);
        totalDist += distance;
        summary.push({
          from: matched[i].name,
          to: matched[i+1].name,
          distance: distance.toFixed(2)
        });
      }
      
      setJourneySummary(summary);
    } else {
      setOrderedPlaces([]);
      setJourneySummary([]);
    }
  }, [pathData, places]);

  return (
    <div className="map-container">
      {/* Journey Summary */}
      {journeySummary.length > 0 && (
        <div className="journey-summary">
          <h3>Journey Summary</h3>
          <div className="journey-legs">
            {journeySummary.map((leg, index) => (
              <div key={index} className="journey-leg">
                <div className="leg-number">{index + 1}</div>
                <div className="leg-details">
                  <strong>{leg.from}</strong> → <strong>{leg.to}</strong>
                  <div className="leg-distance">{leg.distance} km</div>
                </div>
              </div>
            ))}
          </div>
          <div className="journey-total">
            <strong>Total Distance:</strong> {totalDistance ? totalDistance.toFixed(2) : "N/A"} km
          </div>
        </div>
      )}

      {/* Map Container */}
      <MapContainer center={center} zoom={5} style={{ height: "500px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Markers for Selected Cities */}
        {(!path || path.length === 0) &&
          places.map((place, index) => (
            <Marker key={`selected-${index}`} position={place.coords} icon={customIcon}>
              <Popup>
                <strong>{place.name}</strong>
                <br />
                Selected Place
              </Popup>
            </Marker>
          ))}

        {/* Markers for Cities in Shortest Path Order */}
        {orderedPlaces.length > 0 &&
          orderedPlaces.map((place, index) => (
            <Marker 
              key={`ordered-${index}`} 
              position={place.coords} 
              icon={getNumberedIcon(index )}
            >
              <Popup>
                <strong>{place.name}</strong>
                <br />
                Order: {index + 1}
              </Popup>
            </Marker>
          ))}

        {/* Draw Shortest Path */}
        {pathData.length > 1 && (
          <Polyline 
            positions={pathData.map(coord => 
              Array.isArray(coord) ? coord : coord.coords
            )} 
            color="blue" 
          />
        )}
      </MapContainer>
    </div>
  );
};

export default Map;
