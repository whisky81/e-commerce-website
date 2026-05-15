import { useState } from 'react'

export function useGeocoding() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const searchAddress = async (query) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
        {
          headers: {
            'User-Agent': 'OsmApp/1.0'  // bắt buộc, Nominatim sẽ block nếu thiếu
          }
        }
      )
      const data = await res.json()
      return data  // [{ lat, lon, display_name, place_id }]
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }

  return { searchAddress, loading, error }
}
