import React, { InputHTMLAttributes, forwardRef, useId } from 'react';
import { colors, spacing } from '../../styles/theme';
import './Checkbox.css';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, error, indeterminate, disabled, checked, style, ...props }, ref) => {
        const id = useId();
        const inputId = props.id || id;

        const customCheckboxStyles: React.CSSProperties = {
            borderColor: error ? colors.error[500] : checked || indeterminate ? colors.primary[500] : colors.neutral[300],
            backgroundColor: checked || indeterminate ? colors.primary[500] : colors.white,
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
                <label htmlFor={inputId} className={`checkbox-container ${disabled ? 'disabled' : ''}`}>
                    <div className="checkbox-wrapper">
                        <input
                            ref={ref}
                            type="checkbox"
                            id={inputId}
                            checked={checked}
                            disabled={disabled}
                            className="checkbox-input"
                            aria-invalid={!!error}
                            {...props}
                        />
                        <div className="checkbox-custom" style={customCheckboxStyles}>
                            {indeterminate ? (
                                <IndeterminateIcon />
                            ) : checked ? (
                                <CheckIcon />
                            ) : null}
                        </div>
                    </div>
                    {label && <span className="checkbox-label">{label}</span>}
                </label>
                {error && <div className="checkbox-error">{error}</div>}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
