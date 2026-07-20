import React, { useEffect, useState, useCallback } from 'react';
import {
    CheckCircle, XCircle, Clock, AlertCircle, Eye, ChevronLeft, ChevronRight,
    RefreshCw, User, FileText,
} from 'lucide-react';
import api, { ASSETS_URL } from '../services/api';
import { Badge } from '../components/atoms/Badge';
import Button from '../components/atoms/Button';
import ToastContainer from '../components/atoms/ToastContainer';
import { useToast } from '../hooks/useToast';

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterTab = 'all' | 'pending' | 'awaiting_confirmation' | 'confirmed' | 'rejected';

type BadgeVariant = 'warning' | 'success' | 'error' | 'primary' | 'neutral';

function statusBadge(status: string): { variant: BadgeVariant; label: string; Icon: React.ElementType } {
    switch (status) {
        case 'confirmed':             return { variant: 'success',  label: 'Approved',      Icon: CheckCircle };
        case 'rejected':              return { variant: 'error',    label: 'Rejected',      Icon: XCircle };
        case 'awaiting_confirmation': return { variant: 'primary',  label: 'Under Review',  Icon: AlertCircle };
        case 'pending':               return { variant: 'warning',  label: 'Pending',       Icon: Clock };
        default:                      return { variant: 'neutral',  label: status,          Icon: Clock };
    }
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────
interface ConfirmModalProps {
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant: 'primary' | 'danger';
    children?: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    title, description, confirmLabel, confirmVariant, children, onConfirm, onCancel, loading,
}) => (
    <div
        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
        <div style={{ background: '#141414', borderRadius: 20, padding: 32, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f5f5f5', marginBottom: 10 }}>{title}</h3>
            <p style={{ fontSize: 14, color: '#8f8f8f', marginBottom: 20 }}>{description}</p>
            {children}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
                <Button variant={confirmVariant} onClick={onConfirm} isLoading={loading} disabled={loading}>
                    {confirmLabel}
                </Button>
            </div>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminPaymentsPage: React.FC = () => {
    const { toasts, success, error: toastError, dismiss } = useToast();

    const [payments, setPayments] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, awaiting: 0, confirmed: 0, rejected: 0 });
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Confirmation modals
    const [approveModal, setApproveModal] = useState<{ paymentId: string; amount: number } | null>(null);
    const [rejectModal, setRejectModal] = useState<{ paymentId: string; amount: number } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectReasonError, setRejectReasonError] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    const LIMIT = 15;

    // ── Fetch payments ────────────────────────────────────────────────────────
    const fetchPayments = useCallback(async (tab: FilterTab, currentPage: number) => {
        setLoading(true);
        setFetchError(false);
        try {
            const params: Record<string, any> = { page: currentPage, limit: LIMIT };
            if (tab !== 'all') params.status = tab;
            const response = await api.get('/admin/payments', { params });
            const data = response.data;
            setPayments(data.data || []);
            // The API returns pagination under `meta` — reading `pagination` here
            // silently zeroed every count and hid the pager.
            setTotalPages(data.meta?.totalPages ?? 1);
            setTotalCount(data.meta?.total ?? 0);
        } catch (err) {
            setFetchError(true);
            toastError('Failed to load payments.');
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    // ── Fetch stats (all statuses summary) ───────────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const [all, pending, awaiting, confirmed, rejected] = await Promise.all([
                api.get('/admin/payments', { params: { page: 1, limit: 1 } }),
                api.get('/admin/payments', { params: { page: 1, limit: 1, status: 'pending' } }),
                api.get('/admin/payments', { params: { page: 1, limit: 1, status: 'awaiting_confirmation' } }),
                api.get('/admin/payments', { params: { page: 1, limit: 1, status: 'confirmed' } }),
                api.get('/admin/payments', { params: { page: 1, limit: 1, status: 'rejected' } }),
            ]);
            setStats({
                total:    all.data.meta?.total ?? 0,
                pending:  pending.data.meta?.total ?? 0,
                awaiting: awaiting.data.meta?.total ?? 0,
                confirmed: confirmed.data.meta?.total ?? 0,
                rejected: rejected.data.meta?.total ?? 0,
            });
        } catch { /* stats are non-critical */ }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchPayments(activeTab, page);
    }, [activeTab, page, fetchPayments]);

    const handleTabChange = (tab: FilterTab) => {
        setActiveTab(tab);
        setPage(1);
    };

    // ── Approve ───────────────────────────────────────────────────────────────
    const handleApprove = async () => {
        if (!approveModal) return;
        setActionLoading(true);
        try {
            await api.put(`/admin/payments/${approveModal.paymentId}/approve`, {
                adminNotes: adminNotes.trim() || undefined,
            });
            success('Payment approved. Booking marked as completed.');
            setApproveModal(null);
            setAdminNotes('');
            await Promise.all([fetchPayments(activeTab, page), fetchStats()]);
        } catch (err: any) {
            toastError(err?.response?.data?.message || 'Failed to approve payment.');
        } finally {
            setActionLoading(false);
        }
    };

    // ── Reject ────────────────────────────────────────────────────────────────
    const handleReject = async () => {
        if (!rejectModal) return;
        const reason = rejectReason.trim();
        if (!reason) { setRejectReasonError('Rejection reason is required.'); return; }
        if (reason.length < 10) { setRejectReasonError('Please provide a more descriptive reason (min 10 characters).'); return; }
        setActionLoading(true);
        try {
            await api.put(`/admin/payments/${rejectModal.paymentId}/reject`, { reason });
            success('Payment rejected successfully.');
            setRejectModal(null);
            setRejectReason('');
            setRejectReasonError('');
            await Promise.all([fetchPayments(activeTab, page), fetchStats()]);
        } catch (err: any) {
            toastError(err?.response?.data?.message || 'Failed to reject payment.');
        } finally {
            setActionLoading(false);
        }
    };

    // ── Tab definitions ───────────────────────────────────────────────────────
    const TABS: { key: FilterTab; label: string; count?: number }[] = [
        { key: 'all',                   label: 'All',            count: stats.total },
        { key: 'pending',               label: 'Pending',        count: stats.pending },
        { key: 'awaiting_confirmation', label: 'Under Review',   count: stats.awaiting },
        { key: 'confirmed',             label: 'Approved',       count: stats.confirmed },
        { key: 'rejected',              label: 'Rejected',       count: stats.rejected },
    ];

    // ── Stat cards ────────────────────────────────────────────────────────────
    // These are inline styles, so the .dv-app dark remaps never reach them —
    // every colour here has to be dark-surface tinted by hand.
    const STAT_CARDS = [
        { label: 'Total',        value: stats.total,     color: '#d4845a', bg: 'rgba(212,132,90,0.15)' },
        { label: 'Pending',      value: stats.pending,   color: '#e0a458', bg: 'rgba(224,164,88,0.15)' },
        { label: 'Under Review', value: stats.awaiting,  color: '#7aa2d6', bg: 'rgba(122,162,214,0.15)' },
        { label: 'Approved',     value: stats.confirmed, color: '#5fb98b', bg: 'rgba(45,143,94,0.15)' },
        { label: 'Rejected',     value: stats.rejected,  color: '#e0755a', bg: 'rgba(224,90,74,0.15)' },
    ];

    return (
        <div className="space-y-6">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Page header */}
            <div>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d4845a' }}>Admin</p>
                <h1 className="text-3xl font-extrabold text-slate-900">Payment Verifications</h1>
                <p className="text-slate-500 mt-1 max-w-2xl">
                    Review tenant receipts, approve confirmed transfers, or reject invalid submissions.
                </p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                {STAT_CARDS.map(({ label, value, color, bg }) => (
                    <div key={label} style={{ background: bg, borderRadius: 14, padding: '16px 20px', border: `1px solid ${color}22` }}>
                        <p style={{ fontSize: 28, fontWeight: 800, color }}>{value}</p>
                        <p style={{ fontSize: 12, color: '#8f8f8f', fontWeight: 500, marginTop: 2 }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        style={{
                            padding: '7px 16px',
                            borderRadius: 999,
                            border: `1.5px solid ${activeTab === tab.key ? '#d4845a' : '#262626'}`,
                            background: activeTab === tab.key ? '#d4845a' : '#141414',
                            color: activeTab === tab.key ? '#141414' : '#8f8f8f',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span style={{
                                fontSize: 11,
                                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#1f1f1f',
                                color: activeTab === tab.key ? '#141414' : '#c0c0c0',
                                borderRadius: 999, padding: '1px 7px', fontWeight: 700,
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
                <button
                    onClick={() => { fetchPayments(activeTab, page); fetchStats(); }}
                    title="Refresh"
                    style={{ marginLeft: 'auto', background: 'none', border: '1.5px solid #262626', borderRadius: 999, padding: '7px 12px', cursor: 'pointer', color: '#8f8f8f', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                    <RefreshCw size={14} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Refresh</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <div style={{ width: 36, height: 36, border: '4px solid #262626', borderTopColor: '#d4845a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
                        <p style={{ color: '#8f8f8f', fontSize: 14 }}>Loading payments…</p>
                    </div>
                ) : fetchError ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <p style={{ color: '#ef4444', fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Failed to load payments</p>
                        <button
                            onClick={() => fetchPayments(activeTab, page)}
                            style={{ padding: '8px 20px', background: '#d4845a', color: '#141414', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >
                            Try Again
                        </button>
                    </div>
                ) : payments.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <FileText size={40} color="#4a4a4a" style={{ margin: '0 auto 12px' }} />
                        <p style={{ color: '#8f8f8f', fontSize: 15, fontWeight: 500 }}>No payments found</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="w-full text-left" style={{ minWidth: 800 }}>
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {['Tenant', 'Property', 'Amount', 'Type', 'Transaction ID', 'Receipt', 'Status', 'Actions'].map((h) => (
                                        <th key={h} className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map((payment) => {
                                    const { variant, label, Icon } = statusBadge(payment.status);
                                    const tenant = payment.tenant;
                                    const property = payment.property;
                                    const canAct = payment.status === 'pending' || payment.status === 'awaiting_confirmation';

                                    return (
                                        <tr key={payment._id} style={{ transition: 'background 0.15s' }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1a1a')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            {/* Tenant */}
                                            <td className="px-5 py-4">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    {tenant?.avatar ? (
                                                        <img src={`${ASSETS_URL}${tenant.avatar}`} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <User size={16} color="#94a3b8" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p style={{ fontWeight: 600, fontSize: 13, color: '#f5f5f5' }}>
                                                            {tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown'}
                                                        </p>
                                                        <p style={{ fontSize: 11, color: '#8f8f8f' }}>{tenant?.email ?? ''}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Property */}
                                            <td className="px-5 py-4">
                                                <p style={{ fontSize: 13, fontWeight: 600, color: '#f5f5f5', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {property?.title ?? '—'}
                                                </p>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-5 py-4">
                                                <span style={{ fontWeight: 700, fontSize: 14, color: '#f5f5f5' }}>
                                                    PKR {(payment.amount ?? 0).toLocaleString()}
                                                </span>
                                            </td>

                                            {/* Type */}
                                            <td className="px-5 py-4">
                                                <span style={{ fontSize: 12, color: '#8f8f8f', fontWeight: 500 }}>
                                                    {(payment.paymentType ?? '').replace(/_/g, ' ')}
                                                </span>
                                            </td>

                                            {/* Transaction ID */}
                                            <td className="px-5 py-4">
                                                <span style={{ fontSize: 12, color: '#c0c0c0', fontFamily: 'monospace', background: '#1f1f1f', padding: '3px 8px', borderRadius: 6 }}>
                                                    {payment.transactionReference ?? '—'}
                                                </span>
                                            </td>

                                            {/* Receipt */}
                                            <td className="px-5 py-4">
                                                {payment.proofOfPayment ? (
                                                    <a
                                                        href={`${ASSETS_URL}${payment.proofOfPayment}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#d4845a', fontWeight: 600, fontSize: 12 }}
                                                    >
                                                        <Eye size={14} />
                                                        View
                                                    </a>
                                                ) : (
                                                    <span style={{ color: '#6a6a6a', fontSize: 12 }}>—</span>
                                                )}
                                            </td>

                                            {/* Status badge */}
                                            <td className="px-5 py-4">
                                                <Badge variant={variant}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                        <Icon size={11} />
                                                        {label}
                                                    </span>
                                                </Badge>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                {canAct ? (
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button
                                                            onClick={() => { setApproveModal({ paymentId: payment._id, amount: payment.amount }); setAdminNotes(''); }}
                                                            style={{ padding: '5px 14px', borderRadius: 8, background: 'rgba(45,143,94,0.15)', border: '1.5px solid rgba(95,185,139,0.35)', color: '#5fb98b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => { setRejectModal({ paymentId: payment._id, amount: payment.amount }); setRejectReason(''); setRejectReasonError(''); }}
                                                            style={{ padding: '5px 14px', borderRadius: 8, background: 'rgba(224,90,74,0.15)', border: '1.5px solid rgba(224,117,90,0.35)', color: '#e0755a', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: 12, color: '#6a6a6a' }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                    <p style={{ fontSize: 13, color: '#8f8f8f' }}>
                        Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total)
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #262626', background: '#141414', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#c0c0c0' }}
                        >
                            <ChevronLeft size={15} /> Prev
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #262626', background: '#141414', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#c0c0c0' }}
                        >
                            Next <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            )}

            {/* Approve confirmation modal */}
            {approveModal && (
                <ConfirmModal
                    title="Approve Payment"
                    description={`Confirm receipt of PKR ${(approveModal.amount ?? 0).toLocaleString()}. The booking will be automatically marked as completed.`}
                    confirmLabel="Approve Payment"
                    confirmVariant="primary"
                    loading={actionLoading}
                    onConfirm={handleApprove}
                    onCancel={() => setApproveModal(null)}
                >
                    <div style={{ marginBottom: 4 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#c0c0c0', display: 'block', marginBottom: 6 }}>
                            Admin notes (optional)
                        </label>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="e.g. Receipt verified via bank portal on April 3, 2026"
                            rows={3}
                            maxLength={500}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #262626', fontSize: 13, resize: 'none', outline: 'none', background: '#0f0f0f', color: '#f5f5f5', boxSizing: 'border-box' }}
                        />
                    </div>
                </ConfirmModal>
            )}

            {/* Reject confirmation modal */}
            {rejectModal && (
                <ConfirmModal
                    title="Reject Payment"
                    description={`You are rejecting a PKR ${(rejectModal.amount ?? 0).toLocaleString()} payment. The tenant will be notified.`}
                    confirmLabel="Reject Payment"
                    confirmVariant="danger"
                    loading={actionLoading}
                    onConfirm={handleReject}
                    onCancel={() => setRejectModal(null)}
                >
                    <div style={{ marginBottom: 4 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#c0c0c0', display: 'block', marginBottom: 6 }}>
                            Rejection reason <span style={{ color: '#e0755a' }}>*</span>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => { setRejectReason(e.target.value); if (rejectReasonError) setRejectReasonError(''); }}
                            placeholder="e.g. Transaction ID not found in bank records, please resubmit."
                            rows={3}
                            maxLength={500}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${rejectReasonError ? '#fca5a5' : '#262626'}`, fontSize: 13, resize: 'none', outline: 'none', background: '#0f0f0f', color: '#f5f5f5', boxSizing: 'border-box' }}
                        />
                        {rejectReasonError && (
                            <p style={{ color: '#e0755a', fontSize: 12, marginTop: 4 }}>{rejectReasonError}</p>
                        )}
                    </div>
                </ConfirmModal>
            )}
        </div>
    );
};

export default AdminPaymentsPage;
