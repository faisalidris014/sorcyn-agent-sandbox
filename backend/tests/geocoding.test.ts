import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geocodeAddress } from '../src/config/geocoding.js';
import { env } from '../src/config/env.js';

process.env.NODE_ENV = 'test';

describe('Geocoding Service', () => {
  const originalKey = env.GOOGLE_MAPS_API_KEY;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
  });

  afterEach(() => {
    // Restore original API key
    (env as any).GOOGLE_MAPS_API_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it('should return null when GOOGLE_MAPS_API_KEY is not set', async () => {
    (env as any).GOOGLE_MAPS_API_KEY = undefined;
    const result = await geocodeAddress('123 Main St', 'Dallas', 'TX', '75201');
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should return null when no address parts provided', async () => {
    (env as any).GOOGLE_MAPS_API_KEY = 'test-key';
    const result = await geocodeAddress();
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should return coordinates for a valid address', async () => {
    (env as any).GOOGLE_MAPS_API_KEY = 'test-key';

    fetchSpy.mockResolvedValue({
      json: () => Promise.resolve({
        status: 'OK',
        results: [{
          geometry: { location: { lat: 32.7767, lng: -96.797 } },
          formatted_address: '123 Main St, Dallas, TX 75201, USA',
        }],
      }),
    });

    const result = await geocodeAddress('123 Main St', 'Dallas', 'TX', '75201');

    expect(result).not.toBeNull();
    expect(result!.latitude).toBe(32.7767);
    expect(result!.longitude).toBe(-96.797);
    expect(result!.formattedAddress).toBe('123 Main St, Dallas, TX 75201, USA');
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('should return null when geocoding API returns no results', async () => {
    (env as any).GOOGLE_MAPS_API_KEY = 'test-key';

    fetchSpy.mockResolvedValue({
      json: () => Promise.resolve({ status: 'ZERO_RESULTS', results: [] }),
    });

    const result = await geocodeAddress('nonexistent-place');
    expect(result).toBeNull();
  });

  it('should return null when fetch throws', async () => {
    (env as any).GOOGLE_MAPS_API_KEY = 'test-key';

    fetchSpy.mockRejectedValue(new Error('Network error'));

    const result = await geocodeAddress('123 Main St', 'Dallas', 'TX');
    expect(result).toBeNull();
  });
});
