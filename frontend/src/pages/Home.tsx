import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search,
    ShieldCheck,
    Zap,
    MessageCircle,
    Star,
    ArrowRight,
    MapPin,
    Users,
    Home,
    CheckCircle,
    TrendingUp,
} from 'lucide-react';
import SearchBar from '../components/molecules/SearchBar';

// ── Animation presets ───────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
    }),
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09 } },
};

const childFade = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

// ── Stat pill ──────────────────────────────────────────────────────
function StatPill({ value, label }: { value: string; label: string }) {
    return (
        <motion.div variants={childFade} className="flex flex-col items-center px-8 py-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
            <span className="text-sm text-slate-500 mt-0.5 font-medium">{label}</span>
        </motion.div>
    );
}

// ── Feature card ───────────────────────────────────────────────────
function FeatureCard({
    icon: Icon,
    title,
    description,
    accent,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    accent: string;
}) {
    return (
        <motion.div
            variants={childFade}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group bg-white rounded-2xl border border-slate-100 p-7 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl mb-5 ${accent}`}>
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'inherit', letterSpacing: '-0.01em' }}>
                {title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </motion.div>
    );
}

// ── Step ───────────────────────────────────────────────────────────
function Step({ n, title, description }: { n: string; title: string; description: string }) {
    return (
        <motion.div variants={childFade} className="flex gap-5">
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-primary-600 text-white text-sm font-black mt-0.5">
                {n}
            </div>
            <div>
                <p className="font-bold text-slate-900 mb-1">{title}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
            </div>
        </motion.div>
    );
}

// ── Area chip ──────────────────────────────────────────────────────
function AreaChip({ label, count }: { label: string; count: string }) {
    const navigate = useNavigate();
    return (
        <motion.button
            variants={childFade}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/browse', { state: { filters: { city: label } } })}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-colors shadow-sm"
        >
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{label}</span>
            <span className="ml-1 text-xs text-slate-400 font-medium">{count}</span>
        </motion.button>
    );
}

// ── Testimonial card ───────────────────────────────────────────────
function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
    return (
        <motion.div variants={childFade} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
            </div>
            <p className="text-slate-700 text-sm leading-relaxed mb-5">"{quote}"</p>
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
                    {name[0]}
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-400">{role}</p>
                </div>
            </div>
        </motion.div>
    );
}

// ── Main page ──────────────────────────────────────────────────────
const HomePage: React.FC = () => {
    const navigate = useNavigate();

    const handleHeroSearch = (query: string, filters: any) => {
        navigate('/browse', { state: { query, filters } });
    };

    return (
        <div className="overflow-x-hidden">
            {/* ── HERO ──────────────────────────────────────────── */}
            <section className="relative min-h-[90vh] flex items-center bg-mesh overflow-hidden">
                {/* decorative blobs */}
                <div className="pointer-events-none absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-blue-100/60 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-violet-100/40 blur-3xl" aria-hidden />

                <div className="container relative z-10 py-20 lg:py-28">
                    <div className="max-w-3xl mx-auto text-center">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={0}
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-bold uppercase tracking-widest mb-8">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Verified rental marketplace · Multan
                            </span>
                        </motion.div>

                        <motion.h1
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={0.08}
                            className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] mb-6"
                        >
                            Find your next home
                            <br />
                            <span className="text-gradient italic">with confidence</span>
                        </motion.h1>

                        <motion.p
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={0.16}
                            className="text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto font-medium"
                        >
                            Browse verified listings, connect with landlords instantly, and move into a place that truly fits your life.
                        </motion.p>

                        {/* Search */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={0.22}
                            className="max-w-xl mx-auto"
                        >
                            <SearchBar
                                onSearch={handleHeroSearch}
                                placeholder="Search by area, city, or property name"
                            />
                        </motion.div>

                        {/* Trust pills */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={0.3}
                            className="mt-7 flex flex-wrap justify-center gap-3"
                        >
                            {['Verified listings', 'Instant booking', 'Secure payments', 'No hidden fees'].map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm"
                                >
                                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                                    {tag}
                                </span>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── STATS BAR ─────────────────────────────────────── */}
            <section className="border-y border-slate-100 bg-white py-6">
                <motion.div
                    className="container"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={stagger}
                >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatPill value="3,200+" label="Active listings" />
                        <StatPill value="1,800+" label="Happy tenants" />
                        <StatPill value="98%" label="Verified landlords" />
                        <StatPill value="24hrs" label="Avg. response time" />
                    </div>
                </motion.div>
            </section>

            {/* ── HOW IT WORKS ──────────────────────────────────── */}
            <section className="py-24 bg-slate-50">
                <div className="container">
                    <motion.div
                        className="text-center mb-14"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                        variants={fadeUp}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-3">Simple process</p>
                        <h2 className="text-4xl font-black text-slate-900 mb-4">Move in, in 3 steps</h2>
                        <p className="text-slate-500 max-w-md mx-auto">
                            We've removed every friction point. From finding to signing — everything happens on Roomify.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            className="space-y-8"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-60px' }}
                            variants={stagger}
                        >
                            <Step
                                n="1"
                                title="Browse verified listings"
                                description="Filter by location, price, and type. Every listing is verified before it goes live — no scams, no surprises."
                            />
                            <Step
                                n="2"
                                title="Book & sign digitally"
                                description="Request a booking, chat with the landlord, and sign your rental agreement — all inside Roomify."
                            />
                            <Step
                                n="3"
                                title="Move in with confidence"
                                description="Pay securely through our platform. Disputes are handled. Your deposit is protected until you're settled."
                            />
                            <motion.div variants={childFade}>
                                <Link
                                    to="/browse"
                                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-md hover:shadow-lg transition-all"
                                >
                                    Start browsing
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* Visual card */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }}
                            viewport={{ once: true, margin: '-60px' }}
                            className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
                        >
                            <div className="p-2">
                                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 aspect-[4/3] flex items-center justify-center">
                                    <div className="text-slate-300">
                                        <Home className="w-20 h-20" />
                                    </div>
                                    {/* overlay stats */}
                                    <div className="absolute bottom-4 left-4 right-4 glass rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500">DHA Phase 1, Multan</p>
                                                <p className="text-lg font-black text-slate-900">PKR 35,000 <span className="text-xs font-medium text-slate-500">/month</span></p>
                                            </div>
                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Verified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 pb-6 pt-4 space-y-3">
                                <div className="flex gap-2">
                                    {['2 beds', '1 bath', 'WiFi', 'AC'].map(tag => (
                                        <span key={tag} className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600 rounded-lg">{tag}</span>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">Book now</div>
                                    <div className="flex-1 h-9 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 text-xs font-bold">Message</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES GRID ──────────────────────────────────── */}
            <section className="py-24 bg-white">
                <div className="container">
                    <motion.div
                        className="text-center mb-14"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                        variants={fadeUp}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-3">Why Roomify</p>
                        <h2 className="text-4xl font-black text-slate-900 mb-4">Built for modern renters</h2>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Every feature crafted to make your rental journey smooth, safe, and stress-free.
                        </p>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                        variants={stagger}
                    >
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Verified landlords"
                            description="Every landlord is CNIC-verified and background-checked before listing. Zero unverified properties."
                            accent="bg-emerald-50 text-emerald-600"
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Instant booking"
                            description="Send a booking request, get approved, and move in — without a single phone call."
                            accent="bg-amber-50 text-amber-600"
                        />
                        <FeatureCard
                            icon={MessageCircle}
                            title="In-app messaging"
                            description="Communicate directly with landlords through encrypted chat. No WhatsApp needed."
                            accent="bg-blue-50 text-blue-600"
                        />
                        <FeatureCard
                            icon={Users}
                            title="Roommate matching"
                            description="Our AI matches you with compatible roommates based on lifestyle, habits, and budget."
                            accent="bg-violet-50 text-violet-600"
                        />
                        <FeatureCard
                            icon={Search}
                            title="Smart search"
                            description="Filter by city, area, price, amenities, and property type. Find exactly what you need."
                            accent="bg-rose-50 text-rose-600"
                        />
                        <FeatureCard
                            icon={TrendingUp}
                            title="Transparent pricing"
                            description="See the full cost upfront. No hidden admin fees, no surprises at signing."
                            accent="bg-cyan-50 text-cyan-600"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ── POPULAR AREAS ──────────────────────────────────── */}
            <section className="py-20 bg-slate-50">
                <div className="container">
                    <motion.div
                        className="mb-10"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                        variants={fadeUp}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-2">Locations</p>
                        <h2 className="text-3xl font-black text-slate-900">Popular areas in Multan</h2>
                    </motion.div>
                    <motion.div
                        className="flex flex-wrap gap-3"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                        variants={stagger}
                    >
                        {[
                            { label: 'Gulgasht Colony', count: '120+' },
                            { label: 'Cantt Area', count: '85+' },
                            { label: 'Bosan Road', count: '64+' },
                            { label: 'New Multan', count: '47+' },
                            { label: 'Shah Rukn-e-Alam', count: '39+' },
                            { label: 'DHA Multan', count: '28+' },
                            { label: 'Mumtazabad', count: '55+' },
                            { label: 'Hussain Agahi', count: '33+' },
                        ].map((a) => (
                            <AreaChip key={a.label} label={a.label} count={a.count} />
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── TESTIMONIALS ───────────────────────────────────── */}
            <section className="py-24 bg-white">
                <div className="container">
                    <motion.div
                        className="text-center mb-14"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                        variants={fadeUp}
                    >
                        <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-3">Testimonials</p>
                        <h2 className="text-4xl font-black text-slate-900">Loved by thousands</h2>
                    </motion.div>
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-5"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                        variants={stagger}
                    >
                        <Testimonial
                            quote="Roomify helped me lock in a verified home within 24 hours of creating my profile. The booking process was seamless."
                            name="Ayesha K."
                            role="Tenant · Gulgasht, Multan"
                        />
                        <Testimonial
                            quote="As a landlord, I've filled all three of my properties through Roomify. The tenant quality is excellent and communication is built-in."
                            name="Usman T."
                            role="Landlord · 3 properties"
                        />
                        <Testimonial
                            quote="The roommate matching feature is incredible. I found someone with a compatible schedule and budget in less than a week."
                            name="Sara M."
                            role="Tenant · DHA Multan"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ── CTA BANNER ───────────────────────────────────── */}
            <section className="py-20 bg-slate-900 relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-900/60 via-slate-900 to-slate-900" aria-hidden />
                <div className="container relative z-10 text-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                        variants={stagger}
                        className="space-y-6 max-w-2xl mx-auto"
                    >
                        <motion.h2 variants={childFade} className="text-4xl lg:text-5xl font-black text-white tracking-tight">
                            Ready to find your next home?
                        </motion.h2>
                        <motion.p variants={childFade} className="text-slate-400 text-lg">
                            Join over 1,800 tenants who found their perfect place on Roomify.
                        </motion.p>
                        <motion.div variants={childFade} className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/auth"
                                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-lg"
                            >
                                Create free account
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                to="/browse"
                                className="inline-flex items-center justify-center gap-2 border border-slate-700 text-slate-300 font-semibold px-8 py-4 rounded-xl text-sm hover:border-slate-500 hover:text-white transition-colors"
                            >
                                Browse listings
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────── */}
            <footer className="bg-slate-950 py-12">
                <div className="container">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-black text-sm">R</span>
                            <span className="text-white font-bold tracking-tight">Roomify</span>
                        </div>
                        <p className="text-slate-500 text-xs">
                            © {new Date().getFullYear()} Roomify. All rights reserved. Built for Multan.
                        </p>
                        <div className="flex gap-6 text-xs text-slate-500">
                            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
                            <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
