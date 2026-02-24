import React from 'react';
import { useAuthStore } from '../../store/auth.store';
import { Bell, Search, Menu } from 'lucide-react';

const TopBar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
    const { user } = useAuthStore();

    return (
        <header className="h-20 bg-white border-b border-neutral-200 px-6 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    aria-label="Open dashboard menu"
                    className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg lg:hidden"
                >
                    <Menu size={20} />
                </button>

                {/* Search Bar Placeholder */}
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-neutral-100 rounded-xl w-64 focus-within:ring-2 focus-within:ring-primary-500 transition-all border border-transparent focus-within:bg-white">
                    <Search size={18} className="text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search dashboard..."
                        className="bg-transparent border-none outline-none text-sm w-full text-neutral-600"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    aria-label="Notifications"
                    className="p-2.5 text-neutral-500 hover:bg-neutral-100 rounded-xl relative transition-all"
                >
                    <Bell size={20} />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#2563EB] rounded-full border-2 border-white"></span>
                </button>

                <div className="h-8 w-px bg-neutral-200 mx-2"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-[#1E293B]">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
                    </div>
                    <div className="h-10 w-10 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
