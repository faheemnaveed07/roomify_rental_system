import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * PropertyMap
 * --------------
 * Leaflet-based interactive map molecule for the Search page.
 * Renders a price-pin marker for each property with two-way hover sync
 * to the PropertyCard list (controlled by `hoveredId` prop).
 *
 * Design tokens come from globals.css (.price-marker / .hovered / .selected).
 * Tile source: OpenStreetMap (no API key required, free for non-commercial use).
 */

export interface MapProperty {
    id: string;
    title: string;
    price: number;
    currency?: string;
    city: string;
    area: string;
    coordinates: [number, number]; // GeoJSON: [lng, lat]
    imageUrl?: string;
}

interface PropertyMapProps {
    properties: MapProperty[];
    hoveredId?: string | null;
    selectedId?: string | null;
    onMarkerClick?: (id: string) => void;
    onMarkerHover?: (id: string | null) => void;
    /** Default center if no properties — Multan city center */
    defaultCenter?: [number, number]; // [lat, lng]
    defaultZoom?: number;
    className?: string;
}

const MULTAN_CENTER: [number, number] = [30.1575, 71.5249];

/** Format price short-form: 25000 → 25K, 250000 → 2.5L */
const formatPrice = (amount: number): string => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${Math.round(amount / 1000)}K`;
    return amount.toString();
};

/** Build a Leaflet DivIcon for a price pin */
const buildPriceIcon = (
    label: string,
    state: 'default' | 'hovered' | 'selected'
): L.DivIcon => {
    const stateClass = state === 'default' ? '' : ` ${state}`;
    return L.divIcon({
        className: 'price-marker-wrapper',
        html: `<div class="price-marker${stateClass}">${label}</div>`,
        iconSize: [60, 26],
        iconAnchor: [30, 26],
    });
};

/** Helper: when properties change, fit bounds to include all of them */
const FitBounds: React.FC<{ properties: MapProperty[] }> = ({ properties }) => {
    const map = useMap();
    useEffect(() => {
        if (properties.length === 0) return;
        const bounds = L.latLngBounds(
            properties.map((p) => [p.coordinates[1], p.coordinates[0]] as [number, number])
        );
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    }, [properties, map]);
    return null;
};

export const PropertyMap: React.FC<PropertyMapProps> = ({
    properties,
    hoveredId = null,
    selectedId = null,
    onMarkerClick,
    onMarkerHover,
    defaultCenter = MULTAN_CENTER,
    defaultZoom = 12,
    className,
}) => {
    const mapRef = useRef<L.Map | null>(null);

    // Filter out properties missing valid coordinates
    const validProperties = useMemo(
        () =>
            properties.filter(
                (p) =>
                    Array.isArray(p.coordinates) &&
                    p.coordinates.length === 2 &&
                    typeof p.coordinates[0] === 'number' &&
                    typeof p.coordinates[1] === 'number' &&
                    !(p.coordinates[0] === 0 && p.coordinates[1] === 0)
            ),
        [properties]
    );

    return (
        <div className={`relative w-full h-full rounded-2xl overflow-hidden border border-neutral-200 shadow-sm ${className ?? ''}`}>
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', minHeight: '500px' }}
                ref={(map) => {
                    if (map) mapRef.current = map;
                }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds properties={validProperties} />

                {validProperties.map((p) => {
                    const state: 'default' | 'hovered' | 'selected' =
                        p.id === selectedId
                            ? 'selected'
                            : p.id === hoveredId
                                ? 'hovered'
                                : 'default';
                    const label = `${p.currency ?? 'PKR'} ${formatPrice(p.price)}`;
                    const icon = buildPriceIcon(label, state);
                    return (
                        <Marker
                            key={p.id}
                            position={[p.coordinates[1], p.coordinates[0]]}
                            icon={icon}
                            eventHandlers={{
                                click: () => onMarkerClick?.(p.id),
                                mouseover: () => onMarkerHover?.(p.id),
                                mouseout: () => onMarkerHover?.(null),
                            }}
                        >
                            <Popup>
                                <div className="w-full">
                                    {p.imageUrl && (
                                        <img
                                            src={p.imageUrl}
                                            alt={p.title}
                                            className="w-full h-28 object-cover"
                                        />
                                    )}
                                    <div className="p-3">
                                        <div className="text-sm font-semibold text-neutral-900 truncate">
                                            {p.title}
                                        </div>
                                        <div className="text-xs text-neutral-500 mt-0.5 truncate">
                                            {p.area}, {p.city}
                                        </div>
                                        <div className="text-base font-bold text-primary-500 mt-1">
                                            {p.currency ?? 'PKR'} {formatPrice(p.price)}
                                            <span className="text-xs font-normal text-neutral-500"> /month</span>
                                        </div>
                                        {onMarkerClick && (
                                            <button
                                                type="button"
                                                onClick={() => onMarkerClick(p.id)}
                                                className="mt-2 w-full text-xs font-medium text-primary-500 hover:text-primary-600 underline"
                                            >
                                                View details →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {validProperties.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm pointer-events-none">
                    <p className="text-sm text-neutral-500 px-4 text-center">
                        No mapped properties to show.<br />
                        Adjust filters to see listings on the map.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PropertyMap;
