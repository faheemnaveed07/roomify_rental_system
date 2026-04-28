/**
 * Roomify Color Palette
 * Primary: #2563EB (Blue)
 * Secondary: #F59E0B (Amber)
 */

export const colors = {
    primary: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        200: '#BFDBFE',
        300: '#93C5FD',
        400: '#60A5FA',
        500: '#2563EB',
        600: '#1D4ED8',
        700: '#1E40AF',
        800: '#1E3A8A',
        900: '#1E3A5F',
    },
    secondary: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        200: '#FDE68A',
        300: '#FCD34D',
        400: '#FBBF24',
        500: '#F59E0B',
        600: '#D97706',
        700: '#B45309',
        800: '#92400E',
        900: '#78350F',
    },
    neutral: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    },
    success: {
        50: '#ECFDF5',
        100: '#D1FAE5',
        200: '#A7F3D0',
        300: '#6EE7B7',
        400: '#34D399',
        500: '#10B981',
        600: '#059669',
        700: '#047857',
        800: '#065F46',
        900: '#064E3B',
    },
    warning: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        200: '#FDE68A',
        300: '#FCD34D',
        400: '#FBBF24',
        500: '#F59E0B',
        600: '#D97706',
        700: '#B45309',
        800: '#92400E',
        900: '#78350F',
    },
    error: {
        50: '#FEF2F2',
        100: '#FEE2E2',
        200: '#FECACA',
        300: '#FCA5A5',
        400: '#F87171',
        500: '#EF4444',
        600: '#DC2626',
        700: '#B91C1C',
        800: '#991B1B',
        900: '#7F1D1D',
    },
    /**
     * Status pills (Homearia-style card tags)
     * Used on PropertyCard to differentiate listings at a glance.
     */
    status: {
        new: '#10B981',         // green — fresh listing (< 7 days old)
        popular: '#F97316',     // orange — high view/inquiry count
        bestPrice: '#0EA5E9',   // sky-blue — among lowest priced in city
        featured: '#A855F7',    // purple — admin-promoted listing
        verified: '#2563EB',    // primary — admin-approved listing
    },
    /**
     * Map marker palette
     * Used by Leaflet price-pin markers on the Search page.
     */
    mapMarker: {
        default: '#2563EB',     // primary blue
        hovered: '#1D4ED8',     // primary darker (when card is hovered)
        selected: '#F59E0B',    // amber accent (when marker clicked)
        cluster: '#3B82F6',     // blue-500 (cluster bubbles)
    },
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;
export type PrimaryShade = keyof typeof colors.primary;
export type NeutralShade = keyof typeof colors.neutral;
export type StatusKey = keyof typeof colors.status;
export type MapMarkerKey = keyof typeof colors.mapMarker;

export default colors;
