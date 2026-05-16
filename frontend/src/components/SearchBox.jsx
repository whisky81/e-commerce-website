import { useState } from 'react'
import { useGeocoding } from '../hooks/useGeocoding'

function SearchBox({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const { searchAddress, loading, error } = useGeocoding()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    const data = await searchAddress(query)
    setResults(data)
  }

  const handleSelect = (result) => {
    onSelect({
      position: [parseFloat(result.lat), parseFloat(result.lon)], // [lat, lng]
      name: result.display_name
    })
    setResults([]) // đóng dropdown sau khi chọn
    setQuery(result.display_name)
  }

  return (
    <div className="absolute top-4 left-4 z-[1000] w-[360px] max-w-[90vw]">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm địa chỉ..."
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 shadow-sm outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-500 text-white shadow-sm hover:bg-blue-600 transition"
        >
          {loading ? '...' : 'Tìm'}
        </button>
      </form>

      {error && (
        <p className="text-red-500 mt-1 text-sm">{error}</p>
      )}

      {results.length > 0 && (
        <ul className="bg-white border border-gray-200 rounded-lg mt-1 p-0 list-none max-h-60 overflow-y-auto shadow-md">
          {results.map(r => (
            <li
              key={r.place_id}
              onClick={() => handleSelect(r)}
              className="px-3 py-2 cursor-pointer border-b border-gray-100 text-sm hover:bg-gray-50"
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default SearchBox
