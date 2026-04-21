import React, { useState } from 'react';
import { Copy, Check, Building2, CreditCard, Hash, BookOpen } from 'lucide-react';
import Button from '../atoms/Button';

interface BankDetails {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban?: string;
    branchCode?: string;
}

interface PaymentInstructionsCardProps {
    bankDetails: BankDetails;
    amount: number;
    currency?: string;
    onSubmitProof: () => void;
}

const CopyField: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({
    label,
    value,
    icon,
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-neutral-400 shrink-0">{icon}</span>
                <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">{label}</p>
                    <p className="text-sm font-semibold text-neutral-800 truncate">{value}</p>
                </div>
            </div>
            <button
                onClick={handleCopy}
                className="ml-3 shrink-0 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                title="Copy"
            >
                {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                ) : (
                    <Copy className="w-4 h-4 text-neutral-400" />
                )}
            </button>
        </div>
    );
};

const STEPS = [
    'Transfer the exact amount to the account below',
    'Save a screenshot or receipt of the transaction',
    'Upload the receipt and enter your transaction ID',
    'Wait for your landlord to confirm your payment',
];

const PaymentInstructionsCard: React.FC<PaymentInstructionsCardProps> = ({
    bankDetails,
    amount,
    currency = 'PKR',
    onSubmitProof,
}) => {
    const formatted = new Intl.NumberFormat('en-PK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);

    return (
        <div className="rounded-2xl border border-primary-100 bg-primary-50/40 overflow-hidden mt-3">
            {/* Warning note */}
            <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 flex items-start gap-2">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <p className="text-xs text-amber-800">Please transfer the exact amount to avoid rejection</p>
            </div>

            {/* Amount banner */}
            <div className="bg-primary-600 px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-primary-100">Amount Due</span>
                <span className="text-2xl font-bold text-white">
                    {currency} {formatted}
                </span>
            </div>

            {/* Bank details */}
            <div className="px-5 py-3 bg-white border-b border-neutral-100">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1">
                    Bank Transfer Details
                </p>
                <CopyField
                    label="Bank Name"
                    value={bankDetails.bankName}
                    icon={<Building2 className="w-4 h-4" />}
                />
                <CopyField
                    label="Account Title"
                    value={bankDetails.accountTitle}
                    icon={<BookOpen className="w-4 h-4" />}
                />
                <CopyField
                    label="Account Number"
                    value={bankDetails.accountNumber}
                    icon={<Hash className="w-4 h-4" />}
                />
                {bankDetails.iban && (
                    <CopyField
                        label="IBAN"
                        value={bankDetails.iban}
                        icon={<CreditCard className="w-4 h-4" />}
                    />
                )}
            </div>

            {/* Step-by-step instructions */}
            <div className="px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-3">
                    How to Pay
                </p>
                <ol className="space-y-2">
                    {STEPS.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                                {i + 1}
                            </span>
                            <p className="text-sm text-neutral-700 leading-snug">{step}</p>
                        </li>
                    ))}
                </ol>

                <Button
                    className="mt-5 w-full"
                    onClick={onSubmitProof}
                >
                    Upload Receipt
                </Button>
            </div>
        </div>
    );
};

export default PaymentInstructionsCard;
