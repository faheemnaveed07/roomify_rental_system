import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyService, bookingService } from '../services/api';
import { IProperty } from '@shared/types';
import Button from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';

const PropertyDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [property, setProperty] = useState<IProperty | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [selectedBedNumber, setSelectedBedNumber] = useState<number | ''>('');
    const [requestMessage, setRequestMessage] = useState('Hi, I am interested in this property.');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchDetail = async () => {
            try {
                const data = await propertyService.getById(id);
                setProperty(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    const handleBookingRequest = async () => {
        if (!id) return;
        setBookingLoading(true);
        try {
            await bookingService.requestBooking({
                propertyId: id,
                proposedMoveInDate: new Date(),
                proposedDuration: { value: 6, unit: 'months' },
                bedNumber: property?.propertyType === 'shared_room' ? Number(selectedBedNumber) : undefined,
                requestMessage
            });
            alert('Booking request sent successfully!');
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="container py-20 text-center">Loading...</div>;
    if (error || !property) return <div className="container py-20 text-center text-red-500">{error || 'Property not found'}</div>;

    return (
        <div className="container py-12">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
                ← Back to Search
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <div className="rounded-3xl overflow-hidden bg-neutral-200 h-[500px] mb-8">
                        {property.images[0] ? (
                            <img src={property.images[0].url} alt={property.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">No Image</div>
                        )}
                    </div>

                    <h1 className="text-4xl font-bold text-neutral-900 mb-4">{property.title}</h1>
                    <div className="flex items-center gap-4 mb-8">
                        <Badge variant="primary">{property.propertyType}</Badge>
                        <span className="text-neutral-500">{property.location.address}, {property.location.area}, {property.location.city}</span>
                    </div>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4">Description</h2>
                        <p className="text-lg text-neutral-600 leading-relaxed">{property.description}</p>
                    </section>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-8 p-8 bg-white rounded-3xl shadow-xl border border-neutral-100">
                        <div className="mb-6">
                            <span className="text-3xl font-bold text-primary-600">PKR {property.rent.amount.toLocaleString()}</span>
                            <span className="text-neutral-500"> / month</span>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between py-2 border-b border-neutral-50">
                                <span className="text-neutral-500">Deposit</span>
                                <span className="font-semibold">{property.rent.securityDeposit ? `PKR ${property.rent.securityDeposit.toLocaleString()}` : 'None'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-neutral-50">
                                <span className="text-neutral-500">Type</span>
                                <span className="font-semibold capitalize">{property.propertyType.replace('_', ' ')}</span>
                            </div>
                            {property.fullHouseDetails && (
                                <>
                                    <div className="flex justify-between py-2 border-b border-neutral-50">
                                        <span className="text-neutral-500">Bedrooms</span>
                                        <span className="font-semibold">{property.fullHouseDetails.bedrooms}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-neutral-50">
                                        <span className="text-neutral-500">Bathrooms</span>
                                        <span className="font-semibold">{property.fullHouseDetails.bathrooms}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {property.propertyType === 'shared_room' && (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Select Bed Number
                                </label>
                                <select
                                    value={selectedBedNumber}
                                    onChange={(e) => setSelectedBedNumber(Number(e.target.value))}
                                    className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="">Choose a bed...</option>
                                    {property.sharedRoomDetails && Array.from(
                                        { length: property.sharedRoomDetails.totalBeds },
                                        (_, i) => i + 1
                                    ).map(num => (
                                        <option key={num} value={num}>
                                            Bed #{num}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Message to Landlord
                            </label>
                            <textarea
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                placeholder="Tell the landlord a bit about yourself..."
                                className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none"
                            />
                        </div>

                        <Button
                            variant="primary"
                            className="w-full py-4 text-lg"
                            onClick={handleBookingRequest}
                            disabled={
                                bookingLoading ||
                                (property.propertyType === 'shared_room' && !selectedBedNumber) ||
                                !requestMessage.trim()
                            }
                        >
                            {bookingLoading ? 'Sending...' : 'Request Booking'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetailPage;
