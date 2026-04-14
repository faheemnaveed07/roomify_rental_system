import React from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, Calendar, DollarSign, Edit2
} from 'lucide-react';
import { IRoommateProfileResponse } from '../../types/roommate.types';
import { Link } from 'react-router-dom';

interface ProfileDisplayCardProps {
    profile: IRoommateProfileResponse;
    compact?: boolean;
    firstName?: string;
    lastName?: string;
}

const LABEL_MAP: Record<string, string> = {
    early_bird: '🌅 Early Bird',
    night_owl: '🌙 Night Owl',
    flexible: '🔄 Flexible',
    work_from_home: '🏠 WFH',
    office: '🏢 Office',
    hybrid: '🔀 Hybrid',
    student: '📚 Student',
    quiet: '🤫 Quiet',
    moderate: '💬 Moderate',
    social: '🎉 Social',
    non_smoker: '🚭 Non-Smoker',
    smoker: '🚬 Smoker',
    outdoor_only: '🌿 Outdoor Only',
    no_pets: '🐾 No Pets',
    has_pets: '🐕 Has Pets',
    loves_pets: '💕 Loves Pets',
    halal: '☪️ Halal',
    vegetarian: '🥦 Vegetarian',
    non_vegetarian: '🍗 Non-Veg',
    vegan: '🌱 Vegan',
    no_preference: 'Any',
    male: 'Male',
    female: 'Female',
    any: 'Any',
};

function formatLabel(val: string): string {
    return LABEL_MAP[val] ?? val.replace(/_/g, ' ');
}

function formatBudget(min: number, max: number, currency: string): string {
    const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
    return `${currency} ${fmt(min)} – ${fmt(max)}/mo`;
}

function getInitials(firstName?: string, lastName?: string, fallback = 'RP'): string {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.slice(0, 2).toUpperCase();
    return fallback;
}

const CLEANLINESS_LABELS = ['', 'Messy', 'Casual', 'Average', 'Tidy', 'Spotless'];

export const ProfileDisplayCard: React.FC<ProfileDisplayCardProps> = ({
    profile,
    compact = false,
    firstName,
    lastName,
}) => {
    const initials = getInitials(firstName, lastName);

    const chips = [
        formatLabel(profile.lifestyle.sleepSchedule),
        formatLabel(profile.lifestyle.workSchedule),
        formatLabel(profile.preferences.smokingPreference),
        formatLabel(profile.preferences.petPreference),
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden"
        >
            {/* Header gradient */}
            <div className="h-20 bg-gradient-to-br from-primary-600 via-primary-500 to-blue-400 relative">
                <div className="absolute inset-0 opacity-30"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.2\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                <Link
                    to="/roommate-profile"
                    className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 text-xs text-white font-semibold transition"
                >
                    <Edit2 size={12} />
                    Edit
                </Link>
            </div>

            <div className="px-5 pb-5">
                {/* Avatar */}
                <div className="-mt-10 mb-3 flex items-end justify-between">
                    <div className="h-20 w-20 rounded-2xl border-4 border-white bg-primary-600 flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl font-black">{initials}</span>
                    </div>
                    <div className="mb-1 flex flex-col items-end">
                        <span className="text-xs font-semibold text-slate-500 capitalize">
                            {profile.gender} · {profile.age} yrs
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{profile.occupation}</span>
                    </div>
                </div>

                {/* Name & bio */}
                {firstName && (
                    <h3 className="font-serif text-lg font-bold text-slate-900 mb-0.5">
                        {firstName} {lastName}
                    </h3>
                )}
                {profile.bio && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{profile.bio}</p>
                )}

                {/* Key stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
                        <DollarSign size={14} className="text-primary-500 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 truncate">
                            {formatBudget(profile.budget.min, profile.budget.max, profile.budget.currency)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
                        <Calendar size={14} className="text-primary-500 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 truncate">
                            {new Date(profile.moveInDate).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 col-span-2">
                        <MapPin size={14} className="text-primary-500 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 truncate">
                            {profile.preferredLocations.slice(0, 3).join(', ')}
                        </span>
                    </div>
                </div>

                {/* Lifestyle chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {chips.map((chip) => (
                        <span
                            key={chip}
                            className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 border border-primary-100"
                        >
                            {chip}
                        </span>
                    ))}
                </div>

                {!compact && (
                    <>
                        {/* Cleanliness */}
                        <div className="mb-3">
                            <div className="flex justify-between mb-1">
                                <span className="text-xs text-slate-500 font-medium">Cleanliness</span>
                                <span className="text-xs font-bold text-slate-700">
                                    {CLEANLINESS_LABELS[profile.lifestyle.cleanlinessLevel]}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <div
                                        key={n}
                                        className="h-1.5 flex-1 rounded-full transition-colors"
                                        style={{
                                            backgroundColor:
                                                n <= profile.lifestyle.cleanlinessLevel
                                                    ? '#2563EB'
                                                    : '#E5E7EB',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Interests */}
                        {profile.interests.length > 0 && (
                            <div>
                                <p className="text-xs text-slate-400 font-medium mb-1.5">Interests</p>
                                <div className="flex flex-wrap gap-1">
                                    {profile.interests.slice(0, 5).map((interest) => (
                                        <span
                                            key={interest}
                                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-slate-600"
                                        >
                                            {interest}
                                        </span>
                                    ))}
                                    {profile.interests.length > 5 && (
                                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-slate-400">
                                            +{profile.interests.length - 5}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default ProfileDisplayCard;
