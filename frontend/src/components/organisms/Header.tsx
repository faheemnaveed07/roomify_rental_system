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
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isAuthenticated) fetchUnreadCount();
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
                    <span className="text-base tracking-tight">Roomify</span>
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
