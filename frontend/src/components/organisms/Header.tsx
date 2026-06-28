import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    LogOut,
    LayoutDashboard,
    ShieldCheck,
    CalendarCheck,
    Home,
    Users,
    MessageCircle,
    CreditCard,
    UserCheck,
    Star,
    Building2,
    BarChart3,
    Search,
    Menu,
    X,
    MapPin,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useChatStore } from '../../store/chat.store';
import { UserRole } from '@shared/types';

type NavItem = { label: string; path: string; icon: React.ElementType };

const Header: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const { unreadCount, fetchUnreadCount } = useChatStore();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isAuthenticated) fetchUnreadCount();
    }, [isAuthenticated]);

    // Public (logged-out) dark header: switch to solid blur after scrolling past the hero edge.
    useEffect(() => {
        if (isAuthenticated) return;
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [isAuthenticated]);

    const displayName = useMemo(
        () => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Account',
        [user?.firstName, user?.lastName, user?.email]
    );

    // Role-based top nav links
    const navLinks = useMemo<NavItem[]>(() => {
        if (!isAuthenticated || !user?.role) {
            return [{ label: 'Browse', path: '/browse', icon: Search }];
        }
        if (user.role === UserRole.TENANT) {
            return [
                { label: 'Browse', path: '/browse', icon: Home },
                { label: 'Matches', path: '/roommate-matches', icon: Star },
                { label: 'My Profile', path: '/roommate-profile', icon: UserCheck },
            ];
        }
        if (user.role === UserRole.LANDLORD) {
            return [
                { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { label: 'Properties', path: '/dashboard/properties', icon: Building2 },
                { label: 'Bookings', path: '/dashboard/requests', icon: CalendarCheck },
            ];
        }
        if (user.role === UserRole.ADMIN) {
            return [
                { label: 'Admin', path: '/admin', icon: ShieldCheck },
                { label: 'Users', path: '/admin/users', icon: Users },
                { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
            ];
        }
        return [];
    }, [isAuthenticated, user?.role]);

    // Dropdown menu items (role-specific)
    const dropdownItems = useMemo<NavItem[]>(() => {
        if (!user?.role) return [];
        if (user.role === UserRole.TENANT) {
            return [
                { label: 'Browse Properties', path: '/browse', icon: Home },
                { label: 'Roommate Matches', path: '/roommate-matches', icon: Star },
                { label: 'My Bookings', path: '/my-bookings', icon: CalendarCheck },
                { label: 'Messages', path: '/messages', icon: MessageCircle },
                { label: 'Payments', path: '/payments', icon: CreditCard },
                { label: 'Roommate Profile', path: '/roommate-profile', icon: UserCheck },
            ];
        }
        if (user.role === UserRole.LANDLORD) {
            return [
                { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                { label: 'My Properties', path: '/dashboard/properties', icon: Building2 },
                { label: 'Booking Requests', path: '/dashboard/requests', icon: CalendarCheck },
                { label: 'Messages', path: '/messages', icon: MessageCircle },
                { label: 'Payments', path: '/payments', icon: CreditCard },
            ];
        }
        if (user.role === UserRole.ADMIN) {
            return [
                { label: 'Admin Dashboard', path: '/admin', icon: ShieldCheck },
                { label: 'Manage Users', path: '/admin/users', icon: Users },
                { label: 'Properties', path: '/admin/properties', icon: Building2 },
                { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
                { label: 'Payments', path: '/admin/payments', icon: CreditCard },
            ];
        }
        return [];
    }, [user?.role]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        if (menuOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const handleLogout = async () => {
        await logout();
        setMenuOpen(false);
        navigate('/');
    };

    const menuItem = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors';

    // ── Public (logged-out) header — DOMAVI dark marketing nav ──────────
    if (!isAuthenticated) {
        const publicLinks = [
            { label: 'Verification', href: '/#verification' },
            { label: 'Browse', to: '/browse' },
            { label: 'Matching', href: '/#matching' },
            { label: 'Safety', href: '/#trust' },
            { label: 'Stories', href: '/#stories' },
        ];
        const closeMobile = () => setMobileOpen(false);

        return (
            <header
                className={`domavi-dark fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
                    scrolled ? 'nav-scrolled' : 'border-white/5 bg-black/50'
                }`}
            >
                <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <span className="w-9 h-9 bg-[var(--accent)] flex items-center justify-center relative shrink-0">
                            <Home className="text-black w-4 h-4" />
                            <span className="absolute -inset-1 border border-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span>
                            <span className="block font-display text-2xl leading-none tracking-wider text-[var(--fg)]">DOMAVI</span>
                            <span className="block font-mono text-[10px] text-[var(--muted)] tracking-[0.3em] mt-0.5">
                                TRUST · HOME · <span className="font-urdu">گھر</span>
                            </span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden lg:flex items-center gap-10">
                        {publicLinks.map((l) =>
                            l.to ? (
                                <Link key={l.label} to={l.to} className="nav-link">
                                    {l.label}
                                </Link>
                            ) : (
                                <a key={l.label} href={l.href} className="nav-link">
                                    {l.label}
                                </a>
                            )
                        )}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-5">
                        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-[var(--muted)]">
                            <MapPin className="w-3 h-3 text-[var(--accent)]" />
                            <span>MULTAN · BZU · PAKISTAN</span>
                        </div>
                        <Link
                            to="/auth"
                            className="hidden sm:inline-flex items-center font-heading text-xs tracking-[0.2em] uppercase text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/auth"
                            className="hidden sm:inline-block font-heading text-xs tracking-[0.2em] uppercase text-black bg-[var(--accent)] px-5 py-2.5 hover:bg-[var(--accent-bright)] transition-colors"
                        >
                            Get Verified
                        </Link>
                        <button
                            type="button"
                            className="lg:hidden p-2"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu className="text-[var(--fg-dim)]" size={20} />
                        </button>
                    </div>
                </div>

                {/* Mobile backdrop + drawer */}
                <div
                    className={`mobile-backdrop fixed inset-0 bg-black/60 z-40 ${mobileOpen ? 'show' : ''}`}
                    onClick={closeMobile}
                    aria-hidden
                />
                <div
                    className={`mobile-drawer fixed top-0 right-0 bottom-0 w-72 bg-[var(--bg-card)] z-50 p-6 flex flex-col border-l border-[var(--border)] ${
                        mobileOpen ? 'open' : ''
                    }`}
                >
                    <button
                        type="button"
                        className="self-end mb-8 p-2 hover:bg-[var(--bg-card-hover)] transition-colors"
                        onClick={closeMobile}
                        aria-label="Close menu"
                    >
                        <X className="text-[var(--fg-dim)]" size={18} />
                    </button>
                    <nav className="flex flex-col gap-1">
                        {publicLinks.map((l) =>
                            l.to ? (
                                <Link key={l.label} to={l.to} onClick={closeMobile} className="nav-link py-3 px-2">
                                    {l.label}
                                </Link>
                            ) : (
                                <a key={l.label} href={l.href} onClick={closeMobile} className="nav-link py-3 px-2">
                                    {l.label}
                                </a>
                            )
                        )}
                    </nav>
                    <div className="mt-auto">
                        <Link
                            to="/auth"
                            onClick={closeMobile}
                            className="block text-center font-heading text-xs tracking-[0.2em] uppercase text-black bg-[var(--accent)] px-5 py-3 hover:bg-[var(--accent-bright)] transition-colors"
                        >
                            Get Verified
                        </Link>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 font-black text-slate-900 shrink-0">
                    <motion.span
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-black shadow-md shadow-primary-200"
                    >
                        R
                    </motion.span>
                    <span className="text-base tracking-tight">Domavi</span>
                </Link>

                {/* Role-based nav links */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            end={link.path === '/dashboard' || link.path === '/admin'}
                            className={({ isActive }) =>
                                `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                    isActive
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`
                            }
                        >
                            <link.icon size={14} />
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                {/* Right side: Sign In or Avatar */}
                <div className="flex items-center gap-2">
                    {!isAuthenticated ? (
                        <NavLink
                            to="/auth"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-200 transition hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5"
                        >
                            Sign In
                        </NavLink>
                    ) : (
                        <div ref={menuRef} className="relative ml-1">
                            <motion.button
                                type="button"
                                onClick={() => setMenuOpen((p) => !p)}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xs font-bold">
                                    {user?.firstName?.[0] || 'U'}
                                </span>
                                <span className="hidden sm:block max-w-[130px] truncate">{displayName}</span>
                                <ChevronDown
                                    size={14}
                                    className={`text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                                />
                            </motion.button>

                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                                        className="absolute right-0 mt-2.5 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
                                    >
                                        {/* Identity header */}
                                        <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/60">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                                            <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role}</p>
                                        </div>

                                        <div className="p-2 space-y-0.5">
                                            {dropdownItems.map((item) => (
                                                <Link
                                                    key={item.path}
                                                    to={item.path}
                                                    onClick={() => setMenuOpen(false)}
                                                    className={menuItem}
                                                >
                                                    <div className="relative">
                                                        <item.icon size={15} />
                                                        {item.path === '/messages' && unreadCount > 0 && (
                                                            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                                                                {unreadCount > 9 ? '9+' : unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span>{item.label}</span>
                                                    {item.path === '/messages' && unreadCount > 0 && (
                                                        <span className="ml-auto text-xs font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                                            {unreadCount}
                                                        </span>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="border-t border-slate-100 p-2">
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut size={15} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Header;
