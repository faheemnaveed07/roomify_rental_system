import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Search,
    MapPin,
    ArrowRight,
    CreditCard,
    Camera,
    ShieldCheck,
    Star,
    Quote,
    Home as HomeIcon,
    Building2,
    UsersRound,
    ChevronDown,
} from 'lucide-react';
import HeroOrbit from '../components/molecules/HeroOrbit';

/* ============================================================================
 * DOMAVI — Home (public / pre-login landing)
 * Dark "trust-first" marketing page rebuilt from the approved mockup.
 * All custom classes live in src/styles/domavi-dark.css (scoped to .domavi-dark).
 * ========================================================================== */

// ── Animated verified badge (draws its ring + check on mount) ───────────────
function VerifiedBadge({ className = 'w-6 h-6' }: { className?: string }) {
    const [on, setOn] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setOn(true), 120);
        return () => clearTimeout(t);
    }, []);
    return (
        <svg className={`badge-check ${on ? 'animate' : ''} ${className}`} viewBox="0 0 24 24" fill="none">
            <circle className="badge-ring" cx="12" cy="12" r="10" stroke="#2D8F5E" strokeWidth="1.5" fill="none" />
            <path
                className="check-stroke"
                d="M7 12.5l3 3 7-7"
                stroke="#2D8F5E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}

// ── Count-up number (animates 0 → value when scrolled into view) ────────────
function Counter({ value, className = '' }: { value: number; className?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const [n, setN] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([e]) => {
                if (!e.isIntersecting) return;
                io.disconnect();
                const dur = 1600;
                const start = performance.now();
                const step = (t: number) => {
                    const p = Math.min(1, (t - start) / dur);
                    setN(Math.floor(p * value));
                    if (p < 1) requestAnimationFrame(step);
                    else setN(value);
                };
                requestAnimationFrame(step);
            },
            { threshold: 0.4 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [value]);
    return (
        <span ref={ref} className={className}>
            {n.toLocaleString()}
        </span>
    );
}

// ── Data ────────────────────────────────────────────────────────────────────
/**
 * Curated Unsplash photos. These replaced picsum.photos placeholders, which
 * returned unrelated stock images (a beach lifeguard tower for a DHA room).
 */
const UNSPLASH = (id: string, w = 800, h = 600) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Member avatars shown in the hero trust strip */
const HERO_AVATARS = [
    'photo-1633332755192-727a05c4013d',
    'photo-1494790108377-be9c29b29330',
    'photo-1507003211169-0a1dd7228f2d',
    'photo-1438761681033-6461ffad8d80',
];

const GOALS = [
    { key: 'all', label: 'All' },
    { key: 'room', label: 'Room' },
    { key: 'place', label: 'Whole Place' },
    { key: 'roommate', label: 'Roommate' },
];

const LISTINGS = [
    { seed: 'photo-1505691938895-1758d7feb511', title: 'PRIVATE ROOM · BZU', area: 'BOSAN ROAD, MULTAN', price: '₨12,000/mo', host: 'AHMED R.', hostSeed: 'photo-1633332755192-727a05c4013d', match: '92%', type: 'room' },
    { seed: 'photo-1560448204-e02f11c3d0e2', title: '2-BED · GULGASHT', area: 'GULGASHT COLONY, MULTAN', price: '₨28,000/mo', host: 'HASSAN M.', hostSeed: 'photo-1507003211169-0a1dd7228f2d', match: 'WHOLE', type: 'place' },
    { seed: 'photo-1502672260266-1c1ef2d93688', title: 'SHARED ROOM · GIRLS', area: 'SHAH RUKN-E-ALAM', price: '₨9,500/mo', host: 'FATIMA N.', hostSeed: 'photo-1494790108377-be9c29b29330', match: '87%', type: 'roommate' },
    { seed: 'photo-1522708323590-d24dbb6b0267', title: 'STUDIO · CANTT', area: 'CANTT AREA, MULTAN', price: '₨22,000/mo', host: 'BILAL K.', hostSeed: 'photo-1568602471122-7832951cc4c5', match: 'WHOLE', type: 'place' },
    { seed: 'photo-1598928506311-c55ded91a20c', title: 'PRIVATE ROOM · NFC', area: 'NEW MULTAN', price: '₨11,000/mo', host: 'ZAINAB A.', hostSeed: 'photo-1438761681033-6461ffad8d80', match: '90%', type: 'room' },
    { seed: 'photo-1493809842364-78817add7ffb', title: 'ROOMMATE WANTED', area: 'MUMTAZABAD, MULTAN', price: '₨8,000/mo', host: 'OMAR S.', hostSeed: 'photo-1500648767791-00dcc994a43e', match: '84%', type: 'roommate' },
];

const STORIES = [
    { seed: 'photo-1494790108377-be9c29b29330', name: 'AYESHA K.', meta: 'Tenant · Gulgasht', quote: 'Domavi helped me lock in a CNIC-verified home within 24 hours. No agent, no scam, no stress.' },
    { seed: 'photo-1507003211169-0a1dd7228f2d', name: 'USMAN T.', meta: 'Landlord · 3 properties', quote: 'I filled all three of my properties through Domavi. Tenants arrive already verified — that changes everything.' },
    { seed: 'photo-1438761681033-6461ffad8d80', name: 'SARA M.', meta: 'Tenant · DHA Multan', quote: 'The roommate matching is unreal. Found someone with my exact schedule and budget in under a week.' },
    { seed: 'photo-1633332755192-727a05c4013d', name: 'HAMZA R.', meta: 'Student · BZU', quote: 'Coming from another city, I had no contacts. Domavi made finding a safe room near campus actually easy.' },
];

const MATCH_ROWS = [
    { key: 'sleep', label: 'Sleep schedule', options: ['Early bird', 'Night owl', 'Flexible'] },
    { key: 'clean', label: 'Cleanliness', options: ['Very tidy', 'Average', 'Relaxed'] },
    { key: 'study', label: 'Study habit', options: ['Quiet', 'Music on', 'Group'] },
    { key: 'social', label: 'Social energy', options: ['Homebody', 'Balanced', 'Very social'] },
];

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const rootRef = useRef<HTMLDivElement>(null);

    // Search + verified toggle
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [toast, setToast] = useState(false);
    const [location, setLocation] = useState('');
    const [budget, setBudget] = useState('');
    const [ptype, setPtype] = useState('');

    // Browse filter
    const [goal, setGoal] = useState('all');

    // Matching quiz
    const [prefs, setPrefs] = useState<Record<string, string>>({});

    // Sticky CTA
    const [showSticky, setShowSticky] = useState(false);

    // ── Scroll-reveal observer ──────────────────────────────────────────────
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const els = root.querySelectorAll('.reveal, .reveal-stagger');
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('in-view');
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    // ── Sticky CTA visibility ───────────────────────────────────────────────
    useEffect(() => {
        const onScroll = () => setShowSticky(window.scrollY > window.innerHeight * 0.85);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ── Verified toggle → toast ─────────────────────────────────────────────
    const toggleVerified = () => {
        setVerifiedOnly((v) => {
            const next = !v;
            if (next) {
                setToast(true);
                window.setTimeout(() => setToast(false), 3200);
            }
            return next;
        });
    };

    const handleSearch = () => {
        navigate('/browse', { state: { query: location, filters: { city: location, budget, type: ptype, verifiedOnly } } });
    };

    const filteredListings = goal === 'all' ? LISTINGS : LISTINGS.filter((l) => l.type === goal);
    const listingCount = verifiedOnly ? 612 : 847;

    // ── Matching score (60 base + 10 per answered row, capped 100) ───────────
    const answered = Object.keys(prefs).length;
    const matchScore = Math.min(100, 60 + answered * 10);
    const circ = 2 * Math.PI * 52;
    const compat = {
        Lifestyle: Math.min(98, 64 + (prefs.clean ? 18 : 0) + (prefs.social ? 14 : 0)),
        Schedule: Math.min(98, 60 + (prefs.sleep ? 20 : 0) + (prefs.study ? 14 : 0)),
        Budget: 88,
    };

    // ── Story carousel: drag-to-scroll + auto-advance ───────────────────────
    const trackRef = useRef<HTMLDivElement>(null);
    const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        const id = window.setInterval(() => {
            const max = el.scrollWidth - el.clientWidth;
            if (el.scrollLeft >= max - 8) el.scrollTo({ left: 0, behavior: 'smooth' });
            else el.scrollBy({ left: 340, behavior: 'smooth' });
        }, 4200);
        return () => window.clearInterval(id);
    }, []);

    const onDragDown = (e: React.PointerEvent) => {
        const el = trackRef.current;
        if (!el) return;
        drag.current = { down: true, startX: e.pageX, startScroll: el.scrollLeft, moved: false };
        el.classList.add('dragging');
    };
    const onDragMove = (e: React.PointerEvent) => {
        const el = trackRef.current;
        if (!el || !drag.current.down) return;
        const dx = e.pageX - drag.current.startX;
        if (Math.abs(dx) > 4) drag.current.moved = true;
        el.scrollLeft = drag.current.startScroll - dx;
    };
    const onDragUp = () => {
        const el = trackRef.current;
        if (el) el.classList.remove('dragging');
        drag.current.down = false;
    };

    return (
        <div ref={rootRef} className="domavi-dark dv-page overflow-x-hidden">
            {/* Grain overlay */}
            <div className="grain" aria-hidden />

            {/* Verified toast */}
            <div className={`dv-toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">
                <div className="flex items-center gap-3">
                    <VerifiedBadge className="w-6 h-6" />
                    <div>
                        <p className="font-heading text-sm text-[var(--fg)] tracking-wider">VERIFIED FILTER ACTIVE</p>
                        <p className="font-mono text-[10px] text-[var(--muted)] tracking-wider mt-0.5">Showing CNIC-verified listings only</p>
                    </div>
                </div>
            </div>

            {/* Sticky CTA */}
            <div className={`sticky-cta ${showSticky ? 'visible' : ''}`}>
                <div className="bg-[#050505]/95 backdrop-blur-md border-t border-[var(--border)] px-6 py-3 flex items-center justify-between max-w-[1600px] mx-auto">
                    <div className="hidden sm:flex items-center gap-3">
                        <span className="w-2 h-2 bg-[var(--verify)] rounded-full rec-dot" />
                        <span className="font-mono text-[10px] text-[var(--muted)] tracking-[0.2em] uppercase">Verification takes 2 min</span>
                    </div>
                    <Link
                        to="/auth"
                        className="font-heading text-xs tracking-[0.2em] uppercase text-black bg-[var(--accent)] px-8 py-2.5 hover:bg-[var(--accent-bright)] transition-colors pulse-btn w-full sm:w-auto text-center"
                    >
                        Get Verified Now
                    </Link>
                </div>
            </div>

            {/* ===================== HERO ===================== */}
            <section className="relative min-h-screen w-full overflow-hidden flex items-center" id="hero">
                {/* Ambient light — replaces the old stock-photo reel */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute -top-1/4 -right-1/4 h-[75vh] w-[75vh] rounded-full bg-[#d4845a]/10 blur-3xl" />
                    <div className="absolute -bottom-1/4 -left-1/4 h-[60vh] w-[60vh] rounded-full bg-[#2d8f5e]/10 blur-3xl" />
                </div>
                <div className="scan-line" />

                <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 lg:px-10 pt-32 pb-28">
                    <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
                    {/* ---------- LEFT: copy, search, trust ---------- */}
                    <div>
                    {/* Headline */}
                    <div className="reveal in-view">
                        <h1 className="font-display text-[13vw] sm:text-[9vw] lg:text-[5.4vw] xl:text-[5rem] leading-[0.88] mb-6 text-[var(--fg)]">
                            <span className="headline-line">
                                <span>A HOME YOU</span>
                            </span>
                            <span className="headline-line">
                                <span className="text-stroke">CAN TRUST</span>
                            </span>
                            <span className="headline-line">
                                <span>
                                    PEOPLE YOU'LL <span className="text-[var(--accent)]">CLICK</span> WITH
                                </span>
                            </span>
                        </h1>
                        <p className="max-w-xl text-[var(--fg-dim)] text-base md:text-lg leading-relaxed font-body">
                            No more scams, no more guessing. Every member verified by CNIC. Find a real room, a real place, or real people — safely.
                        </p>
                    </div>

                    {/* Search bar */}
                    <div className="mt-10 bg-[#141414]/80 backdrop-blur-md border border-[var(--border-light)] p-1.5">
                        <div className="flex flex-col sm:flex-row gap-0">
                            <div className="flex-1 flex items-center gap-3 px-4 py-2.5 border-b sm:border-b-0 sm:border-r border-[var(--border-light)]">
                                <MapPin className="text-[var(--accent)] w-3.5 h-3.5 shrink-0" />
                                <input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    type="text"
                                    placeholder="Area, city, university..."
                                    className="form-input !border-0 !p-0 !text-sm"
                                    aria-label="Location"
                                />
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2.5 border-b sm:border-b-0 sm:border-r border-[var(--border-light)] w-full sm:w-36">
                                <span className="text-[var(--accent)] text-xs font-mono shrink-0">₨</span>
                                <input
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                    type="text"
                                    placeholder="Budget"
                                    className="form-input !border-0 !p-0 !text-sm"
                                    aria-label="Budget"
                                />
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2.5 w-full sm:w-44">
                                <HomeIcon className="text-[var(--accent)] w-3.5 h-3.5 shrink-0" />
                                <select
                                    value={ptype}
                                    onChange={(e) => setPtype(e.target.value)}
                                    className="form-input !border-0 !p-0 !text-sm appearance-none cursor-pointer bg-transparent"
                                    aria-label="Type"
                                >
                                    <option value="">All Types</option>
                                    <option value="room">Room</option>
                                    <option value="place">Whole Place</option>
                                    <option value="roommate">Roommate</option>
                                </select>
                                <ChevronDown className="text-[var(--muted)] w-2.5 h-2.5" />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black font-heading text-xs tracking-[0.2em] uppercase px-8 py-3 transition-colors flex items-center justify-center gap-2 shrink-0"
                            >
                                <Search className="w-4 h-4" />
                                <span className="hidden sm:inline">Search</span>
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2 px-4 pb-2">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`toggle-track ${verifiedOnly ? 'active' : ''}`}
                                    onClick={toggleVerified}
                                    role="switch"
                                    aria-checked={verifiedOnly}
                                    aria-label="Verified only"
                                    tabIndex={0}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleVerified()}
                                >
                                    <div className="toggle-thumb" />
                                </div>
                                <span className="font-mono text-[10px] text-[var(--muted)] tracking-[0.15em] uppercase">Verified only</span>
                            </div>
                            <span className="font-mono text-[10px] text-[var(--muted)] tracking-[0.15em]">{listingCount} LISTINGS</span>
                        </div>
                    </div>

                    {/* Bottom strip */}
                    <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {HERO_AVATARS.map((s) => (
                                    <img
                                        key={s}
                                        src={UNSPLASH(s, 120, 120)}
                                        className="w-11 h-11 rounded-full border-2 border-[var(--bg)] object-cover img-noir"
                                        alt=""
                                    />
                                ))}
                                <div className="w-11 h-11 rounded-full border-2 border-[var(--bg)] bg-[var(--accent)] flex items-center justify-center font-display text-sm text-black">
                                    +2K
                                </div>
                            </div>
                            <div>
                                <div className="font-mono text-[10px] text-[var(--muted)] tracking-[0.2em] uppercase">Verified Members</div>
                                <div className="font-heading text-sm text-[var(--fg)] tracking-wider">2,340 CNIC-verified</div>
                            </div>
                        </div>
                    </div>
                    </div>

                    {/* ---------- RIGHT: animated property orbit ---------- */}
                    <div className="reveal in-view">
                        <HeroOrbit />
                    </div>
                    </div>
                </div>

                {/* Marquee */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-black/60 backdrop-blur-sm py-3 overflow-hidden z-10">
                    <div className="marquee-track font-display text-sm tracking-[0.25em] text-[var(--silver-dim)]">
                        {Array.from({ length: 2 }).map((_, dup) => (
                            <React.Fragment key={dup}>
                                {['CNIC VERIFIED', 'NO MORE SCAMS', 'TRUST FIRST', 'ROOMMATE MATCHING', 'SECURE AGREEMENTS', 'DEPOSIT PROTECTION'].map((t) => (
                                    <span key={t + dup} className="px-8">{t}</span>
                                ))}
                                <span className="px-8 font-urdu">گھر dil se</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== STATS ===================== */}
            <section className="border-y border-[var(--border)] bg-[var(--bg-darker)] relative overflow-hidden">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-16 lg:py-20">
                    <div className="reveal-stagger grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
                        {[
                            { v: 2340, label: 'CNIC-verified members', color: 'text-[var(--verify-bright)]' },
                            { v: 847, label: 'Active listings', color: 'text-[var(--fg)]' },
                            { v: 612, label: 'Roommates matched', color: 'text-[var(--accent)]' },
                            { v: 5, label: 'Cities active', color: 'text-[var(--fg)]' },
                        ].map((s) => (
                            <div key={s.label} className="border-l border-[var(--border-light)] pl-6">
                                <div className={`font-display text-6xl md:text-7xl number-display ${s.color}`}>
                                    <Counter value={s.v} />
                                </div>
                                <div className="font-mono text-[11px] text-[var(--muted)] tracking-[0.2em] uppercase mt-2">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== VERIFICATION ===================== */}
            <section className="relative py-28 lg:py-36" id="verification">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
                    <div className="reveal grid lg:grid-cols-12 gap-8 mb-20">
                        <div className="lg:col-span-6">
                            <div className="section-marker mb-6">
                                <span>01 Verification</span>
                            </div>
                            <h2 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9] text-[var(--fg)]">
                                Real verification
                                <br />
                                <span className="text-stroke">Not just a label</span>
                                <br />
                                <span className="text-[var(--accent)]">Proof, not promise</span>
                            </h2>
                        </div>
                        <div className="lg:col-span-5 lg:col-start-8 flex flex-col justify-end">
                            <p className="text-[var(--fg-dim)] text-lg leading-relaxed">
                                Every Domavi member goes through a 3-step CNIC verification process. Here's exactly what happens — no
                                ambiguity, no shortcuts. This is what makes Domavi different from every other rental platform in Pakistan.
                            </p>
                        </div>
                    </div>

                    <div className="reveal-stagger grid md:grid-cols-3 gap-6 lg:gap-8">
                        {[
                            { n: '01', Icon: CreditCard, title: 'UPLOAD CNIC', body: 'Snap a clear photo of your CNIC front and back. Our system reads and validates the number in real time.', a: 'Time', av: '30 SEC', b: 'Format', bv: 'PHOTO', accent: false },
                            { n: '02', Icon: Camera, title: 'LIVE SELFIE', body: 'Take a live photo — we match it against your CNIC photo. No stored selfies, just a real-time match result.', a: 'Time', av: '15 SEC', b: 'Method', bv: 'FACE AI', accent: false },
                            { n: '03', Icon: null, title: 'VERIFIED LIVE', body: 'Your green "CNIC Verified" badge appears on your profile and listings. Landlords see it instantly — earned, not claimed.', a: 'Result', av: 'BADGE LIVE', b: 'Trust', bv: 'MAXIMUM', accent: true },
                        ].map((step) => (
                            <div key={step.n} className="info-card notch-corner p-7 group">
                                <div className="flex items-center justify-between mb-8">
                                    <div className={`font-mono text-[11px] tracking-[0.2em] ${step.accent ? 'text-[var(--verify)]' : 'text-[var(--accent)]'}`}>
                                        STEP {step.n}
                                    </div>
                                    <div
                                        className={`w-12 h-12 border flex items-center justify-center transition-colors ${
                                            step.accent ? 'border-[var(--verify-dim)] bg-[#1d5a3b]/20' : 'border-[var(--border-light)] group-hover:border-[var(--accent)]'
                                        }`}
                                    >
                                        {step.Icon ? <step.Icon className="text-[var(--accent)] w-5 h-5" /> : <VerifiedBadge className="w-6 h-6" />}
                                    </div>
                                </div>
                                <h3 className={`font-display text-4xl mb-3 ${step.accent ? 'text-[var(--verify-bright)]' : 'text-[var(--fg)]'}`}>{step.title}</h3>
                                <p className="text-[var(--fg-dim)] text-sm leading-relaxed mb-6">{step.body}</p>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-5 border-t border-[var(--border-light)]">
                                    <div>
                                        <div className="font-mono text-[10px] text-[var(--muted)] tracking-[0.2em] uppercase">{step.a}</div>
                                        <div className={`font-heading text-base ${step.accent ? 'text-[var(--verify-bright)]' : 'text-[var(--fg)]'}`}>{step.av}</div>
                                    </div>
                                    <div>
                                        <div className="font-mono text-[10px] text-[var(--muted)] tracking-[0.2em] uppercase">{step.b}</div>
                                        <div className="font-heading text-base text-[var(--fg)]">{step.bv}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== BROWSE BY GOAL ===================== */}
            <section className="relative py-28 lg:py-36 border-t border-[var(--border)] bg-[var(--bg-darker)]" id="browse">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
                    <div className="reveal grid lg:grid-cols-12 gap-8 mb-16">
                        <div className="lg:col-span-5">
                            <div className="section-marker mb-6">
                                <span>02 Browse</span>
                            </div>
                            <h2 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9] text-[var(--fg)]">
                                Three goals
                                <br />
                                <span className="text-stroke">One platform</span>
                                <br />
                                <span className="text-[var(--accent)]">your next home</span>
                            </h2>
                        </div>
                        <div className="lg:col-span-6 lg:col-start-7 flex flex-col justify-end">
                            <p className="text-[var(--fg-dim)] text-lg leading-relaxed mb-6">
                                Whether it's a single room, a full apartment, or your future best friend — start here. Every listing is CNIC-verified.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {GOALS.map((g) => (
                                    <button key={g.key} className={`goal-pill ${goal === g.key ? 'active' : ''}`} onClick={() => setGoal(g.key)}>
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Goal program cards */}
                    <div className="reveal-stagger grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
                        {[
                            { tag: '01 ROOM', Icon: HomeIcon, title: 'FIND A ROOM', body: 'Affordable rooms in verified homes near your campus or workplace. Private or shared options.', a: 'Price Range', av: '₨5K–20K', b: 'Availability', bv: '312 ROOMS', cta: 'Explore Rooms', badge: 'VERIFIED', badgeAccent: false, seed: 'photo-1505691938895-1758d7feb511', to: '/browse' },
                            { tag: '02 PLACE', Icon: Building2, title: 'RENT A PLACE', body: 'Apartments and houses with CNIC-verified landlords and digital rental agreements.', a: 'Price Range', av: '₨15K–60K', b: 'Availability', bv: '185 PLACES', cta: 'View Places', badge: 'VERIFIED', badgeAccent: false, seed: 'photo-1600596542815-ffad4c1539a9', to: '/browse' },
                            { tag: '03 ROOMMATE', Icon: UsersRound, title: 'FIND A ROOMMATE', body: 'Matched by lifestyle compatibility — sleep, study, cleanliness, social energy. Not just who is available.', a: 'Matching', av: 'AI-POWERED', b: 'Matched', bv: '612 PAIRS', cta: 'Try Matching', badge: 'MATCHING', badgeAccent: true, seed: 'photo-1522708323590-d24dbb6b0267', to: '#matching' },
                        ].map((c) => (
                            <article key={c.tag} className="program-card info-card notch-corner group">
                                <div className="relative h-72 overflow-hidden">
                                    <img src={UNSPLASH(c.seed, 800, 600)} className="program-img w-full h-full object-cover img-noir" alt={c.title} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
                                    <div className="absolute top-4 left-4 font-mono text-[11px] text-[var(--accent)] tracking-[0.2em]">{c.tag}</div>
                                    <div
                                        className={`absolute top-4 right-4 px-2 py-1 font-mono text-[10px] tracking-[0.15em] ${
                                            c.badgeAccent ? 'bg-[var(--accent)] text-black' : 'bg-[var(--verify)] text-white'
                                        }`}
                                    >
                                        {c.badge}
                                    </div>
                                </div>
                                <div className="p-7">
                                    <h3 className="font-display text-4xl mb-3 text-[var(--fg)]">{c.title}</h3>
                                    <p className="text-[var(--fg-dim)] text-sm leading-relaxed mb-6">{c.body}</p>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6 pb-6 border-b border-[var(--border-light)]">
                                        <div>
                                            <div className="font-mono text-[10px] text-[var(--muted)] tracking-[0.2em] uppercase">{c.a}</div>
                                            <div className="font-heading text-base text-[var(--fg)]">{c.av}</div>
                                        </div>
                                        <div>
                                            <div className="font-mono text-[10px] text-[var(--muted)] tracking-[0.2em] uppercase">{c.b}</div>
                                            <div className="font-heading text-base text-[var(--fg)]">{c.bv}</div>
                                        </div>
                                    </div>
                                    {c.to.startsWith('#') ? (
                                        <a href={c.to} className="flex items-center justify-between font-heading text-sm tracking-[0.15em] uppercase link-underline text-[var(--fg)]">
                                            <span>{c.cta}</span>
                                            <ArrowRight className="text-[var(--accent)] w-4 h-4" />
                                        </a>
                                    ) : (
                                        <Link to={c.to} className="flex items-center justify-between font-heading text-sm tracking-[0.15em] uppercase link-underline text-[var(--fg)]">
                                            <span>{c.cta}</span>
                                            <ArrowRight className="text-[var(--accent)] w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Sample listing cards */}
                    <div className="reveal-stagger grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredListings.map((l) => (
                            <div key={l.seed} className="listing-card info-card overflow-hidden">
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <img src={UNSPLASH(l.seed, 600, 450)} className="w-full h-full object-cover img-noir" alt={l.title} />
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[var(--verify)] text-white text-[10px] font-mono tracking-[0.15em] px-2.5 py-1">
                                        <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                                    </div>
                                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-[var(--fg)] text-[10px] font-mono tracking-[0.15em] px-2.5 py-1">{l.price}</div>
                                </div>
                                <div className="p-5">
                                    <h4 className="font-display text-xl mb-1 text-[var(--fg)]">{l.title}</h4>
                                    <p className="font-mono text-[10px] text-[var(--muted)] tracking-[0.15em] mb-4 flex items-center gap-1.5">
                                        <MapPin className="text-[var(--accent)] w-3 h-3" />
                                        {l.area}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <img src={UNSPLASH(l.hostSeed, 96, 96)} className="w-6 h-6 rounded-full object-cover img-noir" alt="" />
                                            <span className="font-mono text-[10px] text-[var(--fg-dim)]">{l.host}</span>
                                        </div>
                                        <div className="listing-actions flex items-center gap-3">
                                            <span className={`font-mono text-[10px] ${l.match === 'WHOLE' ? 'text-[var(--fg-dim)]' : 'text-[var(--verify-bright)]'}`}>{l.match}</span>
                                            <Link to="/browse" className="bg-[var(--accent)] text-black font-mono text-[10px] tracking-[0.15em] px-3 py-1.5 hover:bg-[var(--accent-bright)] transition-colors">
                                                CHAT
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== ROOMMATE MATCHING ===================== */}
            <section className="relative py-28 lg:py-36" id="matching">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
                    <div className="reveal grid lg:grid-cols-12 gap-8 mb-16">
                        <div className="lg:col-span-7">
                            <div className="section-marker mb-6">
                                <span>03 Roommate Matching</span>
                            </div>
                            <h2 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9] text-[var(--fg)]">
                                People who <span className="text-[var(--accent)]">fit</span>
                                <br />
                                your life <span className="text-stroke">Not just</span>
                                <br />
                                your budget
                            </h2>
                        </div>
                        <div className="lg:col-span-4 lg:col-start-9 flex flex-col justify-end">
                            <p className="text-[var(--fg-dim)] text-base leading-relaxed">
                                We match on sleep schedules, study habits, cleanliness, and social energy. Select your preferences to see your
                                match update in real time.
                            </p>
                        </div>
                    </div>

                    <div className="reveal grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">
                        {/* Preferences */}
                        <div className="lg:col-span-3 space-y-5">
                            {MATCH_ROWS.map((row) => (
                                <div key={row.key} className="info-card p-5">
                                    <div className="font-mono text-[11px] text-[var(--muted)] tracking-[0.2em] uppercase mb-3">{row.label}</div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {row.options.map((opt) => (
                                            <button
                                                key={opt}
                                                className={`pref-pill ${prefs[row.key] === opt ? 'selected' : ''}`}
                                                onClick={() => setPrefs((p) => ({ ...p, [row.key]: opt }))}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Live match result */}
                        <div className="lg:col-span-2 booking-frame p-8 flex flex-col items-center text-center">
                            <div className="relative w-[140px] h-[140px] mb-6">
                                <svg className="w-full h-full" viewBox="0 0 120 120">
                                    <circle className="match-ring-bg" cx="60" cy="60" r="52" strokeWidth="6" fill="none" />
                                    <circle
                                        className="match-ring-fill"
                                        cx="60"
                                        cy="60"
                                        r="52"
                                        strokeWidth="6"
                                        fill="none"
                                        stroke="var(--accent)"
                                        strokeLinecap="round"
                                        strokeDasharray={circ}
                                        strokeDashoffset={circ * (1 - matchScore / 100)}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="font-display text-5xl text-[var(--fg)] number-display">{matchScore}%</span>
                                    <span className="font-mono text-[9px] text-[var(--muted)] tracking-[0.2em] uppercase">Match</span>
                                </div>
                            </div>
                            <p className="font-heading text-lg text-[var(--fg)] tracking-wide mb-1">
                                {answered === 0 ? 'PICK YOUR PREFERENCES' : answered < 4 ? 'GETTING WARMER…' : 'STRONG MATCH FOUND'}
                            </p>
                            <p className="font-mono text-[10px] text-[var(--muted)] tracking-[0.15em] mb-6">
                                {answered}/4 preferences set
                            </p>

                            <div className="w-full space-y-4 mb-7">
                                {Object.entries(compat).map(([k, v]) => (
                                    <div key={k}>
                                        <div className="flex justify-between font-mono text-[10px] text-[var(--fg-dim)] tracking-[0.15em] uppercase mb-1.5">
                                            <span>{k}</span>
                                            <span className="text-[var(--accent)]">{v}%</span>
                                        </div>
                                        <div className="h-1 bg-[var(--border-light)] overflow-hidden">
                                            <div className="compat-bar-fill h-full bg-[var(--accent)]" style={{ width: `${v}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Link
                                to="/auth"
                                className="w-full font-heading text-xs tracking-[0.2em] uppercase text-black bg-[var(--accent)] px-6 py-3 hover:bg-[var(--accent-bright)] transition-colors text-center"
                            >
                                Find My Roommate
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== TRUST & SAFETY ===================== */}
            <section className="relative py-28 lg:py-36 border-t border-[var(--border)] bg-[var(--bg-darker)]" id="trust">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
                    <div className="reveal mb-16">
                        <div className="section-marker mb-6">
                            <span>04 Trust &amp; Safety</span>
                        </div>
                        <h2 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9] max-w-4xl text-[var(--fg)]">
                            Built so you never have to <span className="text-[var(--accent)]">worry</span>
                        </h2>
                    </div>
                    <div className="reveal-stagger grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { Icon: ShieldCheck, title: 'CNIC VERIFIED', body: 'Both tenants and landlords verify identity before they can list or message.' },
                            { Icon: CreditCard, title: 'SECURE AGREEMENTS', body: 'Digital rental agreements signed and counter-signed inside Domavi.' },
                            { Icon: Quote, title: 'IN-APP CHAT', body: 'Talk safely without sharing your number until you choose to.' },
                            { Icon: Star, title: 'DEPOSIT PROTECTION', body: 'Your deposit is tracked and protected until you are settled in.' },
                        ].map((f) => (
                            <div key={f.title} className="info-card notch-corner p-7 group">
                                <div className="w-12 h-12 border border-[var(--border-light)] flex items-center justify-center mb-6 group-hover:border-[var(--accent)] transition-colors">
                                    <f.Icon className="text-[var(--accent)] w-5 h-5" />
                                </div>
                                <h3 className="font-display text-2xl mb-2 text-[var(--fg)]">{f.title}</h3>
                                <p className="text-[var(--fg-dim)] text-sm leading-relaxed">{f.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== MEMBER STORIES ===================== */}
            <section className="relative py-28 lg:py-36" id="stories">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 mb-12">
                    <div className="reveal grid lg:grid-cols-12 gap-8 items-end">
                        <div className="lg:col-span-8">
                            <div className="section-marker mb-6">
                                <span>05 Member Stories</span>
                            </div>
                            <h2 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9] text-[var(--fg)]">
                                Real people <span className="text-stroke">Real homes</span>
                            </h2>
                        </div>
                        <div className="lg:col-span-4 flex lg:justify-end">
                            <p className="font-mono text-[11px] text-[var(--muted)] tracking-[0.15em] uppercase">Drag to explore →</p>
                        </div>
                    </div>
                </div>

                <div
                    ref={trackRef}
                    className="story-track px-6 lg:px-10 overflow-x-auto pb-4"
                    style={{ scrollbarWidth: 'none' }}
                    onPointerDown={onDragDown}
                    onPointerMove={onDragMove}
                    onPointerUp={onDragUp}
                    onPointerLeave={onDragUp}
                >
                    {STORIES.map((s) => (
                        <div key={s.seed} className="story-card">
                            <div className="relative h-56 overflow-hidden">
                                <img src={UNSPLASH(s.seed, 600, 400)} className="w-full h-full object-cover img-noir" alt={s.name} draggable={false} />
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
                                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[var(--verify)] text-white text-[10px] font-mono tracking-[0.15em] px-2.5 py-1">
                                    <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                                </div>
                            </div>
                            <div className="p-7">
                                <Quote className="text-[var(--accent)] w-7 h-7 mb-4" />
                                <p className="text-[var(--fg-dim)] text-sm leading-relaxed mb-6">"{s.quote}"</p>
                                <div className="flex items-center gap-2 mb-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="w-3.5 h-3.5 fill-[var(--accent)] text-[var(--accent)]" />
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-[var(--border-light)]">
                                    <p className="font-display text-xl text-[var(--fg)]">{s.name}</p>
                                    <p className="font-mono text-[10px] text-[var(--muted)] tracking-[0.15em] uppercase mt-0.5">{s.meta}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===================== BOOK / CTA ===================== */}
            <section className="relative py-28 lg:py-36 border-t border-[var(--border)] bg-[var(--bg-darker)]" id="cta">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
                    <div className="reveal booking-frame p-10 lg:p-20 text-center">
                        <div className="section-marker justify-center mb-6 flex">
                            <span>Get Started</span>
                        </div>
                        <h2 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9] mb-6 text-[var(--fg)]">
                            Ready to find a home <br />
                            <span className="text-[var(--accent)]">you can trust?</span>
                        </h2>
                        <p className="text-[var(--fg-dim)] text-lg max-w-xl mx-auto mb-10">
                            Get CNIC-verified in 2 minutes and join 2,340+ members who found their place — and their people — on Domavi.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/auth"
                                className="font-heading text-sm tracking-[0.2em] uppercase text-black bg-[var(--accent)] px-10 py-4 hover:bg-[var(--accent-bright)] transition-colors pulse-btn"
                            >
                                Get Verified Now
                            </Link>
                            <Link
                                to="/browse"
                                className="font-heading text-sm tracking-[0.2em] uppercase text-[var(--fg)] border border-[var(--border-light)] px-10 py-4 hover:border-[var(--accent)] transition-colors"
                            >
                                Browse Listings
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
