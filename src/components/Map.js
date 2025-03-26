import React from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const Map = ({ places, path }) => {
  const center = [28.6139, 77.2090]; // Default center (Delhi)

  // Calculate distances between consecutive cities
  const calculateDistance = (coords1, coords2) => {
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

  return (
    <MapContainer center={center} zoom={5} style={{ height: "500px", width: "100%" }}>
      {/* Tile Layer (Map background) */}
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Markers for Each City */}
      {places.map((place, index) => (
        <Marker key={index} position={place.coords}>
          <Popup>
            <strong>{place.name}</strong>
            <br />
            Order: {index + 1}
          </Popup>
          <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
            {index + 1}
          </Tooltip>
        </Marker>
      ))}

      {/* Draw Shortest Path and Display Distances */}
      {path.length > 1 && (
        <>
          <Polyline positions={path} color="blue" />
          {path.map((coords, index) => {
            if (index < path.length - 1) {
              const midPoint = [
                (coords[0] + path[index + 1][0]) / 2,
                (coords[1] + path[index + 1][1]) / 2,
              ];
              const distance = calculateDistance(coords, path[index + 1]);

              return (
                <Marker key={index} position={midPoint} opacity={0}>
                  <Tooltip direction="right" offset={[10, 0]} opacity={1} permanent>
                    {distance.toFixed(2)} km
                  </Tooltip>
                </Marker>
              );
            }
            return null;
          })}
        </>
      )}
    </MapContainer>
  );
};

export default Map;
