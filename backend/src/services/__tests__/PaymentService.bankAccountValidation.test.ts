import PaymentService from '../PaymentService';
import { Payment } from '../../models/Payment';
import { Booking } from '../../models/Booking';
import { LandlordBankAccount } from '../../models/LandlordBankAccount';

jest.mock('../../models/Payment', () => ({
    Payment: {
        create: jest.fn(),
        findOne: jest.fn(),
    },
    PaymentMethod: {
        BANK_TRANSFER: 'bank_transfer',
        CASH: 'cash',
    },
    PaymentStatus: {
        PENDING: 'pending',
        AWAITING_CONFIRMATION: 'awaiting_confirmation',
        CONFIRMED: 'confirmed',
    },
    PaymentType: {
        SECURITY_DEPOSIT: 'security_deposit',
        MONTHLY_RENT: 'monthly_rent',
        ADVANCE_RENT: 'advance_rent',
    },
}));

jest.mock('../../models/Booking', () => ({
    Booking: {
        findById: jest.fn(),
    },
    BookingStatus: {
        COMPLETED: 'completed',
    },
}));

jest.mock('../../models/LandlordBankAccount', () => ({
    LandlordBankAccount: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../models/User', () => ({
    User: {
        findById: jest.fn(),
    },
}));

jest.mock('../AgreementService', () => ({
    __esModule: true,
    default: {
        generateAgreement: jest.fn(),
    },
}));

describe('PaymentService landlord bank account validation consistency', () => {
    const mockedPayment = Payment as jest.Mocked<typeof Payment>;
    const mockedBooking = Booking as jest.Mocked<typeof Booking>;
    const mockedBankAccount = LandlordBankAccount as jest.Mocked<typeof LandlordBankAccount>;

    const tenantId = '6a02dda97c9b24cd76d7f51d';
    const landlordId = '6a02ddaa7c9b24cd76d7f528';
    const bookingId = '6a3836c8ea8448fbae9fc102';

    const setupBookingPopulate = () => {
        const bookingDoc = {
            _id: bookingId,
            tenant: { toString: () => tenantId },
            landlord: landlordId,
            property: { _id: '6a2f9dc15996bcfb2e2d3c89', rent: { amount: 7000 } },
            rentDetails: { monthlyRent: 7000 },
        };

        (mockedBooking.findById as jest.Mock).mockReturnValue({
            populate: jest.fn().mockResolvedValue(bookingDoc),
        });

        return bookingDoc;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createPayment with bank account: succeeds and includes bankDetails', async () => {
        setupBookingPopulate();

        (mockedBankAccount.findOne as jest.Mock).mockResolvedValueOnce({
            bankName: 'Demo Bank',
            accountTitle: 'Demo Landlord',
            accountNumber: '12345',
            iban: 'PK00DEMO12345',
            branchCode: '001',
        });

        (mockedPayment.create as jest.Mock).mockResolvedValue({ _id: 'payment-1' });

        await expect(
            PaymentService.createPayment({
                bookingId,
                tenantId,
                paymentType: 'security_deposit' as any,
                paymentMethod: 'bank_transfer' as any,
                amount: 7000,
                dueDate: new Date('2026-06-22T00:00:00.000Z'),
                proofOfPayment: '/uploads/payments/receipt-proof.png',
            })
        ).resolves.toEqual({ _id: 'payment-1' });

        expect(mockedPayment.create).toHaveBeenCalledWith(
            expect.objectContaining({
                bankDetails: {
                    bankName: 'Demo Bank',
                    accountTitle: 'Demo Landlord',
                    accountNumber: '12345',
                    iban: 'PK00DEMO12345',
                    branchCode: '001',
                },
            })
        );
    });

    it('createPayment without bank account: throws expected error message', async () => {
        setupBookingPopulate();

        (mockedBankAccount.findOne as jest.Mock)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);

        await expect(
            PaymentService.createPayment({
                bookingId,
                tenantId,
                paymentType: 'security_deposit' as any,
                paymentMethod: 'bank_transfer' as any,
                amount: 7000,
                dueDate: new Date('2026-06-22T00:00:00.000Z'),
                proofOfPayment: '/uploads/payments/receipt-proof.png',
            })
        ).rejects.toThrow('Landlord has not set up bank account for payments');
    });

    it('submit-with-receipt with bank account: succeeds and includes bankDetails', async () => {
        setupBookingPopulate();

        (mockedPayment.findOne as jest.Mock).mockResolvedValue(null);
        (mockedBankAccount.findOne as jest.Mock).mockResolvedValueOnce({
            bankName: 'Demo Bank',
            accountTitle: 'Demo Landlord',
            accountNumber: '12345',
            iban: 'PK00DEMO12345',
            branchCode: '001',
        });
        (mockedPayment.create as jest.Mock).mockResolvedValue({ _id: 'payment-2' });

        await expect(
            PaymentService.submitPaymentWithReceipt({
                bookingId,
                tenantId,
                paymentType: 'security_deposit' as any,
                paymentMethod: 'bank_transfer' as any,
                transactionReference: 'TXNOK001',
                receiptUrl: '/uploads/payments/receipt-proof.png',
            })
        ).resolves.toEqual({ _id: 'payment-2' });

        expect(mockedPayment.create).toHaveBeenCalledWith(
            expect.objectContaining({
                bankDetails: {
                    bankName: 'Demo Bank',
                    accountTitle: 'Demo Landlord',
                    accountNumber: '12345',
                    iban: 'PK00DEMO12345',
                    branchCode: '001',
                },
            })
        );
    });

    it('submit-with-receipt without bank account: throws expected error message', async () => {
        setupBookingPopulate();

        (mockedPayment.findOne as jest.Mock).mockResolvedValue(null);
        (mockedBankAccount.findOne as jest.Mock)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);

        await expect(
            PaymentService.submitPaymentWithReceipt({
                bookingId,
                tenantId,
                paymentType: 'security_deposit' as any,
                paymentMethod: 'bank_transfer' as any,
                transactionReference: 'TXNFAIL001',
                receiptUrl: '/uploads/payments/receipt-proof.png',
            })
        ).rejects.toThrow('Landlord has not set up bank account for payments');
    });
});
