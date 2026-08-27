import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

import { CITY_COORDINATES, INDIA_CENTRE } from '../../lib/constants';
import { coordinatesFor } from '../../lib/geo';
import { describeProperty, formatCurrencyShort } from '../../lib/format';
import { useTheme } from '../../context/contexts';

/**
 * Map view of the current results.
 *
 * The API does not store latitude/longitude yet, so markers are scattered
 * deterministically around the city centre. That is honest jitter for a demo,
 * but it is not a real position - hence the disclaimer under the map.
 */

function priceIcon(property, isActive) {
    return L.divIcon({
        html: `<span class="price-marker${isActive ? ' is-active' : ''}">${formatCurrencyShort(
            property.rentAmount,
        )}</span>`,
        className: 'custom-div-icon',
        iconSize: [56, 26],
        iconAnchor: [28, 30],
        popupAnchor: [0, -30],
    });
}

export default function PropertyMap({ properties, activeId, onHover }) {
    const { isDark } = useTheme();

    // Recentre only when the first result's city changes, not on every array
    // identity change. The old dependency array held a computed expression,
    // which re-ran the memo on virtually every render.
    const firstCity = properties.length ? properties[0].city : null;
    const centre = useMemo(() => CITY_COORDINATES[firstCity] ?? INDIA_CENTRE, [firstCity]);

    const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    return (
        <div className="flex h-full flex-col">
            <div className="relative z-0 flex-1 overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800">
                <MapContainer
                    key={isDark ? 'dark' : 'light'}
                    center={centre}
                    zoom={12}
                    scrollWheelZoom
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url={tileUrl}
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'
                    />
                    {properties.map((property) => (
                        <Marker
                            key={property.id}
                            position={coordinatesFor(property)}
                            icon={priceIcon(property, activeId === property.id)}
                            eventHandlers={{
                                mouseover: () => onHover?.(property.id),
                                mouseout: () => onHover?.(null),
                            }}
                        >
                            <Popup>
                                <span className="block text-xs font-semibold text-ink-900">
                                    {describeProperty(property)}
                                </span>
                                <span className="block text-xs text-ink-500">
                                    {property.locality}, {property.city}
                                </span>
                                <Link
                                    to={`/property/${property.id}`}
                                    className="mt-2 block rounded-lg bg-brand-500 px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-white"
                                >
                                    View details
                                </Link>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-400">
                Marker positions are approximate and indicate the locality, not the exact address.
            </p>
        </div>
    );
}
