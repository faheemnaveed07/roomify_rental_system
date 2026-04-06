import { Payment, IPaymentDocument, PaymentMethod, PaymentStatus, PaymentType } from '../models/Payment';
import { LandlordBankAccount, ILandlordBankAccountDocument } from '../models/LandlordBankAccount';
import { Booking, BookingStatus } from '../models/Booking';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const ALLOWED_PROOF_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.pdf']);

const getFileExtension = (value: string): string => {
    const idx = value.lastIndexOf('.');
    return idx >= 0 ? value.slice(idx).toLowerCase() : '';
};

const validateProofOfPayment = (proofOfPayment: string) => {
    const ext = getFileExtension(proofOfPayment);
    if (!ALLOWED_PROOF_EXTENSIONS.has(ext)) {
        throw new Error('Proof of payment file type is not allowed');
    }
};

export interface CreatePaymentDTO {
    bookingId: string;
    tenantId: string;
    paymentType: PaymentType;
    paymentMethod: PaymentMethod;
    amount: number;
    dueDate: Date;
    transactionReference?: string;
    proofOfPayment?: string;
    cashCollectionDetails?: {
        scheduledDate?: Date;
        location?: string;
        notes?: string;
    };
    notes?: string;
}

export interface SubmitPaymentWithReceiptDTO {
    bookingId: string;
    tenantId: string;
    paymentType: PaymentType;
    paymentMethod: PaymentMethod;
    transactionReference: string;
    receiptUrl: string;
}

export interface ConfirmPaymentDTO {
    paymentId: string;
    landlordId: string;
    confirmed: boolean;
    notes?: string;
    rejectionReason?: string;
}

export interface AddBankAccountDTO {
    landlordId: string;
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban?: string;
    branchCode?: string;
    isDefault?: boolean;
}

class PaymentService {
    /**
     * Get landlord's bank accounts
     */
    async getLandlordBankAccounts(landlordId: string): Promise<ILandlordBankAccountDocument[]> {
        return LandlordBankAccount.find({
            landlord: new mongoose.Types.ObjectId(landlordId),
        }).sort({ isDefault: -1, createdAt: -1 });
    }

    /**
     * Add a bank account for landlord
     */
    async addBankAccount(data: AddBankAccountDTO): Promise<ILandlordBankAccountDocument> {
        const { landlordId, bankName, accountTitle, accountNumber, iban, branchCode, isDefault } = data;

        // Verify landlord exists
        const landlord = await User.findById(landlordId);
        if (!landlord) {
            throw new Error('Landlord not found');
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await LandlordBankAccount.updateMany(
                { landlord: new mongoose.Types.ObjectId(landlordId) },
                { $set: { isDefault: false } }
            );
        }

        const bankAccount = await LandlordBankAccount.create({
            landlord: new mongoose.Types.ObjectId(landlordId),
            bankName,
            accountTitle,
            accountNumber,
            iban,
            branchCode,
            isDefault: isDefault || false,
            isVerified: false,
        });

        logger.info(`Bank account added for landlord ${landlordId}`);
        return bankAccount;
    }

    /**
     * Update bank account
     */
    async updateBankAccount(
        bankAccountId: string,
        landlordId: string,
        updates: Partial<AddBankAccountDTO>
    ): Promise<ILandlordBankAccountDocument> {
        const bankAccount = await LandlordBankAccount.findOne({
            _id: new mongoose.Types.ObjectId(bankAccountId),
            landlord: new mongoose.Types.ObjectId(landlordId),
        });

        if (!bankAccount) {
            throw new Error('Bank account not found');
        }

        // If setting as default, unset other defaults
        if (updates.isDefault) {
            await LandlordBankAccount.updateMany(
                { landlord: new mongoose.Types.ObjectId(landlordId), _id: { $ne: bankAccountId } },
                { $set: { isDefault: false } }
            );
        }

        Object.assign(bankAccount, updates);
        await bankAccount.save();

        return bankAccount;
    }

    /**
     * Delete bank account
     */
    async deleteBankAccount(bankAccountId: string, landlordId: string): Promise<void> {
        const result = await LandlordBankAccount.deleteOne({
            _id: new mongoose.Types.ObjectId(bankAccountId),
            landlord: new mongoose.Types.ObjectId(landlordId),
        });

        if (result.deletedCount === 0) {
            throw new Error('Bank account not found');
        }

        logger.info(`Bank account ${bankAccountId} deleted`);
    }

    /**
     * Create a new payment
     */
    async createPayment(data: CreatePaymentDTO): Promise<IPaymentDocument> {
        const { bookingId, tenantId, paymentType, paymentMethod, amount, dueDate, ...rest } = data;

        // Get booking details
        const booking = await Booking.findById(bookingId).populate('landlord property');
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Verify tenant
        if (booking.tenant.toString() !== tenantId) {
            throw new Error('Unauthorized: Not your booking');
        }

        // If bank transfer, get landlord's bank details
        let bankDetails;
        if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
            const bankAccount = await LandlordBankAccount.findOne({
                landlord: booking.landlord,
                isDefault: true,
            });
            
            if (!bankAccount) {
                // Get any bank account
                const anyAccount = await LandlordBankAccount.findOne({
                    landlord: booking.landlord,
                });
                if (!anyAccount) {
                    throw new Error('Landlord has not set up bank account for payments');
                }
                bankDetails = {
                    bankName: anyAccount.bankName,
                    accountTitle: anyAccount.accountTitle,
                    accountNumber: anyAccount.accountNumber,
                    iban: anyAccount.iban,
                    branchCode: anyAccount.branchCode,
                };
            } else {
                bankDetails = {
                    bankName: bankAccount.bankName,
                    accountTitle: bankAccount.accountTitle,
                    accountNumber: bankAccount.accountNumber,
                    iban: bankAccount.iban,
                    branchCode: bankAccount.branchCode,
                };
            }
        }

        const payment = await Payment.create({
            booking: new mongoose.Types.ObjectId(bookingId),
            tenant: new mongoose.Types.ObjectId(tenantId),
            landlord: booking.landlord,
            property: booking.property,
            amount,
            paymentType,
            paymentMethod,
            status: paymentMethod === PaymentMethod.CASH ? PaymentStatus.PENDING : PaymentStatus.PENDING,
            bankDetails,
            dueDate,
            ...rest,
        });

        logger.info(`Payment created: ${payment._id} for booking ${bookingId}`);
        return payment;
    }

    /**
     * Submit payment proof (for bank transfer)
     */
    async submitPaymentProof(
        paymentId: string,
        tenantId: string,
        transactionReference: string,
        proofOfPayment: string
    ): Promise<IPaymentDocument> {
        validateProofOfPayment(proofOfPayment);
        const payment = await Payment.findOne({
            _id: new mongoose.Types.ObjectId(paymentId),
            tenant: new mongoose.Types.ObjectId(tenantId),
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        if (payment.status !== PaymentStatus.PENDING) {
            throw new Error('Payment cannot be updated');
        }

        payment.transactionReference = transactionReference;
        payment.proofOfPayment = proofOfPayment;
        payment.status = PaymentStatus.AWAITING_CONFIRMATION;
        payment.paidAt = new Date();
        await payment.save();

        logger.info(`Payment proof submitted for ${paymentId}`);
        return payment;
    }

    /**
     * Confirm or reject payment by landlord
     */
    async confirmPayment(data: ConfirmPaymentDTO): Promise<IPaymentDocument> {
        const { paymentId, landlordId, confirmed, notes, rejectionReason } = data;

        const payment = await Payment.findOne({
            _id: new mongoose.Types.ObjectId(paymentId),
            landlord: new mongoose.Types.ObjectId(landlordId),
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        if (payment.status !== PaymentStatus.AWAITING_CONFIRMATION && payment.status !== PaymentStatus.PENDING) {
            throw new Error('Payment cannot be confirmed/rejected in current status');
        }

        if (confirmed) {
            payment.status = PaymentStatus.CONFIRMED;
            payment.confirmedBy = new mongoose.Types.ObjectId(landlordId);
            payment.confirmedAt = new Date();
            if (!payment.paidAt) {
                payment.paidAt = new Date();
            }
        } else {
            payment.status = PaymentStatus.REJECTED;
            payment.rejectionReason = rejectionReason || 'Payment rejected by landlord';
        }

        if (notes) {
            payment.notes = notes;
        }

        await payment.save();
        logger.info(`Payment ${paymentId} ${confirmed ? 'confirmed' : 'rejected'}`);
        return payment;
    }

    /**
     * Get payments for a tenant
     */
    async getTenantPayments(tenantId: string, page = 1, limit = 20) {
        const payments = await Payment.find({
            tenant: new mongoose.Types.ObjectId(tenantId),
        })
            .populate('property', 'title images location')
            .populate('landlord', 'firstName lastName')
            .populate('booking', 'status proposedMoveInDate')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Payment.countDocuments({
            tenant: new mongoose.Types.ObjectId(tenantId),
        });

        return {
            payments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get payments for a landlord
     */
    async getLandlordPayments(landlordId: string, page = 1, limit = 20, status?: PaymentStatus) {
        const query: any = { landlord: new mongoose.Types.ObjectId(landlordId) };
        if (status) {
            query.status = status;
        }

        const payments = await Payment.find(query)
            .populate('property', 'title images location')
            .populate('tenant', 'firstName lastName email phone')
            .populate('booking', 'status proposedMoveInDate')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Payment.countDocuments(query);

        return {
            payments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get payment by ID
     */
    async getPaymentById(paymentId: string, userId: string): Promise<IPaymentDocument | null> {
        const payment = await Payment.findOne({
            _id: new mongoose.Types.ObjectId(paymentId),
            $or: [
                { tenant: new mongoose.Types.ObjectId(userId) },
                { landlord: new mongoose.Types.ObjectId(userId) },
            ],
        })
            .populate('property', 'title images location rent')
            .populate('tenant', 'firstName lastName email phone')
            .populate('landlord', 'firstName lastName email phone')
            .populate('booking', 'status proposedMoveInDate rentDetails');

        return payment;
    }

    /**
     * Get payments for a booking
     */
    async getBookingPayments(bookingId: string, userId: string) {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Check access
        if (booking.tenant.toString() !== userId && booking.landlord.toString() !== userId) {
            throw new Error('Unauthorized');
        }

        const payments = await Payment.find({
            booking: new mongoose.Types.ObjectId(bookingId),
        })
            .populate('property', 'title')
            .sort({ createdAt: -1 });

        return payments;
    }

    /**
     * Schedule cash payment collection
     */
    async scheduleCashCollection(
        paymentId: string,
        tenantId: string,
        scheduledDate: Date,
        location: string,
        notes?: string
    ): Promise<IPaymentDocument> {
        const payment = await Payment.findOne({
            _id: new mongoose.Types.ObjectId(paymentId),
            tenant: new mongoose.Types.ObjectId(tenantId),
            paymentMethod: PaymentMethod.CASH,
        });

        if (!payment) {
            throw new Error('Payment not found or not a cash payment');
        }

        payment.cashCollectionDetails = {
            scheduledDate,
            location,
            notes,
        };
        payment.status = PaymentStatus.AWAITING_CONFIRMATION;
        await payment.save();

        logger.info(`Cash collection scheduled for payment ${paymentId}`);
        return payment;
    }

    /**
     * Combined: Tenant submits payment with receipt in one operation.
     * Prevents duplicate pending/awaiting payments for same booking.
     */
    async submitPaymentWithReceipt(data: SubmitPaymentWithReceiptDTO): Promise<IPaymentDocument> {
        const { bookingId, tenantId, paymentType, paymentMethod, transactionReference, receiptUrl } = data;

        const booking = await Booking.findById(bookingId).populate('property');
        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.tenant.toString() !== tenantId) {
            throw new Error('Unauthorized: Not your booking');
        }

        // Prevent duplicate submission
        const existingPayment = await Payment.findOne({
            booking: booking._id,
            tenant: new mongoose.Types.ObjectId(tenantId),
            status: { $in: [PaymentStatus.PENDING, PaymentStatus.AWAITING_CONFIRMATION, PaymentStatus.CONFIRMED] },
        });

        if (existingPayment) {
            throw new Error('A payment has already been submitted for this booking');
        }

        const property = booking.property as any;
        const amount = booking.rentDetails?.monthlyRent || property?.rent?.amount || 0;

        // Get landlord bank details if bank transfer
        let bankDetails;
        if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
            const bankAccount = await LandlordBankAccount.findOne({
                landlord: booking.landlord,
                isDefault: true,
            }) || await LandlordBankAccount.findOne({ landlord: booking.landlord });

            if (bankAccount) {
                bankDetails = {
                    bankName: bankAccount.bankName,
                    accountTitle: bankAccount.accountTitle,
                    accountNumber: bankAccount.accountNumber,
                    iban: bankAccount.iban,
                    branchCode: bankAccount.branchCode,
                };
            }
        }

        const payment = await Payment.create({
            booking: booking._id,
            tenant: new mongoose.Types.ObjectId(tenantId),
            landlord: booking.landlord,
            property: booking.property,
            amount,
            paymentType,
            paymentMethod,
            status: PaymentStatus.AWAITING_CONFIRMATION,
            transactionReference,
            proofOfPayment: receiptUrl,
            bankDetails,
            dueDate: new Date(),
            paidAt: new Date(),
        });

        logger.info(`Payment with receipt submitted: ${payment._id} for booking ${bookingId}`);
        return payment;
    }

    // ─────────────────────────────────────────────────────────────────
    // ADMIN METHODS
    // ─────────────────────────────────────────────────────────────────

    /**
     * Admin: Get all payments with optional status filter (paginated)
     */
    async adminGetAllPayments(page = 1, limit = 20, status?: PaymentStatus) {
        const query: Record<string, unknown> = {};
        if (status) {
            query.status = status;
        }

        const [payments, total] = await Promise.all([
            Payment.find(query)
                .populate('tenant', 'firstName lastName email phone')
                .populate('landlord', 'firstName lastName email')
                .populate('property', 'title location')
                .populate('booking', 'status proposedMoveInDate rentDetails bookingType')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Payment.countDocuments(query),
        ]);

        return {
            payments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Admin: Approve payment and auto-confirm the booking
     */
    async adminApprovePayment(
        paymentId: string,
        adminId: string,
        adminNotes?: string
    ): Promise<IPaymentDocument> {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        if (payment.status === PaymentStatus.CONFIRMED) {
            throw new Error('Payment is already confirmed');
        }

        if (payment.status === PaymentStatus.REJECTED) {
            throw new Error('Cannot approve a rejected payment');
        }

        payment.status = PaymentStatus.CONFIRMED;
        payment.confirmedBy = new mongoose.Types.ObjectId(adminId);
        payment.confirmedAt = new Date();
        if (adminNotes) {
            payment.adminNotes = adminNotes;
        }
        if (!payment.paidAt) {
            payment.paidAt = new Date();
        }
        await payment.save();

        // Auto-confirm the booking
        await Booking.findByIdAndUpdate(payment.booking, {
            status: BookingStatus.COMPLETED,
            'timeline.completedAt': new Date(),
        });

        logger.info(`Admin ${adminId} approved payment ${paymentId}; booking ${payment.booking} marked COMPLETED`);
        return payment;
    }

    /**
     * Admin: Reject payment with a mandatory reason
     */
    async adminRejectPayment(
        paymentId: string,
        adminId: string,
        reason: string
    ): Promise<IPaymentDocument> {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        if (payment.status === PaymentStatus.CONFIRMED) {
            throw new Error('Cannot reject an already confirmed payment');
        }

        payment.status = PaymentStatus.REJECTED;
        payment.rejectionReason = reason;
        payment.adminNotes = reason;
        payment.confirmedBy = new mongoose.Types.ObjectId(adminId);
        payment.confirmedAt = new Date();
        await payment.save();

        logger.info(`Admin ${adminId} rejected payment ${paymentId}`);
        return payment;
    }

    /**
     * Get payment statistics for landlord dashboard
     */
    async getLandlordPaymentStats(landlordId: string) {
        const [confirmed, pending, awaiting] = await Promise.all([
            Payment.aggregate([
                { $match: { landlord: new mongoose.Types.ObjectId(landlordId), status: PaymentStatus.CONFIRMED } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
            Payment.countDocuments({ landlord: new mongoose.Types.ObjectId(landlordId), status: PaymentStatus.PENDING }),
            Payment.countDocuments({ landlord: new mongoose.Types.ObjectId(landlordId), status: PaymentStatus.AWAITING_CONFIRMATION }),
        ]);

        return {
            totalReceived: confirmed[0]?.total || 0,
            confirmedCount: confirmed[0]?.count || 0,
            pendingCount: pending,
            awaitingConfirmationCount: awaiting,
        };
    }
}

export default new PaymentService();
