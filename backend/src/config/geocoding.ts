import { env } from './env.js';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

/**
 * Geocode an address using Google Maps Geocoding API.
 * Returns null gracefully when API key is absent or geocoding fails.
 */
export async function geocodeAddress(
  address?: string,
  city?: string,
  state?: string,
  zip?: string,
): Promise<GeocodingResult | null> {
  if (!env.GOOGLE_MAPS_API_KEY) {
    return null;
  }

  const parts = [address, city, state, zip].filter(Boolean);
  if (parts.length === 0) return null;

  const query = encodeURIComponent(parts.join(', '));
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${env.GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json() as {
      status: string;
      results?: Array<{
        geometry: { location: { lat: number; lng: number } };
        formatted_address: string;
      }>;
    };

    if (data.status !== 'OK' || !data.results?.length) {
      return null;
    }

    const result = data.results[0];
    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch {
    return null;
  }
}
