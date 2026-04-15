import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Building2, CalendarCheck, PlusCircle, LogOut, X, MessageCircle, CreditCard } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const navGroups = [
    {
        label: 'Overview',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', end: true },
        ],
    },
    {
        label: 'Management',
        items: [
            { icon: Building2, label: 'My Properties', path: '/dashboard/properties', end: false },
            { icon: CalendarCheck, label: 'Booking Requests', path: '/dashboard/requests', end: false },
            { icon: MessageCircle, label: 'Messages', path: '/messages', end: false },
            { icon: CreditCard, label: 'Payments', path: '/payments', end: false },
        ],
    },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transform transition-transform duration-300 ease-smooth ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 lg:static lg:inset-0`}
        >
            <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100">
                <Link to="/" className="flex items-center gap-2.5 font-black text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-black shadow-md shadow-primary-200">R</span>
                    <span className="text-base tracking-tight">Roomify</span>
                </Link>
                <button type="button" aria-label="Close sidebar" onClick={onToggle}
                    className="lg:hidden text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="px-4 pt-5 pb-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/add-property')}
                    className="flex items-center justify-center w-full gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-primary-200">
                    <PlusCircle size={16} />
                    Add Property
                </motion.button>
            </div>

            <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-4">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        <p className="px-3.5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{group.label}</p>
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                                            isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
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

            <div className="px-3 pb-4 pt-2 border-t border-slate-100">
                <button onClick={logout}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
                    <LogOut size={17} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;