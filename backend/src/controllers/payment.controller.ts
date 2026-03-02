import { Request, Response, NextFunction } from 'express';
import PaymentService from '../services/PaymentService';
import { PaymentStatus } from '../models/Payment';

// Bank Account Controllers
export const getBankAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const accounts = await PaymentService.getLandlordBankAccounts(userId);

        res.status(200).json({
            success: true,
            data: accounts,
        });
    } catch (error) {
        next(error);
    }
};

export const addBankAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { bankName, accountTitle, accountNumber, iban, branchCode, isDefault } = req.body;

        if (!bankName || !accountTitle || !accountNumber) {
            res.status(400).json({ 
                success: false, 
                message: 'bankName, accountTitle, and accountNumber are required' 
            });
            return;
        }

        const account = await PaymentService.addBankAccount({
            landlordId: userId,
            bankName,
            accountTitle,
            accountNumber,
            iban,
            branchCode,
            isDefault,
        });

        res.status(201).json({
            success: true,
            data: account,
        });
    } catch (error) {
        next(error);
    }
};

export const updateBankAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { accountId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const account = await PaymentService.updateBankAccount(accountId, userId, req.body);

        res.status(200).json({
            success: true,
            data: account,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteBankAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { accountId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        await PaymentService.deleteBankAccount(accountId, userId);

        res.status(200).json({
            success: true,
            message: 'Bank account deleted',
        });
    } catch (error) {
        next(error);
    }
};

// Payment Controllers
export const createPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { bookingId, paymentType, paymentMethod, amount, dueDate, ...rest } = req.body;

        if (!bookingId || !paymentType || !paymentMethod || !amount || !dueDate) {
            res.status(400).json({ 
                success: false, 
                message: 'bookingId, paymentType, paymentMethod, amount, and dueDate are required' 
            });
            return;
        }

        const payment = await PaymentService.createPayment({
            bookingId,
            tenantId: userId,
            paymentType,
            paymentMethod,
            amount,
            dueDate: new Date(dueDate),
            ...rest,
        });

        res.status(201).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        next(error);
    }
};

export const submitPaymentProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { paymentId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { transactionReference, proofOfPayment } = req.body;

        if (!transactionReference || !proofOfPayment) {
            res.status(400).json({ 
                success: false, 
                message: 'transactionReference and proofOfPayment are required' 
            });
            return;
        }

        const payment = await PaymentService.submitPaymentProof(
            paymentId,
            userId,
            transactionReference,
            proofOfPayment
        );

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        next(error);
    }
};

export const confirmPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { paymentId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { confirmed, notes, rejectionReason } = req.body;

        const payment = await PaymentService.confirmPayment({
            paymentId,
            landlordId: userId,
            confirmed,
            notes,
            rejectionReason,
        });

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        next(error);
    }
};

export const getTenantPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await PaymentService.getTenantPayments(userId, page, limit);

        res.status(200).json({
            success: true,
            data: result.payments,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getLandlordPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as PaymentStatus | undefined;

        const result = await PaymentService.getLandlordPayments(userId, page, limit, status);

        res.status(200).json({
            success: true,
            data: result.payments,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getPaymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { paymentId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const payment = await PaymentService.getPaymentById(paymentId, userId);

        if (!payment) {
            res.status(404).json({ success: false, message: 'Payment not found' });
            return;
        }

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        next(error);
    }
};

export const getBookingPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { bookingId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const payments = await PaymentService.getBookingPayments(bookingId, userId);

        res.status(200).json({
            success: true,
            data: payments,
        });
    } catch (error) {
        next(error);
    }
};

export const scheduleCashCollection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { paymentId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { scheduledDate, location, notes } = req.body;

        if (!scheduledDate || !location) {
            res.status(400).json({ 
                success: false, 
                message: 'scheduledDate and location are required' 
            });
            return;
        }

        const payment = await PaymentService.scheduleCashCollection(
            paymentId,
            userId,
            new Date(scheduledDate),
            location,
            notes
        );

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        next(error);
    }
};

export const getLandlordPaymentStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const stats = await PaymentService.getLandlordPaymentStats(userId);

        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getBankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    createPayment,
    submitPaymentProof,
    confirmPayment,
    getTenantPayments,
    getLandlordPayments,
    getPaymentById,
    getBookingPayments,
    scheduleCashCollection,
    getLandlordPaymentStats,
};
