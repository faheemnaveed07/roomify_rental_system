import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
    ];

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1E293B] text-white transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 lg:static lg:inset-0`}
        >
            <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-20 px-6 bg-[#0F172A]">
                    <span className="text-2xl font-bold tracking-tight text-[#2563EB]">Roomify</span>
                    <button type="button" aria-label="Close sidebar" onClick={onToggle} className="lg:hidden text-neutral-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Quick Action Button */}
                <div className="px-4 py-6">
                    <button
                        onClick={() => navigate('/dashboard/properties/new')}
                        className="flex items-center justify-center w-full gap-2 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/20"
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
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20'
                                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-neutral-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
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
