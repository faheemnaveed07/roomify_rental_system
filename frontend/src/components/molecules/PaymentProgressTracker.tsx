import React from 'react';
import { CheckCircle, Clock, Circle, AlertCircle } from 'lucide-react';

type StepStatus = 'completed' | 'active' | 'upcoming' | 'failed';

interface Step {
    label: string;
    description: string;
    status: StepStatus;
}

interface PaymentProgressTrackerProps {
    bookingStatus: string;
    paymentStatus: string;
}

const deriveSteps = (bookingStatus: string, paymentStatus: string): Step[] => {
    const isBookingApproved = bookingStatus === 'approved' || bookingStatus === 'completed';
    const ps = paymentStatus;

    const step1: Step = {
        label: 'Booking Approved',
        description: 'Landlord accepted your request',
        status: isBookingApproved ? 'completed' : 'upcoming',
    };

    let step2Status: StepStatus = 'upcoming';
    let step3Status: StepStatus = 'upcoming';
    let step4Status: StepStatus = 'upcoming';

    if (isBookingApproved) {
        if (ps === 'pending' || ps === 'rejected') {
            step2Status = ps === 'rejected' ? 'failed' : 'active';
            step3Status = 'upcoming';
            step4Status = 'upcoming';
        } else if (ps === 'awaiting_confirmation') {
            step2Status = 'completed';
            step3Status = 'active';
            step4Status = 'upcoming';
        } else if (ps === 'confirmed') {
            step2Status = 'completed';
            step3Status = 'completed';
            step4Status = 'completed';
        } else {
            // no payment yet
            step2Status = 'active';
        }
    }

    return [
        step1,
        {
            label: ps === 'rejected' ? 'Resubmit Payment' : 'Make Payment',
            description: ps === 'rejected' ? 'Correct the issue and upload again' : 'Transfer funds & upload receipt',
            status: step2Status,
        },
        {
            label: 'Under Review',
            description: 'Your landlord is reviewing your payment (usually within 24 hours)',
            status: step3Status,
        },
        {
            label: 'Payment Confirmed',
            description: 'Your booking is now active',
            status: step4Status,
        },
    ];
};

const StepIcon: React.FC<{ status: StepStatus }> = ({ status }) => {
    if (status === 'completed') {
        return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
    if (status === 'active') {
        return <Clock className="w-6 h-6 text-primary-600 animate-pulse" />;
    }
    if (status === 'failed') {
        return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
    return <Circle className="w-6 h-6 text-neutral-300" />;
};

const connectorColor = (status: StepStatus): string => {
    return status === 'completed' ? 'bg-green-400' : 'bg-neutral-200';
};

const PaymentProgressTracker: React.FC<PaymentProgressTrackerProps> = ({
    bookingStatus,
    paymentStatus,
}) => {
    const steps = deriveSteps(bookingStatus, paymentStatus);
    const isConfirmed = paymentStatus === 'confirmed';

    return (
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-4">
            {isConfirmed && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800">🎉 Payment Confirmed — Your booking is now active</p>
                </div>
            )}
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">
                Payment Progress
            </p>
            <div className="flex items-start gap-0">
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    return (
                        <React.Fragment key={step.label}>
                            {/* Step */}
                            <div className="flex flex-col items-center flex-1 min-w-0">
                                <StepIcon status={step.status} />
                                <p
                                    className={`mt-2 text-xs font-semibold text-center leading-tight ${
                                        step.status === 'active'
                                            ? 'text-primary-700'
                                            : step.status === 'completed'
                                            ? 'text-green-700'
                                            : step.status === 'failed'
                                            ? 'text-red-600'
                                            : 'text-neutral-400'
                                    }`}
                                >
                                    {step.label}
                                </p>
                                <p className={`text-[10px] text-center mt-1 leading-tight hidden sm:block ${
                                    step.status === 'active' ? 'text-primary-600 font-medium' : 'text-neutral-400'
                                }`}>
                                    {step.description}
                                </p>
                            </div>

                            {/* Connector line */}
                            {!isLast && (
                                <div className="flex-none w-8 mt-3 px-1">
                                    <div className={`h-0.5 w-full ${connectorColor(steps[index + 1]?.status)}`} />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default PaymentProgressTracker;
