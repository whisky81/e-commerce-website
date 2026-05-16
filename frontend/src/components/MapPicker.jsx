import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import FlyTo from './FlyTo'
import { useReverseGeocode } from '../hooks/useReverseGeocode'

L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow, iconRetinaUrl: markerIcon })

// Lắng nghe click trên map → reverse geocode → trả kết quả lên trên
function ClickHandler({ onPick }) {
  const { reverseGeocode } = useReverseGeocode()
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng
      const result = await reverseGeocode(lat, lng)
      if (result) onPick(result)
    }
  })
  return null
}

function MapPicker({ position, onPick }) {
  const defaultPos = [21.0285, 105.8542] // Hà Nội

  // Use MapTiler key if available, otherwise OSM default
  const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY
  const tileUrl = mapTilerKey 
    ? `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${mapTilerKey}`
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  
  const attribution = mapTilerKey 
    ? '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    : '&copy; OpenStreetMap contributors'

  return (
    <div className="h-[300px] rounded-lg overflow-hidden border border-gray-300 mb-4 z-0 relative">
      <MapContainer center={defaultPos} zoom={13} className="h-full z-0">
        <TileLayer url={tileUrl} attribution={attribution} />
        <ClickHandler onPick={onPick} />
        {position && (
          <>
            <FlyTo position={position} />
            <Marker position={position} />
          </>
        )}
      </MapContainer>
    </div>
  )
}

export default MapPicker
