import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, Search, Loader2, MapPin } from 'lucide-react';

/**
 * LocationPicker
 * --------------
 * Lets a landlord set the EXACT location of their property by dropping a pin.
 *
 * Why this exists: addresses in Pakistan are informal ("model town, Multan"), so
 * auto-geocoding alone is unreliable. Industry practice (Zameen / Bayut / MLS)
 * is: optionally geocode the typed address to get close, then let the user
 * confirm by dragging the pin — and store BOTH the coordinates and the address.
 *
 * Emits GeoJSON order [lng, lat] to match the backend Property model.
 */

export const CITY_CENTERS: Record<string, [number, number]> = {
    // [lat, lng] — Leaflet order
    Multan: [30.1575, 71.5249],
    Vehari: [30.0445, 72.3489],
};

const DEFAULT_CENTER: [number, number] = CITY_CENTERS.Multan;

const PIN_HTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 24 32">
  <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z"
        fill="#d4845a" stroke="#ffffff" stroke-width="2"/>
  <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
</svg>`;

const pinIcon = L.divIcon({
    className: 'dv-location-pin',
    html: PIN_HTML,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
});

/** Turns map clicks into a picked coordinate */
const ClickCapture: React.FC<{ onPick: (coords: [number, number]) => void }> = ({ onPick }) => {
    useMapEvents({
        click(e) {
            onPick([e.latlng.lng, e.latlng.lat]);
        },
    });
    return null;
};

/** Imperatively re-centres the map, but only on explicit actions (city change / search / geolocate) */
const Recenter: React.FC<{ focus: { center: [number, number]; zoom: number } | null }> = ({ focus }) => {
    const map = useMap();
    const key = focus ? `${focus.center[0]},${focus.center[1]},${focus.zoom}` : '';
    useEffect(() => {
        if (focus) map.setView(focus.center, focus.zoom);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return null;
};

interface LocationPickerProps {
    /** GeoJSON [lng, lat] — undefined/null until the landlord drops a pin */
    value?: [number, number] | null;
    onChange: (coords: [number, number]) => void;
    /** Selected city — used to centre the map before a pin exists */
    city?: string;
    /** "address, area, city" — used by the optional address lookup */
    searchQuery?: string;
    error?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
    value,
    onChange,
    city = 'Multan',
    searchQuery,
    error,
}) => {
    const cityCenter = CITY_CENTERS[city] ?? DEFAULT_CENTER;
    const [focus, setFocus] = useState<{ center: [number, number]; zoom: number } | null>(null);
    const [busy, setBusy] = useState<null | 'search' | 'geo'>(null);
    const [msg, setMsg] = useState<string | null>(null);

    // Leaflet wants [lat, lng]; we store GeoJSON [lng, lat]
    const markerPos = useMemo<[number, number] | null>(
        () => (value && value.length === 2 ? [value[1], value[0]] : null),
        [value]
    );

    // When the city changes and no pin has been dropped yet, move the map there.
    useEffect(() => {
        if (!value) setFocus({ center: cityCenter, zoom: 13 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [city]);

    const pick = (coords: [number, number], recenter = false, zoom = 16) => {
        setMsg(null);
        onChange(coords);
        if (recenter) setFocus({ center: [coords[1], coords[0]], zoom });
    };

    /** Optional convenience: look the typed address up on OpenStreetMap (free, no key) */
    const findAddress = async () => {
        const q = (searchQuery ?? '').trim();
        if (q.length < 3) {
            setMsg('Type the area / address first, then search.');
            return;
        }
        setBusy('search');
        setMsg(null);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pk&q=${encodeURIComponent(q)}`,
                { headers: { Accept: 'application/json' } }
            );
            const json = (await res.json()) as Array<{ lat: string; lon: string }>;
            if (json?.length) {
                pick([parseFloat(json[0].lon), parseFloat(json[0].lat)], true, 16);
                setMsg('Found it — drag the pin to fine-tune the exact spot.');
            } else {
                setMsg('Address not found. Please place the pin manually on the map.');
            }
        } catch {
            setMsg('Lookup failed. Please place the pin manually on the map.');
        } finally {
            setBusy(null);
        }
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            setMsg('Your browser does not support location access.');
            return;
        }
        setBusy('geo');
        setMsg(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                pick([pos.coords.longitude, pos.coords.latitude], true, 17);
                setBusy(null);
            },
            () => {
                setMsg('Could not get your location. Please place the pin manually.');
                setBusy(null);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-sm font-medium text-neutral-700">
                    Pin the exact location <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={findAddress}
                        disabled={busy !== null}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-60"
                    >
                        {busy === 'search' ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                        Find address
                    </button>
                    <button
                        type="button"
                        onClick={useMyLocation}
                        disabled={busy !== null}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-60"
                    >
                        {busy === 'geo' ? <Loader2 size={13} className="animate-spin" /> : <Crosshair size={13} />}
                        Use my location
                    </button>
                </div>
            </div>

            <p className="text-xs text-neutral-500">
                Click anywhere on the map to drop the pin, then drag it to the exact spot. This is what tenants will see.
            </p>

            <div
                className={`relative rounded-xl overflow-hidden border ${
                    error ? 'border-red-400' : 'border-neutral-200'
                }`}
            >
                <MapContainer
                    center={markerPos ?? cityCenter}
                    zoom={markerPos ? 16 : 13}
                    scrollWheelZoom
                    style={{ height: 320, width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Recenter focus={focus} />
                    <ClickCapture onPick={(c) => pick(c)} />
                    {markerPos && (
                        <Marker
                            position={markerPos}
                            icon={pinIcon}
                            draggable
                            eventHandlers={{
                                dragend: (e) => {
                                    const ll = (e.target as L.Marker).getLatLng();
                                    pick([ll.lng, ll.lat]);
                                },
                            }}
                        />
                    )}
                </MapContainer>

                {!markerPos && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
                        <span className="flex items-center gap-2 text-xs font-semibold text-white bg-black/70 px-3 py-2 rounded-lg">
                            <MapPin size={14} /> Click on the map to set the property location
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-neutral-500">
                    {markerPos
                        ? `📍 ${markerPos[0].toFixed(5)}, ${markerPos[1].toFixed(5)}`
                        : 'No location set yet'}
                </span>
                {msg && <span className="text-xs text-neutral-500">{msg}</span>}
            </div>

            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
};

export default LocationPicker;
