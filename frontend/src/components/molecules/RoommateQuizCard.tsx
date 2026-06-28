import React from 'react';
import { Button } from '../atoms/Button';
import { spacing, borderRadius } from '../../styles/theme';

interface QuizOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface RoommateQuizCardProps {
    questionNumber: number;
    totalQuestions: number;
    question: string;
    description?: string;
    options: QuizOption[];
    selectedValue?: string;
    onSelect: (value: string) => void;
    onNext?: () => void;
    onPrevious?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
}

export const RoommateQuizCard: React.FC<RoommateQuizCardProps> = ({
    questionNumber,
    totalQuestions,
    question,
    description,
    options,
    selectedValue,
    onSelect,
    onNext,
    onPrevious,
    isFirst = false,
    isLast = false,
}) => {
    const cardStyles: React.CSSProperties = {
        backgroundColor: '#141414',
        borderRadius: borderRadius['2xl'],
        border: '1px solid #2a2a2a',
        boxShadow: 'none',
        padding: spacing[8],
        maxWidth: '600px',
        width: '100%',
    };

    const progressContainerStyles: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        marginBottom: spacing[6],
    };

    const progressBarStyles: React.CSSProperties = {
        flex: 1,
        height: '8px',
        backgroundColor: '#2a2a2a',
        borderRadius: borderRadius.full,
        overflow: 'hidden',
    };

    const progressFillStyles: React.CSSProperties = {
        height: '100%',
        width: `${(questionNumber / totalQuestions) * 100}%`,
        backgroundColor: '#d4845a',
        borderRadius: borderRadius.full,
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    };

    const progressTextStyles: React.CSSProperties = {
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#8f8f8f',
        whiteSpace: 'nowrap',
    };

    const questionStyles: React.CSSProperties = {
        fontSize: '1.5rem',
        fontWeight: 600,
        color: '#f5f5f5',
        marginBottom: spacing[2],
        lineHeight: 1.3,
    };

    const descriptionStyles: React.CSSProperties = {
        fontSize: '1rem',
        color: '#8f8f8f',
        marginBottom: spacing[6],
    };

    const optionsContainerStyles: React.CSSProperties = {
        display: 'grid',
        gap: spacing[3],
        marginBottom: spacing[8],
    };

    const optionStyles = (isSelected: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[4],
        backgroundColor: isSelected ? 'rgba(212,132,90,0.12)' : '#141414',
        border: `2px solid ${isSelected ? '#d4845a' : '#2a2a2a'}`,
        borderRadius: borderRadius.lg,
        cursor: 'pointer',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    });

    const optionIconStyles = (isSelected: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.5rem',
        height: '2.5rem',
        backgroundColor: isSelected ? 'rgba(212,132,90,0.18)' : '#1f1f1f',
        borderRadius: borderRadius.lg,
        color: isSelected ? '#d4845a' : '#8f8f8f',
        fontSize: '1.25rem',
    });

    const optionLabelStyles = (isSelected: boolean): React.CSSProperties => ({
        fontSize: '1rem',
        fontWeight: isSelected ? 600 : 500,
        color: isSelected ? '#e89a6c' : '#c0c0c0',
    });

    const radioStyles = (isSelected: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.25rem',
        height: '1.25rem',
        marginLeft: 'auto',
        borderRadius: borderRadius.full,
        border: `2px solid ${isSelected ? '#d4845a' : '#3a3a3a'}`,
        backgroundColor: isSelected ? '#d4845a' : '#141414',
        transition: 'all 150ms',
    });

    const navigationStyles: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };

    const CheckIcon = () => (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
                d="M10 3L4.5 8.5L2 6"
                stroke={'#141414'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

    return (
        <div style={cardStyles}>
            <div style={progressContainerStyles}>
                <div style={progressBarStyles}>
                    <div style={progressFillStyles} />
                </div>
                <span style={progressTextStyles}>
                    {questionNumber} of {totalQuestions}
                </span>
            </div>

            <h2 style={questionStyles}>{question}</h2>
            {description && <p style={descriptionStyles}>{description}</p>}

            <div style={optionsContainerStyles}>
                {options.map((option) => {
                    const isSelected = selectedValue === option.value;
                    return (
                        <div
                            key={option.value}
                            style={optionStyles(isSelected)}
                            onClick={() => onSelect(option.value)}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelect(option.value);
                                }
                            }}
                        >
                            {option.icon && (
                                <span style={optionIconStyles(isSelected)}>{option.icon}</span>
                            )}
                            <span style={optionLabelStyles(isSelected)}>{option.label}</span>
                            <span style={radioStyles(isSelected)}>
                                {isSelected && <CheckIcon />}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div style={navigationStyles}>
                <Button
                    variant="ghost"
                    onClick={onPrevious}
                    disabled={isFirst}
                >
                    Previous
                </Button>
                <Button
                    variant="primary"
                    onClick={onNext}
                    disabled={!selectedValue}
                >
                    {isLast ? 'Complete' : 'Next'}
                </Button>
            </div>
        </div>
    );
};

export default RoommateQuizCard;
