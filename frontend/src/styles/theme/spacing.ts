/**
 * Roomify Spacing System
 * Based on 8pt grid system
 */

export const spacing = {
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px  (1 unit)
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px (2 units)
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px (3 units)
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px (4 units)
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px (5 units)
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px (6 units)
    14: '3.5rem',     // 56px (7 units)
    16: '4rem',       // 64px (8 units)
    20: '5rem',       // 80px (10 units)
    24: '6rem',       // 96px (12 units)
    28: '7rem',       // 112px (14 units)
    32: '8rem',       // 128px (16 units)
    36: '9rem',       // 144px (18 units)
    40: '10rem',      // 160px (20 units)
    44: '11rem',      // 176px
    48: '12rem',      // 192px (24 units)
    52: '13rem',      // 208px
    56: '14rem',      // 224px (28 units)
    60: '15rem',      // 240px
    64: '16rem',      // 256px (32 units)
    72: '18rem',      // 288px (36 units)
    80: '20rem',      // 320px (40 units)
    96: '24rem',      // 384px (48 units)
} as const;

// 8pt grid helper values
export const gridUnit = 8;

export const gridSpacing = {
    quarter: '2px',   // 0.25 units
    half: '4px',      // 0.5 units
    1: '8px',         // 1 unit
    1.5: '12px',      // 1.5 units
    2: '16px',        // 2 units
    3: '24px',        // 3 units
    4: '32px',        // 4 units
    5: '40px',        // 5 units
    6: '48px',        // 6 units
    8: '64px',        // 8 units
    10: '80px',       // 10 units
    12: '96px',       // 12 units
    16: '128px',      // 16 units
} as const;

export const borderRadius = {
    none: '0',
    sm: '0.125rem',   // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
} as const;

export type SpacingKey = keyof typeof spacing;
export type GridSpacingKey = keyof typeof gridSpacing;
export type BorderRadiusKey = keyof typeof borderRadius;

export default spacing;
