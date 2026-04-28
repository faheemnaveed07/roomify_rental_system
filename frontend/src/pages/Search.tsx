import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Map as MapIcon, X } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import PropertyCard, { PropertyStatus } from '../components/molecules/PropertyCard';
import PropertyMap, { MapProperty } from '../components/molecules/PropertyMap';
import SearchBar from '../components/molecules/SearchBar';
import Button from '../components/atoms/Button';
import { matchingService, propertyService } from '../services/api';
import { useSearchFilters } from '../hooks/useSearchFilters';

type SortOption = 'newest' | 'best_match' | 'price_low' | 'price_high';
type ViewMode = 'split' | 'list' | 'map';

const SearchPage: React.FC = () => {
    // ── URL is the single source of truth for filters ────────────────────────
    const { filters, setFilters, clearFilter, clearAll, queryKey } = useSearchFilters();
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    // Location state forwarded from the home-page search bar (one-time seed).
    // We apply it on first render only, then discard.
    const seededRef = useRef(false);

    // Pull initial state from location.state if the page was navigated to from
    // the home search (e.g., <Link state={{ query: 'Gulberg', filters: {...} }}>).
    // We read it once and push it into the URL so it becomes the source of truth.
    React.useLayoutEffect(() => {
        if (seededRef.current) return;
        seededRef.current = true;
        const state = (window.history.state?.usr ?? window.history.state) as
            | { query?: string; filters?: Record<string, unknown> }
            | null;
        if (!state) return;
        const { query, filters: stateFilters } = state;
        const { minPrice, maxPrice, ...rest } = (stateFilters ?? {}) as Record<string, unknown>;
        const seed: Record<string, unknown> = { ...rest };
        if (query?.toString().trim()) seed.q = query.toString().trim();
        if (minPrice !== undefined) seed.minRent = minPrice;
        if (maxPrice !== undefined) seed.maxRent = maxPrice;
        if (Object.keys(seed).length > 0) {
            setFilters(seed as any);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally one-shot
    }, []);

    // ── Matching state ───────────────────────────────────────────────────────
    const [scoreMap, setScoreMap] = useState<Record<string, number>>({});
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);
    const [matchLoading, setMatchLoading] = useState(false);

    // ── UI-only state (not shareable via URL, not server state) ─────────────
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [highMatchOnly, setHighMatchOnly] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    // ── React Query: server state ─────────────────────────────────────────────
    // queryKey is derived from the current URL params — any filter change
    // automatically triggers a new request. AbortSignal cancels in-flight
    // requests when the query key changes before the response arrives.
    const {
        data: searchResult,
        isLoading,
        isError,
        error: queryError,
    } = useQuery({
        queryKey,
        queryFn: ({ signal }) => {
            const { page, limit, sortBy: sb, sortOrder, ...filterRest } = filters;
            return propertyService.getProperties(
                filterRest,
                { page, limit, sortBy: sb, sortOrder },
                signal,
            );
        },
        staleTime: 30_000, // 30 s — cached data stays fresh; avoids hammering the API
        placeholderData: (prev) => prev, // keep showing old results while new ones load
    });

    const properties = searchResult?.properties ?? [];
    const total      = searchResult?.total      ?? 0;
    const totalPages = searchResult?.totalPages  ?? 1;
    const page       = searchResult?.page        ?? 1;

    // ── Fetch matching scores when properties change ─────────────────────────
    React.useEffect(() => {
        if (!isAuthenticated || properties.length === 0) {
            setScoreMap({});
            return;
        }
        let cancelled = false;
        (async () => {
            setMatchLoading(true);
            try {
                const result = await matchingService.getMatchedProperties(filters, { limit: 50 });
                if (cancelled) return;
                setHasProfile(result.hasProfile);
                const map: Record<string, number> = {};
                for (const s of result.scores) {
                    map[s.propertyId] = s.overallScore;
                }
                setScoreMap(map);
            } catch {
                if (!cancelled) { setScoreMap({}); setHasProfile(null); }
            } finally {
                if (!cancelled) setMatchLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [isAuthenticated, properties, filters]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSearch = useCallback(
        (query: string, searchFilters: Record<string, unknown>) => {
            const q = query?.trim();
            const { minPrice, maxPrice, ...restFilters } = searchFilters ?? {};
            setFilters({
                ...restFilters as any,
                ...(q ? { q } : { q: undefined }),
                ...(minPrice !== undefined ? { minRent: minPrice as number } : {}),
                ...(maxPrice !== undefined ? { maxRent: maxPrice as number } : {}),
            });
        },
        [setFilters],
    );

    const handleLoadMore = () => {
        setFilters({ page: (filters.page ?? 1) + 1 });
    };

    const handleFavoriteToggle = (id: string, next: boolean) => {
        setFavorites((prev) => {
            const copy = new Set(prev);
            if (next) copy.add(id); else copy.delete(id);
            return copy;
        });
    };

    const handleCardClick = (id: string) => {
        setSelectedId(id);
        navigate(`/property/${id}`);
    };

    // ── Derived display list (client-side sort / high-match filter) ──────────
    const bestPriceId = useMemo(() => {
        if (properties.length === 0) return null;
        return properties.reduce((min, p) =>
            !min || p.rent.amount < min.rent.amount ? p : min, properties[0])._id;
    }, [properties]);

    const statusFor = (p: any): PropertyStatus[] => {
        const s: PropertyStatus[] = [];
        if (p.createdAt) {
            const days = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
            if (days < 7) s.push('new');
        }
        if (p._id === bestPriceId) s.push('bestPrice');
        return s;
    };

    const displayProperties = useMemo(() => {
        let list = [...properties];
        if (highMatchOnly && Object.keys(scoreMap).length > 0) {
            list = list.filter((p) => (scoreMap[p._id!] ?? 0) >= 70);
        }
        if (sortBy === 'best_match' && Object.keys(scoreMap).length > 0) {
            list.sort((a, b) => (scoreMap[b._id!] ?? 0) - (scoreMap[a._id!] ?? 0));
        } else if (sortBy === 'price_low') {
            list.sort((a, b) => a.rent.amount - b.rent.amount);
        } else if (sortBy === 'price_high') {
            list.sort((a, b) => b.rent.amount - a.rent.amount);
        }
        return list;
    }, [properties, scoreMap, sortBy, highMatchOnly]);

    // Top 3 by score for "Best Match" badge
    const bestMatchIds = useMemo(() => {
        if (Object.keys(scoreMap).length === 0) return new Set<string>();
        const sorted = Object.entries(scoreMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([id]) => id);
        return new Set(sorted);
    }, [scoreMap]);

    const mapProperties: MapProperty[] = useMemo(() => {
        return displayProperties
            .map((p) => {
                const coords = p.location?.coordinates;
                if (!coords || coords.length !== 2) return null;
                return {
                    id: p._id!,
                    title: p.title,
                    price: p.rent.amount,
                    currency: p.rent.currency || 'PKR',
                    city: p.location.city,
                    area: p.location.area,
                    coordinates: coords as [number, number],
                    imageUrl: p.images[0]?.url,
                } as MapProperty;
            })
            .filter((x): x is MapProperty => x !== null);
    }, [displayProperties]);

    const hasScores = Object.keys(scoreMap).length > 0;

    // Active filter chips — derived from URL filters
    const activeChips = useMemo(() => {
        const chips: { key: string; label: string }[] = [];
        if (filters.city) chips.push({ key: 'city', label: filters.city });
        if (filters.propertyType)
            chips.push({
                key: 'propertyType',
                label: filters.propertyType === 'shared_room' ? 'Shared Room' : 'Full House',
            });
        if (filters.minRent)
            chips.push({ key: 'minRent', label: `Min PKR ${filters.minRent.toLocaleString()}` });
        if (filters.maxRent)
            chips.push({ key: 'maxRent', label: `Max PKR ${filters.maxRent.toLocaleString()}` });
        if (filters.q) chips.push({ key: 'q', label: `"${filters.q}"` });
        if (filters.furnished !== undefined)
            chips.push({ key: 'furnished', label: filters.furnished ? 'Furnished' : 'Unfurnished' });
        if (filters.amenities && filters.amenities.length > 0)
            chips.push({ key: 'amenities', label: `Amenities (${filters.amenities.length})` });
        return chips;
    }, [filters]);

    const removeChip = (key: string) => {
        clearFilter(key as keyof typeof filters);
    };

    return (
        <div className="container py-6 lg:py-8">
            {/* ----- Header & search ----- */}
            <header className="mb-6">
                <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
                    Find Your Next Home
                </h1>
                <SearchBar
                    onSearch={handleSearch}
                    showFilters
                    placeholder="Search by area or property name..."
                    initialValue={filters.q ?? ''}
                />
            </header>

            {/* No-profile hint */}
            {isAuthenticated && hasProfile === false && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
                    Complete your roommate profile to see personalized compatibility matches.
                </div>
            )}

            {/* ----- Active filter chips ----- */}
            {activeChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    {activeChips.map((c) => (
                        <button
                            key={c.key}
                            onClick={() => removeChip(c.key)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium border border-primary-100 hover:bg-primary-100 transition-colors"
                        >
                            {c.label}
                            <X size={12} />
                        </button>
                    ))}
                    <button
                        onClick={clearAll}
                        className="text-xs text-neutral-500 hover:text-neutral-700 underline ml-1"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* ----- Results bar (count + sort + view toggle) ----- */}
            {(properties.length > 0 || isLoading) && (
                <div className="flex flex-wrap items-center gap-3 mb-5">
                    <div className="text-sm text-neutral-700">
                        <span className="font-semibold">{displayProperties.length}</span>{' '}
                        of {total}{' '}
                        {total === 1 ? 'property' : 'properties'}
                    </div>

                    <div className="flex-1" />

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                        aria-label="Sort properties"
                    >
                        <option value="newest">Newest first</option>
                        {hasScores && <option value="best_match">Best match</option>}
                        <option value="price_low">Price: Low → High</option>
                        <option value="price_high">Price: High → Low</option>
                    </select>

                    {hasScores && (
                        <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={highMatchOnly}
                                onChange={(e) => setHighMatchOnly(e.target.checked)}
                                className="w-4 h-4 accent-primary-500"
                            />
                            High matches only (≥70%)
                        </label>
                    )}

                    {/* View toggle (visible on lg+ only — mobile uses tab switcher below) */}
                    <div className="hidden lg:inline-flex items-center bg-neutral-100 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setViewMode('split')}
                            aria-label="Split view"
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${viewMode === 'split'
                                    ? 'bg-white text-neutral-900 shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            <LayoutGrid size={13} /> Split
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            aria-label="List only"
                            className={`px-3 py-1.5 rounded-md text-xs font-medium ${viewMode === 'list'
                                    ? 'bg-white text-neutral-900 shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            List
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('map')}
                            aria-label="Map only"
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ${viewMode === 'map'
                                    ? 'bg-white text-neutral-900 shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            <MapIcon size={13} /> Map
                        </button>
                    </div>

                    {matchLoading && (
                        <span className="text-xs text-neutral-400">Loading match scores...</span>
                    )}
                </div>
            )}

            {/* ----- Mobile List/Map tab switcher ----- */}
            {properties.length > 0 && (
                <div className="lg:hidden flex bg-neutral-100 rounded-lg p-1 mb-4 w-fit">
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${viewMode !== 'map'
                                ? 'bg-white text-neutral-900 shadow-sm'
                                : 'text-neutral-500'
                            }`}
                    >
                        <LayoutGrid size={14} /> List
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('map')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${viewMode === 'map'
                                ? 'bg-white text-neutral-900 shadow-sm'
                                : 'text-neutral-500'
                            }`}
                    >
                        <MapIcon size={14} /> Map
                    </button>
                </div>
            )}

            {isError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg">
                    {(queryError as Error)?.message ?? 'Failed to load properties. Please try again.'}
                </div>
            )}

            {/* ----- Main results layout ----- */}
            <div
                className={`grid gap-6 ${viewMode === 'split'
                        ? 'lg:grid-cols-[1fr_500px]'
                        : 'grid-cols-1'
                    }`}
            >
                {/* List column */}
                {viewMode !== 'map' && (
                    <div className={viewMode === 'split' ? 'min-w-0' : ''}>
                        <div
                            className={`grid gap-5 ${viewMode === 'split'
                                    ? 'grid-cols-1 sm:grid-cols-2'
                                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                }`}
                        >
                            {isLoading && properties.length === 0
                                ? Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="animate-pulse bg-neutral-200 rounded-2xl h-80"
                                    />
                                ))
                                : displayProperties.map((property) => (
                                    <PropertyCard
                                        key={property._id}
                                        id={property._id!}
                                        title={property.title}
                                        address={property.location.address}
                                        city={property.location.city}
                                        area={property.location.area}
                                        price={property.rent.amount}
                                        currency={property.rent.currency || 'PKR'}
                                        propertyType={property.propertyType as any}
                                        imageUrl={property.images[0]?.url}
                                        bedrooms={property.fullHouseDetails?.bedrooms}
                                        bathrooms={property.fullHouseDetails?.bathrooms}
                                        availableBeds={property.sharedRoomDetails?.availableBeds}
                                        totalBeds={property.sharedRoomDetails?.totalBeds}
                                        amenities={property.amenities}
                                        isVerified={property.verificationStatus.adminApproved}
                                        statuses={statusFor(property)}
                                        compatibilityScore={scoreMap[property._id!] ?? undefined}
                                        isBestMatch={bestMatchIds.has(property._id!)}
                                        isFavorite={favorites.has(property._id!)}
                                        isHighlighted={hoveredId === property._id || selectedId === property._id}
                                        onClick={() => handleCardClick(property._id!)}
                                        onFavoriteToggle={handleFavoriteToggle}
                                        onMouseEnter={() => setHoveredId(property._id!)}
                                        onMouseLeave={() => setHoveredId(null)}
                                    />
                                ))}
                        </div>

                        {/* Empty state */}
                        {!isLoading && displayProperties.length === 0 && (
                            <div className="text-center py-16 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
                                <p className="text-lg text-neutral-500">
                                    {highMatchOnly
                                        ? 'No properties match ≥70% compatibility. Try disabling the filter.'
                                        : 'No properties found matching your criteria.'}
                                </p>
                                <Button variant="ghost" onClick={clearAll} className="mt-4">
                                    Clear Filters
                                </Button>
                            </div>
                        )}

                        {/* Pagination */}
                        {page < totalPages && (
                            <div className="mt-10 flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={isLoading}
                                    className="px-8"
                                >
                                    {isLoading ? 'Loading...' : 'Load More Results'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Map column */}
                {viewMode !== 'list' && (
                    <div
                        className={
                            viewMode === 'split'
                                ? 'hidden lg:block lg:sticky lg:top-24 lg:self-start lg:h-[calc(100vh-7rem)]'
                                : 'h-[70vh]'
                        }
                    >
                        <PropertyMap
                            properties={mapProperties}
                            hoveredId={hoveredId}
                            selectedId={selectedId}
                            onMarkerHover={(id) => setHoveredId(id)}
                            onMarkerClick={(id) => handleCardClick(id)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
