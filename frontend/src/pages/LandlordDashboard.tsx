import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBookingStore } from '../store/booking.store';
import { useAgreementStore, isAwaitingLandlord, LandlordAgreement } from '../store/agreement.store';
import StatCard from '../components/molecules/StatCard';
import BookingRequestCard from '../components/organisms/BookingRequestCard';
import {
    CheckCircle,
    Activity,
    Inbox,
    Building2,
    Layout,
    FileSignature,
    Clock
} from 'lucide-react';
import { PropertyStatus } from '@shared/types';

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });

const getPropertyTitle = (a: LandlordAgreement): string =>
    (typeof a.property === 'object' && a.property?.title) || 'Lease Agreement';

const getTenantName = (a: LandlordAgreement): string => {
    if (typeof a.tenant === 'object' && a.tenant) {
        return `${a.tenant.firstName ?? ''} ${a.tenant.lastName ?? ''}`.trim() || 'Tenant';
    }
    return 'Tenant';
};

const LandlordDashboard: React.FC = () => {
    const {
        stats,
        bookings,
        myProperties,
        error,
        fetchDashboardData,
        approveBooking,
        rejectBooking
    } = useBookingStore();

    const { landlordAgreements, fetchLandlordAgreements } = useAgreementStore();

    const location = useLocation();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'requests' | 'properties' | 'agreements'>('requests');

    const awaitingCount = landlordAgreements.filter(isAwaitingLandlord).length;

    useEffect(() => {
        fetchDashboardData();
        fetchLandlordAgreements();
    }, [fetchDashboardData, fetchLandlordAgreements]);

    useEffect(() => {
        if (location.pathname.includes('/dashboard/properties')) {
            setActiveTab('properties');
        } else if (location.pathname.includes('/dashboard/agreements')) {
            setActiveTab('agreements');
        } else {
            setActiveTab('requests');
        }
    }, [location.pathname]);

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl font-medium">
                Failed to load dashboard: {error}
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-[#1E293B]">Dashboard Overview</h1>
                <p className="text-neutral-500 mt-1 font-medium">Monitor your property performance and handle requests.</p>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Properties"
                    value={stats?.totalProperties || 0}
                    icon={<Building2 size={24} />}
                />
                <StatCard
                    title="Pending Requests"
                    value={stats?.pendingRequests || 0}
                    icon={<Inbox size={24} />}
                    trend={{ value: '12%', isUp: true }}
                />
                <StatCard
                    title="Confirmed Bookings"
                    value={stats?.confirmedBookings || 0}
                    icon={<CheckCircle size={24} />}
                />
                <StatCard
                    title="Total Revenue"
                    value={`${stats?.currency || 'PKR'} ${(stats?.totalRevenue || 0).toLocaleString()}`}
                    icon={<Activity size={24} />}
                />
            </div>

            {/* Tabs & Content */}
            <div className="space-y-6">
                <div className="flex p-1.5 bg-neutral-100 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'requests'
                            ? 'bg-white text-[#2563EB] shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                    >
                        <Inbox size={18} />
                        Booking Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('properties')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'properties'
                            ? 'bg-white text-[#2563EB] shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                    >
                        <Layout size={18} />
                        My Properties
                    </button>
                    <button
                        onClick={() => setActiveTab('agreements')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'agreements'
                            ? 'bg-white text-[#2563EB] shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                    >
                        <FileSignature size={18} />
                        Agreements
                        {awaitingCount > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[11px] font-bold">
                                {awaitingCount > 9 ? '9+' : awaitingCount}
                            </span>
                        )}
                    </button>
                </div>

                {activeTab === 'requests' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {bookings.filter(b => b.status === 'pending').length > 0 ? (
                            bookings
                                .filter(b => b.status === 'pending')
                                .map((booking) => (
                                    <BookingRequestCard
                                        key={booking._id}
                                        booking={booking}
                                        onApprove={approveBooking}
                                        onReject={rejectBooking}
                                    />
                                ))
                        ) : (
                            <div className="xl:col-span-2 text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-300">
                                <Inbox size={48} className="mx-auto text-neutral-300 mb-4" />
                                <p className="text-neutral-500 font-bold text-lg">No pending booking requests</p>
                                <p className="text-neutral-400 text-sm">New requests will appear here in real-time.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'properties' && (
                    <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 border-b border-neutral-100">
                                <tr>
                                    <th className="px-8 py-5 text-sm font-bold text-neutral-500 uppercase tracking-widest">Property</th>
                                    <th className="px-8 py-5 text-sm font-bold text-neutral-500 uppercase tracking-widest">Type</th>
                                    <th className="px-8 py-5 text-sm font-bold text-neutral-500 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-sm font-bold text-neutral-500 uppercase tracking-widest text-right">Rent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {myProperties.length > 0 ? (
                                    myProperties.map((property) => (
                                        <tr key={property._id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="font-bold text-[#1E293B]">{property.title}</p>
                                                    <p className="text-xs text-neutral-500 mt-0.5">{property.location.address}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-medium capitalize text-neutral-600">
                                                    {property.propertyType.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${property.status === PropertyStatus.ACTIVE
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {property.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className="font-bold text-[#1E293B]">
                                                    {property.rent.currency} {property.rent.amount.toLocaleString()}
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-neutral-400 font-medium">
                                            No properties listed yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'agreements' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {landlordAgreements.length > 0 ? (
                            landlordAgreements.map((a) => {
                                const awaiting = isAwaitingLandlord(a);
                                const signed = a.status === 'signed';
                                return (
                                    <div key={a._id} className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 flex flex-col gap-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-bold text-[#1E293B]">{getPropertyTitle(a)}</p>
                                                <p className="text-sm text-neutral-500 mt-0.5">Tenant: {getTenantName(a)}</p>
                                            </div>
                                            <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg whitespace-nowrap ${signed
                                                ? 'bg-green-100 text-green-700'
                                                : awaiting
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-neutral-100 text-neutral-600'
                                                }`}>
                                                {signed ? 'Signed' : awaiting ? 'Action needed' : 'Pending tenant'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-500 flex items-center gap-2">
                                            <Clock size={14} className="text-neutral-400" />
                                            {a.tenantSignedAt
                                                ? `Tenant signed on ${formatDate(a.tenantSignedAt)}`
                                                : 'Waiting for the tenant to sign'}
                                        </p>
                                        <button
                                            onClick={() => navigate(`/agreement/${a.booking}`)}
                                            className={`mt-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-colors ${awaiting
                                                ? 'bg-[#2563EB] text-white hover:bg-blue-700'
                                                : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                                                }`}
                                        >
                                            <FileSignature size={16} />
                                            {awaiting ? 'Review & Sign' : 'View Agreement'}
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="xl:col-span-2 text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-300">
                                <FileSignature size={48} className="mx-auto text-neutral-300 mb-4" />
                                <p className="text-neutral-500 font-bold text-lg">No agreements yet</p>
                                <p className="text-neutral-400 text-sm">Once a tenant signs a lease, it'll appear here for your signature.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LandlordDashboard;
