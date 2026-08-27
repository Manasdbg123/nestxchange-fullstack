import { CITY_COORDINATES, INDIA_CENTRE } from './constants';

/**
 * Approximate map position for a listing.
 *
 * The API does not store latitude/longitude yet, so markers are scattered
 * around the city centre. The offset is derived from the listing id rather than
 * randomised, so a property stays in the same place across re-renders instead
 * of hopping around the map.
 */
export function coordinatesFor(property) {
    const centre = CITY_COORDINATES[property.city] ?? INDIA_CENTRE;
    const latOffset = ((property.id % 20) - 10) * 0.004;
    const lngOffset = (((property.id * 7) % 20) - 10) * 0.004;
    return [centre[0] + latOffset, centre[1] + lngOffset];
}
