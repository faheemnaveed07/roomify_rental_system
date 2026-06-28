import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building2, Upload, CheckCircle, AlertTriangle,
    FileText, CreditCard, Copy, Eye, X,
} from 'lucide-react';
import { paymentService, ASSETS_URL, resolveAssetUrl } from '../services/api';
import { usePaymentStore } from '../store/payment.store';
import Button from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { Input } from '../components/atoms/Input';
import ToastContainer from '../components/atoms/ToastContainer';
import { useToast } from '../hooks/useToast';

// ─── Constants ────────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MIN_TXN_LENGTH = 6;

// ─── Status badge helper ──────────────────────────────────────────────────────
type BadgeVariant = 'warning' | 'success' | 'error' | 'primary' | 'neutral';

function statusBadge(status: string): { variant: BadgeVariant; label: string } {
    switch (status) {
        case 'confirmed':   return { variant: 'success',  label: 'Approved' };
        case 'rejected':    return { variant: 'error',    label: 'Rejected' };
        case 'awaiting_confirmation': return { variant: 'primary', label: 'Under Review' };
        case 'pending':     return { variant: 'warning',  label: 'Pending' };
        default:            return { variant: 'neutral',  label: status };
    }
}

// ─── Component ────────────────────────────────────────────────────────────────
const PaymentSubmitPage: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const { toasts, success, error: toastError, dismiss } = useToast();
    const { submitPaymentWithReceipt, loading } = usePaymentStore();

    // Remote data
    const [booking, setBooking] = useState<any>(null);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [existingPayment, setExistingPayment] = useState<any>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Form state
    const [txnRef, setTxnRef] = useState('');
    const [txnError, setTxnError] = useState('');
    const [paymentType, setPaymentType] = useState('security_deposit');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load booking + landlord bank accounts ────────────────────────────────
    useEffect(() => {
        if (!bookingId) return;
        (async () => {
            setDataLoading(true);
            setLoadError(null);
            try {
                const bookingData = await paymentService.getBookingById(bookingId);
                setBooking(bookingData);
                const landlordId =
                    typeof bookingData.landlord === 'object'
                        ? bookingData.landlord._id
                        : bookingData.landlord;

                const [accounts, paymentsRes] = await Promise.all([
                    paymentService.getLandlordBankAccounts(landlordId),
                    paymentService.getBookingPayments(bookingId).catch(() => []),
                ]);
                setBankAccounts(accounts);

                // Check for existing non-rejected payment
                const active = (paymentsRes as any[]).find(
                    (p: any) =>
                        p.status === 'pending' ||
                        p.status === 'awaiting_confirmation' ||
                        p.status === 'confirmed'
                );
                if (active) setExistingPayment(active);
            } catch (err: any) {
                const backendMessage = err?.response?.data?.message;
                setLoadError(backendMessage || 'Failed to load booking details.');
                toastError(backendMessage || 'Failed to load booking details.');
            } finally {
                setDataLoading(false);
            }
        })();
    }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── File selection ───────────────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setFileError('');
        if (!file) { setReceiptFile(null); setReceiptPreview(null); return; }

        if (!ALLOWED_TYPES.includes(file.type)) {
            setFileError('Only JPG, PNG, WebP, or PDF files are allowed.');
            setReceiptFile(null); setReceiptPreview(null);
            e.target.value = '';
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setFileError('File must be smaller than 5 MB.');
            setReceiptFile(null); setReceiptPreview(null);
            e.target.value = '';
            return;
        }

        setReceiptFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setReceiptPreview('pdf'); // placeholder for PDFs
        }
    };

    // ── Transaction ID validation ────────────────────────────────────────────
    const validateTxn = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return 'Transaction ID is required.';
        if (trimmed.length < MIN_TXN_LENGTH)
            return `Transaction ID must be at least ${MIN_TXN_LENGTH} characters.`;
        if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed))
            return 'Only letters, numbers, hyphens, and underscores allowed.';
        return '';
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const txnValidationError = validateTxn(txnRef);
        if (txnValidationError) { setTxnError(txnValidationError); return; }
        if (!receiptFile) { setFileError('Please attach your payment receipt.'); return; }

        try {
            await submitPaymentWithReceipt({
                bookingId: bookingId!,
                paymentType,
                paymentMethod: 'bank_transfer',
                transactionReference: txnRef.trim(),
                receiptFile,
            });
            setSubmitted(true);
            success('Payment submitted! An admin will verify it shortly.');
        } catch (err: any) {
            toastError(err?.response?.data?.message || 'Submission failed. Please try again.');
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────────────
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => success('Copied to clipboard!'));
    };

    const primaryAccount = bankAccounts.find((a: any) => a.isDefault) ?? bankAccounts[0];

    // ── Render ───────────────────────────────────────────────────────────────
    if (dataLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <div style={{ width: 36, height: 36, border: '4px solid #e2e8f0', borderTopColor: '#d4845a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!booking) {
        const notReadyMessage =
            loadError === 'Access denied'
                ? 'This booking is not available for payment yet. If your request is still pending, wait for landlord approval and try again from My Bookings.'
                : 'This booking doesn\'t exist, you don\'t have access, or it isn\'t ready for payment yet.';

        return (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <AlertTriangle size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f5f5f5' }}>Booking Not Ready for Payment</h2>
                <p style={{ color: '#8f8f8f', marginTop: 8 }}>
                    {notReadyMessage}
                </p>
                <div style={{ marginTop: 20 }}>
                    <Button variant="outline" onClick={() => navigate('/my-bookings')}>
                        Back to My Bookings
                    </Button>
                </div>
            </div>
        );
    }

    if (!['approved', 'completed'].includes(booking.status) && !existingPayment) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <AlertTriangle size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f5f5f5' }}>
                    Booking Not Ready for Payment
                </h2>
                <p style={{ color: '#8f8f8f', marginTop: 8, maxWidth: 560, marginInline: 'auto' }}>
                    {booking.status === 'pending'
                        ? 'Your booking is pending landlord approval. You can submit payment as soon as it is approved.'
                        : `Your booking is currently ${booking.status}. Payment submission is only available for approved bookings.`}
                </p>
                <div style={{ marginTop: 20 }}>
                    <Button variant="outline" onClick={() => navigate('/my-bookings')}>
                        Back to My Bookings
                    </Button>
                </div>
            </div>
        );
    }

    const property = booking.property ?? {};
    const propertyImageSrc = resolveAssetUrl(property.images?.[0]);
    const amountDue =
        booking.rentDetails?.monthlyRent ??
        booking.rentDetails?.agreedRent ??
        property?.rent?.amount ??
        0;

    // ── Already submitted state ──────────────────────────────────────────────
    if (submitted || existingPayment) {
        const payment = existingPayment;
        const badgeInfo = payment ? statusBadge(payment.status) : { variant: 'success' as BadgeVariant, label: 'Submitted' };
        return (
            <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 16px' }}>
                <ToastContainer toasts={toasts} dismiss={dismiss} />
                <div style={{ background: '#141414', borderRadius: 20, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', textAlign: 'center' }}>
                    <CheckCircle size={56} color="#16a34a" style={{ margin: '0 auto 16px' }} />
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f5f5f5', marginBottom: 8 }}>
                        Payment {submitted ? 'Submitted' : 'Already Submitted'}
                    </h2>
                    <p style={{ color: '#8f8f8f', marginBottom: 24 }}>
                        Your receipt is under admin review. You'll be notified once it's verified.
                    </p>
                    {payment && (
                        <div style={{ background: '#0a0a0a', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: '#8f8f8f', fontSize: 13 }}>Status</span>
                                <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: '#8f8f8f', fontSize: 13 }}>Amount</span>
                                <span style={{ fontWeight: 700, color: '#f5f5f5' }}>PKR {(payment.amount ?? amountDue).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#8f8f8f', fontSize: 13 }}>Transaction ID</span>
                                <span style={{ fontWeight: 600, color: '#c0c0c0', fontSize: 13 }}>
                                    {payment.transactionReference ?? '—'}
                                </span>
                            </div>
                            {payment.status === 'rejected' && payment.rejectionReason && (
                                <div style={{ marginTop: 16, padding: '12px 16px', background: '#2a1414', borderRadius: 10, color: '#fca5a5', fontSize: 13 }}>
                                    <strong>Rejection reason:</strong> {payment.rejectionReason}
                                </div>
                            )}
                            {payment.proofOfPayment && (
                                <div style={{ marginTop: 16 }}>
                                    <a
                                        href={`${ASSETS_URL}${payment.proofOfPayment}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#d4845a', fontWeight: 600, fontSize: 13 }}
                                    >
                                        <Eye size={14} /> View Submitted Receipt
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <Button variant="outline" onClick={() => navigate('/my-bookings')}>My Bookings</Button>
                        <Button onClick={() => navigate('/payments')}>All Payments</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!primaryAccount) {
        return (
            <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 16px 60px' }}>
                <ToastContainer toasts={toasts} dismiss={dismiss} />

                <div style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d4845a', marginBottom: 4 }}>
                        Payment
                    </p>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f5f5f5' }}>Payment Unavailable</h1>
                    <p style={{ color: '#8f8f8f', marginTop: 4 }}>
                        This payment cannot proceed yet because the landlord has not configured a payout bank account.
                    </p>
                </div>

                <div style={{ background: '#141414', borderRadius: 16, padding: '20px 24px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
                    {propertyImageSrc ? (
                        <img
                            src={propertyImageSrc}
                            alt={property.title}
                            style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                            onError={(event) => {
                                event.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div style={{ width: 64, height: 64, borderRadius: 10, background: '#1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={28} color="#8f8f8f" />
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: '#f5f5f5', fontSize: 16, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {property.title ?? 'Property'}
                        </p>
                        <p style={{ fontSize: 13, color: '#8f8f8f' }}>
                            {property.location?.city ?? ''}{property.location?.area ? `, ${property.location.area}` : ''}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 22, fontWeight: 800, color: '#d4845a' }}>
                            PKR {amountDue.toLocaleString()}
                        </p>
                        <p style={{ fontSize: 12, color: '#8f8f8f' }}>due amount</p>
                    </div>
                </div>

                <div style={{ background: '#241c0a', border: '1px solid #fde68a', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fbbf24' }}>
                        <AlertTriangle size={18} />
                        <span style={{ fontSize: 14 }}>
                            The landlord hasn&apos;t set up bank accounts yet, so receipt submission is temporarily disabled for this booking.
                        </span>
                    </div>
                </div>

                <Button variant="outline" onClick={() => navigate('/my-bookings')}>
                    Back to My Bookings
                </Button>
            </div>
        );
    }

    // ── Main form ────────────────────────────────────────────────────────────
    return (
        <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 16px 60px' }}>
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d4845a', marginBottom: 4 }}>
                    Payment
                </p>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f5f5f5' }}>Submit Payment</h1>
                <p style={{ color: '#8f8f8f', marginTop: 4 }}>
                    Transfer the amount to the landlord's account and upload your receipt below.
                </p>
            </div>

            {/* Property summary */}
            <div style={{ background: '#141414', borderRadius: 16, padding: '20px 24px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
                {propertyImageSrc ? (
                    <img
                        src={propertyImageSrc}
                        alt={property.title}
                        style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                        onError={(event) => {
                            event.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 10, background: '#1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={28} color="#8f8f8f" />
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#f5f5f5', fontSize: 16, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {property.title ?? 'Property'}
                    </p>
                    <p style={{ fontSize: 13, color: '#8f8f8f' }}>
                        {property.location?.city ?? ''}{property.location?.area ? `, ${property.location.area}` : ''}
                    </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#d4845a' }}>
                        PKR {amountDue.toLocaleString()}
                    </p>
                    <p style={{ fontSize: 12, color: '#8f8f8f' }}>due amount</p>
                </div>
            </div>

            {/* Bank details */}
            <div style={{ background: '#141414', border: '1px solid #e0e7ff', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#d4845a', marginBottom: 12 }}>
                    Transfer to this account
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                    {[
                        { label: 'Bank', value: primaryAccount.bankName },
                        { label: 'Account Title', value: primaryAccount.accountTitle },
                        { label: 'Account Number', value: primaryAccount.accountNumber },
                        ...(primaryAccount.iban ? [{ label: 'IBAN', value: primaryAccount.iban }] : []),
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <p style={{ fontSize: 11, color: '#8f8f8f', marginBottom: 2 }}>{label}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <p style={{ fontWeight: 600, color: '#f5f5f5', fontSize: 14 }}>{value}</p>
                                <button
                                    type="button"
                                    title="Copy"
                                    onClick={() => copyToClipboard(value)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#8f8f8f' }}
                                >
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <div style={{ background: '#141414', borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f5f5f5', marginBottom: 20 }}>
                        Payment Details
                    </h3>

                    {/* Payment type */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c0c0c0', marginBottom: 8 }}>
                            Payment Type
                        </label>
                        <select
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#f5f5f5', background: '#141414', outline: 'none' }}
                        >
                            <option value="security_deposit">Security Deposit</option>
                            <option value="monthly_rent">Monthly Rent</option>
                            <option value="advance_rent">Advance Rent</option>
                        </select>
                    </div>

                    {/* Transaction ID */}
                    <div style={{ marginBottom: 20 }}>
                        <Input
                            label="Transaction / Reference ID *"
                            placeholder={`e.g. TXN-${Date.now().toString().slice(-8)}`}
                            value={txnRef}
                            onChange={(e) => {
                                setTxnRef(e.target.value);
                                if (txnError) setTxnError(validateTxn(e.target.value));
                            }}
                            onBlur={() => setTxnError(validateTxn(txnRef))}
                            error={txnError}
                            helperText={`Minimum ${MIN_TXN_LENGTH} characters. Alphanumeric only.`}
                            leftIcon={<CreditCard size={16} color="#8f8f8f" />}
                        />
                    </div>

                    {/* Receipt upload */}
                    <div style={{ marginBottom: 8 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c0c0c0', marginBottom: 8 }}>
                            Payment Receipt *
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        {!receiptFile ? (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: '100%', padding: '32px 16px', border: '2px dashed #c7d2fe',
                                    borderRadius: 12, background: '#141414', cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#d4845a',
                                }}
                            >
                                <Upload size={28} />
                                <span style={{ fontWeight: 600, fontSize: 14 }}>Click to upload receipt</span>
                                <span style={{ fontSize: 12, color: '#8f8f8f' }}>JPG, PNG, WebP, PDF · max 5 MB</span>
                            </button>
                        ) : (
                            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1.5px solid #e0e7ff' }}>
                                {receiptPreview === 'pdf' ? (
                                    <div style={{ padding: '24px 20px', background: '#0a0a0a', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <FileText size={36} color="#d4845a" />
                                        <div>
                                            <p style={{ fontWeight: 600, color: '#f5f5f5', fontSize: 14 }}>{receiptFile.name}</p>
                                            <p style={{ fontSize: 12, color: '#8f8f8f' }}>{(receiptFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={receiptPreview!}
                                        alt="Receipt preview"
                                        style={{ width: '100%', maxHeight: 260, objectFit: 'contain', background: '#0a0a0a', display: 'block' }}
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReceiptFile(null); setReceiptPreview(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    title="Remove"
                                    style={{
                                        position: 'absolute', top: 8, right: 8, width: 28, height: 28,
                                        borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#141414',
                                    }}
                                >
                                    <X size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ width: '100%', padding: '8px', background: '#1f1f1f', border: 'none', cursor: 'pointer', fontSize: 13, color: '#d4845a', fontWeight: 600 }}
                                >
                                    Change file
                                </button>
                            </div>
                        )}
                        {fileError && (
                            <p style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{fileError}</p>
                        )}
                    </div>

                    <div style={{ marginTop: 28 }}>
                        <Button
                            type="submit"
                            fullWidth
                            disabled={loading}
                            isLoading={loading}
                            leftIcon={loading ? undefined : <CheckCircle size={18} />}
                        >
                            {loading ? 'Submitting…' : 'Submit Payment'}
                        </Button>
                        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#8f8f8f' }}>
                            Your receipt will be reviewed by an admin. Booking confirms upon approval.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PaymentSubmitPage;
