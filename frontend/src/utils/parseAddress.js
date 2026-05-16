export function parseNominatimAddress(addr = {}) {
  return {
    street:   [addr.house_number, addr.road].filter(Boolean).join(' '),
    ward:     addr.suburb || addr.quarter || addr.neighbourhood || '',
    province: addr.city || addr.state || addr.county || '',
  }
}
