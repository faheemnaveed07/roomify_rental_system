import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Users, Home, CalendarCheck, Banknote,
    TrendingUp, Loader2, AlertCircle,
} from 'lucide-react';
import { adminAnalyticsService } from '../services/api';
import { AdminAnalyticsData } from '@shared/types/api.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
    return amount.toLocaleString();
}

function statusLabel(raw: string): string {
    return raw
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-emerald-500',
    pending_verification: 'bg-amber-500',
    rejected: 'bg-red-500',
    inactive: 'bg-slate-400',
    pending: 'bg-amber-500',
    confirmed: 'bg-emerald-500',
    cancelled: 'bg-red-500',
    completed: 'bg-blue-500',
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtitle?: string;
    iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtitle, iconBg }) => (
    <Card className="rounded-2xl">
        <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} text-white`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</p>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
        </CardContent>
    </Card>
);

// ─── Distribution Card ─────────────────────────────────────────────────────────

interface DistributionCardProps {
    title: string;
    items: { label: string; count: number }[];
    total: number;
}

const DistributionCard: React.FC<DistributionCardProps> = ({ title, items, total }) => (
    <Card className="rounded-2xl">
        <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            {items.map(({ label, count }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const colorKey = label.toLowerCase().replace(/\s+/g, '_');
                return (
                    <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[colorKey] ?? 'bg-slate-400'}`} />
                                <span className="text-xs font-medium text-slate-700">{statusLabel(label)}</span>
                            </div>
                            <span className="text-xs tabular-nums font-semibold text-slate-500">
                                {count} <span className="font-normal text-muted-foreground">({pct}%)</span>
                            </span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                    </div>
                );
            })}
        </CardContent>
    </Card>
);

// ─── Revenue Chart (pure CSS bars) ─────────────────────────────────────────────

interface RevenueChartProps {
    data: { month: string; revenue: number }[];
    currency: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, currency }) => {
    const max = Math.max(...data.map((d) => d.revenue), 1);

    return (
        <Card className="rounded-2xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No revenue data yet</p>
                ) : (
                    <div className="flex items-end gap-2 h-44">
                        {data.map((d) => {
                            const pct = (d.revenue / max) * 100;
                            return (
                                <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
                                    <span className="text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                                        {currency} {formatCurrency(d.revenue)}
                                    </span>
                                    <div
                                        className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors min-h-[4px]"
                                        style={{ height: `${Math.max(pct, 3)}%` }}
                                    />
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                        {d.month.split(' ')[0]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// ─── Page ──────────────────────────────────────────────────────────────────────

const AdminAnalyticsPage: React.FC = () => {
    const { data, isLoading, isError, refetch } = useQuery<AdminAnalyticsData>({
        queryKey: ['adminAnalytics'],
        queryFn: adminAnalyticsService.getAnalytics,
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-slate-600 font-medium">Failed to load analytics</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Try Again
                </Button>
            </div>
        );
    }

    const { overview, usersByRole, propertiesByStatus, bookingsByStatus, revenueByMonth, recentActivity } = data;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">Admin</p>
                <h1 className="text-3xl font-extrabold text-slate-900">Analytics Dashboard</h1>
                <p className="text-slate-500 mt-1">Real-time overview of platform metrics.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users size={22} />}
                    label="Total Users"
                    value={overview.totalUsers.toLocaleString()}
                    subtitle={`+${recentActivity.newUsersThisMonth} this month`}
                    iconBg="bg-blue-600"
                />
                <StatCard
                    icon={<Home size={22} />}
                    label="Total Properties"
                    value={overview.totalProperties.toLocaleString()}
                    subtitle={`+${recentActivity.newPropertiesThisMonth} this month`}
                    iconBg="bg-emerald-600"
                />
                <StatCard
                    icon={<CalendarCheck size={22} />}
                    label="Total Bookings"
                    value={overview.totalBookings.toLocaleString()}
                    subtitle={`+${recentActivity.newBookingsThisMonth} this month`}
                    iconBg="bg-violet-600"
                />
                <StatCard
                    icon={<Banknote size={22} />}
                    label="Total Revenue"
                    value={`${overview.currency} ${formatCurrency(overview.totalRevenue)}`}
                    iconBg="bg-amber-600"
                />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <RevenueChart data={revenueByMonth} currency={overview.currency} />
                </div>
                <DistributionCard
                    title="Users by Role"
                    items={usersByRole.map((r) => ({ label: r.role, count: r.count }))}
                    total={overview.totalUsers}
                />
            </div>

            {/* Distributions row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DistributionCard
                    title="Properties by Status"
                    items={propertiesByStatus.map((p) => ({ label: p.status, count: p.count }))}
                    total={overview.totalProperties}
                />
                <DistributionCard
                    title="Bookings by Status"
                    items={bookingsByStatus.map((b) => ({ label: b.status, count: b.count }))}
                    total={overview.totalBookings}
                />
            </div>

            {/* Activity badges */}
            <Card className="rounded-2xl">
                <CardContent className="flex flex-wrap items-center gap-3 p-5">
                    <TrendingUp size={16} className="text-primary" />
                    <span className="text-sm font-medium text-slate-700">This Month:</span>
                    <Badge variant="secondary" className="rounded-full">
                        {recentActivity.newUsersThisMonth} new users
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                        {recentActivity.newPropertiesThisMonth} new properties
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                        {recentActivity.newBookingsThisMonth} new bookings
                    </Badge>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminAnalyticsPage;
