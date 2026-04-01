// frontend/src/components/MapAddressPicker.jsx
// Requires VITE_GOOGLE_MAPS_API_KEY in .env
import { useEffect, useRef, useState, useCallback } from 'react'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Load Google Maps script once
let googleMapsLoaded = false
let loadPromise = null

const loadGoogleMaps = () => {
    if (googleMapsLoaded) return Promise.resolve()
    if (loadPromise) return loadPromise
    loadPromise = new Promise((resolve, reject) => {
        if (!API_KEY) { reject(new Error('NO_KEY')); return }
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=vi&region=VN`
        script.async = true
        script.onload  = () => { googleMapsLoaded = true; resolve() }
        script.onerror = () => reject(new Error('LOAD_ERROR'))
        document.head.appendChild(script)
    })
    return loadPromise
}

/**
 * MapAddressPicker
 * Props:
 *   - value: { fullName, phone, street, ward, district, province, lat, lng, placeId }
 *   - onChange(updatedFields): called when map/autocomplete changes fields
 *   - disabled: boolean
 */
const MapAddressPicker = ({ value = {}, onChange, disabled }) => {
    const mapRef       = useRef(null)
    const inputRef     = useRef(null)
    const markerRef    = useRef(null)
    const mapInstanceRef = useRef(null)

    const [mapsReady, setMapsReady] = useState(googleMapsLoaded)
    const [mapsError, setMapsError] = useState(!API_KEY)
    const [selectedPlace, setSelectedPlace] = useState(null)

    // Default center: Hà Nội
    const defaultCenter = { lat: 21.0245, lng: 105.8412 }

    useEffect(() => {
        if (googleMapsLoaded) { setMapsReady(true); return }
        if (!API_KEY) { setMapsError(true); return }
        loadGoogleMaps()
            .then(() => setMapsReady(true))
            .catch(() => setMapsError(true))
    }, [])

    const initMap = useCallback(() => {
        if (!mapRef.current || !window.google) return

        const center = value.lat && value.lng ? { lat: value.lat, lng: value.lng } : defaultCenter

        const map = new window.google.maps.Map(mapRef.current, {
            center, zoom: value.lat ? 16 : 12,
            mapTypeControl: false, streetViewControl: false,
            fullscreenControl: false,
            styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
        })
        mapInstanceRef.current = map

        // Marker
        const marker = new window.google.maps.Marker({
            map, draggable: !disabled,
            position: center,
            visible: !!(value.lat && value.lng),
            animation: window.google.maps.Animation.DROP,
        })
        markerRef.current = marker

        // Click on map to set location
        if (!disabled) {
            map.addListener('click', (e) => {
                const pos = e.latLng
                marker.setPosition(pos)
                marker.setVisible(true)
                reverseGeocode(pos.lat(), pos.lng())
            })
        }

        // Autocomplete
        if (inputRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'vn' },
                fields: ['address_components', 'geometry', 'name', 'place_id', 'formatted_address'],
            })
            autocomplete.bindTo('bounds', map)
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace()
                if (!place.geometry) return
                const loc = place.geometry.location
                map.setCenter(loc)
                map.setZoom(17)
                marker.setPosition(loc)
                marker.setVisible(true)
                parseAddressComponents(place, loc.lat(), loc.lng())
            })
        }
    }, [mapsReady, value.lat, value.lng, disabled])

    useEffect(() => {
        if (mapsReady) initMap()
    }, [mapsReady])

    const reverseGeocode = (lat, lng) => {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                parseAddressComponents(results[0], lat, lng)
            }
        })
    }

    const parseAddressComponents = (place, lat, lng) => {
        const components = place.address_components || []
        const get = (type) => components.find(c => c.types.includes(type))?.long_name || ''

        const streetNumber = get('street_number')
        const route = get('route')
        const street = [streetNumber, route].filter(Boolean).join(' ') || place.name || ''

        const ward     = get('sublocality_level_2') || get('sublocality_level_1') || get('sublocality') || ''
        const district = get('administrative_area_level_2') || get('locality') || ''
        const province = get('administrative_area_level_1') || ''

        const updates = {
            street, ward, district, province,
            lat, lng,
            placeId: place.place_id || null,
        }

        setSelectedPlace(place.formatted_address || street)
        if (onChange) onChange(updates)
    }

    if (mapsError || !API_KEY) {
        return (
            <div className='rounded-xl p-4 text-center' style={{ background: '#F9FAFB', border: '1.5px dashed #D1D5DB' }}>
                <p className='text-sm text-gray-500'>🗺️ Google Maps chưa được cấu hình</p>
                <p className='text-xs text-gray-400 mt-1'>Thêm <code className='bg-gray-100 px-1 rounded'>VITE_GOOGLE_MAPS_API_KEY</code> vào file .env</p>
            </div>
        )
    }

    if (!mapsReady) {
        return (
            <div className='rounded-xl flex items-center justify-center' style={{ height: 240, background: '#F3F4F6' }}>
                <div className='flex items-center gap-2 text-gray-500 text-sm'>
                    <div className='w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin' />
                    Đang tải bản đồ...
                </div>
            </div>
        )
    }

    return (
        <div className='space-y-3'>
            {/* Search input */}
            <div className='relative'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>🔍</span>
                <input
                    ref={inputRef}
                    type='text'
                    disabled={disabled}
                    placeholder='Tìm kiếm địa chỉ trên bản đồ...'
                    className='w-full pl-9 pr-4 py-2.5 text-sm rounded-xl disabled:opacity-60'
                    style={{ border: '1.5px solid #DDD6FE', background: '#FAFAFF', outline: 'none' }}
                />
            </div>

            {/* Map */}
            <div
                ref={mapRef}
                className='w-full rounded-xl overflow-hidden'
                style={{ height: 260, border: '1.5px solid #DDD6FE' }}
            />

            {selectedPlace && (
                <p className='text-xs text-indigo-600 flex items-center gap-1'>
                    📍 {selectedPlace}
                </p>
            )}
            {!disabled && (
                <p className='text-xs text-gray-400'>💡 Nhấp vào bản đồ hoặc tìm kiếm để chọn vị trí chính xác</p>
            )}
        </div>
    )
}

export default MapAddressPicker
