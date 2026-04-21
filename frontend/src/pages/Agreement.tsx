import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, CheckCircle, Clock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAgreementStore } from '../store/agreement.store';
import { useAuthStore } from '../store/auth.store';
import Button from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { ASSETS_URL } from '../services/api';

const AgreementPage: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { agreement, loading, generating, signing, error, generate, fetchByBooking, sign, download, clearError } =
        useAgreementStore();

    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [signConfirm, setSignConfirm] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (bookingId) {
            fetchByBooking(bookingId);
        }
        return () => {
            clearError();
        };
    }, [bookingId]);

    const handleGenerate = async () => {
        if (!bookingId) return;
        try {
            await generate(bookingId);
            showToast('success', 'Lease agreement generated successfully!');
        } catch (err: any) {
            showToast('error', err.message || 'Failed to generate agreement');
        }
    };

    const handleDownload = async () => {
        if (!agreement) return;
        setDownloadLoading(true);
        try {
            await download(agreement._id, bookingId!);
            showToast('success', 'Download started');
        } catch (err: any) {
            showToast('error', err.message || 'Failed to download');
        } finally {
            setDownloadLoading(false);
        }
    };

    const handleSign = async () => {
        if (!agreement) return;
        try {
            await sign(agreement._id);
            setSignConfirm(false);
            showToast('success', 'Agreement signed successfully!');
        } catch (err: any) {
            setSignConfirm(false);
            showToast('error', err.message || 'Failed to sign agreement');
        }
    };

    const isUserSigned = () => {
        if (!agreement || !user) return false;
        // Normalise both sides to string — tenant/landlord may be ObjectId objects
        const tenantId = (typeof agreement.tenant === 'object' && agreement.tenant !== null)
            ? (agreement.tenant as any)._id?.toString() ?? String(agreement.tenant)
            : String(agreement.tenant);
        const landlordId = (typeof agreement.landlord === 'object' && agreement.landlord !== null)
            ? (agreement.landlord as any)._id?.toString() ?? String(agreement.landlord)
            : String(agreement.landlord);
        const userId = String(user.id);
        if (tenantId === userId && agreement.tenantSignedAt) return true;
        if (landlordId === userId && agreement.landlordSignedAt) return true;
        return false;
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-lg flex items-center gap-3 text-sm font-medium transition-all ${
                        toast.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                    }`}
                >
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                </div>
            )}

            <div className="container max-w-3xl py-12">
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Bookings</span>
                </button>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Lease Agreement</h1>
                        <p className="text-neutral-500 mt-1 text-sm">
                            Booking reference: <span className="font-mono font-medium">{bookingId}</span>
                        </p>
                    </div>
                    {agreement && (
                        <Badge variant={agreement.status === 'signed' ? 'success' : 'primary'}>
                            {agreement.status === 'signed' ? '✓ Signed' : '📄 Generated'}
                        </Badge>
                    )}
                </div>

                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-neutral-100">
                        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-neutral-500">Loading agreement...</p>
                    </div>
                ) : !agreement ? (
                    /* No agreement yet */
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-neutral-100">
                        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText size={36} className="text-neutral-400" />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-800 mb-2">No Agreement Yet</h2>
                        <p className="text-neutral-500 mb-8 max-w-sm mx-auto text-sm">
                            A lease agreement can be generated once the booking is marked as completed and payment has been verified.
                        </p>
                        <Button variant="primary" onClick={handleGenerate} disabled={generating}>
                            {generating ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Generating PDF...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <FileText size={16} />
                                    Generate Lease Agreement
                                </span>
                            )}
                        </Button>
                        {error && (
                            <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl inline-block">
                                {error}
                            </p>
                        )}
                    </div>
                ) : (
                    /* Agreement exists */
                    <div className="space-y-6">
                        {/* Agreement card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <FileText size={28} className="text-primary-600" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-neutral-900">Residential Lease Agreement</h2>
                                    <p className="text-neutral-500 text-sm">
                                        Generated on {formatDate(agreement.createdAt)}
                                    </p>
                                </div>
                                <Badge variant={agreement.status === 'signed' ? 'success' : 'primary'}>
                                    {agreement.status === 'signed' ? 'Fully Signed' : 'Awaiting Signatures'}
                                </Badge>
                            </div>

                            {/* Signature status */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-neutral-50 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        {agreement.tenantSignedAt ? (
                                            <CheckCircle size={16} className="text-green-500" />
                                        ) : (
                                            <Clock size={16} className="text-neutral-400" />
                                        )}
                                        <span className="text-sm font-semibold text-neutral-700">Tenant</span>
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        {agreement.tenantSignedAt
                                            ? `Signed on ${formatDate(agreement.tenantSignedAt)}`
                                            : 'Awaiting signature'}
                                    </p>
                                </div>
                                <div className="bg-neutral-50 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        {agreement.landlordSignedAt ? (
                                            <CheckCircle size={16} className="text-green-500" />
                                        ) : (
                                            <Clock size={16} className="text-neutral-400" />
                                        )}
                                        <span className="text-sm font-semibold text-neutral-700">Landlord</span>
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        {agreement.landlordSignedAt
                                            ? `Signed on ${formatDate(agreement.landlordSignedAt)}`
                                            : 'Awaiting signature'}
                                    </p>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-3">
                                <Button variant="primary" onClick={handleDownload} disabled={downloadLoading}>
                                    {downloadLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Downloading...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Download size={16} />
                                            Download PDF
                                        </span>
                                    )}
                                </Button>

                                {!isUserSigned() && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => setSignConfirm(true)}
                                        disabled={signing}
                                    >
                                        <span className="flex items-center gap-2">
                                            <CheckCircle size={16} />
                                            I Accept & Sign
                                        </span>
                                    </Button>
                                )}

                                {isUserSigned() && !agreement.landlordSignedAt && agreement.tenant === user?.id && (
                                    <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-xl flex items-center gap-2">
                                        <Clock size={14} />
                                        Waiting for landlord's signature
                                    </p>
                                )}
                                {isUserSigned() && !agreement.tenantSignedAt && agreement.landlord === user?.id && (
                                    <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-xl flex items-center gap-2">
                                        <Clock size={14} />
                                        Waiting for tenant's signature
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* View PDF link */}
                        <div className="bg-neutral-100 rounded-2xl p-4 flex items-center gap-3 text-sm text-neutral-600">
                            <FileText size={16} />
                            <span>
                                You can also{' '}
                                <a
                                    href={`${ASSETS_URL}${agreement.pdfUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-600 underline hover:text-primary-700"
                                >
                                    view the PDF in your browser
                                </a>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Sign confirmation modal */}
            {signConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={28} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-neutral-900 mb-2">Confirm Signature</h3>
                        <p className="text-neutral-500 text-center text-sm mb-6">
                            By clicking "Sign Agreement", you confirm that you have read and accept all the terms and conditions stated in this lease agreement.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSignConfirm(false)}
                                className="flex-1 py-3 rounded-2xl border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSign}
                                disabled={signing}
                                className="flex-1 py-3 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {signing ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Signing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        Sign Agreement
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgreementPage;
