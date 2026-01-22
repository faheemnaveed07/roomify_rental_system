import React from 'react';
import { Button } from '../atoms/Button';
import { colors, spacing, borderRadius } from '../../styles/theme';

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
        backgroundColor: colors.white,
        borderRadius: borderRadius['2xl'],
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
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
        backgroundColor: colors.neutral[200],
        borderRadius: borderRadius.full,
        overflow: 'hidden',
    };

    const progressFillStyles: React.CSSProperties = {
        height: '100%',
        width: `${(questionNumber / totalQuestions) * 100}%`,
        backgroundColor: colors.primary[500],
        borderRadius: borderRadius.full,
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    };

    const progressTextStyles: React.CSSProperties = {
        fontSize: '0.875rem',
        fontWeight: 500,
        color: colors.neutral[500],
        whiteSpace: 'nowrap',
    };

    const questionStyles: React.CSSProperties = {
        fontSize: '1.5rem',
        fontWeight: 600,
        color: colors.neutral[900],
        marginBottom: spacing[2],
        lineHeight: 1.3,
    };

    const descriptionStyles: React.CSSProperties = {
        fontSize: '1rem',
        color: colors.neutral[500],
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
        backgroundColor: isSelected ? colors.primary[50] : colors.white,
        border: `2px solid ${isSelected ? colors.primary[500] : colors.neutral[200]}`,
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
        backgroundColor: isSelected ? colors.primary[100] : colors.neutral[100],
        borderRadius: borderRadius.lg,
        color: isSelected ? colors.primary[600] : colors.neutral[500],
        fontSize: '1.25rem',
    });

    const optionLabelStyles = (isSelected: boolean): React.CSSProperties => ({
        fontSize: '1rem',
        fontWeight: isSelected ? 600 : 500,
        color: isSelected ? colors.primary[700] : colors.neutral[700],
    });

    const radioStyles = (isSelected: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.25rem',
        height: '1.25rem',
        marginLeft: 'auto',
        borderRadius: borderRadius.full,
        border: `2px solid ${isSelected ? colors.primary[500] : colors.neutral[300]}`,
        backgroundColor: isSelected ? colors.primary[500] : colors.white,
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
                stroke={colors.white}
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
