export function parseNominatimAddress(addr = {}) {
  return {
    street:   [addr.house_number, addr.road].filter(Boolean).join(' '),
    ward:     addr.suburb || addr.quarter || addr.neighbourhood || addr.village || '',
    district: addr.county || addr.city_district || addr.state_district || addr.district || '',
    province: addr.city || addr.state || addr.region || '',
  }
}
