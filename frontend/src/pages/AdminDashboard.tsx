import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminPropertyService } from '../services/api';
import { PropertyStatus } from '@shared/types/property.types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import { CheckCircle, XCircle, Search, Building2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';

// ── Confirm Dialog ──────────────────────────────────────────────────
interface ConfirmDialogProps {
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant?: 'default' | 'destructive';
    requireReason?: boolean;
    onConfirm: (reason?: string) => void;
    onCancel: () => void;
}

function ConfirmDialog({ title, description, confirmLabel, confirmVariant = 'default', requireReason, onConfirm, onCancel }: ConfirmDialogProps) {
    const [reason, setReason] = useState('');
    const canConfirm = !requireReason || reason.trim().length >= 5;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 p-6">
                <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        <p className="text-sm text-slate-500 mt-1">{description}</p>
                    </div>
                </div>

                {requireReason && (
                    <div className="mb-4">
                        <label className="text-sm font-medium text-slate-700 block mb-1">
                            Rejection reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            rows={3}
                            placeholder="Explain why this property is being rejected…"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                        {reason.trim().length > 0 && reason.trim().length < 5 && (
                            <p className="text-xs text-red-500 mt-1">Reason must be at least 5 characters.</p>
                        )}
                    </div>
                )}

                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button
                        variant={confirmVariant === 'destructive' ? 'destructive' : 'default'}
                        disabled={!canConfirm}
                        onClick={() => onConfirm(requireReason ? reason.trim() : undefined)}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Status badge helper ─────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
    [PropertyStatus.PENDING_VERIFICATION]: 'bg-amber-100 text-amber-700 border-amber-200',
    [PropertyStatus.ACTIVE]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [PropertyStatus.REJECTED]: 'bg-red-100 text-red-700 border-red-200',
    [PropertyStatus.RENTED]: 'bg-blue-100 text-blue-700 border-blue-200',
    [PropertyStatus.INACTIVE]: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
    [PropertyStatus.PENDING_VERIFICATION]: 'Pending',
    [PropertyStatus.ACTIVE]: 'Active',
    [PropertyStatus.REJECTED]: 'Rejected',
    [PropertyStatus.RENTED]: 'Rented',
    [PropertyStatus.INACTIVE]: 'Inactive',
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

// ── Skeleton row ────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <TableRow>
            {[140, 100, 80, 80, 90, 80].map((w, i) => (
                <TableCell key={i}>
                    <div className={`h-4 bg-slate-100 rounded animate-pulse w-${w === 140 ? '32' : w === 100 ? '24' : w === 90 ? '20' : '16'}`} />
                </TableCell>
            ))}
        </TableRow>
    );
}

// ── Main page ───────────────────────────────────────────────────────
type DialogState =
    | { mode: 'approve'; id: string; title: string }
    | { mode: 'reject'; id: string; title: string }
    | null;

const AdminDashboardPage: React.FC = () => {
    const queryClient = useQueryClient();

    // Filters
    const [status, setStatus] = useState<string>('all');
    const [city, setCity] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const LIMIT = 10;

    // Confirm dialog
    const [dialog, setDialog] = useState<DialogState>(null);

    // Query
    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-properties', { status, city, search, page }],
        queryFn: () =>
            adminPropertyService.getAll({
                page,
                limit: LIMIT,
                status: status === 'all' ? undefined : status,
                city: city.trim() || undefined,
                search: search.trim() || undefined,
            }),
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });

    const properties: any[] = data?.data ?? [];
    const meta = data?.meta;
    const totalPages = meta?.totalPages ?? 1;

    const invalidate = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    }, [queryClient]);

    // Mutations
    const approveMutation = useMutation({
        mutationFn: (id: string) => adminPropertyService.approve(id),
        onSuccess: () => { setDialog(null); invalidate(); },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            adminPropertyService.reject(id, reason),
        onSuccess: () => { setDialog(null); invalidate(); },
    });

    const handleFilterChange = useCallback((setter: (v: string) => void) => (v: string) => {
        setter(v);
        setPage(1);
    }, []);

    const isPending = (s: string) => s === PropertyStatus.PENDING_VERIFICATION;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">Admin</p>
                <h1 className="text-3xl font-extrabold text-slate-900">Property Management</h1>
                <p className="text-slate-500 mt-2 max-w-2xl">
                    Review listings, approve or reject properties, and manage all active inventory.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                        placeholder="Search title, city, area…"
                        className="pl-9"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                <div className="w-[180px]">
                    <Select value={status} onValueChange={handleFilterChange(setStatus)}>
                        <SelectTrigger>
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value={PropertyStatus.PENDING_VERIFICATION}>Pending</SelectItem>
                            <SelectItem value={PropertyStatus.ACTIVE}>Active</SelectItem>
                            <SelectItem value={PropertyStatus.REJECTED}>Rejected</SelectItem>
                            <SelectItem value={PropertyStatus.RENTED}>Rented</SelectItem>
                            <SelectItem value={PropertyStatus.INACTIVE}>Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="relative w-[160px]">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                        placeholder="Filter by city"
                        className="pl-9"
                        value={city}
                        onChange={e => { setCity(e.target.value); setPage(1); }}
                    />
                </div>

                {(status !== 'all' || city || search) && (
                    <Button variant="ghost" size="sm" onClick={() => { setStatus('all'); setCity(''); setSearch(''); setPage(1); }}>
                        Clear filters
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {isError ? (
                    <div className="py-16 text-center text-red-500 text-sm">
                        Failed to load properties. Please try again.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead>Property</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Rent</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: LIMIT }).map((_, i) => <SkeletonRow key={i} />)
                                : properties.length === 0
                                ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-16 text-center text-slate-400">
                                            <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                            <p className="font-medium text-slate-500">No properties found</p>
                                            <p className="text-sm mt-1">Try adjusting your filters.</p>
                                        </TableCell>
                                    </TableRow>
                                )
                                : properties.map((property) => (
                                    <TableRow key={property._id} className="hover:bg-slate-50/60 transition-colors">
                                        <TableCell>
                                            <div className="font-semibold text-slate-900 max-w-[200px] truncate">
                                                {property.title}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-0.5 capitalize">
                                                {property.type?.replace('_', ' ')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-slate-700">{property.location?.city}</div>
                                            <div className="text-xs text-slate-400">{property.location?.area}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium text-slate-700">
                                                {property.owner?.firstName} {property.owner?.lastName}
                                            </div>
                                            <div className="text-xs text-slate-400">{property.owner?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-semibold text-slate-800">
                                                {property.rent?.currency} {property.rent?.amount?.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-slate-400 capitalize">
                                                /{property.rent?.paymentFrequency}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={property.status} />
                                        </TableCell>
                                        <TableCell>
                                            {isPending(property.status) ? (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        onClick={() => setDialog({ mode: 'approve', id: property._id, title: property.title })}
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="h-8 gap-1.5"
                                                        onClick={() => setDialog({ mode: 'reject', id: property._id, title: property.title })}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Page {meta?.page ?? page} of {totalPages}
                        {meta?.total != null && ` · ${meta.total} total`}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="gap-1"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Confirm dialog */}
            {dialog?.mode === 'approve' && (
                <ConfirmDialog
                    title="Approve property?"
                    description={`"${dialog.title}" will become publicly visible to tenants.`}
                    confirmLabel={approveMutation.isPending ? 'Approving…' : 'Approve'}
                    onCancel={() => setDialog(null)}
                    onConfirm={() => approveMutation.mutate(dialog.id)}
                />
            )}

            {dialog?.mode === 'reject' && (
                <ConfirmDialog
                    title="Reject property?"
                    description={`Provide a reason for rejecting "${dialog.title}". The landlord will be notified.`}
                    confirmLabel={rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
                    confirmVariant="destructive"
                    requireReason
                    onCancel={() => setDialog(null)}
                    onConfirm={(reason) => rejectMutation.mutate({ id: dialog.id, reason: reason! })}
                />
            )}
        </div>
    );
};

export default AdminDashboardPage;

