import React, { InputHTMLAttributes, forwardRef, useId } from 'react';
import { colors, spacing } from '../../styles/theme';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, error, indeterminate, disabled, checked, style, ...props }, ref) => {
        const id = useId();
        const inputId = props.id || id;

        const containerStyles: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'flex-start',
            gap: spacing[2],
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
        };

        const checkboxWrapperStyles: React.CSSProperties = {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.25rem',
            height: '1.25rem',
            flexShrink: 0,
        };

        const inputStyles: React.CSSProperties = {
            position: 'absolute',
            width: '100%',
            height: '100%',
            margin: 0,
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
        };

        const customCheckboxStyles: React.CSSProperties = {
            width: '1.25rem',
            height: '1.25rem',
            borderRadius: '0.25rem',
            border: `2px solid ${error ? colors.error[500] : checked || indeterminate ? colors.primary[500] : colors.neutral[300]}`,
            backgroundColor: checked || indeterminate ? colors.primary[500] : colors.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
        };

        const labelStyles: React.CSSProperties = {
            fontSize: '0.875rem',
            color: colors.neutral[700],
            lineHeight: 1.5,
            userSelect: 'none',
        };

        const errorStyles: React.CSSProperties = {
            fontSize: '0.75rem',
            color: colors.error[500],
            marginTop: spacing[1],
        };

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
                    stroke={colors.white}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );

        const IndeterminateIcon = () => (
            <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M2 6H10"
                    stroke={colors.white}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        );

        return (
            <div>
                <label htmlFor={inputId} style={containerStyles}>
                    <div style={checkboxWrapperStyles}>
                        <input
                            ref={ref}
                            type="checkbox"
                            id={inputId}
                            checked={checked}
                            disabled={disabled}
                            style={inputStyles}
                            aria-invalid={!!error}
                            {...props}
                        />
                        <div style={customCheckboxStyles}>
                            {indeterminate ? (
                                <IndeterminateIcon />
                            ) : checked ? (
                                <CheckIcon />
                            ) : null}
                        </div>
                    </div>
                    {label && <span style={labelStyles}>{label}</span>}
                </label>
                {error && <div style={errorStyles}>{error}</div>}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
