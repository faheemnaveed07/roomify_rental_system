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
        <div className="container py-12">
            <h1 className="text-3xl font-bold mb-8">Pending Property Approvals</h1>

            {loading ? (
                <div>Loading queue...</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-neutral-600">Property</th>
                                <th className="px-6 py-4 font-semibold text-neutral-600">Owner</th>
                                <th className="px-6 py-4 font-semibold text-neutral-600">Status</th>
                                <th className="px-6 py-4 font-semibold text-neutral-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {pendingProperties.map((property) => (
                                <tr key={property._id}>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-neutral-900">{property.title}</div>
                                            <div className="text-sm text-neutral-500">
                                                {property.location?.area}, {property.location?.city}
                                            </div>
                                            <div className="text-xs text-neutral-400 mt-1">
                                                {property.rent?.currency} {property.rent?.amount?.toLocaleString()} / {property.rent?.paymentFrequency}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-neutral-900">
                                                {property.owner?.firstName} {property.owner?.lastName}
                                            </div>
                                            <div className="text-sm text-neutral-500">{property.owner?.email}</div>
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
                                    <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">No pending properties.</td>
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
