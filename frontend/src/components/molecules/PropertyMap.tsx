import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

/**
 * PropertyMap
 * --------------
 * Leaflet-based interactive map molecule for the Search page.
 * Renders a price-pin marker for each property with two-way hover sync
 * to the PropertyCard list (controlled by `hoveredId` prop).
 *
 * Includes:
 *  - grid-based marker clustering (no extra dependency — react-leaflet-cluster
 *    conflicts with react-leaflet v4 — and fully themed to the app's accent)
 *  - an optional "Search this area" control (Bayut/Zameen style) that reports
 *    the map's current centre + visible radius back to the caller
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
    /** Map height floor — lower this when embedding (e.g. the property detail page) */
    minHeight?: number | string;
    /** Enables the "Search this area" button. Receives centre + visible radius (km). */
    onSearchArea?: (center: { lat: number; lng: number }, radiusKm: number) => void;
    /** Shows a spinner state on the search-area button */
    searching?: boolean;
}

const MULTAN_CENTER: [number, number] = [30.1575, 71.5249];

/** Grid cell size in screen pixels — markers inside one cell collapse to a cluster */
const CLUSTER_CELL_PX = 64;

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

/** Themed cluster bubble — size scales gently with the number of listings */
const buildClusterIcon = (count: number): L.DivIcon => {
    const size = count >= 50 ? 56 : count >= 10 ? 48 : 42;
    return L.divIcon({
        className: 'dv-cluster-wrapper',
        html: `<div style="
            width:${size}px;height:${size}px;border-radius:9999px;
            background:#d4845a;color:#1a0e07;
            display:flex;align-items:center;justify-content:center;
            font-weight:800;font-size:${count >= 100 ? 12 : 14}px;
            font-family:Archivo,system-ui,sans-serif;
            border:3px solid #ffffff;
            box-shadow:0 2px 10px rgba(0,0,0,.35);
        ">${count}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
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

/** Bridges the Leaflet instance + move events out to the parent overlay UI */
const MapBridge: React.FC<{ onReady: (m: L.Map) => void; onMove: () => void }> = ({
    onReady,
    onMove,
}) => {
    const map = useMap();
    useEffect(() => {
        onReady(map);
    }, [map, onReady]);
    useMapEvents({ moveend: onMove, zoomend: onMove });
    return null;
};

interface ClusterGroup {
    key: string;
    lat: number;
    lng: number;
    items: MapProperty[];
}

/** Groups markers that would visually overlap at the current zoom into clusters */
const ClusteredMarkers: React.FC<{
    properties: MapProperty[];
    hoveredId: string | null;
    selectedId: string | null;
    onMarkerClick?: (id: string) => void;
    onMarkerHover?: (id: string | null) => void;
}> = ({ properties, hoveredId, selectedId, onMarkerClick, onMarkerHover }) => {
    const map = useMap();
    const [zoom, setZoom] = useState(() => map.getZoom());

    useMapEvents({
        zoomend: () => setZoom(map.getZoom()),
    });

    // Clustering depends only on zoom (world-pixel grid), not on panning.
    const groups = useMemo<ClusterGroup[]>(() => {
        const cells = new Map<string, MapProperty[]>();
        properties.forEach((p) => {
            const pt = map.project([p.coordinates[1], p.coordinates[0]], zoom);
            const key = `${Math.floor(pt.x / CLUSTER_CELL_PX)}:${Math.floor(pt.y / CLUSTER_CELL_PX)}`;
            const bucket = cells.get(key);
            if (bucket) bucket.push(p);
            else cells.set(key, [p]);
        });

        return Array.from(cells.entries()).map(([key, items]) => ({
            key,
            lat: items.reduce((s, i) => s + i.coordinates[1], 0) / items.length,
            lng: items.reduce((s, i) => s + i.coordinates[0], 0) / items.length,
            items,
        }));
    }, [properties, map, zoom]);

    return (
        <>
            {groups.map((g) => {
                // A cluster of one is just a normal price pin.
                if (g.items.length === 1) {
                    const p = g.items[0];
                    const state: 'default' | 'hovered' | 'selected' =
                        p.id === selectedId ? 'selected' : p.id === hoveredId ? 'hovered' : 'default';
                    const label = `${p.currency ?? 'PKR'} ${formatPrice(p.price)}`;
                    return (
                        <Marker
                            key={p.id}
                            position={[p.coordinates[1], p.coordinates[0]]}
                            icon={buildPriceIcon(label, state)}
                            eventHandlers={{
                                click: () => onMarkerClick?.(p.id),
                                mouseover: () => onMarkerHover?.(p.id),
                                mouseout: () => onMarkerHover?.(null),
                            }}
                        >
                            <Popup>
                                <div className="w-full">
                                    {p.imageUrl && (
                                        <img src={p.imageUrl} alt={p.title} className="w-full h-28 object-cover" />
                                    )}
                                    <div className="p-3">
                                        <div className="text-sm font-semibold text-neutral-900 truncate">{p.title}</div>
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
                }

                // Multiple listings here → cluster bubble; clicking zooms into it.
                return (
                    <Marker
                        key={g.key}
                        position={[g.lat, g.lng]}
                        icon={buildClusterIcon(g.items.length)}
                        eventHandlers={{
                            click: () => {
                                const bounds = L.latLngBounds(
                                    g.items.map((i) => [i.coordinates[1], i.coordinates[0]] as [number, number])
                                );
                                if (bounds.isValid()) {
                                    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
                                }
                            },
                        }}
                    />
                );
            })}
        </>
    );
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
    minHeight = '500px',
    onSearchArea,
    searching = false,
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const [mapApi, setMapApi] = useState<L.Map | null>(null);
    const [moved, setMoved] = useState(false);

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

    const runAreaSearch = () => {
        if (!mapApi || !onSearchArea) return;
        const c = mapApi.getCenter();
        const ne = mapApi.getBounds().getNorthEast();
        // Visible radius = centre → corner, so the whole viewport is covered.
        const radiusKm = Math.max(0.5, mapApi.distance(c, ne) / 1000);
        onSearchArea({ lat: c.lat, lng: c.lng }, Math.round(radiusKm * 10) / 10);
        setMoved(false);
    };

    return (
        <div className={`relative w-full h-full rounded-2xl overflow-hidden border border-neutral-200 shadow-sm ${className ?? ''}`}>
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', minHeight }}
                ref={(map) => {
                    if (map) mapRef.current = map;
                }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds properties={validProperties} />
                {onSearchArea && <MapBridge onReady={setMapApi} onMove={() => setMoved(true)} />}

                <ClusteredMarkers
                    properties={validProperties}
                    hoveredId={hoveredId}
                    selectedId={selectedId}
                    onMarkerClick={onMarkerClick}
                    onMarkerHover={onMarkerHover}
                />
            </MapContainer>

            {/* "Search this area" — appears once the user pans/zooms (Bayut pattern) */}
            {onSearchArea && (moved || searching) && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
                    <button
                        type="button"
                        onClick={runAreaSearch}
                        disabled={searching}
                        className="inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-4 py-2 text-xs font-bold text-neutral-800 shadow-lg ring-1 ring-black/10 hover:bg-white disabled:opacity-70 transition"
                    >
                        {searching ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <circle cx="11" cy="11" r="7" />
                                <path d="m20 20-3.5-3.5" />
                            </svg>
                        )}
                        {searching ? 'Searching…' : 'Search this area'}
                    </button>
                </div>
            )}

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
