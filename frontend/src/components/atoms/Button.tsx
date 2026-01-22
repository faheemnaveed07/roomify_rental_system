import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { colors } from '../../styles/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
        backgroundColor: colors.primary[500],
        color: colors.white,
        border: 'none',
    },
    secondary: {
        backgroundColor: colors.secondary[500],
        color: colors.white,
        border: 'none',
    },
    outline: {
        backgroundColor: 'transparent',
        color: colors.primary[500],
        border: `2px solid ${colors.primary[500]}`,
    },
    ghost: {
        backgroundColor: 'transparent',
        color: colors.neutral[700],
        border: 'none',
    },
    danger: {
        backgroundColor: colors.error[500],
        color: colors.white,
        border: 'none',
    },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: {
        padding: '0.375rem 0.75rem',
        fontSize: '0.875rem',
        borderRadius: '0.375rem',
    },
    md: {
        padding: '0.5rem 1rem',
        fontSize: '1rem',
        borderRadius: '0.5rem',
    },
    lg: {
        padding: '0.75rem 1.5rem',
        fontSize: '1.125rem',
        borderRadius: '0.5rem',
    },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            children,
            style,
            ...props
        },
        ref
    ) => {
        const baseStyles: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: 500,
            cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
            opacity: disabled || isLoading ? 0.6 : 1,
            transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            width: fullWidth ? '100%' : 'auto',
            ...variantStyles[variant],
            ...sizeStyles[size],
            ...style,
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                style={baseStyles}
                {...props}
            >
                {isLoading ? (
                    <span
                        style={{
                            width: '1rem',
                            height: '1rem',
                            border: '2px solid currentColor',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }}
                    />
                ) : (
                    leftIcon
                )}
                {children}
                {!isLoading && rightIcon}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
