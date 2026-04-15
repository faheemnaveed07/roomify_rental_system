import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Menu, Home } from 'lucide-react';

const TopBar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
    const { user } = useAuthStore();

    return (
        <header className="h-16 bg-white border-b border-slate-100 px-5 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    aria-label="Open sidebar menu"
                    className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg lg:hidden transition-colors"
                >
                    <Menu size={19} />
                </button>

                <Link
                    to="/"
                    className="hidden lg:inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
                >
                    <Home size={13} />
                    Back to site
                </Link>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900 leading-tight">
                        {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11px] text-slate-400 capitalize">{user?.role}</p>
                </div>
                <div className="h-9 w-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-primary-200">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
