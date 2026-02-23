import React from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/molecules/SearchBar';

const HomePage: React.FC = () => {
    const navigate = useNavigate();

    const handleHeroSearch = (query: string, filters: any) => {
        navigate('/browse', {
            state: {
                query,
                filters,
            },
        });
    };

    return (
        <div>
            <section className="bg-gradient-to-b from-white via-slate-50 to-slate-100">
                <div className="container py-16 lg:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <p className="text-sm font-semibold tracking-widest uppercase text-primary-600 mb-4">
                                Trusted Rental Marketplace
                            </p>
                            <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                                Find Your Next Home
                                <span className="block text-primary-600">with total confidence</span>
                            </h1>
                            <p className="text-lg text-slate-600 mt-5 max-w-xl">
                                Browse verified listings, connect with landlords instantly, and move into a place that fits your life.
                            </p>
                            <div className="mt-8">
                                <SearchBar
                                    onSearch={handleHeroSearch}
                                    placeholder="Search by area, city, or property name"
                                />
                            </div>
                            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
                                <span className="px-3 py-1 rounded-full bg-white border border-slate-200">Verified listings</span>
                                <span className="px-3 py-1 rounded-full bg-white border border-slate-200">Instant booking</span>
                                <span className="px-3 py-1 rounded-full bg-white border border-slate-200">Secure payments</span>
                            </div>
                        </div>
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 uppercase">Active Homes</p>
                                        <p className="text-3xl font-extrabold text-slate-900">3,200+</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                                        R
                                    </div>
                                </div>
                                <div className="h-px bg-slate-200" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 uppercase">Popular Areas</p>
                                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-medium text-slate-700">
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">Gulgasht</div>
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">Cantt</div>
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">Bosan Rd</div>
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">New Multan</div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 uppercase">Success Stories</p>
                                    <p className="mt-2 text-slate-600">
                                        “Roomify helped me lock in a verified home within 24 hours.”
                                    </p>
                                    <p className="mt-3 text-sm font-semibold text-slate-800">— Ayesha, Tenant</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
