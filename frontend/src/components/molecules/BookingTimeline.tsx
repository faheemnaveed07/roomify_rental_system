import React from 'react';
import { formatBookingCalendarDate } from '../../lib/date';

interface BookingTimelineProps {
    booking: any;
}

const getStepClass = (isComplete: boolean, isCurrent: boolean): string => {
    if (isComplete) return 'bg-green-100 text-green-700 border-green-200';
    if (isCurrent) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-neutral-100 text-neutral-500 border-neutral-200';
};

const BookingTimeline: React.FC<BookingTimelineProps> = ({ booking }) => {
    const status = booking?.status;

    const steps = [
        {
            key: 'requested',
            label: 'Requested',
            icon: '1',
            isComplete: true,
            isCurrent: false,
            date: booking?.timeline?.requestedAt,
        },
        {
            key: 'approved',
            label: 'Approval',
            icon: '2',
            isComplete: ['approved', 'completed'].includes(status),
            isCurrent: status === 'pending',
            date: booking?.timeline?.approvedAt,
        },
        {
            key: 'payment',
            label: 'Payment',
            icon: '3',
            isComplete: status === 'completed',
            isCurrent: status === 'approved',
            date: null,
        },
        {
            key: 'move-in',
            label: 'Move-in',
            icon: '4',
            isComplete: false,
            isCurrent: status === 'completed',
            date: booking?.proposedMoveInDate,
        },
    ];

    return (
        <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="text-sm font-semibold text-neutral-700 mb-3">Booking Progress</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {steps.map((step) => (
                    <div
                        key={step.key}
                        className={`rounded-xl border p-3 ${getStepClass(step.isComplete, step.isCurrent)}`}
                    >
                        <div className="text-xs font-bold mb-1">Step {step.icon}</div>
                        <div className="text-sm font-semibold">{step.label}</div>
                        {step.date ? (
                            <div className="text-xs mt-1 opacity-80">
                                {step.key === 'move-in'
                                    ? formatBookingCalendarDate(step.date)
                                    : new Date(step.date).toLocaleDateString()}
                            </div>
                        ) : (
                            <div className="text-xs mt-1 opacity-80">Pending</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookingTimeline;
