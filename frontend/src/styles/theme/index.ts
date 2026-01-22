/**
 * Roomify Design System - Consolidated Theme Export
 */

export { colors, type ColorKey, type PrimaryShade, type NeutralShade } from './colors';
export {
    typography,
    fontFamilies,
    fontSizes,
    fontWeights,
    lineHeights,
    letterSpacings,
    type FontFamily,
    type FontSize,
    type FontWeight,
    type LineHeight,
    type LetterSpacing,
} from './typography';
export {
    spacing,
    gridUnit,
    gridSpacing,
    borderRadius,
    type SpacingKey,
    type GridSpacingKey,
    type BorderRadiusKey,
} from './spacing';
export {
    breakpoints,
    breakpointValues,
    media,
    containers,
    type BreakpointKey,
    type ContainerKey,
} from './breakpoints';

import { colors } from './colors';
import { typography, fontFamilies, fontSizes, fontWeights, lineHeights, letterSpacings } from './typography';
import { spacing, gridUnit, gridSpacing, borderRadius } from './spacing';
import { breakpoints, breakpointValues, media, containers } from './breakpoints';

export const theme = {
    colors,
    typography,
    fontFamilies,
    fontSizes,
    fontWeights,
    lineHeights,
    letterSpacings,
    spacing,
    gridUnit,
    gridSpacing,
    borderRadius,
    breakpoints,
    breakpointValues,
    media,
    containers,

    // Shadows
    shadows: {
        none: 'none',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    },

    // Transitions
    transitions: {
        none: 'none',
        all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        DEFAULT: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        colors: 'color, background-color, border-color, text-decoration-color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Z-index scale
    zIndex: {
        auto: 'auto',
        0: 0,
        10: 10,
        20: 20,
        30: 30,
        40: 40,
        50: 50,
        dropdown: 100,
        sticky: 200,
        fixed: 300,
        modalBackdrop: 400,
        modal: 500,
        popover: 600,
        tooltip: 700,
        toast: 800,
    },
} as const;

export type Theme = typeof theme;

export default theme;
