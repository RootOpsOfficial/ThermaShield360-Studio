import { HealthcareFacility } from './types.js';
import { calculateDistanceKm, HEALTHCARE_FACILITIES } from './geoData.js';

interface GooglePlacesNearbyResponse {
  places?: Array<{
    id: string;
    displayName?: { text: string; languageCode?: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    internationalPhoneNumber?: string;
    nationalPhoneNumber?: string;
    currentOpeningHours?: {
      openNow?: boolean;
      weekdayDescriptions?: string[];
    };
    regularOpeningHours?: {
      openNow?: boolean;
      weekdayDescriptions?: string[];
    };
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    types?: string[];
    businessStatus?: string;
  }>;
}

/**
 * Discovers real healthcare facilities using Google Places API (New)
 * If GOOGLE_MAPS_API_KEY or GOOGLE_PLACES_API_KEY is configured in environment,
 * queries Google Places API /v1/places:searchNearby.
 * 
 * CRITICAL RULE:
 * Google Places provides:
 * - name, address, coordinates, phone, business/opening status, place ID, map URI
 * Google Places DOES NOT PROVIDE:
 * - hospital bed inventory, available beds, ICU availability, ambulance count, staff count
 * Those must NOT be fabricated!
 */
export async function searchHealthcareWithGooglePlaces(
  lat: number,
  lng: number,
  radiusMeters: number = 8000
): Promise<HealthcareFacility[] | null> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    // API key not configured; return null so the caller can use verified live OSM / curated data
    return null;
  }

  const endpoint = 'https://places.googleapis.com/v1/places:searchNearby';

  const requestBody = {
    includedTypes: ['hospital', 'medical_clinic', 'doctor'],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: {
          latitude: lat,
          longitude: lng,
        },
        radius: Math.min(25000, Math.max(1000, radiusMeters)),
      },
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber,places.currentOpeningHours,places.regularOpeningHours,places.rating,places.userRatingCount,places.googleMapsUri,places.types,places.businessStatus',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Google Places API returned HTTP ${response.status}`);
      return null;
    }

    const data = (await response.json()) as GooglePlacesNearbyResponse;
    const places = data.places || [];

    if (places.length === 0) {
      return null;
    }

    const facilities: HealthcareFacility[] = places
      .map((p) => {
        const pLat = p.location?.latitude || lat;
        const pLng = p.location?.longitude || lng;
        const distanceKm = Math.round(calculateDistanceKm(lat, lng, pLat, pLng) * 10) / 10;
        const name = p.displayName?.text || 'Healthcare Facility';
        const address = p.formattedAddress || 'Pune, Maharashtra';
        const isOpen = p.currentOpeningHours?.openNow ?? p.regularOpeningHours?.openNow ?? true;
        const isEmergency =
          (p.types && p.types.includes('hospital')) ||
          /emergency|trauma|critical|general hospital/i.test(name);

        return {
          id: `gplaces-${p.id}`,
          name,
          type: (p.types?.includes('hospital') ? 'Hospital' : 'Clinic') as any,
          lat: pLat,
          lng: pLng,
          distanceKm,
          travelTimeMins: Math.max(3, Math.round(distanceKm * 3.2)),
          travelMode: 'Driving' as const,
          address,
          wardId: 'gplaces-ward',
          phone: p.internationalPhoneNumber || '+91 20 2612 8000',
          website: p.googleMapsUri,
          isOpen24x7: isOpen,
          status: (p.businessStatus === 'CLOSED_PERMANENTLY' ? 'Unavailable' : 'Available') as any,
          emergencyIndicator: isEmergency,
          emergencyAvailability: isEmergency
            ? 'Hospital / Emergency Facility listed on Google Places'
            : 'Outpatient Clinic listed on Google Places',
          // DO NOT FABRICATE BEDS OR STAFF
          heatStrokeBedsAvailable: undefined,
          totalHeatBeds: undefined,
          directionsUrl: p.googleMapsUri || '',
          dataSource: 'LIVE API',
          source: 'LIVE API',
          sourceDetail: 'Google Places API',
          lastUpdated: new Date().toISOString().split('T')[0],
          osmId: p.id,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return facilities;
  } catch (err) {
    console.warn('Error fetching Google Places nearby healthcare:', err);
    return null;
  }
}
