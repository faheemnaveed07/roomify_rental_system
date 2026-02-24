import React from 'react';
import { BarChart3, TrendingUp, MapPin } from 'lucide-react';

const AdminAnalyticsPage: React.FC = () => {
    return (
        <div className="space-y-8">
            <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">Admin</p>
                <h1 className="text-3xl font-extrabold text-slate-900">Property Analytics</h1>
                <p className="text-slate-500 mt-2 max-w-2xl">
                    Track listing performance, demand hotspots, and approval velocity.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <BarChart3 size={24} className="text-primary-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-500 uppercase">Listings Reviewed</p>
                    <p className="text-3xl font-extrabold text-slate-900">482</p>
                    <p className="text-sm text-emerald-600 mt-2">+12% vs last week</p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <TrendingUp size={24} className="text-emerald-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-500 uppercase">Approval Rate</p>
                    <p className="text-3xl font-extrabold text-slate-900">78%</p>
                    <p className="text-sm text-slate-500 mt-2">Stable month-over-month</p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <MapPin size={24} className="text-amber-500" />
                    <p className="mt-4 text-sm font-semibold text-slate-500 uppercase">Top Demand Area</p>
                    <p className="text-3xl font-extrabold text-slate-900">Gulgasht</p>
                    <p className="text-sm text-slate-500 mt-2">High tenant activity</p>
                </div>
            </div>

            <div className="bg-gradient-to-r from-primary-50 via-white to-amber-50 rounded-3xl border border-slate-200 p-8">
                <h2 className="text-xl font-bold text-slate-900">Weekly Insights</h2>
                <p className="text-slate-500 mt-2 max-w-2xl">
                    Listings in central Multan receive 2.6x more saves. Encourage landlords to provide
                    complete photo sets to boost approvals.
                </p>
            </div>
        </div>
    );
};

export default AdminAnalyticsPage;
