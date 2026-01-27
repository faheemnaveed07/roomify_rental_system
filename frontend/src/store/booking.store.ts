import { create } from 'zustand';
import { IBooking, IProperty, LandlordStatistics } from '@shared/types';
import { landlordService, bookingService } from '../services/api';

interface BookingState {
    bookings: IBooking[];
    stats: LandlordStatistics | null;
    myProperties: IProperty[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchDashboardData: () => Promise<void>;
    approveBooking: (bookingId: string, message?: string) => Promise<void>;
    rejectBooking: (bookingId: string, message?: string) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
    bookings: [],
    stats: null,
    myProperties: [],
    loading: false,
    error: null,

    fetchDashboardData: async () => {
        set({ loading: true, error: null });
        try {
            const [stats, properties, bookingsData] = await Promise.all([
                landlordService.getStats(),
                landlordService.getMyProperties(),
                landlordService.getBookings()
            ]);

            set({
                stats,
                myProperties: properties,
                bookings: bookingsData, // Assuming getBookings returns the array directly or we adjust based on response
                loading: false
            });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    approveBooking: async (bookingId: string, message?: string) => {
        set({ loading: true, error: null });
        try {
            await bookingService.updateStatus(bookingId, 'approved', message);
            // Refresh data after approval
            await get().fetchDashboardData();
        } catch (error: any) {
            console.error('Approval failed:', error);
            // If the error is about already being processed, we can just refresh and ignore
            if (error.message?.includes('already processed') || error.message?.includes('already approved')) {
                await get().fetchDashboardData();
            } else {
                set({ error: error.message, loading: false });
            }
        }
    },

    rejectBooking: async (bookingId: string, message?: string) => {
        set({ loading: true, error: null });
        try {
            await bookingService.updateStatus(bookingId, 'rejected', message);
            // Refresh data after rejection
            await get().fetchDashboardData();
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    }
}));
