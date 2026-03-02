import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { usePaymentStore, PaymentStatus, PaymentMethod, PaymentType } from '../store/payment.store';
import Button from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { 
    CreditCard, 
    Wallet, 
    Building2, 
    CheckCircle, 
    XCircle, 
    Clock, 
    AlertCircle,
    Plus,
    Trash2,
    Upload,
    MapPin,
    Calendar
} from 'lucide-react';

const PaymentsPage: React.FC = () => {
    const { user } = useAuthStore();
    const { 
        payments, 
        bankAccounts,
        stats,
        loading,
        fetchTenantPayments,
        fetchLandlordPayments,
        fetchBankAccounts,
        fetchPaymentStats,
        addBankAccount,
        deleteBankAccount,
        submitPaymentProof,
        scheduleCashCollection,
        confirmPayment,
    } = usePaymentStore();

    const [showAddBankModal, setShowAddBankModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<string>('');

    const isLandlord = user?.role === 'landlord';

    useEffect(() => {
        if (isLandlord) {
            fetchLandlordPayments(statusFilter || undefined);
            fetchBankAccounts();
            fetchPaymentStats();
        } else {
            fetchTenantPayments();
        }
    }, [isLandlord, statusFilter]);

    const getStatusBadge = (status: PaymentStatus) => {
        const statusConfig = {
            [PaymentStatus.PENDING]: { variant: 'warning' as const, icon: Clock, text: 'Pending' },
            [PaymentStatus.AWAITING_CONFIRMATION]: { variant: 'primary' as const, icon: AlertCircle, text: 'Awaiting Confirmation' },
            [PaymentStatus.CONFIRMED]: { variant: 'success' as const, icon: CheckCircle, text: 'Confirmed' },
            [PaymentStatus.REJECTED]: { variant: 'error' as const, icon: XCircle, text: 'Rejected' },
            [PaymentStatus.REFUNDED]: { variant: 'secondary' as const, icon: CreditCard, text: 'Refunded' },
        };
        const config = statusConfig[status] || statusConfig[PaymentStatus.PENDING];
        return (
            <Badge variant={config.variant}>
                <config.icon className="w-3 h-3 mr-1" />
                {config.text}
            </Badge>
        );
    };

    const getPaymentTypeLabel = (type: PaymentType) => {
        const labels = {
            [PaymentType.SECURITY_DEPOSIT]: 'Security Deposit',
            [PaymentType.MONTHLY_RENT]: 'Monthly Rent',
            [PaymentType.ADVANCE_RENT]: 'Advance Rent',
        };
        return labels[type] || type;
    };

    const getPaymentMethodIcon = (method: PaymentMethod) => {
        return method === PaymentMethod.BANK_TRANSFER 
            ? <Building2 className="w-4 h-4" />
            : <Wallet className="w-4 h-4" />;
    };

    const formatCurrency = (amount: number, currency = 'PKR') => {
        return `${currency} ${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="container py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">Payments</h1>
                {isLandlord && (
                    <Button onClick={() => setShowAddBankModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Bank Account
                    </Button>
                )}
            </div>

            {/* Stats for Landlord */}
            {isLandlord && stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
                        <p className="text-sm text-neutral-500 mb-1">Total Received</p>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(stats.totalReceived)}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
                        <p className="text-sm text-neutral-500 mb-1">Confirmed</p>
                        <p className="text-2xl font-bold text-neutral-900">{stats.confirmedCount}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
                        <p className="text-sm text-neutral-500 mb-1">Pending</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.pendingCount}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
                        <p className="text-sm text-neutral-500 mb-1">Awaiting Confirmation</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.awaitingConfirmationCount}</p>
                    </div>
                </div>
            )}

            {/* Bank Accounts Section for Landlord */}
            {isLandlord && bankAccounts.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Your Bank Accounts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bankAccounts.map((account) => (
                            <div 
                                key={account._id} 
                                className={`bg-white rounded-2xl p-6 shadow-sm border ${
                                    account.isDefault ? 'border-primary-500' : 'border-neutral-100'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-primary-600" />
                                        <span className="font-semibold">{account.bankName}</span>
                                    </div>
                                    {account.isDefault && (
                                        <Badge variant="primary">Default</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-neutral-600 mb-1">{account.accountTitle}</p>
                                <p className="font-mono text-neutral-900">{account.accountNumber}</p>
                                {account.iban && (
                                    <p className="text-xs text-neutral-500 mt-1">IBAN: {account.iban}</p>
                                )}
                                <button
                                    onClick={() => deleteBankAccount(account._id)}
                                    className="mt-4 text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter for Landlord */}
            {isLandlord && (
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setStatusFilter('')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            statusFilter === '' 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setStatusFilter(PaymentStatus.AWAITING_CONFIRMATION)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            statusFilter === PaymentStatus.AWAITING_CONFIRMATION 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                    >
                        Awaiting Confirmation
                    </button>
                    <button
                        onClick={() => setStatusFilter(PaymentStatus.PENDING)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            statusFilter === PaymentStatus.PENDING 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setStatusFilter(PaymentStatus.CONFIRMED)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            statusFilter === PaymentStatus.CONFIRMED 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                    >
                        Confirmed
                    </button>
                </div>
            )}

            {/* Payments List */}
            <div className="space-y-4">
                {loading && payments.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">Loading payments...</div>
                ) : payments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-neutral-100">
                        <CreditCard className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-500">No payments found</p>
                    </div>
                ) : (
                    payments.map((payment) => (
                        <div 
                            key={payment._id}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {getPaymentMethodIcon(payment.paymentMethod)}
                                        <span className="font-semibold text-lg">
                                            {formatCurrency(payment.amount, payment.currency)}
                                        </span>
                                        {getStatusBadge(payment.status)}
                                    </div>
                                    <p className="text-neutral-600 mb-1">
                                        {getPaymentTypeLabel(payment.paymentType)}
                                    </p>
                                    <p className="text-sm text-neutral-500">
                                        {payment.property?.title}
                                    </p>
                                    <p className="text-sm text-neutral-400 mt-1">
                                        Due: {formatDate(payment.dueDate)}
                                        {payment.paidAt && ` • Paid: ${formatDate(payment.paidAt)}`}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {/* Tenant actions */}
                                    {!isLandlord && payment.status === PaymentStatus.PENDING && (
                                        <>
                                            {payment.paymentMethod === PaymentMethod.BANK_TRANSFER && (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => setShowPaymentModal({ ...payment, action: 'proof' })}
                                                >
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Submit Proof
                                                </Button>
                                            )}
                                            {payment.paymentMethod === PaymentMethod.CASH && (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => setShowPaymentModal({ ...payment, action: 'schedule' })}
                                                >
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    Schedule Collection
                                                </Button>
                                            )}
                                        </>
                                    )}

                                    {/* Landlord actions */}
                                    {isLandlord && payment.status === PaymentStatus.AWAITING_CONFIRMATION && (
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm"
                                                onClick={() => confirmPayment(payment._id, true)}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Confirm
                                            </Button>
                                            <Button 
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setShowPaymentModal({ ...payment, action: 'reject' })}
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}

                                    {/* Show bank details for tenant (bank transfer) */}
                                    {!isLandlord && payment.paymentMethod === PaymentMethod.BANK_TRANSFER && payment.bankDetails && (
                                        <div className="text-sm bg-neutral-50 rounded-lg p-3 mt-2">
                                            <p className="font-medium mb-1">Bank Details:</p>
                                            <p>{payment.bankDetails.bankName}</p>
                                            <p>{payment.bankDetails.accountTitle}</p>
                                            <p className="font-mono">{payment.bankDetails.accountNumber}</p>
                                            {payment.bankDetails.iban && (
                                                <p className="text-xs text-neutral-500">IBAN: {payment.bankDetails.iban}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Show proof of payment */}
                                    {payment.proofOfPayment && (
                                        <a 
                                            href={payment.proofOfPayment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-600 hover:text-primary-700 text-sm"
                                        >
                                            View Payment Proof
                                        </a>
                                    )}

                                    {/* Show cash collection details */}
                                    {payment.cashCollectionDetails && (
                                        <div className="text-sm bg-neutral-50 rounded-lg p-3 mt-2">
                                            <p className="font-medium mb-1">Cash Collection:</p>
                                            <p className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(payment.cashCollectionDetails.scheduledDate)}
                                            </p>
                                            <p className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {payment.cashCollectionDetails.location}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Bank Account Modal */}
            {showAddBankModal && (
                <AddBankAccountModal 
                    onClose={() => setShowAddBankModal(false)}
                    onSubmit={async (data) => {
                        await addBankAccount(data);
                        setShowAddBankModal(false);
                    }}
                />
            )}

            {/* Payment Action Modal */}
            {showPaymentModal && (
                <PaymentActionModal
                    payment={showPaymentModal}
                    onClose={() => setShowPaymentModal(null)}
                    onSubmitProof={async (data) => {
                        await submitPaymentProof(showPaymentModal._id, data);
                        setShowPaymentModal(null);
                    }}
                    onScheduleCash={async (data) => {
                        await scheduleCashCollection(showPaymentModal._id, data);
                        setShowPaymentModal(null);
                    }}
                    onReject={async (reason) => {
                        await confirmPayment(showPaymentModal._id, false, undefined, reason);
                        setShowPaymentModal(null);
                    }}
                />
            )}
        </div>
    );
};

// Add Bank Account Modal Component
const AddBankAccountModal: React.FC<{
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}> = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        bankName: '',
        accountTitle: '',
        accountNumber: '',
        iban: '',
        branchCode: '',
        isDefault: false,
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add Bank Account</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Bank Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                            placeholder="e.g., HBL, UBL, Meezan Bank"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Account Title *</label>
                        <input
                            type="text"
                            required
                            value={formData.accountTitle}
                            onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                            placeholder="Account holder name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Account Number *</label>
                        <input
                            type="text"
                            required
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 font-mono"
                            placeholder="Enter account number"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">IBAN (Optional)</label>
                        <input
                            type="text"
                            value={formData.iban}
                            onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 font-mono"
                            placeholder="PK..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Branch Code (Optional)</label>
                        <input
                            type="text"
                            value={formData.branchCode}
                            onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                            placeholder="Branch code"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            title="Set as default account"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="isDefault" className="text-sm">Set as default account</label>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="flex-1">
                            {submitting ? 'Adding...' : 'Add Account'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Payment Action Modal Component
const PaymentActionModal: React.FC<{
    payment: any;
    onClose: () => void;
    onSubmitProof: (data: { transactionReference: string; proofOfPayment: string }) => Promise<void>;
    onScheduleCash: (data: { scheduledDate: string; location: string; notes?: string }) => Promise<void>;
    onReject: (reason: string) => Promise<void>;
}> = ({ payment, onClose, onSubmitProof, onScheduleCash, onReject }) => {
    const [proofData, setProofData] = useState({
        transactionReference: '',
        proofOfPayment: '',
    });
    const [cashData, setCashData] = useState({
        scheduledDate: '',
        location: '',
        notes: '',
    });
    const [rejectReason, setRejectReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (payment.action === 'proof') {
                await onSubmitProof(proofData);
            } else if (payment.action === 'schedule') {
                await onScheduleCash(cashData);
            } else if (payment.action === 'reject') {
                await onReject(rejectReason);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {payment.action === 'proof' && 'Submit Payment Proof'}
                    {payment.action === 'schedule' && 'Schedule Cash Collection'}
                    {payment.action === 'reject' && 'Reject Payment'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {payment.action === 'proof' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1">Transaction Reference *</label>
                                <input
                                    type="text"
                                    required
                                    value={proofData.transactionReference}
                                    onChange={(e) => setProofData({ ...proofData, transactionReference: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                                    placeholder="Transaction ID or reference number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Proof of Payment URL *</label>
                                <input
                                    type="url"
                                    required
                                    value={proofData.proofOfPayment}
                                    onChange={(e) => setProofData({ ...proofData, proofOfPayment: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                                    placeholder="Link to receipt screenshot"
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                    Upload your receipt to any image hosting service and paste the link
                                </p>
                            </div>
                        </>
                    )}

                    {payment.action === 'schedule' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1">Collection Date *</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={cashData.scheduledDate}
                                    onChange={(e) => setCashData({ ...cashData, scheduledDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                                    title="Select collection date and time"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Collection Location *</label>
                                <input
                                    type="text"
                                    required
                                    value={cashData.location}
                                    onChange={(e) => setCashData({ ...cashData, location: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                                    placeholder="Address for cash collection"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                                <textarea
                                    value={cashData.notes}
                                    onChange={(e) => setCashData({ ...cashData, notes: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                                    rows={2}
                                    placeholder="Any additional notes..."
                                />
                            </div>
                        </>
                    )}

                    {payment.action === 'reject' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Rejection Reason *</label>
                            <textarea
                                required
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
                                rows={3}
                                placeholder="Explain why you're rejecting this payment"
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="flex-1">
                            {submitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentsPage;
