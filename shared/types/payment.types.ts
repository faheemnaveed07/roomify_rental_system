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

export interface IBankDetails {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban?: string;
    branchCode?: string;
}

export interface IPayment {
    _id?: string;
    booking: string | any;
    tenant: string | any;
    landlord: string | any;
    property: string | any;
    amount: number;
    currency: string;
    paymentType: PaymentType;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    
    // For bank transfer
    bankDetails?: IBankDetails;
    transactionReference?: string;
    proofOfPayment?: string; // URL to uploaded receipt
    
    // For cash payment
    cashCollectionDetails?: {
        scheduledDate?: Date;
        location?: string;
        collectedAt?: Date;
        collectedBy?: string;
        notes?: string;
    };
    
    // Confirmation details
    confirmedBy?: string | any;
    confirmedAt?: Date;
    rejectionReason?: string;
    
    // Metadata
    dueDate: Date;
    paidAt?: Date;
    notes?: string;
    
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ILandlordBankAccount {
    _id?: string;
    landlord: string | any;
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban?: string;
    branchCode?: string;
    isDefault: boolean;
    isVerified: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IPaymentRequest {
    bookingId: string;
    paymentType: PaymentType;
    paymentMethod: PaymentMethod;
    amount: number;
    transactionReference?: string;
    proofOfPayment?: string;
    cashCollectionDetails?: {
        scheduledDate?: Date;
        location?: string;
        notes?: string;
    };
}

export interface IPaymentConfirmation {
    paymentId: string;
    confirmed: boolean;
    notes?: string;
    rejectionReason?: string;
}
