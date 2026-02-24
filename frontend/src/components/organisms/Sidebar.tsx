import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Home,
    CalendarCheck,
    PlusCircle,
    LogOut,
    X
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/dashboard' },
        { icon: <Home size={20} />, label: 'My Properties', path: '/dashboard/properties' },
        { icon: <CalendarCheck size={20} />, label: 'Booking Requests', path: '/dashboard/requests' },
        { icon: <PlusCircle size={20} />, label: 'Add Property', path: '/add-property' },
    ];

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 lg:static lg:inset-0`}
        >
            <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-20 px-6">
                    <Link to="/" className="flex items-center gap-3 font-black text-slate-900">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md">
                            R
                        </span>
                        <span className="text-lg tracking-tight">Roomify</span>
                    </Link>
                    <button type="button" aria-label="Close sidebar" onClick={onToggle} className="lg:hidden text-slate-400 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                {/* Quick Action Button */}
                <div className="px-4 py-6">
                    <button
                        onClick={() => navigate('/add-property')}
                        className="flex items-center justify-center w-full gap-2 py-3 bg-primary-600 hover:bg-primary-700 rounded-2xl font-semibold transition-all shadow-sm"
                    >
                        <PlusCircle size={20} />
                        <span>Add Property</span>
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive
                                    ? 'bg-primary-50 text-primary-700 border border-primary-100 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
