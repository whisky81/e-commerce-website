import { useState } from 'react'
import { parseNominatimAddress } from '../utils/parseAddress'

export function useReverseGeocode() {
  const [loading, setLoading] = useState(false)

  // lat, lng → trả về { street, ward, province, display_name }
  const reverseGeocode = async (lat, lng) => {
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'User-Agent': 'OsmApp/1.0' } }
      )
      const data = await res.json()
      return {
        ...parseNominatimAddress(data.address),
        display_name: data.display_name,
        lat,
        lng,
        placeId: String(data.place_id),
      }
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }

  return { reverseGeocode, loading }
}
