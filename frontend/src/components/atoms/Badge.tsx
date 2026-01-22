import React from 'react';
import { colors } from '../../styles/theme';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    primary: {
        backgroundColor: colors.primary[100],
        color: colors.primary[700],
    },
    secondary: {
        backgroundColor: colors.secondary[100],
        color: colors.secondary[700],
    },
    success: {
        backgroundColor: colors.success[100],
        color: colors.success[700],
    },
    warning: {
        backgroundColor: colors.warning[100],
        color: colors.warning[700],
    },
    error: {
        backgroundColor: colors.error[100],
        color: colors.error[700],
    },
    neutral: {
        backgroundColor: colors.neutral[100],
        color: colors.neutral[700],
    },
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
    sm: {
        padding: '0.125rem 0.5rem',
        fontSize: '0.625rem',
    },
    md: {
        padding: '0.25rem 0.75rem',
        fontSize: '0.75rem',
    },
    lg: {
        padding: '0.375rem 1rem',
        fontSize: '0.875rem',
    },
};

export const Badge: React.FC<BadgeProps> = ({
    variant = 'primary',
    size = 'md',
    icon,
    children,
    style,
}) => {
    const baseStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontWeight: 500,
        borderRadius: '9999px',
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
    };

    return (
        <span style={baseStyles}>
            {icon && (
                <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
            )}
            {children}
        </span>
    );
};

// Specialized verification badge
interface VerificationBadgeProps {
    isVerified: boolean;
    size?: BadgeSize;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
    isVerified,
    size = 'sm',
}) => {
    const CheckIcon = () => (
        <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M10 3L4.5 8.5L2 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

    const XIcon = () => (
        <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M9 3L3 9M3 3L9 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

    return (
        <Badge
            variant={isVerified ? 'success' : 'warning'}
            size={size}
            icon={isVerified ? <CheckIcon /> : <XIcon />}
        >
            {isVerified ? 'Verified' : 'Unverified'}
        </Badge>
    );
};

export default Badge;
