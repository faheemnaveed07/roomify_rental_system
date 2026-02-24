import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    ChevronDown,
    LogOut,
    LayoutDashboard,
    ShieldCheck,
    CalendarCheck,
    Sparkles,
    Home,
    Users
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { UserRole } from '@shared/types';

const Header: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const displayName = useMemo(() => {
        return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Account';
    }, [user?.firstName, user?.lastName, user?.email]);

    const quickAccess = useMemo(() => {
        if (!user?.role) return null;
        if (user.role === UserRole.ADMIN) {
            return { label: 'Admin Panel', path: '/admin', icon: ShieldCheck };
        }
        if (user.role === UserRole.LANDLORD) {
            return { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard };
        }
        return { label: 'My Bookings', path: '/my-bookings', icon: CalendarCheck };
    }, [user?.role]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const handleLogout = async () => {
        await logout();
        setMenuOpen(false);
        navigate('/');
    };

    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur">
            <div className="relative">
                <div className="absolute inset-0 pointer-events-none">
                    <svg
                        className="absolute right-0 top-0 h-full w-[38rem] opacity-60"
                        viewBox="0 0 760 160"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id="headerGlow" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#DBEAFE" />
                                <stop offset="55%" stopColor="#EFF6FF" />
                                <stop offset="100%" stopColor="#FEF3C7" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M0 30C120 10 260 50 380 40C500 30 580 -20 760 10V160H0V30Z"
                            fill="url(#headerGlow)"
                        />
                    </svg>
                </div>

                <div className="container relative z-10 flex h-16 items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 font-black text-slate-900">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md">
                            R
                        </span>
                        <span className="text-lg tracking-tight">Roomify</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <NavLink
                            to="/browse"
                            className={({ isActive }) =>
                                `hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                                    isActive
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`
                            }
                        >
                            <Home size={16} />
                            Browse
                        </NavLink>

                        {isAuthenticated && quickAccess && (
                            <NavLink
                                to={quickAccess.path}
                                className={({ isActive }) =>
                                    `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                        isActive
                                            ? 'border-primary-300 bg-primary-50 text-primary-700'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:text-primary-700'
                                    }`
                                }
                            >
                                <Sparkles size={16} />
                                Quick Access: {quickAccess.label}
                            </NavLink>
                        )}

                        {!isAuthenticated ? (
                            <NavLink
                                to="/auth"
                                className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                            >
                                Sign In
                            </NavLink>
                        ) : (
                            <div ref={menuRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-200"
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white font-bold">
                                        {user?.firstName?.[0] || 'U'}
                                    </span>
                                    <span className="hidden sm:block max-w-[140px] truncate">{displayName}</span>
                                    <ChevronDown size={16} className={menuOpen ? 'rotate-180 transition' : 'transition'} />
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                                        <div className="px-4 py-3 border-b border-slate-100">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                                            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            {quickAccess && (
                                                <Link
                                                    to={quickAccess.path}
                                                    onClick={() => setMenuOpen(false)}
                                                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
                                                >
                                                    <quickAccess.icon size={16} />
                                                    {quickAccess.label}
                                                </Link>
                                            )}
                                            <Link
                                                to="/browse"
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                            >
                                                <Home size={16} />
                                                Browse Properties
                                            </Link>
                                            {user?.role === UserRole.TENANT && (
                                                <Link
                                                    to="/my-bookings"
                                                    onClick={() => setMenuOpen(false)}
                                                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                                >
                                                    <CalendarCheck size={16} />
                                                    My Bookings
                                                </Link>
                                            )}
                                            {user?.role === UserRole.LANDLORD && (
                                                <Link
                                                    to="/dashboard"
                                                    onClick={() => setMenuOpen(false)}
                                                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                                >
                                                    <LayoutDashboard size={16} />
                                                    Landlord Dashboard
                                                </Link>
                                            )}
                                            {user?.role === UserRole.ADMIN && (
                                                <Link
                                                    to="/admin/users"
                                                    onClick={() => setMenuOpen(false)}
                                                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                                >
                                                    <Users size={16} />
                                                    Manage Users
                                                </Link>
                                            )}
                                        </div>
                                        <div className="border-t border-slate-100 p-2">
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                <LogOut size={16} />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
