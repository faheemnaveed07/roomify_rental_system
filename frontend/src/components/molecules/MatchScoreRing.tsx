import React from 'react';
import { motion } from 'framer-motion';
import { IScoreBreakdown } from '../../types/roommate.types';

interface MatchScoreRingProps {
    score: number;
    breakdown?: IScoreBreakdown[];
    size?: 'sm' | 'md' | 'lg';
    showBreakdown?: boolean;
    label?: string;
}

const SIZE_MAP = {
    sm: { r: 28, cx: 36, cy: 36, svgSize: 72, stroke: 5, fontSize: '0.75rem', labelSize: '0.6rem' },
    md: { r: 40, cx: 52, cy: 52, svgSize: 104, stroke: 7, fontSize: '1rem', labelSize: '0.7rem' },
    lg: { r: 56, cx: 68, cy: 68, svgSize: 136, stroke: 9, fontSize: '1.25rem', labelSize: '0.75rem' },
};

function getScoreColor(score: number): string {
    if (score >= 80) return '#16a34a';  // green-700
    if (score >= 60) return '#d97706';  // amber-600
    return '#dc2626';                    // red-600
}

function getScoreBg(score: number): string {
    if (score >= 80) return '#dcfce7';  // green-100
    if (score >= 60) return '#fef9c3';  // yellow-100
    return '#fee2e2';                    // red-100
}

function getScoreLabel(score: number): string {
    if (score >= 80) return 'Great Match';
    if (score >= 60) return 'Good Match';
    return 'Low Match';
}

const CATEGORY_ICONS: Record<string, string> = {
    budget: '💰',
    location: '📍',
    lifestyle: '🏠',
    preferences: '✅',
    schedule: '🗓️',
    default: '📊',
};

export const MatchScoreRing: React.FC<MatchScoreRingProps> = ({
    score,
    breakdown,
    size = 'md',
    showBreakdown = false,
    label,
}) => {
    const cfg = SIZE_MAP[size];
    const circumference = 2 * Math.PI * cfg.r;
    const clampedScore = Math.min(100, Math.max(0, score));
    const offset = circumference - (clampedScore / 100) * circumference;
    const color = getScoreColor(clampedScore);
    const bg = getScoreBg(clampedScore);

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Ring */}
            <div
                className="relative flex items-center justify-center rounded-full"
                style={{ width: cfg.svgSize, height: cfg.svgSize, backgroundColor: bg }}
            >
                <svg
                    width={cfg.svgSize}
                    height={cfg.svgSize}
                    className="absolute inset-0 -rotate-90"
                    aria-hidden="true"
                >
                    {/* Track */}
                    <circle
                        cx={cfg.cx}
                        cy={cfg.cy}
                        r={cfg.r}
                        fill="none"
                        stroke="rgba(0,0,0,0.06)"
                        strokeWidth={cfg.stroke}
                    />
                    {/* Progress */}
                    <motion.circle
                        cx={cfg.cx}
                        cy={cfg.cy}
                        r={cfg.r}
                        fill="none"
                        stroke={color}
                        strokeWidth={cfg.stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </svg>
                <motion.div
                    className="z-10 flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                >
                    <span
                        className="font-black leading-none"
                        style={{ fontSize: cfg.fontSize, color }}
                    >
                        {clampedScore}%
                    </span>
                    {size !== 'sm' && (
                        <span
                            className="font-semibold text-center leading-tight mt-0.5"
                            style={{ fontSize: cfg.labelSize, color }}
                        >
                            {label ?? getScoreLabel(clampedScore)}
                        </span>
                    )}
                </motion.div>
            </div>

            {/* Breakdown bars */}
            {showBreakdown && breakdown && breakdown.length > 0 && (
                <motion.div
                    className="w-full space-y-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                >
                    {breakdown.map((item, i) => (
                        <div key={item.category} className="space-y-0.5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 capitalize font-medium flex items-center gap-1">
                                    <span>{CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS.default}</span>
                                    {item.category}
                                </span>
                                <span className="text-xs font-bold" style={{ color: getScoreColor(item.score) }}>
                                    {Math.round(item.score)}%
                                </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: getScoreColor(item.score) }}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${item.score}%` }}
                                    transition={{ delay: 0.6 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default MatchScoreRing;
