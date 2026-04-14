import React, { useState, useEffect, KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    ChevronRight, ChevronLeft, Check, User, MapPin,
    Coffee, Heart, X, Loader2, Sparkles, BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { roommateProfileService } from '../services/api';
import { IRoommateProfileForm } from '../types/roommate.types';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const roommateProfileSchema = z.object({
    bio: z.string().max(500, 'Max 500 characters'),
    occupation: z.string().min(1, 'Occupation is required').max(100),
    age: z.number().int().min(18, 'Must be at least 18').max(100, 'Max age is 100'),
    gender: z.enum(['male', 'female', 'other']),
    moveInDate: z.string().min(1, 'Move-in date is required'),
    budget: z.object({
        min: z.number().min(0, 'Min budget required'),
        max: z.number().min(0, 'Max budget required'),
        currency: z.string(),
    }).refine((d) => d.max >= d.min, { message: 'Max must be ≥ Min', path: ['max'] }),
    preferredLocations: z.array(z.string()).min(1, 'Add at least one location'),
    lifestyle: z.object({
        sleepSchedule: z.enum(['early_bird', 'night_owl', 'flexible']),
        workSchedule: z.enum(['work_from_home', 'office', 'hybrid', 'student']),
        cleanlinessLevel: z.number().int().min(1).max(5),
        noiseLevel: z.enum(['quiet', 'moderate', 'social']),
        guestsFrequency: z.enum(['never', 'rarely', 'sometimes', 'often']),
        cookingFrequency: z.enum(['never', 'rarely', 'sometimes', 'daily']),
    }),
    preferences: z.object({
        smokingPreference: z.enum(['smoker', 'non_smoker', 'outdoor_only', 'no_preference']),
        petPreference: z.enum(['has_pets', 'loves_pets', 'no_pets', 'no_preference']),
        dietaryPreference: z.enum(['vegetarian', 'non_vegetarian', 'vegan', 'halal', 'no_preference']),
        genderPreference: z.enum(['male', 'female', 'any']),
        ageRangePreference: z.object({
            min: z.number().int().min(18),
            max: z.number().int().max(100),
        }),
    }),
    interests: z.array(z.string()),
    languages: z.array(z.string()),
});

type FormValues = z.infer<typeof roommateProfileSchema>;

// ─── Step fields for validation ───────────────────────────────────────────────
const STEP_FIELDS: (keyof FormValues)[][] = [
    ['bio', 'occupation', 'age', 'gender', 'moveInDate'],
    ['budget', 'preferredLocations'],
    ['lifestyle'],
    ['preferences', 'interests', 'languages'],
];

const STEPS = [
    { title: 'Basic Info', icon: User, description: 'Tell us about yourself' },
    { title: 'Budget & Location', icon: MapPin, description: 'Rent range and preferred areas' },
    { title: 'Lifestyle', icon: Coffee, description: 'Your daily habits and routine' },
    { title: 'Preferences', icon: Heart, description: 'Who you\'d like to live with' },
] as const;

const DEFAULT_VALUES: FormValues = {
    bio: '',
    occupation: '',
    age: 22,
    gender: 'male',
    moveInDate: '',
    budget: { min: 10000, max: 30000, currency: 'PKR' },
    preferredLocations: [],
    lifestyle: {
        sleepSchedule: 'flexible',
        workSchedule: 'office',
        cleanlinessLevel: 3,
        noiseLevel: 'moderate',
        guestsFrequency: 'rarely',
        cookingFrequency: 'sometimes',
    },
    preferences: {
        smokingPreference: 'no_preference',
        petPreference: 'no_preference',
        dietaryPreference: 'no_preference',
        genderPreference: 'any',
        ageRangePreference: { min: 18, max: 40 },
    },
    interests: [],
    languages: ['Urdu'],
};

// ─── Reusable UI primitives ───────────────────────────────────────────────────

interface SelectCardProps {
    value: string;
    current: string;
    label: string;
    onClick: () => void;
}
const SelectCard: React.FC<SelectCardProps> = ({ value, current, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all text-center select-none',
            current === value
                ? 'border-primary bg-primary/5 text-primary font-semibold shadow-sm'
                : 'border-border bg-background text-slate-600 hover:border-primary/40 hover:bg-slate-50',
        )}
    >
        {label}
    </button>
);

interface TagInputProps {
    tags: string[];
    onAdd: (tag: string) => void;
    onRemove: (index: number) => void;
    placeholder: string;
    error?: string;
}
const TagInput: React.FC<TagInputProps> = ({ tags, onAdd, onRemove, placeholder, error }) => {
    const [inputVal, setInputVal] = useState('');
    const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && inputVal.trim()) {
            e.preventDefault();
            onAdd(inputVal.trim());
            setInputVal('');
        }
    };
    return (
        <div>
            <div
                className={cn(
                    'flex flex-wrap gap-1.5 min-h-[46px] rounded-lg border px-3 py-2 bg-background transition-colors',
                    error
                        ? 'border-destructive'
                        : 'border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                )}
            >
                {tags.map((tag, i) => (
                    <Badge key={`${tag}-${i}`} variant="secondary" className="gap-1 pr-1 text-xs h-6">
                        {tag}
                        <button
                            type="button"
                            onClick={() => onRemove(i)}
                            className="ml-0.5 hover:text-destructive transition-colors"
                        >
                            <X size={10} />
                        </button>
                    </Badge>
                ))}
                <input
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={tags.length === 0 ? placeholder : 'Add more…'}
                    className="flex-1 min-w-[120px] bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                />
            </div>
            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
            <p className="mt-1 text-xs text-muted-foreground">Press Enter or comma to add</p>
        </div>
    );
};

// ─── Step prop interface ──────────────────────────────────────────────────────

interface StepProps {
    control: ReturnType<typeof useForm<FormValues>>['control'];
    watch: ReturnType<typeof useForm<FormValues>>['watch'];
    setValue: ReturnType<typeof useForm<FormValues>>['setValue'];
    errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
    register: ReturnType<typeof useForm<FormValues>>['register'];
}

// ─── Step 1 — Basic Info ──────────────────────────────────────────────────────

const Step1BasicInfo: React.FC<StepProps> = ({ register, errors, setValue, watch }) => {
    const gender = watch('gender');
    const bio = watch('bio') ?? '';

    return (
        <div className="space-y-5">
            {/* Bio */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-slate-700">
                        About Me{' '}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <span className={cn('text-xs tabular-nums', bio.length > 450 ? 'text-amber-500 font-semibold' : 'text-muted-foreground')}>
                        {bio.length}/500
                    </span>
                </div>
                <Textarea
                    {...register('bio')}
                    rows={3}
                    placeholder="I'm a working professional looking for a clean, quiet place to stay…"
                    className="resize-none"
                />
                {errors.bio && <p className="mt-1 text-xs text-destructive">{errors.bio.message}</p>}
            </div>

            {/* Occupation + Age */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Occupation *</label>
                    <Input {...register('occupation')} placeholder="e.g. Software Engineer" />
                    {errors.occupation && (
                        <p className="text-xs text-destructive">{errors.occupation.message}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Age *</label>
                    <Input
                        {...register('age', { valueAsNumber: true })}
                        type="number"
                        min={18}
                        max={100}
                        placeholder="22"
                    />
                    {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
                </div>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Gender *</label>
                <div className="grid grid-cols-3 gap-2">
                    {(
                        [
                            { k: 'male', label: '♂ Male' },
                            { k: 'female', label: '♀ Female' },
                            { k: 'other', label: '⚧ Other' },
                        ] as const
                    ).map(({ k, label }) => (
                        <SelectCard key={k} value={k} current={gender} label={label} onClick={() => setValue('gender', k)} />
                    ))}
                </div>
                {errors.gender && <p className="mt-1 text-xs text-destructive">{errors.gender.message}</p>}
            </div>

            {/* Move-in date */}
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Preferred Move-In Date *</label>
                <Input {...register('moveInDate')} type="date" min={new Date().toISOString().split('T')[0]} />
                {errors.moveInDate && (
                    <p className="text-xs text-destructive">{errors.moveInDate.message}</p>
                )}
            </div>
        </div>
    );
};

const Step2BudgetLocation: React.FC<StepProps> = ({ errors, watch, setValue }) => {
    const budgetMin = watch('budget.min') ?? 10000;
    const budgetMax = watch('budget.max') ?? 30000;
    const locations = watch('preferredLocations') ?? [];

    const fmt = (n: number) =>
        n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : String(n);

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Monthly Budget Range (PKR) *
                </label>
                <p className="text-xs text-slate-400 mb-5">Drag the handles to set your min and max budget</p>

                <Slider
                    min={0}
                    max={500000}
                    step={5000}
                    value={[budgetMin, budgetMax]}
                    onValueChange={(vals) => {
                        setValue('budget.min', vals[0], { shouldValidate: true });
                        setValue('budget.max', vals[1], { shouldValidate: true });
                    }}
                    className="mb-5"
                />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Minimum</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">PKR</span>
                            <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={budgetMin}
                                onChange={(e) =>
                                    setValue('budget.min', Number(e.target.value), { shouldValidate: true })
                                }
                                className="pl-11 font-semibold"
                            />
                        </div>
                        {errors.budget?.min && (
                            <p className="mt-1 text-xs text-red-500">{errors.budget.min.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Maximum</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">PKR</span>
                            <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={budgetMax}
                                onChange={(e) =>
                                    setValue('budget.max', Number(e.target.value), { shouldValidate: true })
                                }
                                className="pl-11 font-semibold"
                            />
                        </div>
                        {errors.budget?.max && (
                            <p className="mt-1 text-xs text-red-500">{errors.budget.max.message}</p>
                        )}
                    </div>
                </div>

                <div className="mt-4 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between">
                    <Badge variant="secondary" className="text-primary font-bold">
                        PKR {fmt(budgetMin)}
                    </Badge>
                    <span className="text-xs text-slate-400 font-medium">to</span>
                    <Badge variant="secondary" className="text-primary font-bold">
                        PKR {fmt(budgetMax)}
                    </Badge>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Preferred Locations *
                </label>
                <p className="text-xs text-slate-400 mb-2">
                    Add areas in Multan or other cities (e.g. Gulshan Iqbal, DHA Multan)
                </p>
                <TagInput
                    tags={locations}
                    onAdd={(tag) => setValue('preferredLocations', [...locations, tag])}
                    onRemove={(i) =>
                        setValue('preferredLocations', locations.filter((_, idx) => idx !== i))
                    }
                    placeholder="Type an area and press Enter…"
                    error={errors.preferredLocations?.message}
                />
            </div>
        </div>
    );
};

const LIFESTYLE_OPTIONS = {
    sleepSchedule: [
        { value: 'early_bird', label: '🌅 Early Bird' },
        { value: 'night_owl', label: '🌙 Night Owl' },
        { value: 'flexible', label: '🔄 Flexible' },
    ],
    workSchedule: [
        { value: 'work_from_home', label: '🏠 Work From Home' },
        { value: 'office', label: '🏢 Office' },
        { value: 'hybrid', label: '🔀 Hybrid' },
        { value: 'student', label: '📚 Student' },
    ],
    noiseLevel: [
        { value: 'quiet', label: '🤫 Quiet' },
        { value: 'moderate', label: '💬 Moderate' },
        { value: 'social', label: '🎉 Social' },
    ],
    guestsFrequency: [
        { value: 'never', label: 'Never' },
        { value: 'rarely', label: 'Rarely' },
        { value: 'sometimes', label: 'Sometimes' },
        { value: 'often', label: 'Often' },
    ],
    cookingFrequency: [
        { value: 'never', label: 'Never' },
        { value: 'rarely', label: 'Rarely' },
        { value: 'sometimes', label: 'Sometimes' },
        { value: 'daily', label: 'Daily' },
    ],
} as const;

const LIFESTYLE_FIELD_LABELS: Record<keyof typeof LIFESTYLE_OPTIONS, string> = {
    sleepSchedule: 'Sleep Schedule',
    workSchedule: 'Work Schedule',
    noiseLevel: 'Noise Level',
    guestsFrequency: 'Guests Frequency',
    cookingFrequency: 'Cooking Frequency',
};

const CLEANLINESS_LABELS = ['', '😅 Messy', '😐 Casual', '😊 Average', '🧹 Tidy', '✨ Spotless'];

const Step3Lifestyle: React.FC<StepProps> = ({ watch, setValue }) => {
    const lifestyle = watch('lifestyle');

    return (
        <div className="space-y-5">
            {(Object.keys(LIFESTYLE_OPTIONS) as (keyof typeof LIFESTYLE_OPTIONS)[]).map((field) => (
                <div key={field}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        {LIFESTYLE_FIELD_LABELS[field]}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {LIFESTYLE_OPTIONS[field].map((opt) => (
                            <SelectCard
                                key={opt.value}
                                value={opt.value}
                                current={String(lifestyle[field])}
                                label={opt.label}
                                onClick={() => setValue(`lifestyle.${field}`, opt.value as never)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-slate-700">Cleanliness Level</label>
                    <Badge variant="secondary" className="text-sm font-semibold">
                        {CLEANLINESS_LABELS[lifestyle.cleanlinessLevel]}
                    </Badge>
                </div>
                <div className="rounded-xl border border-border p-4 bg-slate-50">
                    <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[lifestyle.cleanlinessLevel]}
                        onValueChange={(vals) =>
                            setValue('lifestyle.cleanlinessLevel', vals[0] as 1 | 2 | 3 | 4 | 5)
                        }
                    />
                    <div className="flex justify-between mt-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} className="text-xs text-slate-400">{n}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PREF_OPTIONS = {
    smokingPreference: [
        { value: 'non_smoker', label: '🚭 Non-Smoker' },
        { value: 'outdoor_only', label: '🌿 Outdoor Only' },
        { value: 'smoker', label: '🚬 Smoker' },
        { value: 'no_preference', label: '— Any' },
    ],
    petPreference: [
        { value: 'no_pets', label: '🐾 No Pets' },
        { value: 'loves_pets', label: '💕 Loves Pets' },
        { value: 'has_pets', label: '🐕 Has Pets' },
        { value: 'no_preference', label: '— Any' },
    ],
    dietaryPreference: [
        { value: 'halal', label: '☪️ Halal' },
        { value: 'vegetarian', label: '🥦 Vegetarian' },
        { value: 'vegan', label: '🌱 Vegan' },
        { value: 'non_vegetarian', label: '🍗 Non-Veg' },
        { value: 'no_preference', label: '— Any' },
    ],
    genderPreference: [
        { value: 'male', label: '♂ Male only' },
        { value: 'female', label: '♀ Female only' },
        { value: 'any', label: '⚥ Any gender' },
    ],
};

const PREF_FIELD_LABELS: Record<keyof typeof PREF_OPTIONS, string> = {
    smokingPreference: 'Smoking Preference',
    petPreference: 'Pet Preference',
    dietaryPreference: 'Dietary Preference',
    genderPreference: 'Gender Preference',
};

const Step4Preferences: React.FC<StepProps> = ({ watch, setValue, register }) => {
    const prefs = watch('preferences');
    const interests = watch('interests') ?? [];
    const languages = watch('languages') ?? [];

    return (
        <div className="space-y-5">
            {(Object.keys(PREF_OPTIONS) as (keyof typeof PREF_OPTIONS)[]).map((field) => (
                <div key={field}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        {PREF_FIELD_LABELS[field]}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PREF_OPTIONS[field].map((opt) => (
                            <SelectCard
                                key={opt.value}
                                value={opt.value}
                                current={String(prefs[field])}
                                label={opt.label}
                                onClick={() => setValue(`preferences.${field}`, opt.value as never)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred Age Range</label>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Min age</label>
                        <Input
                            {...register('preferences.ageRangePreference.min', { valueAsNumber: true })}
                            type="number"
                            min={18}
                            max={99}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Max age</label>
                        <Input
                            {...register('preferences.ageRangePreference.max', { valueAsNumber: true })}
                            type="number"
                            min={19}
                            max={100}
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Interests <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <TagInput
                    tags={interests}
                    onAdd={(t) => setValue('interests', [...interests, t])}
                    onRemove={(i) => setValue('interests', interests.filter((_, idx) => idx !== i))}
                    placeholder="e.g. Gaming, Reading, Cricket…"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Languages Spoken</label>
                <TagInput
                    tags={languages}
                    onAdd={(t) => setValue('languages', [...languages, t])}
                    onRemove={(i) => setValue('languages', languages.filter((_, idx) => idx !== i))}
                    placeholder="e.g. Urdu, English, Punjabi…"
                />
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const RoommateProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);

    const { data: profileData, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['roommateProfile'],
        queryFn: roommateProfileService.getProfile,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
    const hasProfile = !!profileData;

    const { register, control, handleSubmit, watch, setValue, trigger, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(roommateProfileSchema),
        defaultValues: DEFAULT_VALUES,
        mode: 'onChange',
    });

    useEffect(() => {
        if (profileData) {
            reset({
                bio: profileData.bio ?? '',
                occupation: profileData.occupation,
                age: profileData.age,
                gender: profileData.gender,
                moveInDate: profileData.moveInDate ? profileData.moveInDate.split('T')[0] : '',
                budget: profileData.budget,
                preferredLocations: profileData.preferredLocations,
                lifestyle: profileData.lifestyle,
                preferences: profileData.preferences,
                interests: profileData.interests,
                languages: profileData.languages,
            });
        }
    }, [profileData, reset]);

    const createMutation = useMutation({
        mutationFn: (data: IRoommateProfileForm) => roommateProfileService.createProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roommateProfile'] });
            toast.success('Profile created! Finding your matches…');
            navigate('/roommate-matches');
        },
        onError: () => {
            toast.error('Could not create profile. Please try again.');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: IRoommateProfileForm) => roommateProfileService.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roommateProfile'] });
            toast.success('Profile updated successfully!');
            navigate('/roommate-matches');
        },
        onError: () => {
            toast.error('Could not update profile. Please try again.');
        },
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const stepProps: StepProps = { register, control, watch, setValue, errors };

    const handleNext = async () => {
        const fieldsToValidate = STEP_FIELDS[step] as Parameters<typeof trigger>[0];
        const valid = await trigger(fieldsToValidate);
        if (!valid) {
            toast.error('Please complete all required fields before continuing.');
            return;
        }
        setDirection(1);
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    const handleBack = () => {
        setDirection(-1);
        setStep((s) => Math.max(s - 1, 0));
    };

    const onSubmit = handleSubmit((data: FormValues) => {
        const payload = data as IRoommateProfileForm;
        if (hasProfile) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    });

    const progressPct = ((step + 1) / STEPS.length) * 100;
    const StepComponent = [Step1BasicInfo, Step2BudgetLocation, Step3Lifestyle, Step4Preferences][step];

    if (isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-slate-500 font-medium">Loading your profile…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 py-10 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-4">
                        <Sparkles size={14} />
                        {hasProfile ? 'Edit Profile' : 'Create Profile'}
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">
                        {hasProfile ? 'Update Your Roommate Profile' : 'Find Your Perfect Roommate Match'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {hasProfile
                            ? 'Keep your preferences up to date for better matches'
                            : 'Complete your profile to get AI-powered roommate matches'}
                    </p>
                </motion.div>

                {/* Progress bar */}
                <Progress value={progressPct} className="mb-6 h-1.5" />

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const isCompleted = i < step;
                        const isCurrent = i === step;
                        return (
                            <React.Fragment key={s.title}>
                                <motion.div
                                    animate={{
                                        scale: isCurrent ? 1.1 : 1,
                                        backgroundColor: isCompleted ? '#16a34a' : isCurrent ? 'hsl(var(--primary))' : '#E5E7EB',
                                    }}
                                    className="relative flex h-9 w-9 items-center justify-center rounded-full shadow-sm"
                                >
                                    {isCurrent && (
                                        <motion.span
                                            layoutId="step-ring"
                                            className="absolute inset-0 rounded-full ring-2 ring-primary ring-offset-2"
                                        />
                                    )}
                                    {isCompleted ? (
                                        <Check size={16} className="text-white" />
                                    ) : (
                                        <Icon size={16} className={isCurrent ? 'text-white' : 'text-slate-400'} />
                                    )}
                                </motion.div>
                                {i < STEPS.length - 1 && (
                                    <div className="h-0.5 w-8 sm:w-12 rounded-full overflow-hidden bg-slate-200">
                                        <motion.div
                                            className="h-full bg-primary"
                                            animate={{ width: i < step ? '100%' : '0%' }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                >
                    {/* Step header */}
                    <div className="border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                {React.createElement(STEPS[step].icon, { size: 20, className: 'text-primary' })}
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Step {step + 1} of {STEPS.length}: {STEPS[step].title}
                                </h2>
                                <p className="text-xs text-slate-400">{STEPS[step].description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Step content */}
                    <form onSubmit={onSubmit}>
                        <div className="px-6 py-6 min-h-[400px] overflow-hidden relative">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={step}
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                >
                                    <StepComponent {...stepProps} />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer navigation */}
                        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={step === 0}
                                className="flex items-center gap-2"
                            >
                                <ChevronLeft size={16} />
                                Back
                            </Button>

                            {step < STEPS.length - 1 ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex items-center gap-2"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving…
                                        </>
                                    ) : (
                                        <>
                                            <BadgeCheck size={16} />
                                            {hasProfile ? 'Save Changes' : 'Create Profile'}
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </form>
                </motion.div>

                {/* Step labels */}
                <div className="flex justify-center mt-4 gap-8">
                    {STEPS.map((s, i) => (
                        <span
                            key={s.title}
                            className={`text-xs font-medium transition-colors ${
                                i === step ? 'text-primary' : i < step ? 'text-green-600' : 'text-slate-400'
                            }`}
                        >
                            {s.title}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoommateProfilePage;
