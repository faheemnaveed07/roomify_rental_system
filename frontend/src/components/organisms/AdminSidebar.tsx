import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    ShieldCheck,
    Users,
    BarChart3,
    CreditCard,
    Building2,
    LogOut,
    X,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

interface AdminSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const navGroups = [
    {
        label: 'Overview',
        items: [
            { icon: ShieldCheck, label: 'Pending Approvals', path: '/admin', end: true },
        ],
    },
    {
        label: 'Management',
        items: [
            { icon: Users, label: 'Manage Users', path: '/admin/users', end: false },
            { icon: Building2, label: 'Properties', path: '/admin/properties', end: false },
            { icon: CreditCard, label: 'Payment Verifications', path: '/admin/payments', end: false },
        ],
    },
    {
        label: 'Analytics',
        items: [
            { icon: BarChart3, label: 'Analytics', path: '/admin/analytics', end: false },
        ],
    },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle }) => {
    const { logout } = useAuthStore();

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transform transition-transform duration-300 ease-smooth ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 lg:static lg:inset-0`}
        >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100">
                <Link to="/" className="flex items-center gap-2.5 font-black text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-black shadow-md shadow-primary-200">
                        R
                    </span>
                    <span className="text-base tracking-tight">Roomify</span>
                </Link>
                <button
                    type="button"
                    aria-label="Close admin sidebar"
                    onClick={onToggle}
                    className="lg:hidden text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Admin badge */}
            <div className="px-4 pt-4 pb-3">
                <div className="rounded-xl border border-primary-100 bg-primary-50 px-3.5 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-600">Admin Console</p>
                    <p className="text-xs text-slate-500 mt-0.5">Review, approve & monitor</p>
                </div>
            </div>

            {/* Grouped nav */}
            <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-4">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        <p className="px-3.5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            {group.label}
                        </p>
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                                            isActive
                                                ? 'bg-primary-50 text-primary-700 font-semibold'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon size={17} className={isActive ? 'text-primary-600' : ''} />
                                            {item.label}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Sign out */}
            <div className="px-3 pb-4 pt-2 border-t border-slate-100">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                >
                    <LogOut size={17} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
