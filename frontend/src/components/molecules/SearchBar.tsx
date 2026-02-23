import React, { useState, useCallback } from 'react';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';

interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string, filters: SearchFilters) => void;
    showFilters?: boolean;
    initialValue?: string;
}

interface SearchFilters {
    city?: string;
    propertyType?: 'shared_room' | 'full_house' | '';
    minPrice?: number;
    maxPrice?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = 'Search by location, city, or property name...',
    onSearch,
    showFilters = false,
    initialValue = '',
}) => {
    const [query, setQuery] = useState(initialValue);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const handleSearch = useCallback(() => {
        onSearch(query, filters);
    }, [query, filters, onSearch]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const SearchIcon = () => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
                d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
                stroke="currentColor"
                strokeWidth="1.67"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

    const FilterIcon = () => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
                d="M5 10H15M2.5 5H17.5M7.5 15H12.5"
                stroke="currentColor"
                strokeWidth="1.67"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="flex-1">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        leftIcon={<SearchIcon />}
                    />
                </div>
                {showFilters && (
                    <Button
                        variant="outline"
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        leftIcon={<FilterIcon />}
                    >
                        Filters
                    </Button>
                )}
                <Button variant="primary" onClick={handleSearch}>
                    Search
                </Button>
            </div>

            <div
                className={`${isFiltersOpen ? 'flex' : 'hidden'} flex-wrap gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-200`}
            >
                <div className="flex flex-col gap-1 min-w-[150px]">
                    <label htmlFor="filter-property-type" className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        Property Type
                    </label>
                    <select
                        id="filter-property-type"
                        className="px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white text-neutral-900 outline-none"
                        value={filters.propertyType || ''}
                        onChange={(e) =>
                            setFilters({ ...filters, propertyType: e.target.value as SearchFilters['propertyType'] })
                        }
                    >
                        <option value="">All Types</option>
                        <option value="shared_room">Shared Room</option>
                        <option value="full_house">Full House</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1 min-w-[150px]">
                    <label htmlFor="filter-city" className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        City
                    </label>
                    <select
                        id="filter-city"
                        className="px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white text-neutral-900 outline-none"
                        value={filters.city || ''}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    >
                        <option value="">All Cities</option>
                        <option value="karachi">Karachi</option>
                        <option value="lahore">Lahore</option>
                        <option value="islamabad">Islamabad</option>
                        <option value="rawalpindi">Rawalpindi</option>
                        <option value="faisalabad">Faisalabad</option>
                        <option value="Multan">Multan</option>
                        <option value="Vehari">Vehari</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1 min-w-[150px]">
                    <label htmlFor="filter-min-price" className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        Min Price (PKR)
                    </label>
                    <Input
                        id="filter-min-price"
                        type="number"
                        placeholder="0"
                        value={filters.minPrice || ''}
                        onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) || undefined })}
                    />
                </div>

                <div className="flex flex-col gap-1 min-w-[150px]">
                    <label htmlFor="filter-max-price" className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        Max Price (PKR)
                    </label>
                    <Input
                        id="filter-max-price"
                        type="number"
                        placeholder="Any"
                        value={filters.maxPrice || ''}
                        onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) || undefined })}
                    />
                </div>

                <div className="flex items-end">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setFilters({});
                        }}
                    >
                        Clear Filters
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
