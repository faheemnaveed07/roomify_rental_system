import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <TopBar onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default DashboardLayout;
