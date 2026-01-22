import React, { useState, useCallback } from 'react';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { colors, spacing, borderRadius } from '../../styles/theme';

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

    const containerStyles: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[3],
        width: '100%',
    };

    const searchRowStyles: React.CSSProperties = {
        display: 'flex',
        gap: spacing[2],
        width: '100%',
    };

    const inputWrapperStyles: React.CSSProperties = {
        flex: 1,
        position: 'relative',
    };

    const filtersContainerStyles: React.CSSProperties = {
        display: isFiltersOpen ? 'flex' : 'none',
        flexWrap: 'wrap',
        gap: spacing[4],
        padding: spacing[4],
        backgroundColor: colors.neutral[50],
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.neutral[200]}`,
    };

    const filterGroupStyles: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[1],
        minWidth: '150px',
    };

    const filterLabelStyles: React.CSSProperties = {
        fontSize: '0.75rem',
        fontWeight: 500,
        color: colors.neutral[600],
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    };

    const selectStyles: React.CSSProperties = {
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        border: `1px solid ${colors.neutral[300]}`,
        borderRadius: borderRadius.md,
        backgroundColor: colors.white,
        color: colors.neutral[900],
        outline: 'none',
        cursor: 'pointer',
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
        <div style={containerStyles}>
            <div style={searchRowStyles}>
                <div style={inputWrapperStyles}>
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

            <div style={filtersContainerStyles}>
                <div style={filterGroupStyles}>
                    <label style={filterLabelStyles}>Property Type</label>
                    <select
                        style={selectStyles}
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

                <div style={filterGroupStyles}>
                    <label style={filterLabelStyles}>City</label>
                    <select
                        style={selectStyles}
                        value={filters.city || ''}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    >
                        <option value="">All Cities</option>
                        <option value="karachi">Karachi</option>
                        <option value="lahore">Lahore</option>
                        <option value="islamabad">Islamabad</option>
                        <option value="rawalpindi">Rawalpindi</option>
                        <option value="faisalabad">Faisalabad</option>
                    </select>
                </div>

                <div style={filterGroupStyles}>
                    <label style={filterLabelStyles}>Min Price (PKR)</label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={filters.minPrice || ''}
                        onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) || undefined })}
                    />
                </div>

                <div style={filterGroupStyles}>
                    <label style={filterLabelStyles}>Max Price (PKR)</label>
                    <Input
                        type="number"
                        placeholder="Any"
                        value={filters.maxPrice || ''}
                        onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) || undefined })}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
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
