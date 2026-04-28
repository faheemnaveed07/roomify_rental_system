import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService, paymentService } from '../services/api';
import { Badge } from '../components/atoms/Badge';
import Button from '../components/atoms/Button';
import { resolveAssetUrl } from '../services/api';
import { CreditCard, FileText } from 'lucide-react';

const MyBookingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await bookingService.getMyBookings();
                setBookings(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'neutral';
            case 'approved': return 'primary';
            case 'rejected': return 'secondary';
            case 'cancelled': return 'neutral';
            default: return 'neutral';
        }
    };

    const handleInitiatePayment = async (booking: any, method: 'bank_transfer' | 'cash') => {
        setPaymentLoading(booking._id);
        try {
            const landlordId = typeof booking.property.owner === 'string' 
                ? booking.property.owner 
                : booking.property.owner._id;
            
            await paymentService.createPayment({
                bookingId: booking._id,
                landlordId,
                propertyId: booking.property._id,
                paymentType: 'rent',
                paymentMethod: method,
                amount: booking.rentDetails?.monthlyRent,
                currency: 'PKR',
                dueDate: new Date().toISOString()
            });
            navigate('/payments');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setPaymentLoading(null);
        }
    };

    if (loading) return <div className="container py-20 text-center">Loading...</div>;
    if (error) return <div className="container py-20 text-center text-red-500">{error}</div>;

    return (
        <div className="container py-12">
            <h1 className="text-3xl font-bold text-neutral-900 mb-8">My Booking Requests</h1>

            {bookings.length === 0 ? (
                <div className="text-center py-20 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
                    <p className="text-xl text-neutral-500">You haven't made any booking requests yet.</p>
                    <Button variant="primary" onClick={() => window.location.href = '/browse'} className="mt-6">
                        Browse Properties
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {bookings.map((booking) => (
                        <div key={booking._id} className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0">
                                {booking.property?.images?.[0]?.url ? (
                                    <img
                                        src={resolveAssetUrl(booking.property.images[0])}
                                        alt={booking.property.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400">No Image</div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-neutral-900">{booking.property?.title || 'Unknown Property'}</h3>
                                    <Badge variant={getStatusColor(booking.status) as any}>
                                        {booking.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="text-neutral-500 mb-4">{booking.property?.location?.address}, {booking.property?.location?.city}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-neutral-500">Rent</p>
                                        <p className="font-semibold">PKR {booking.rentDetails?.monthlyRent?.toLocaleString()}/mo</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500">Requested On</p>
                                        <p className="font-semibold">{new Date(booking.timeline?.requestedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500">Move-in Date</p>
                                        <p className="font-semibold">{new Date(booking.proposedMoveInDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500">Duration</p>
                                        <p className="font-semibold">{booking.proposedDuration?.value} {booking.proposedDuration?.unit}</p>
                                    </div>
                                </div>

                                {booking.status === 'completed' && (
                                    <div className="mt-4 pt-4 border-t border-neutral-100">
                                        <p className="text-sm font-semibold text-green-700 mb-3">
                                            ✓ Booking completed — your lease agreement is ready.
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            <Button
                                                variant="primary"
                                                onClick={() => navigate(`/agreement/${booking._id}`)}
                                                className="flex items-center gap-2"
                                            >
                                                <FileText size={16} />
                                                View / Generate Agreement
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {booking.status === 'approved' && (
                                    <div className="mt-4 pt-4 border-t border-neutral-100">
                                        <p className="text-sm font-semibold text-neutral-700 mb-3">
                                            Your booking is approved! Choose payment method:
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            <Button
                                                variant="primary"
                                                onClick={() => navigate(`/payment/submit/${booking._id}`)}
                                                className="flex items-center gap-2"
                                            >
                                                <CreditCard size={16} />
                                                Pay via Bank Transfer
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => handleInitiatePayment(booking, 'cash')}
                                                disabled={paymentLoading === booking._id}
                                                className="flex items-center gap-2"
                                            >
                                                💵 Pay Cash
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => navigate('/payments')}
                                                className="flex items-center gap-2"
                                            >
                                                View Payments
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookingsPage;
