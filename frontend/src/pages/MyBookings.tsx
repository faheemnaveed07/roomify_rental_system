import React, { useEffect, useState } from 'react';
import { bookingService } from '../services/api';
import { Badge } from '../components/atoms/Badge';
import Button from '../components/atoms/Button';
import { ASSETS_URL } from '../services/api';

const MyBookingsPage: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                                        src={booking.property.images[0].url.startsWith('/uploads/') ? `${ASSETS_URL}${booking.property.images[0].url}` : booking.property.images[0].url}
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
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookingsPage;
