import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

// Component này dùng hook useMap() để điều khiển map instance
// phải đặt bên trong <MapContainer> mới dùng được useMap()
function FlyTo({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo(position, 15)
  }, [position])
  return null
}

export default FlyTo
