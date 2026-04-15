import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, ChevronLeft, ChevronRight, Loader2,
    ShieldCheck, ShieldOff, UserCog, X, AlertCircle,
} from 'lucide-react';
import { adminUserService } from '../services/api';
import { IUserPublic, UserRole, UserStatus } from '@shared/types/user.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 15;

const ROLE_LABELS: Record<string, string> = {
    tenant: 'Tenant',
    landlord: 'Landlord',
    admin: 'Admin',
};

const STATUS_LABELS: Record<string, string> = {
    active: 'Active',
    suspended: 'Suspended',
    deactivated: 'Deactivated',
    pending: 'Pending',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'active') return 'default';
    if (status === 'suspended') return 'destructive';
    return 'secondary';
}

function roleVariant(role: string): 'default' | 'secondary' | 'outline' {
    if (role === 'admin') return 'default';
    if (role === 'landlord') return 'secondary';
    return 'outline';
}

function formatDate(date?: string | Date): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

// ─── Inline Role Selector ─────────────────────────────────────────────────────

interface RoleSelectorProps {
    userId: string;
    currentRole: string;
    onSave: (userId: string, role: string) => void;
    isSaving: boolean;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ userId, currentRole, onSave, isSaving }) => {
    const [editing, setEditing] = useState(false);
    const [selected, setSelected] = useState(currentRole);

    if (!editing) {
        return (
            <button
                type="button"
                onClick={() => setEditing(true)}
                className="group flex items-center gap-1.5"
                title="Click to change role"
            >
                <Badge variant={roleVariant(currentRole)} className="capitalize text-xs">
                    {ROLE_LABELS[currentRole] ?? currentRole}
                </Badge>
                <UserCog size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <Select
                value={selected}
                onValueChange={setSelected}
            >
                <SelectTrigger className="h-7 w-28 text-xs rounded-lg">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={UserRole.TENANT}>Tenant</SelectItem>
                    <SelectItem value={UserRole.LANDLORD}>Landlord</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                </SelectContent>
            </Select>
            <Button
                size="sm"
                className="h-7 px-2.5 text-xs rounded-lg"
                disabled={isSaving || selected === currentRole}
                onClick={() => { onSave(userId, selected); setEditing(false); }}
            >
                {isSaving ? <Loader2 size={11} className="animate-spin" /> : 'Save'}
            </Button>
            <button type="button" onClick={() => { setEditing(false); setSelected(currentRole); }}>
                <X size={13} className="text-muted-foreground hover:text-slate-700" />
            </button>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminUsersPage: React.FC = () => {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);

    // Debounce search input
    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        clearTimeout((handleSearchChange as any)._timer);
        (handleSearchChange as any)._timer = setTimeout(() => {
            setDebouncedSearch(value);
            setPage(1);
        }, 400);
    }, []);

    const queryParams = {
        page,
        limit: LIMIT,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filterRole && { role: filterRole }),
        ...(filterStatus && { status: filterStatus }),
    };

    const { data, isLoading, isError } = useQuery({
        queryKey: ['adminUsers', queryParams],
        queryFn: () => adminUserService.getUsers(queryParams),
        staleTime: 30 * 1000,
        placeholderData: (prev) => prev,
    });

    const users: IUserPublic[] = (data?.data as IUserPublic[]) ?? [];
    const total: number = data?.meta?.total ?? 0;
    const totalPages: number = data?.meta?.totalPages ?? 1;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] });

    const statusMutation = useMutation({
        mutationFn: ({ userId, status }: { userId: string; status: string }) =>
            adminUserService.updateStatus(userId, status),
        onSuccess: invalidate,
    });

    const roleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) =>
            adminUserService.updateRole(userId, role),
        onSuccess: invalidate,
    });

    const toggleStatus = (user: IUserPublic) => {
        const newStatus =
            user.status === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
        statusMutation.mutate({ userId: user._id, status: newStatus });
    };

    const handlePageChange = (next: number) => {
        setPage(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setSearch('');
        setDebouncedSearch('');
        setFilterRole('');
        setFilterStatus('');
        setPage(1);
    };

    const activeFilters = [debouncedSearch, filterRole, filterStatus].filter(Boolean).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">Admin</p>
                <h1 className="text-3xl font-extrabold text-slate-900">Manage Users</h1>
                <p className="text-slate-500 mt-1">
                    Search, filter, and control user roles and access.
                </p>
            </div>

            {/* Filters */}
            <Card className="rounded-2xl">
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    {/* Search */}
                    <div className="flex items-center gap-2 rounded-xl border border-input px-3 py-2 flex-1 min-w-[200px] focus-within:ring-2 focus-within:ring-ring transition">
                        <Search size={14} className="text-muted-foreground shrink-0" />
                        <input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by name or email…"
                            className="text-sm outline-none w-full bg-transparent placeholder:text-muted-foreground"
                        />
                        {search && (
                            <button type="button" onClick={() => handleSearchChange('')}>
                                <X size={13} className="text-muted-foreground hover:text-slate-700" />
                            </button>
                        )}
                    </div>

                    {/* Role filter */}
                    <Select
                        value={filterRole || 'all'}
                        onValueChange={(v) => { setFilterRole(v === 'all' ? '' : v); setPage(1); }}
                    >
                        <SelectTrigger className="w-[130px] rounded-xl">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value={UserRole.TENANT}>Tenant</SelectItem>
                            <SelectItem value={UserRole.LANDLORD}>Landlord</SelectItem>
                            <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Status filter */}
                    <Select
                        value={filterStatus || 'all'}
                        onValueChange={(v) => { setFilterStatus(v === 'all' ? '' : v); setPage(1); }}
                    >
                        <SelectTrigger className="w-[140px] rounded-xl">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                            <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
                            <SelectItem value={UserStatus.DEACTIVATED}>Deactivated</SelectItem>
                            <SelectItem value={UserStatus.PENDING}>Pending</SelectItem>
                        </SelectContent>
                    </Select>

                    {activeFilters > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-xs text-muted-foreground hover:text-slate-700">
                            <X size={13} />
                            Clear ({activeFilters})
                        </Button>
                    )}

                    <span className="ml-auto text-xs text-muted-foreground font-medium">
                        {isLoading ? '…' : `${total} user${total !== 1 ? 's' : ''}`}
                    </span>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="rounded-2xl overflow-hidden">
                <div className="relative min-h-[200px]">
                    {isError ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <AlertCircle size={32} className="text-red-400" />
                            <p className="text-sm text-slate-500">Failed to load users</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-500 pl-5">User</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-500">Role</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-500">Status</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-500">Verified</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-500">Joined</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wide text-slate-500 pr-5">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <TableRow key={i} className="animate-pulse">
                                            <TableCell className="pl-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-slate-100" />
                                                    <div className="space-y-1.5">
                                                        <div className="h-3 w-28 bg-slate-100 rounded" />
                                                        <div className="h-2.5 w-36 bg-slate-100 rounded" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell><div className="h-5 w-16 bg-slate-100 rounded-full" /></TableCell>
                                            <TableCell><div className="h-5 w-16 bg-slate-100 rounded-full" /></TableCell>
                                            <TableCell><div className="h-3 w-14 bg-slate-100 rounded" /></TableCell>
                                            <TableCell><div className="h-3 w-20 bg-slate-100 rounded" /></TableCell>
                                            <TableCell className="pr-5"><div className="h-7 w-20 bg-slate-100 rounded-lg" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-20 text-center">
                                            <p className="text-slate-500 font-medium">No users found</p>
                                            {activeFilters > 0 && (
                                                <Button variant="link" size="sm" onClick={clearFilters} className="mt-1 text-xs">
                                                    Clear filters
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => {
                                        const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
                                        const isBlocked = user.status === UserStatus.SUSPENDED;
                                        const isMutating =
                                            (statusMutation.isPending && (statusMutation.variables as any)?.userId === user._id) ||
                                            (roleMutation.isPending && (roleMutation.variables as any)?.userId === user._id);

                                        return (
                                            <TableRow key={user._id} className="group">
                                                {/* User info */}
                                                <TableCell className="pl-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-900 text-sm truncate max-w-[160px]">
                                                                {user.firstName} {user.lastName}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Role */}
                                                <TableCell>
                                                    <RoleSelector
                                                        userId={user._id}
                                                        currentRole={user.role}
                                                        onSave={(uid, role) => roleMutation.mutate({ userId: uid, role })}
                                                        isSaving={isMutating}
                                                    />
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell>
                                                    <Badge variant={statusVariant(user.status)} className="capitalize text-xs font-semibold">
                                                        {STATUS_LABELS[user.status] ?? user.status}
                                                    </Badge>
                                                </TableCell>

                                                {/* Verified */}
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className={`text-[11px] font-medium ${user.emailVerified ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                            {user.emailVerified ? '✓ Email' : '✗ Email'}
                                                        </span>
                                                        <span className={`text-[11px] font-medium ${user.cnicVerified ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                            {user.cnicVerified ? '✓ CNIC' : '✗ CNIC'}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* Joined */}
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {formatDate(user.createdAt)}
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="pr-5">
                                                    <Button
                                                        variant={isBlocked ? 'outline' : 'destructive'}
                                                        size="sm"
                                                        className="h-7 px-3 text-xs rounded-lg gap-1.5"
                                                        disabled={isMutating || statusMutation.isPending}
                                                        onClick={() => toggleStatus(user)}
                                                    >
                                                        {isMutating ? (
                                                            <Loader2 size={11} className="animate-spin" />
                                                        ) : isBlocked ? (
                                                            <><ShieldCheck size={12} /> Unblock</>
                                                        ) : (
                                                            <><ShieldOff size={12} /> Block</>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && !isLoading && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="gap-1.5 rounded-xl"
                    >
                        <ChevronLeft size={15} />
                        Prev
                    </Button>
                    <span className="text-sm text-slate-500 px-3 font-medium">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="gap-1.5 rounded-xl"
                    >
                        Next
                        <ChevronRight size={15} />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
