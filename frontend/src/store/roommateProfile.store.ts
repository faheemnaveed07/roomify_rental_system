import { create } from 'zustand';
import { toast } from 'sonner';
import { roommateProfileService } from '../services/api';
import { IRoommateProfileForm, IRoommateProfileResponse } from '../types/roommate.types';

interface RoommateProfileState {
    profile: IRoommateProfileResponse | null;
    hasProfile: boolean;
    loading: boolean;
    error: string | null;
    fetchProfile: () => Promise<void>;
    createProfile: (data: IRoommateProfileForm) => Promise<boolean>;
    updateProfile: (data: Partial<IRoommateProfileForm>) => Promise<boolean>;
    clearError: () => void;
}

export const useRoommateProfileStore = create<RoommateProfileState>((set) => ({
    profile: null,
    hasProfile: false,
    loading: false,
    error: null,

    fetchProfile: async () => {
        set({ loading: true, error: null });
        try {
            const profile = await roommateProfileService.getProfile();
            set({ profile, hasProfile: profile !== null, loading: false });
        } catch {
            set({ loading: false, error: 'Failed to fetch profile' });
        }
    },

    createProfile: async (data: IRoommateProfileForm) => {
        set({ loading: true, error: null });
        try {
            const profile = await roommateProfileService.createProfile(data);
            set({ profile, hasProfile: true, loading: false });
            toast.success('Roommate profile created! You can now see matched properties.');
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create profile';
            set({ loading: false, error: message });
            toast.error(message);
            return false;
        }
    },

    updateProfile: async (data: Partial<IRoommateProfileForm>) => {
        set({ loading: true, error: null });
        try {
            const profile = await roommateProfileService.updateProfile(data);
            set({ profile, hasProfile: true, loading: false });
            toast.success('Roommate profile updated successfully!');
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update profile';
            set({ loading: false, error: message });
            toast.error(message);
            return false;
        }
    },

    clearError: () => set({ error: null }),
}));
