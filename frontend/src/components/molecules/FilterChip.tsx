import React from 'react';
import styles from './FilterChip.module.css';

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
        <div className={styles.chip}>
            <button
                type="button"
                className={`${styles.main} ${isActive ? styles.mainActive : ''}`}
                onClick={handleClick}
                disabled={disabled}
            >
                {icon && <span className={styles.icon}>{icon}</span>}
                <span className={styles.label}>{label}</span>
                {count !== undefined && (
                    <span className={`${styles.count} ${isActive ? styles.countActive : ''}`}>{count}</span>
                )}
            </button>

            {onRemove && isActive && (
                <button
                    type="button"
                    className={`${styles.remove} ${isActive ? styles.removeActive : ''}`}
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
    return (
        <div className={styles.group}>
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
                    type="button"
                    className={styles.clearAll}
                >
                    Clear all
                </button>
            )}
        </div>
    );
};

export default FilterChip;
