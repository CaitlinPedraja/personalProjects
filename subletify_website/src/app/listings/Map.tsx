import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';


const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41], 
  iconAnchor: [12, 41], 
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  shadowSize: [41, 41], 
});

interface Location {
    latitude: number;
    longitude: number;
  }
  
  interface MapsProps {
    locations: Location[]; 
    names: string[];
  }

  const Maps: React.FC<MapsProps> = ({ locations, names }) => {
    const defaultCenter:[number, number] = [38.648942, -90.311551]; 
    const mapCenter: [number, number]  =
      locations.length === 1 ? [locations[0].latitude, locations[0].longitude] : defaultCenter;
  
    return (
      <MapContainer
        center={mapCenter}
        zoom={locations.length === 1 ? 15 : 13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {locations.map((location, index) => (
          <Marker key={index} position={[location.latitude, location.longitude]} icon={customIcon}>
            <Popup>
              Location: {names[index+1]}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    );
  };

export default Maps;
