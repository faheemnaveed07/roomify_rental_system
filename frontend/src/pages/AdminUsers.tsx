import React from 'react';
import { ShieldCheck, Users, UserCheck } from 'lucide-react';

const AdminUsersPage: React.FC = () => {
    return (
        <div className="space-y-8">
            <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">Admin</p>
                <h1 className="text-3xl font-extrabold text-slate-900">Manage Users</h1>
                <p className="text-slate-500 mt-2 max-w-2xl">
                    Review user roles, verify accounts, and keep the marketplace trusted.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <ShieldCheck size={24} className="text-primary-600" />
                    <p className="mt-4 text-sm font-semibold text-slate-500 uppercase">Verified Users</p>
                    <p className="text-3xl font-extrabold text-slate-900">1,248</p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <Users size={24} className="text-amber-500" />
                    <p className="mt-4 text-sm font-semibold text-slate-500 uppercase">Active Landlords</p>
                    <p className="text-3xl font-extrabold text-slate-900">342</p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <UserCheck size={24} className="text-emerald-500" />
                    <p className="mt-4 text-sm font-semibold text-slate-500 uppercase">Active Tenants</p>
                    <p className="text-3xl font-extrabold text-slate-900">906</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center">
                <h2 className="text-xl font-bold text-slate-900">User Directory is being prepared</h2>
                <p className="text-slate-500 mt-2 max-w-xl mx-auto">
                    We are wiring the full directory with search, filters, and audit history. Coming next.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm">
                    Schedule Review Session
                </div>
            </div>
        </div>
    );
};

export default AdminUsersPage;
