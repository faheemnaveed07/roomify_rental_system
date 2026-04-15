import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Sparkles, SlidersHorizontal, Search, MapPin, Home, RefreshCw,
    ArrowRight, ChevronLeft, ChevronRight, Loader2, UserCheck,
    SearchX, ChevronDown,
} from 'lucide-react';
import { matchingService, roommateProfileService, ASSETS_URL } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { IProperty } from '@shared/types';
import { PropertyType } from '@shared/types';
import { IPropertyCompatibilityScore } from '../types/roommate.types';
import ProfileDisplayCard from '../components/molecules/ProfileDisplayCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScoredProperty {
    property: IProperty;
    score: IPropertyCompatibilityScore | undefined;
}

interface Filters {
    city: string;
    propertyType: string;
    minPrice: string;
    maxPrice: string;
}

const EMPTY_FILTERS: Filters = { city: '', propertyType: '', minPrice: '', maxPrice: '' };
const LIMIT = 12;

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden animate-pulse">
        <div className="h-44 bg-slate-100" />
        <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="space-y-1.5">
                <div className="h-2 bg-slate-100 rounded" />
                <div className="h-2 bg-slate-100 rounded w-5/6" />
                <div className="h-2 bg-slate-100 rounded w-4/5" />
            </div>
            <div className="flex items-center justify-between pt-1">
                <div className="h-5 bg-slate-100 rounded w-20" />
                <div className="h-7 bg-slate-100 rounded-xl w-16" />
            </div>
        </div>
    </div>
);

// ─── No Profile CTA ────────────────────────────────────────────────────────────

const NoProfileCTA: React.FC = () => {
    const navigate = useNavigate();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center max-w-lg mx-auto py-20 px-4"
        >
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-xl mb-6">
                <Sparkles size={40} className="text-white" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 mb-3">
                Get AI-Matched Properties
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
                Create your roommate profile to unlock compatibility scores and see properties
                that actually fit your lifestyle, budget, and preferences.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                    onClick={() => navigate('/roommate-profile')}
                    className="flex items-center gap-2 rounded-2xl px-8 py-3.5 font-bold"
                    size="lg"
                >
                    <UserCheck size={18} />
                    Create My Profile
                    <ArrowRight size={16} />
                </Button>
                <Button
                    variant="outline"
                    onClick={() => navigate('/browse')}
                    className="rounded-2xl px-6"
                    size="lg"
                >
                    Browse Without Matching
                </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-8">
                {['Budget Matching', 'Location Fit', 'Lifestyle Score', 'Preference Analysis'].map((f) => (
                    <Badge key={f} variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
                        ✓ {f}
                    </Badge>
                ))}
            </div>
        </motion.div>
    );
};

// ─── Filter Bar ──────────────────────────────────────────────────────────────

interface FilterBarProps {
    pending: Filters;
    onChange: (f: Filters) => void;
    onApply: () => void;
    loading: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ pending, onChange, onApply, loading }) => {
    const [isOpen, setIsOpen] = useState(false);
    const set = (key: keyof Filters, val: string) => onChange({ ...pending, [key]: val });
    const activeCount = [pending.city, pending.propertyType, pending.minPrice, pending.maxPrice].filter(Boolean).length;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Mobile toggle header */}
            <div className="flex sm:hidden items-center justify-between px-3 py-2.5">
                <button
                    type="button"
                    onClick={() => setIsOpen((v) => !v)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                    <SlidersHorizontal size={15} className="text-slate-400" />
                    Filters
                    {activeCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
                            {activeCount}
                        </Badge>
                    )}
                    <ChevronDown
                        size={14}
                        className={cn('text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')}
                    />
                </button>
                <Button onClick={onApply} disabled={loading} size="sm" className="rounded-xl gap-1.5">
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                    Search
                </Button>
            </div>

            {/* Mobile collapsible filter body */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="mobile-filters"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="sm:hidden overflow-hidden border-t border-slate-100"
                    >
                        <div className="flex flex-col gap-3 p-3">
                            <div className="flex items-center gap-2 rounded-xl border border-input px-3 py-2 focus-within:ring-2 focus-within:ring-ring transition">
                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                <input
                                    value={pending.city}
                                    onChange={(e) => set('city', e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onApply()}
                                    placeholder="City or area…"
                                    className="text-sm outline-none w-full text-slate-700 placeholder:text-muted-foreground bg-transparent"
                                />
                            </div>
                            <Select
                                value={pending.propertyType || 'all'}
                                onValueChange={(v) => set('propertyType', v === 'all' ? '' : v)}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="shared_room">Shared Room</SelectItem>
                                    <SelectItem value="full_house">Full House</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 rounded-xl border border-input px-3 py-2 flex-1 focus-within:ring-2 focus-within:ring-ring transition">
                                    <span className="text-xs text-muted-foreground">PKR</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={1000}
                                        value={pending.minPrice}
                                        onChange={(e) => set('minPrice', e.target.value)}
                                        placeholder="Min"
                                        className="w-full text-sm outline-none text-slate-700 bg-transparent"
                                    />
                                </div>
                                <span className="text-slate-300 text-sm">–</span>
                                <div className="flex items-center gap-1.5 rounded-xl border border-input px-3 py-2 flex-1 focus-within:ring-2 focus-within:ring-ring transition">
                                    <input
                                        type="number"
                                        min={0}
                                        step={1000}
                                        value={pending.maxPrice}
                                        onChange={(e) => set('maxPrice', e.target.value)}
                                        placeholder="Max"
                                        className="w-full text-sm outline-none text-slate-700 bg-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop filter bar — always visible */}
            <div className="hidden sm:flex flex-wrap gap-3 items-center p-3">
                <SlidersHorizontal size={16} className="text-slate-400 ml-1 shrink-0" />
                <div className="flex items-center gap-2 rounded-xl border border-input px-3 py-2 flex-1 min-w-[140px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 transition">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <input
                        value={pending.city}
                        onChange={(e) => set('city', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onApply()}
                        placeholder="City or area…"
                        className="text-sm outline-none w-full text-slate-700 placeholder:text-muted-foreground bg-transparent"
                    />
                </div>
                <Select
                    value={pending.propertyType || 'all'}
                    onValueChange={(v) => set('propertyType', v === 'all' ? '' : v)}
                >
                    <SelectTrigger className="w-[140px] rounded-xl">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="shared_room">Shared Room</SelectItem>
                        <SelectItem value="full_house">Full House</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1.5 rounded-xl border border-input px-3 py-2 focus-within:ring-2 focus-within:ring-ring transition">
                        <span className="text-xs text-muted-foreground">PKR</span>
                        <input
                            type="number"
                            min={0}
                            step={1000}
                            value={pending.minPrice}
                            onChange={(e) => set('minPrice', e.target.value)}
                            placeholder="Min"
                            className="w-16 text-sm outline-none text-slate-700 bg-transparent"
                        />
                    </div>
                    <span className="text-slate-300 text-sm font-light">–</span>
                    <div className="flex items-center gap-1.5 rounded-xl border border-input px-3 py-2 focus-within:ring-2 focus-within:ring-ring transition">
                        <input
                            type="number"
                            min={0}
                            step={1000}
                            value={pending.maxPrice}
                            onChange={(e) => set('maxPrice', e.target.value)}
                            placeholder="Max"
                            className="w-16 text-sm outline-none text-slate-700 bg-transparent"
                        />
                    </div>
                </div>
                <Button onClick={onApply} disabled={loading} className="rounded-xl gap-2" size="sm">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    Search
                </Button>
            </div>
        </div>
    );
};

// ─── Property Match Card ───────────────────────────────────────────────────────

interface PropertyMatchCardProps {
    property: IProperty;
    score?: IPropertyCompatibilityScore;
    rank: number;
}

const PropertyMatchCard: React.FC<PropertyMatchCardProps> = ({ property, score, rank }) => {
    const navigate = useNavigate();
    const overallScore = score ? Math.round(score.overallScore) : undefined;
    const isBestMatch = rank === 0 && overallScore !== undefined && overallScore >= 70;

    const imageUrl = property.images?.[0]?.url
        ? property.images[0].url.startsWith('/uploads/')
            ? `${ASSETS_URL}${property.images[0].url}`
            : property.images[0].url
        : undefined;

    const scoreColor =
        overallScore === undefined ? ''
        : overallScore >= 80 ? 'text-green-700 bg-green-50 border-green-200'
        : overallScore >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-red-600 bg-red-50 border-red-200';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ delay: Math.min(rank * 0.04, 0.3) }}
            className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
        >
            {/* Image */}
            <div className="relative h-44 bg-slate-100 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={property.title}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <Home size={32} className="text-slate-300" />
                    </div>
                )}

                {overallScore !== undefined && (
                    <div className="absolute top-3 right-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border backdrop-blur-sm bg-white/90 ${scoreColor}`}>
                            {overallScore}%
                        </span>
                    </div>
                )}

                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <Badge
                        variant={property.propertyType === 'shared_room' ? 'default' : 'secondary'}
                        className="rounded-full text-[11px] font-bold px-2.5"
                    >
                        {property.propertyType === 'shared_room' ? 'Shared' : 'Full House'}
                    </Badge>
                    {isBestMatch && (
                        <Badge className="rounded-full text-[11px] font-bold px-2.5 bg-violet-600 hover:bg-violet-600">
                            <Sparkles size={9} className="mr-1" />
                            Best Match
                        </Badge>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-0.5 line-clamp-1">
                    {property.title}
                </h3>
                <p className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                    <MapPin size={11} />
                    {property.location.area}, {property.location.city}
                </p>

                {/* Overall compatibility */}
                {overallScore !== undefined && (
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-slate-500 font-medium">Compatibility</span>
                            <Badge className={`text-[10px] font-bold px-2 py-0 border ${scoreColor}`}>
                                {overallScore}% Match
                            </Badge>
                        </div>
                        <Progress value={overallScore} className="h-1.5" />
                    </div>
                )}

                {/* Score breakdown mini bars */}
                {score && score.breakdown.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                        {score.breakdown.slice(0, 3).map((b) => (
                            <div key={b.category} className="flex items-center gap-2">
                                <span className="w-16 text-[10px] text-slate-400 capitalize shrink-0">
                                    {b.category}
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${b.score}%`,
                                            backgroundColor:
                                                b.score >= 80 ? '#16a34a'
                                                : b.score >= 60 ? '#d97706'
                                                : '#dc2626',
                                        }}
                                    />
                                </div>
                                <span className="text-[10px] font-semibold text-slate-500 w-7 text-right">
                                    {Math.round(b.score)}%
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center mt-1">
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-lg font-black text-primary">
                            PKR {property.rent.amount >= 1000
                                ? `${(property.rent.amount / 1000).toFixed(0)}K`
                                : property.rent.amount}
                        </span>
                        <span className="text-xs text-slate-400">/mo</span>
                    </div>
                </div>

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/property/${String(property._id)}`)}
                    className="w-full mt-3 rounded-xl gap-1.5 text-xs font-semibold"
                >
                    View Property
                    <ArrowRight size={12} />
                </Button>
            </div>
        </motion.div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const RoommateMatchesPage: React.FC = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const [pendingFilters, setPendingFilters] = useState<Filters>(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
    const [page, setPage] = useState(1);
    const [showProfile, setShowProfile] = useState(false);

    // ── Profile query ──
    const { data: profileData, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['roommateProfile'],
        queryFn: roommateProfileService.getProfile,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
    const hasProfile = !!profileData;

    // ── Build filter params for query key ──
    const filterParams = useMemo(() => ({
        ...(appliedFilters.city && { city: appliedFilters.city }),
        ...(appliedFilters.propertyType && {
            propertyType: appliedFilters.propertyType as PropertyType,
        }),
        ...(appliedFilters.minPrice && { minPrice: appliedFilters.minPrice }),
        ...(appliedFilters.maxPrice && { maxPrice: appliedFilters.maxPrice }),
    }), [appliedFilters]);

    // ── Matches query ──
    const {
        data: matchData,
        isLoading: isLoadingMatches,
        isFetching,
    } = useQuery({
        queryKey: ['matchedProperties', filterParams, page],
        queryFn: () =>
            matchingService.getMatchedProperties(filterParams, { page, limit: LIMIT }),
        staleTime: 5 * 60 * 1000,
        placeholderData: (prev) => prev,
    });

    const scoredProperties = useMemo<ScoredProperty[]>(() => {
        if (!matchData?.properties) return [];
        const scoreMap = new Map<string, IPropertyCompatibilityScore>(
            (matchData.scores ?? []).map((s) => [s.propertyId, s as IPropertyCompatibilityScore])
        );
        return matchData.properties
            .map((p) => ({
                property: p,
                score: p._id ? scoreMap.get(String(p._id)) : undefined,
            }))
            .sort((a, b) => (b.score?.overallScore ?? 0) - (a.score?.overallScore ?? 0));
    }, [matchData]);

    const total = matchData?.total ?? 0;
    const totalPages = matchData?.totalPages ?? 1;
    const isLoading = isLoadingMatches || isFetching;

    const handleApplyFilters = () => {
        setAppliedFilters(pendingFilters);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['matchedProperties'] });
    };

    if (isLoadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero header */}
            <div className="bg-gradient-to-br from-slate-900 via-primary/80 to-slate-900 text-white">
                <div className="container py-10 px-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-semibold mb-4">
                                <Sparkles size={14} />
                                AI-Powered Matching
                            </div>
                            <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">
                                {hasProfile ? 'Your Matched Properties' : 'Find Your Perfect Match'}
                            </h1>
                            <p className="text-slate-300 text-sm">
                                {hasProfile
                                    ? `${total} properties ranked by compatibility with your profile`
                                    : 'Create a profile to unlock personalized property scores'}
                            </p>
                        </div>

                        {hasProfile && profileData && (
                            <Button
                                variant="outline"
                                onClick={() => setShowProfile((v) => !v)}
                                className="hidden sm:flex border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-2"
                            >
                                <UserCheck size={15} />
                                {showProfile ? 'Hide Profile' : 'My Profile'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container py-6 px-4">
                <div className={`grid gap-6 ${showProfile && hasProfile ? 'lg:grid-cols-[300px_1fr]' : 'grid-cols-1'}`}>
                    {/* Profile sidebar */}
                    <AnimatePresence>
                        {showProfile && hasProfile && profileData && (
                            <motion.div
                                key="profile-sidebar"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <ProfileDisplayCard
                                    profile={profileData}
                                    firstName={user?.firstName}
                                    lastName={user?.lastName}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main column */}
                    <div>
                        {!hasProfile ? (
                            <NoProfileCTA />
                        ) : (
                            <>
                                {/* Filter bar */}
                                <div className="mb-6">
                                    <FilterBar
                                        pending={pendingFilters}
                                        onChange={setPendingFilters}
                                        onApply={handleApplyFilters}
                                        loading={isLoading}
                                    />
                                </div>

                                {/* Results header */}
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-slate-500 font-medium">
                                        {isLoading
                                            ? 'Searching…'
                                            : `${total} ${total === 1 ? 'property' : 'properties'} found`}
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRefresh}
                                        disabled={isLoading}
                                        className="gap-1.5 text-slate-500 hover:text-slate-700 text-xs"
                                    >
                                        <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                                        Refresh
                                    </Button>
                                </div>

                                {/* Grid */}
                                <AnimatePresence mode="wait">
                                    {isLoadingMatches && !matchData ? (
                                        <motion.div
                                            key="skeleton"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                                        >
                                            {Array.from({ length: LIMIT }).map((_, i) => (
                                                <SkeletonCard key={i} />
                                            ))}
                                        </motion.div>
                                    ) : scoredProperties.length === 0 ? (
                                        <motion.div
                                            key="empty"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center justify-center py-24 text-center"
                                        >
                                            <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                                <SearchX size={32} className="text-slate-300" />
                                            </div>
                                            <h3 className="font-semibold text-slate-700 mb-1 text-lg">
                                                No properties found
                                            </h3>
                                            <p className="text-sm text-slate-400 mb-5 max-w-xs">
                                                No matches for your current filters. Try a different city, price range, or property type.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setPendingFilters(EMPTY_FILTERS);
                                                    setAppliedFilters(EMPTY_FILTERS);
                                                    setPage(1);
                                                }}
                                                className="gap-2"
                                            >
                                                <SlidersHorizontal size={13} />
                                                Adjust Filters
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key={`page-${page}-${JSON.stringify(appliedFilters)}`}
                                            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                                        >
                                            {scoredProperties.map(({ property, score }, idx) => (
                                                <PropertyMatchCard
                                                    key={String(property._id)}
                                                    property={property}
                                                    score={score}
                                                    rank={idx}
                                                />
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Pagination */}
                                {totalPages > 1 && !isLoadingMatches && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(page - 1)}
                                            disabled={page === 1 || isLoading}
                                            className="gap-1.5 rounded-xl"
                                        >
                                            <ChevronLeft size={15} />
                                            Prev
                                        </Button>
                                        <span className="text-sm text-slate-500 px-3 font-medium">
                                            {page} / {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(page + 1)}
                                            disabled={page === totalPages || isLoading}
                                            className="gap-1.5 rounded-xl"
                                        >
                                            Next
                                            <ChevronRight size={15} />
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoommateMatchesPage;
