import { create } from 'zustand';
import { paymentService, adminPaymentService } from '../services/api';

export enum PaymentMethod {
    BANK_TRANSFER = 'bank_transfer',
    CASH = 'cash',
}

export enum PaymentStatus {
    PENDING = 'pending',
    AWAITING_CONFIRMATION = 'awaiting_confirmation',
    CONFIRMED = 'confirmed',
    REJECTED = 'rejected',
    REFUNDED = 'refunded',
}

export enum PaymentType {
    SECURITY_DEPOSIT = 'security_deposit',
    MONTHLY_RENT = 'monthly_rent',
    ADVANCE_RENT = 'advance_rent',
}

interface BankAccount {
    _id: string;
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban?: string;
    branchCode?: string;
    isDefault: boolean;
    isVerified: boolean;
}

interface Payment {
    _id: string;
    booking: any;
    tenant: any;
    landlord: any;
    property: any;
    amount: number;
    currency: string;
    paymentType: PaymentType;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    bankDetails?: any;
    transactionReference?: string;
    proofOfPayment?: string;
    cashCollectionDetails?: any;
    dueDate: string;
    paidAt?: string;
    confirmedAt?: string;
    notes?: string;
    createdAt: string;
}

interface PaymentStats {
    totalReceived: number;
    confirmedCount: number;
    pendingCount: number;
    awaitingConfirmationCount: number;
}

interface PaymentState {
    payments: Payment[];
    adminPayments: Payment[];
    bankAccounts: BankAccount[];
    currentPayment: Payment | null;
    stats: PaymentStats | null;
    loading: boolean;
    error: string | null;

    // Actions
    fetchBankAccounts: () => Promise<void>;
    addBankAccount: (data: Partial<BankAccount>) => Promise<BankAccount>;
    updateBankAccount: (accountId: string, data: Partial<BankAccount>) => Promise<void>;
    deleteBankAccount: (accountId: string) => Promise<void>;
    
    fetchTenantPayments: () => Promise<void>;
    fetchLandlordPayments: (status?: string) => Promise<void>;
    fetchPaymentStats: () => Promise<void>;
    createPayment: (data: any) => Promise<Payment>;
    submitPaymentProof: (paymentId: string, data: { transactionReference: string; proofOfPayment: string }) => Promise<void>;
    scheduleCashCollection: (paymentId: string, data: { scheduledDate: string; location: string; notes?: string }) => Promise<void>;
    confirmPayment: (paymentId: string, confirmed: boolean, notes?: string, rejectionReason?: string) => Promise<void>;
    fetchPaymentById: (paymentId: string) => Promise<Payment>;
    fetchBookingPayments: (bookingId: string) => Promise<Payment[]>;
    submitPaymentWithReceipt: (data: { bookingId: string; paymentType: string; paymentMethod: string; transactionReference: string; receiptFile: File }) => Promise<Payment>;
    adminFetchAllPayments: (page?: number, limit?: number, status?: string) => Promise<void>;
    adminApprovePayment: (paymentId: string, adminNotes?: string) => Promise<void>;
    adminRejectPayment: (paymentId: string, reason: string) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
    payments: [],
    adminPayments: [],
    bankAccounts: [],
    currentPayment: null,
    stats: null,
    loading: false,
    error: null,

    fetchBankAccounts: async () => {
        set({ loading: true, error: null });
        try {
            const accounts = await paymentService.getBankAccounts();
            set({ bankAccounts: accounts, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    addBankAccount: async (data) => {
        set({ loading: true, error: null });
        try {
            const account = await paymentService.addBankAccount(data as any);
            set((state) => ({ 
                bankAccounts: [...state.bankAccounts, account], 
                loading: false 
            }));
            return account;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateBankAccount: async (accountId, data) => {
        set({ loading: true, error: null });
        try {
            const updated = await paymentService.updateBankAccount(accountId, data);
            set((state) => ({
                bankAccounts: state.bankAccounts.map(acc => 
                    acc._id === accountId ? updated : acc
                ),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteBankAccount: async (accountId) => {
        set({ loading: true, error: null });
        try {
            await paymentService.deleteBankAccount(accountId);
            set((state) => ({
                bankAccounts: state.bankAccounts.filter(acc => acc._id !== accountId),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    fetchTenantPayments: async () => {
        set({ loading: true, error: null });
        try {
            const response = await paymentService.getTenantPayments();
            set({ payments: response.data || [], loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchLandlordPayments: async (status) => {
        set({ loading: true, error: null });
        try {
            const response = await paymentService.getLandlordPayments(1, 20, status);
            set({ payments: response.data || [], loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchPaymentStats: async () => {
        try {
            const stats = await paymentService.getLandlordPaymentStats();
            set({ stats });
        } catch (error: any) {
            console.error('Failed to fetch payment stats:', error);
        }
    },

    createPayment: async (data) => {
        set({ loading: true, error: null });
        try {
            const payment = await paymentService.createPayment(data);
            set((state) => ({ 
                payments: [payment, ...state.payments], 
                loading: false 
            }));
            return payment;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    submitPaymentProof: async (paymentId, data) => {
        set({ loading: true, error: null });
        try {
            const updated = await paymentService.submitPaymentProof(paymentId, data);
            set((state) => ({
                payments: state.payments.map(p => 
                    p._id === paymentId ? updated : p
                ),
                currentPayment: state.currentPayment?._id === paymentId ? updated : state.currentPayment,
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    scheduleCashCollection: async (paymentId, data) => {
        set({ loading: true, error: null });
        try {
            const updated = await paymentService.scheduleCashCollection(paymentId, data);
            set((state) => ({
                payments: state.payments.map(p => 
                    p._id === paymentId ? updated : p
                ),
                currentPayment: state.currentPayment?._id === paymentId ? updated : state.currentPayment,
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    confirmPayment: async (paymentId, confirmed, notes, rejectionReason) => {
        set({ loading: true, error: null });
        try {
            const updated = await paymentService.confirmPayment(paymentId, { confirmed, notes, rejectionReason });
            set((state) => ({
                payments: state.payments.map(p => 
                    p._id === paymentId ? updated : p
                ),
                currentPayment: state.currentPayment?._id === paymentId ? updated : state.currentPayment,
                loading: false,
            }));
            // Refresh stats
            get().fetchPaymentStats();
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    fetchPaymentById: async (paymentId) => {
        set({ loading: true, error: null });
        try {
            const payment = await paymentService.getPaymentById(paymentId);
            set({ currentPayment: payment, loading: false });
            return payment;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    fetchBookingPayments: async (bookingId) => {
        set({ loading: true, error: null });
        try {
            const payments = await paymentService.getBookingPayments(bookingId);
            set({ payments, loading: false });
            return payments;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    submitPaymentWithReceipt: async (data) => {
        set({ loading: true, error: null });
        try {
            const payment = await paymentService.submitPaymentWithReceipt(data);
            set((state) => ({
                payments: [payment, ...state.payments],
                loading: false,
            }));
            return payment;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    adminFetchAllPayments: async (page = 1, limit = 20, status) => {
        set({ loading: true, error: null });
        try {
            const response = await adminPaymentService.getAllPayments(page, limit, status);
            set({ adminPayments: response.data || [], loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    adminApprovePayment: async (paymentId, adminNotes) => {
        set({ loading: true, error: null });
        try {
            const updated = await adminPaymentService.approvePayment(paymentId, adminNotes);
            set((state) => ({
                adminPayments: state.adminPayments.map(p =>
                    p._id === paymentId ? updated : p
                ),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    adminRejectPayment: async (paymentId, reason) => {
        set({ loading: true, error: null });
        try {
            const updated = await adminPaymentService.rejectPayment(paymentId, reason);
            set((state) => ({
                adminPayments: state.adminPayments.map(p =>
                    p._id === paymentId ? updated : p
                ),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },
}));

export default usePaymentStore;
