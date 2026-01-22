import React, { InputHTMLAttributes, forwardRef, useId } from 'react';
import { colors, spacing } from '../../styles/theme';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            fullWidth = true,
            disabled,
            style,
            ...props
        },
        ref
    ) => {
        const id = useId();
        const inputId = props.id || id;

        const containerStyles: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[1],
            width: fullWidth ? '100%' : 'auto',
        };

        const labelStyles: React.CSSProperties = {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: colors.neutral[700],
        };

        const inputWrapperStyles: React.CSSProperties = {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
        };

        const inputStyles: React.CSSProperties = {
            width: '100%',
            padding: leftIcon ? '0.5rem 0.75rem 0.5rem 2.5rem' : '0.5rem 0.75rem',
            paddingRight: rightIcon ? '2.5rem' : '0.75rem',
            fontSize: '1rem',
            lineHeight: 1.5,
            color: colors.neutral[900],
            backgroundColor: disabled ? colors.neutral[100] : colors.white,
            border: `1px solid ${error ? colors.error[500] : colors.neutral[300]}`,
            borderRadius: '0.5rem',
            outline: 'none',
            transition: 'border-color 150ms, box-shadow 150ms',
            cursor: disabled ? 'not-allowed' : 'text',
            ...style,
        };

        const iconStyles: React.CSSProperties = {
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '100%',
            color: colors.neutral[400],
            pointerEvents: 'none',
        };

        const helperStyles: React.CSSProperties = {
            fontSize: '0.75rem',
            color: error ? colors.error[500] : colors.neutral[500],
        };

        return (
            <div style={containerStyles}>
                {label && (
                    <label htmlFor={inputId} style={labelStyles}>
                        {label}
                    </label>
                )}
                <div style={inputWrapperStyles}>
                    {leftIcon && <span style={{ ...iconStyles, left: 0 }}>{leftIcon}</span>}
                    <input
                        ref={ref}
                        id={inputId}
                        disabled={disabled}
                        style={inputStyles}
                        aria-invalid={!!error}
                        aria-describedby={error || helperText ? `${inputId}-helper` : undefined}
                        {...props}
                    />
                    {rightIcon && <span style={{ ...iconStyles, right: 0 }}>{rightIcon}</span>}
                </div>
                {(error || helperText) && (
                    <span id={`${inputId}-helper`} style={helperStyles}>
                        {error || helperText}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
