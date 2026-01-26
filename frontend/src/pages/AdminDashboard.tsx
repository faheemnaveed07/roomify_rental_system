import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/atoms/Badge';
import Button from '../components/atoms/Button';

const AdminDashboardPage: React.FC = () => {
    const [pendingDocs, setPendingDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const response = await api.get('/admin/pending-documents');
            setPendingDocs(response.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string, action: 'approve' | 'reject') => {
        try {
            if (action === 'approve') {
                await api.patch(`/admin/approve-document/${id}`);
            } else {
                await api.patch(`/admin/reject-document/${id}`, { reason: 'Document unclear' });
            }
            fetchPending();
        } catch (err) {
            alert('Action failed');
        }
    };

    return (
        <div className="container py-12">
            <h1 className="text-3xl font-bold mb-8">Admin Verification Queue</h1>

            {loading ? (
                <div>Loading queue...</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-neutral-600">User</th>
                                <th className="px-6 py-4 font-semibold text-neutral-600">Document Type</th>
                                <th className="px-6 py-4 font-semibold text-neutral-600">Status</th>
                                <th className="px-6 py-4 font-semibold text-neutral-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {pendingDocs.map((doc) => (
                                <tr key={doc._id}>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-neutral-900">{doc.user?.firstName} {doc.user?.lastName}</div>
                                            <div className="text-sm text-neutral-500">{doc.user?.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="neutral">{doc.documentType}</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="secondary">Pending</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <Button variant="primary" size="sm" onClick={() => handleVerify(doc._id, 'approve')}>Approve</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleVerify(doc._id, 'reject')}>Reject</Button>
                                            <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary-600 text-sm font-medium hover:underline ml-2">View File</a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pendingDocs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">No pending verifications.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;
