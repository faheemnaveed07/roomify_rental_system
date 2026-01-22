import React from 'react';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface FilterChipProps {
    label: string;
    isActive?: boolean;
    count?: number;
    icon?: React.ReactNode;
    onToggle?: () => void;
    onRemove?: () => void;
    disabled?: boolean;
}

export const FilterChip: React.FC<FilterChipProps> = ({
    label,
    isActive = false,
    count,
    icon,
    onToggle,
    onRemove,
    disabled = false,
}) => {
    const chipStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing[1],
        padding: `${spacing[1]} ${spacing[3]}`,
        fontSize: '0.875rem',
        fontWeight: 500,
        borderRadius: borderRadius.full,
        border: `1px solid ${isActive ? colors.primary[500] : colors.neutral[300]}`,
        backgroundColor: isActive ? colors.primary[50] : colors.white,
        color: isActive ? colors.primary[700] : colors.neutral[700],
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
    };

    const countStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '1.25rem',
        height: '1.25rem',
        padding: '0 0.25rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        borderRadius: borderRadius.full,
        backgroundColor: isActive ? colors.primary[500] : colors.neutral[200],
        color: isActive ? colors.white : colors.neutral[600],
    };

    const removeButtonStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1rem',
        height: '1rem',
        marginLeft: spacing[1],
        padding: 0,
        border: 'none',
        borderRadius: borderRadius.full,
        backgroundColor: 'transparent',
        color: isActive ? colors.primary[600] : colors.neutral[500],
        cursor: 'pointer',
        transition: 'color 150ms',
    };

    const CloseIcon = () => (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
                d="M9 3L3 9M3 3L9 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

    const handleClick = () => {
        if (!disabled && onToggle) {
            onToggle();
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!disabled && onRemove) {
            onRemove();
        }
    };

    return (
        <div
            style={chipStyles}
            onClick={handleClick}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-pressed={isActive}
            aria-disabled={disabled}
        >
            {icon && (
                <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
            )}
            <span>{label}</span>
            {count !== undefined && <span style={countStyles}>{count}</span>}
            {onRemove && isActive && (
                <button
                    style={removeButtonStyles}
                    onClick={handleRemove}
                    aria-label={`Remove ${label} filter`}
                >
                    <CloseIcon />
                </button>
            )}
        </div>
    );
};

// Filter chip group component
interface FilterChipGroupProps {
    filters: { id: string; label: string; count?: number }[];
    activeFilters: string[];
    onFilterChange: (filterId: string) => void;
    onClearAll?: () => void;
}

export const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
    filters,
    activeFilters,
    onFilterChange,
    onClearAll,
}) => {
    const containerStyles: React.CSSProperties = {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: spacing[2],
    };

    return (
        <div style={containerStyles}>
            {filters.map((filter) => (
                <FilterChip
                    key={filter.id}
                    label={filter.label}
                    count={filter.count}
                    isActive={activeFilters.includes(filter.id)}
                    onToggle={() => onFilterChange(filter.id)}
                    onRemove={
                        activeFilters.includes(filter.id)
                            ? () => onFilterChange(filter.id)
                            : undefined
                    }
                />
            ))}
            {activeFilters.length > 0 && onClearAll && (
                <button
                    onClick={onClearAll}
                    style={{
                        padding: `${spacing[1]} ${spacing[2]}`,
                        fontSize: '0.875rem',
                        color: colors.neutral[500],
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                    }}
                >
                    Clear all
                </button>
            )}
        </div>
    );
};

export default FilterChip;
