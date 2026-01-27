export enum BookingStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed',
    EXPIRED = 'expired',
}

export enum BookingType {
    FULL_PROPERTY = 'full_property',
    SHARED_ROOM_BED = 'shared_room_bed',
}

export interface IBooking {
    _id?: string;
    property: string | any;
    tenant: string | any;
    landlord: string | any;
    bookingType: BookingType;
    status: BookingStatus;
    requestMessage: string;
    responseMessage?: string;
    proposedMoveInDate: Date;
    proposedDuration: {
        value: number;
        unit: 'months' | 'years';
    };
    rentDetails: {
        monthlyRent: number;
        securityDeposit: number;
        totalAmount: number;
        currency: string;
    };
    bedNumber?: number;
    timeline: {
        requestedAt: Date;
        respondedAt?: Date;
        approvedAt?: Date;
        rejectedAt?: Date;
        cancelledAt?: Date;
        completedAt?: Date;
        expiredAt?: Date;
    };
    cancellation?: {
        cancelledBy: string;
        reason: string;
        cancelledAt: Date;
    };
    notes?: {
        createdBy: string;
        content: string;
        createdAt: Date;
    }[];
    expiresAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
