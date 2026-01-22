/**
 * Roomify Responsive Breakpoints
 */

export const breakpoints = {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
} as const;

export const breakpointValues = {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

// Media query helpers
export const media = {
    xs: `@media (min-width: ${breakpoints.xs})`,
    sm: `@media (min-width: ${breakpoints.sm})`,
    md: `@media (min-width: ${breakpoints.md})`,
    lg: `@media (min-width: ${breakpoints.lg})`,
    xl: `@media (min-width: ${breakpoints.xl})`,
    '2xl': `@media (min-width: ${breakpoints['2xl']})`,

    // Max-width queries
    xsMax: `@media (max-width: ${breakpointValues.xs - 1}px)`,
    smMax: `@media (max-width: ${breakpointValues.sm - 1}px)`,
    mdMax: `@media (max-width: ${breakpointValues.md - 1}px)`,
    lgMax: `@media (max-width: ${breakpointValues.lg - 1}px)`,
    xlMax: `@media (max-width: ${breakpointValues.xl - 1}px)`,

    // Range queries
    smOnly: `@media (min-width: ${breakpoints.sm}) and (max-width: ${breakpointValues.md - 1}px)`,
    mdOnly: `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpointValues.lg - 1}px)`,
    lgOnly: `@media (min-width: ${breakpoints.lg}) and (max-width: ${breakpointValues.xl - 1}px)`,

    // Orientation
    portrait: '@media (orientation: portrait)',
    landscape: '@media (orientation: landscape)',

    // Preferences
    darkMode: '@media (prefers-color-scheme: dark)',
    lightMode: '@media (prefers-color-scheme: light)',
    reducedMotion: '@media (prefers-reduced-motion: reduce)',
} as const;

export const containers = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1440px',
} as const;

export type BreakpointKey = keyof typeof breakpoints;
export type ContainerKey = keyof typeof containers;

export default breakpoints;
