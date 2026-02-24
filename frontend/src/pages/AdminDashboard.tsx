import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge } from '../components/atoms/Badge';
import Button from '../components/atoms/Button';

const AdminDashboardPage: React.FC = () => {
    const [pendingProperties, setPendingProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const response = await api.get('/admin/properties/pending');
            setPendingProperties(response.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.post(`/admin/properties/${id}/approve`);
            fetchPending();
        } catch (err) {
            alert('Action failed');
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-primary-600">Admin</p>
                <h1 className="text-3xl font-extrabold text-slate-900">Pending Property Approvals</h1>
                <p className="text-slate-500 mt-2 max-w-2xl">
                    Review new listings, verify details, and keep Roomify trusted.
                </p>
            </div>

            {loading ? (
                <div>Loading queue...</div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Property</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Owner</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pendingProperties.map((property) => (
                                <tr key={property._id}>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-slate-900">{property.title}</div>
                                            <div className="text-sm text-slate-500">
                                                {property.location?.area}, {property.location?.city}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {property.rent?.currency} {property.rent?.amount?.toLocaleString()} / {property.rent?.paymentFrequency}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-slate-900">
                                                {property.owner?.firstName} {property.owner?.lastName}
                                            </div>
                                            <div className="text-sm text-slate-500">{property.owner?.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="secondary">Pending</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <Button variant="primary" size="sm" onClick={() => handleApprove(property._id)}>
                                                Approve
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pendingProperties.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No pending properties.</td>
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
