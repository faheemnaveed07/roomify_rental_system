import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAgreementStore } from '../../store/agreement.store';
import { useAuthStore } from '../../store/auth.store';
import { useSocket } from '../../hooks/useSocket';

const DashboardLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const fetchLandlordAgreements = useAgreementStore((s) => s.fetchLandlordAgreements);
    const user = useAuthStore((s) => s.user);
    const { onAgreementNotification, isConnected } = useSocket({ userId: user?.id });

    // Load the landlord's agreements once so the sidebar "Agreements" badge is
    // accurate on every dashboard page (socket events refresh it thereafter).
    useEffect(() => {
        fetchLandlordAgreements();
    }, [fetchLandlordAgreements]);

    // Real-time: a tenant signing (or the lease becoming fully executed) toasts
    // the landlord and refreshes the badge/list without a manual reload.
    useEffect(() => {
        if (!isConnected) return;
        return onAgreementNotification((event, data) => {
            if (event === 'agreement:awaiting-signature') {
                toast.info(
                    `${data?.tenantName ?? 'A tenant'} signed the lease for ${data?.propertyTitle ?? 'a property'} — review & sign.`
                );
            } else {
                toast.success(`Lease for ${data?.propertyTitle ?? 'your property'} is now fully signed.`);
            }
            fetchLandlordAgreements();
        });
    }, [isConnected, onAgreementNotification, fetchLandlordAgreements]);

    return (
        <div className="dv-app flex h-screen bg-[#F8FAFC]">
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
