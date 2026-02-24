import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
    ShieldCheck,
    Users,
    BarChart3,
    LogOut,
    X
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

interface AdminSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle }) => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const navItems = [
        { icon: <ShieldCheck size={20} />, label: 'Pending Approvals', path: '/admin' },
        { icon: <Users size={20} />, label: 'Manage Users', path: '/admin/users' },
        { icon: <BarChart3 size={20} />, label: 'Property Analytics', path: '/admin/analytics' },
    ];

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 lg:static lg:inset-0`}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between h-20 px-6">
                    <Link to="/" className="flex items-center gap-3 font-black text-slate-900">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md">
                            R
                        </span>
                        <span className="text-lg tracking-tight">Roomify</span>
                    </Link>
                    <button
                        type="button"
                        aria-label="Close admin sidebar"
                        onClick={onToggle}
                        className="lg:hidden text-slate-400 hover:text-slate-700"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="px-6">
                    <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">Admin Console</p>
                        <p className="text-sm text-slate-600 mt-1">Review, approve, and monitor listings.</p>
                        <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
                        >
                            Go to Approvals
                        </button>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                                    isActive
                                        ? 'bg-primary-50 text-primary-700 border border-primary-100 shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="font-semibold">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all"
                    >
                        <LogOut size={20} />
                        <span className="font-semibold">Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
