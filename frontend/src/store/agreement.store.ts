import { create } from 'zustand';
import { agreementService } from '../services/api';

export type AgreementStatus = 'generated' | 'signed';

export interface Agreement {
    _id: string;
    booking: string;
    tenant: string;
    landlord: string;
    property: string;
    status: AgreementStatus;
    pdfPath: string;
    pdfUrl: string;
    tenantSignedAt?: string;
    landlordSignedAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface AgreementStore {
    agreement: Agreement | null;
    loading: boolean;
    generating: boolean;
    signing: boolean;
    error: string | null;

    generate: (bookingId: string) => Promise<Agreement>;
    fetchByBooking: (bookingId: string) => Promise<void>;
    sign: (agreementId: string) => Promise<void>;
    download: (agreementId: string, bookingId: string) => Promise<void>;
    clearError: () => void;
    reset: () => void;
}

export const useAgreementStore = create<AgreementStore>((set) => ({
    agreement: null,
    loading: false,
    generating: false,
    signing: false,
    error: null,

    generate: async (bookingId: string): Promise<Agreement> => {
        set({ generating: true, error: null });
        try {
            const agreement = await agreementService.generate(bookingId);
            set({ agreement, generating: false });
            return agreement;
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to generate agreement';
            set({ generating: false, error: message });
            throw new Error(message);
        }
    },

    fetchByBooking: async (bookingId: string): Promise<void> => {
        set({ loading: true, error: null });
        try {
            const agreement = await agreementService.getByBooking(bookingId);
            set({ agreement, loading: false });
        } catch (err: any) {
            // 404 means no agreement yet — not a real error
            if (err.response?.status === 404) {
                set({ agreement: null, loading: false });
            } else {
                const message = err.response?.data?.message || err.message || 'Failed to fetch agreement';
                set({ loading: false, error: message });
            }
        }
    },

    sign: async (agreementId: string): Promise<void> => {
        set({ signing: true, error: null });
        try {
            const updated = await agreementService.sign(agreementId);
            set({ agreement: updated, signing: false });
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to sign agreement';
            set({ signing: false, error: message });
            throw new Error(message);
        }
    },

    download: async (agreementId: string, bookingId: string): Promise<void> => {
        try {
            const blob = await agreementService.download(agreementId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lease-agreement-${bookingId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to download agreement';
            set({ error: message });
            throw new Error(message);
        }
    },

    clearError: () => set({ error: null }),
    reset: () => set({ agreement: null, loading: false, generating: false, signing: false, error: null }),
}));
