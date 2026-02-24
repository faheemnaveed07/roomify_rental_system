import React, { InputHTMLAttributes, forwardRef, useId } from 'react';
import styles from './Input.module.css';

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
            ...props
        },
        ref
    ) => {
        const id = useId();
        const inputId = props.id || id;

        const containerClass = `${styles.container} ${!fullWidth ? styles.containerNotFullWidth : ''}`;
        const inputClass = `${styles.input} ${error ? styles.inputError : styles.inputNoError} ${leftIcon ? styles.inputWithLeftIcon : ''} ${rightIcon ? styles.inputWithRightIcon : ''}`;
        const helperClass = `${styles.helper} ${error ? styles.helperError : ''}`;

        return (
            <div className={containerClass}>
                {label && (
                    <label htmlFor={inputId} className={styles.label}>
                        {label}
                    </label>
                )}
                <div className={styles.inputWrapper}>
                    {leftIcon && <span className={`${styles.icon} ${styles.iconLeft}`}>{leftIcon}</span>}
                    <input
                        ref={ref}
                        id={inputId}
                        disabled={disabled}
                        className={inputClass}
                        aria-invalid={!!error}
                        aria-describedby={error || helperText ? `${inputId}-helper` : undefined}
                        {...props}
                    />
                    {rightIcon && <span className={`${styles.icon} ${styles.iconRight}`}>{rightIcon}</span>}
                </div>
                {(error || helperText) && (
                    <span id={`${inputId}-helper`} className={helperClass}>
                        {error || helperText}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
