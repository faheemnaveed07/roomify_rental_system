import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { usePropertyStore } from '../store/property.store';
import { useAuthStore } from '../store/auth.store';
import PropertyCard from '../components/molecules/PropertyCard';
import SearchBar from '../components/molecules/SearchBar';
import Button from '../components/atoms/Button';
import { matchingService } from '../services/api';

type SortOption = 'newest' | 'best_match' | 'price_low' | 'price_high';

const SearchPage: React.FC = () => {
    const {
        properties,
        loading,
        error,
        fetchProperties,
        filters,
        totalPages,
        page
    } = usePropertyStore();
    const { isAuthenticated } = useAuthStore();

    const location = useLocation();
    const initialSearchRef = useRef<{ query?: string; filters?: any } | null>(
        (location.state as { query?: string; filters?: any }) || null
    );

    // Matching state — fetched once per property list change
    const [scoreMap, setScoreMap] = useState<Record<string, number>>({});
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);
    const [matchLoading, setMatchLoading] = useState(false);

    // Sort & filter controls
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [highMatchOnly, setHighMatchOnly] = useState(false);

    useEffect(() => {
        const initialSearch = initialSearchRef.current;
        if (initialSearch) {
            const q = initialSearch.query?.trim();
            const { minPrice, maxPrice, ...restFilters } = initialSearch.filters || {};
            fetchProperties({
                ...restFilters,
                ...(q ? { q } : {}),
                ...(minPrice !== undefined ? { minRent: minPrice } : {}),
                ...(maxPrice !== undefined ? { maxRent: maxPrice } : {}),
            });
        } else {
            fetchProperties();
        }
    }, [fetchProperties]);

    // Fetch matching scores when properties change + user is authenticated
    useEffect(() => {
        if (!isAuthenticated || properties.length === 0) {
            setScoreMap({});
            return;
        }

        let cancelled = false;
        const fetchScores = async () => {
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
                // Silently fail — matching is a non-critical enhancement
                if (!cancelled) {
                    setScoreMap({});
                    setHasProfile(null);
                }
            } finally {
                if (!cancelled) setMatchLoading(false);
            }
        };
        fetchScores();
        return () => { cancelled = true; };
    }, [isAuthenticated, properties, filters]);

    const handleSearch = useCallback((query: string, searchFilters: any) => {
        const q = query?.trim();
        const { minPrice, maxPrice, ...restFilters } = searchFilters || {};
        fetchProperties({
            ...restFilters,
            ...(q ? { q } : {}),
            ...(minPrice !== undefined ? { minRent: minPrice } : {}),
            ...(maxPrice !== undefined ? { maxRent: maxPrice } : {}),
        });
    }, [fetchProperties]);

    const handleLoadMore = () => {
        if (page < totalPages) {
            fetchProperties(filters, { page: page + 1 });
        }
    };

    // Derive sorted + filtered property list
    const displayProperties = useMemo(() => {
        let list = [...properties];

        // Filter: high match only
        if (highMatchOnly && Object.keys(scoreMap).length > 0) {
            list = list.filter((p) => (scoreMap[p._id!] ?? 0) >= 70);
        }

        // Sort
        if (sortBy === 'best_match' && Object.keys(scoreMap).length > 0) {
            list.sort((a, b) => (scoreMap[b._id!] ?? 0) - (scoreMap[a._id!] ?? 0));
        } else if (sortBy === 'price_low') {
            list.sort((a, b) => a.rent.amount - b.rent.amount);
        } else if (sortBy === 'price_high') {
            list.sort((a, b) => b.rent.amount - a.rent.amount);
        }
        // 'newest' keeps the default server order

        return list;
    }, [properties, scoreMap, sortBy, highMatchOnly]);

    // Top 3 property IDs by score for "Best Match" badge
    const bestMatchIds = useMemo(() => {
        if (Object.keys(scoreMap).length === 0) return new Set<string>();
        const sorted = Object.entries(scoreMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([id]) => id);
        return new Set(sorted);
    }, [scoreMap]);

    const hasScores = Object.keys(scoreMap).length > 0;

    return (
        <div className="container py-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-neutral-900 mb-6">Find Your Next Home</h1>
                <SearchBar
                    onSearch={handleSearch}
                    showFilters
                    placeholder="Search by area or property name..."
                    initialValue={initialSearchRef.current?.query || ''}
                />
            </header>

            {/* No-profile hint */}
            {isAuthenticated && hasProfile === false && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
                    Complete your roommate profile to see personalized compatibility matches.
                </div>
            )}

            {/* Sort & Filter bar */}
            {properties.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                        aria-label="Sort properties"
                    >
                        <option value="newest">Sort: Newest</option>
                        {hasScores && <option value="best_match">Sort: Best Match</option>}
                        <option value="price_low">Sort: Price Low → High</option>
                        <option value="price_high">Sort: Price High → Low</option>
                    </select>

                    {hasScores && (
                        <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={highMatchOnly}
                                onChange={(e) => setHighMatchOnly(e.target.checked)}
                                className="w-4 h-4 accent-primary-500"
                            />
                            Show only high matches (≥70%)
                        </label>
                    )}

                    {matchLoading && (
                        <span className="text-xs text-neutral-400 ml-auto">Loading match scores...</span>
                    )}
                </div>
            )}

            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading && properties.length === 0 ? (
                    // Skeleton Loaders
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-neutral-200 rounded-2xl h-96"></div>
                    ))
                ) : (
                    displayProperties.map((property) => (
                        <PropertyCard
                            key={property._id}
                            id={property._id!}
                            title={property.title}
                            address={property.location.address}
                            city={property.location.city}
                            area={property.location.area}
                            price={property.rent.amount}
                            propertyType={property.propertyType as any}
                            imageUrl={property.images[0]?.url}
                            bedrooms={property.fullHouseDetails?.bedrooms}
                            bathrooms={property.fullHouseDetails?.bathrooms}
                            availableBeds={property.sharedRoomDetails?.availableBeds}
                            totalBeds={property.sharedRoomDetails?.totalBeds}
                            isVerified={property.verificationStatus.adminApproved}
                            compatibilityScore={scoreMap[property._id!] ?? undefined}
                            isBestMatch={bestMatchIds.has(property._id!)}
                            onClick={() => window.location.href = `/property/${property._id}`}
                        />
                    ))
                )}
            </div>

            {!loading && displayProperties.length === 0 && (
                <div className="text-center py-20 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
                    <p className="text-xl text-neutral-500">
                        {highMatchOnly
                            ? 'No properties match ≥70% compatibility. Try disabling the filter.'
                            : 'No properties found matching your criteria.'}
                    </p>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setHighMatchOnly(false);
                            fetchProperties({ city: 'Multan' });
                        }}
                        className="mt-4"
                    >
                        Clear Filters
                    </Button>
                </div>
            )}

            {page < totalPages && (
                <div className="mt-12 flex justify-center">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-8"
                    >
                        {loading ? 'Loading...' : 'Load More Results'}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
