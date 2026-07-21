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

/** Agreement as returned by GET /agreements/landlord/mine (property + tenant populated). */
export interface LandlordAgreement {
    _id: string;
    booking: string;
    status: AgreementStatus;
    tenantSignedAt?: string;
    landlordSignedAt?: string;
    createdAt: string;
    property?: { _id: string; title?: string; location?: { city?: string; area?: string } } | string;
    tenant?: { _id: string; firstName?: string; lastName?: string; email?: string } | string;
}

/** An agreement is awaiting the landlord when the tenant has signed but the landlord hasn't. */
export const isAwaitingLandlord = (a: Pick<LandlordAgreement, 'tenantSignedAt' | 'landlordSignedAt'>): boolean =>
    Boolean(a.tenantSignedAt && !a.landlordSignedAt);

interface AgreementStore {
    agreement: Agreement | null;
    loading: boolean;
    generating: boolean;
    signing: boolean;
    error: string | null;

    // Landlord dashboard: the landlord's own agreements + loading flag.
    landlordAgreements: LandlordAgreement[];
    landlordAgreementsLoading: boolean;

    generate: (bookingId: string) => Promise<Agreement>;
    fetchByBooking: (bookingId: string) => Promise<void>;
    fetchLandlordAgreements: () => Promise<void>;
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
    landlordAgreements: [],
    landlordAgreementsLoading: false,

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
            // 404 means no agreement yet — not a real error. (The interceptor
            // rejects with ApiError, which carries `status`; the old
            // `err.response.status` read was always undefined, so this branch
            // never ran and "no agreement yet" surfaced as a red error.)
            if (err?.status === 404) {
                set({ agreement: null, loading: false });
            } else {
                const message = err.response?.data?.message || err.message || 'Failed to fetch agreement';
                set({ loading: false, error: message });
            }
        }
    },

    fetchLandlordAgreements: async (): Promise<void> => {
        set({ landlordAgreementsLoading: true });
        try {
            const list = await agreementService.listMine();
            set({ landlordAgreements: list as LandlordAgreement[], landlordAgreementsLoading: false });
        } catch {
            // Non-fatal: leave the previous list and just drop the loading flag.
            set({ landlordAgreementsLoading: false });
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
