import React, { useState } from 'react';
import { IBooking } from '@shared/types';
import { User, MessageSquare, Bed, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '../atoms/Badge';
import Button from '../atoms/Button';

interface BookingRequestCardProps {
    booking: IBooking;
    onApprove: (id: string, message?: string) => Promise<void>;
    onReject: (id: string, message?: string) => Promise<void>;
}

const BookingRequestCard: React.FC<BookingRequestCardProps> = ({ booking, onApprove, onReject }) => {
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [responseMsg, setResponseMsg] = useState('');
    const [showResponseInput, setShowResponseInput] = useState(false);

    const handleAction = async (action: 'approve' | 'reject') => {
        setIsActionLoading(true);
        try {
            if (action === 'approve') {
                await onApprove(booking._id!, responseMsg);
            } else {
                await onReject(booking._id!, responseMsg);
            }
        } finally {
            setIsActionLoading(false);
            setShowResponseInput(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row justify-between gap-6">
                {/* Tenant & Property Info */}
                <div className="flex gap-4">
                    <div className="h-16 w-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400">
                        {booking.tenant?.avatar ? (
                            <img src={booking.tenant.avatar} alt="tenant" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                            <User size={32} />
                        )}
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-[#1E293B]">
                            {booking.tenant?.firstName} {booking.tenant?.lastName}
                        </h4>
                        <p className="text-sm text-neutral-500 font-medium">{booking.property?.title}</p>
                        <div className="flex flex-wrap gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 bg-neutral-50 px-2 py-1 rounded-lg">
                                <Calendar size={14} />
                                {new Date(booking.proposedMoveInDate).toLocaleDateString()}
                            </div>
                            {booking.bedNumber && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50 px-2 py-1 rounded-lg">
                                    <Bed size={14} />
                                    Bed #{booking.bedNumber}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Badge variant={booking.status === 'pending' ? 'neutral' : booking.status === 'approved' ? 'primary' : 'secondary'}>
                                    {booking.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Info */}
                <div className="md:text-right flex flex-col justify-center">
                    <p className="text-sm text-neutral-500 uppercase font-bold tracking-tight">Total Rent</p>
                    <p className="text-2xl font-black text-[#2563EB]">
                        {booking.rentDetails.currency} {booking.rentDetails.totalAmount.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Tenant Message */}
            <div className="mt-6 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="flex items-center gap-2 mb-2 text-neutral-500">
                    <MessageSquare size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Tenant's Message</span>
                </div>
                <p className="text-neutral-700 text-sm leading-relaxed italic">
                    "{booking.requestMessage}"
                </p>
            </div>

            {/* Actions */}
            {booking.status === 'pending' && (
                <div className="mt-6 space-y-4">
                    {showResponseInput ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <textarea
                                value={responseMsg}
                                onChange={(e) => setResponseMsg(e.target.value)}
                                placeholder="Add a response message (optional)..."
                                className="w-full p-3 text-sm border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none h-20 resize-none bg-neutral-50"
                            />
                            <div className="flex gap-2">
                                <Button
                                    variant="primary"
                                    className="flex-1 bg-[#2563EB]"
                                    onClick={() => handleAction('approve')}
                                    disabled={isActionLoading}
                                >
                                    Confirm Approval
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowResponseInput(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <Button
                                variant="primary"
                                className="flex-1 bg-[#2563EB] flex items-center justify-center gap-2"
                                onClick={() => setShowResponseInput(true)}
                            >
                                <CheckCircle size={18} />
                                Approve
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                                onClick={() => handleAction('reject')}
                            >
                                <XCircle size={18} />
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BookingRequestCard;
