import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyService, bookingService, chatService, matchingService, ASSETS_URL } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { IProperty } from '@shared/types';
import Button from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { MessageCircle } from 'lucide-react';

interface ScoreBreakdown {
    category: string;
    score: number;
    weight: number;
    weightedScore: number;
}

const PropertyDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [property, setProperty] = useState<IProperty | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [selectedBedNumber, setSelectedBedNumber] = useState<number | ''>('');
    const [requestMessage, setRequestMessage] = useState('Hi, I am interested in this property.');
    const [moveInDate, setMoveInDate] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Matching
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [matchBreakdown, setMatchBreakdown] = useState<ScoreBreakdown[]>([]);
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);

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

    // Fetch match score once
    useEffect(() => {
        if (!id || !isAuthenticated) return;
        let cancelled = false;

        matchingService.getPropertyScore(id).then((result) => {
            if (cancelled) return;
            setHasProfile(result.hasProfile);
            if (result.score) {
                setMatchScore(result.score.overallScore);
                setMatchBreakdown(result.score.breakdown);
            }
        }).catch(() => {
            // Non-critical — silently ignore
        });

        return () => { cancelled = true; };
    }, [id, isAuthenticated]);

    const handleBookingRequest = async () => {
        if (!id) return;
        setBookingLoading(true);
        try {
            await bookingService.requestBooking({
                propertyId: id,
                proposedMoveInDate: new Date(moveInDate),
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
                        {property.images?.[0]?.url ? (
                            <img
                                src={property.images[0].url.startsWith('/uploads/') ? `${ASSETS_URL}${property.images[0].url}` : property.images[0].url}
                                alt={property.title}
                                className="w-full h-full object-cover"
                            />
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
                        {/* Compatibility score card */}
                        {isAuthenticated && matchScore !== null && (
                            <div className="mb-6 p-4 rounded-xl border"
                                style={{
                                    borderColor: matchScore >= 80 ? '#86efac' : matchScore >= 60 ? '#fde68a' : '#fca5a5',
                                    backgroundColor: matchScore >= 80 ? '#f0fdf4' : matchScore >= 60 ? '#fefce8' : '#fef2f2',
                                }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-neutral-700">Your Match</span>
                                    <span className="text-lg font-bold"
                                        style={{ color: matchScore >= 80 ? '#16a34a' : matchScore >= 60 ? '#ca8a04' : '#dc2626' }}
                                    >
                                        {matchScore}%
                                    </span>
                                </div>
                                {/* Top 3 breakdown items */}
                                <div className="space-y-1">
                                    {matchBreakdown
                                        .sort((a, b) => b.weightedScore - a.weightedScore)
                                        .slice(0, 3)
                                        .map((item) => (
                                            <div key={item.category} className="flex items-center justify-between text-xs text-neutral-600">
                                                <span>{item.category}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${item.score}%`,
                                                                backgroundColor: item.score >= 80 ? '#16a34a' : item.score >= 60 ? '#ca8a04' : '#dc2626',
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="w-8 text-right">{item.score}%</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {isAuthenticated && hasProfile === false && (
                            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                                Complete your roommate profile to see compatibility scores.
                            </div>
                        )}

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
                                    aria-label="Select Bed Number"
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
                                Preferred Move-in Date
                            </label>
                            <input
                                type="date"
                                value={moveInDate}
                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                onChange={(e) => setMoveInDate(e.target.value)}
                                className="w-full p-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>

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
                                !moveInDate ||
                                (property.propertyType === 'shared_room' && !selectedBedNumber) ||
                                !requestMessage.trim()
                            }
                        >
                            {bookingLoading ? 'Sending...' : 'Request Booking'}
                        </Button>

                        <Button
                            variant="secondary"
                            className="w-full py-4 text-lg mt-3 flex items-center justify-center gap-2"
                            onClick={async () => {
                                try {
                                    const landlordId = typeof property.owner === 'string' 
                                        ? property.owner 
                                        : (property.owner as any)._id;
                                    await chatService.startPropertyInquiry(
                                        landlordId,
                                        property._id!,
                                        `Hi, I'm interested in "${property.title}". Can we discuss the details?`
                                    );
                                    navigate('/messages');
                                } catch (error) {
                                    console.error('Failed to start conversation:', error);
                                }
                            }}
                        >
                            <MessageCircle size={20} />
                            Contact Landlord
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetailPage;
