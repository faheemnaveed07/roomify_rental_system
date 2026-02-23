import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePropertyStore } from '../store/property.store';
import PropertyCard from '../components/molecules/PropertyCard';
import SearchBar from '../components/molecules/SearchBar';
import Button from '../components/atoms/Button';

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

    const location = useLocation();
    const initialSearchRef = useRef<{ query?: string; filters?: any } | null>(
        (location.state as { query?: string; filters?: any }) || null
    );

    useEffect(() => {
        const initialSearch = initialSearchRef.current;
        if (initialSearch) {
            const areaQuery = initialSearch.query?.trim();
            fetchProperties({
                ...initialSearch.filters,
                ...(areaQuery ? { area: areaQuery } : {}),
                city: initialSearch.filters?.city || 'Multan',
            });
        } else {
            fetchProperties();
        }
    }, [fetchProperties]);

    const handleSearch = (query: string, searchFilters: any) => {
        const areaQuery = query?.trim();
        fetchProperties({
            ...searchFilters,
            ...(areaQuery ? { area: areaQuery } : {}),
            city: searchFilters.city || 'Multan',
        });
    };

    const handleLoadMore = () => {
        if (page < totalPages) {
            fetchProperties(filters, { page: page + 1 });
        }
    };

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
                    properties.map((property) => (
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
                            onClick={() => window.location.href = `/property/${property._id}`}
                        />
                    ))
                )}
            </div>

            {!loading && properties.length === 0 && (
                <div className="text-center py-20 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
                    <p className="text-xl text-neutral-500">No properties found matching your criteria.</p>
                    <Button
                        variant="ghost"
                        onClick={() => fetchProperties({ city: 'Multan' })}
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
