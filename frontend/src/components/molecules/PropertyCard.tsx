import React, { useState } from 'react';
import { Heart, MapPin, Bed, Bath, Star, BadgeCheck } from 'lucide-react';
import { Badge } from '../atoms/Badge';
import { ASSETS_URL } from '../../services/api';

/**
 * PropertyCard (Tailwind refactor)
 * --------------------------------
 * Homearia-inspired listing card with:
 *  - status pills (New / Popular / Best price / Featured)
 *  - favorite (heart) toggle in top-right
 *  - 3-icon details row (bed / bath / area)
 *  - compatibility score chip + Best Match star ribbon
 *  - hover-sync hooks for the map (onMouseEnter / onMouseLeave)
 */

export type PropertyStatus = 'new' | 'popular' | 'bestPrice';

interface PropertyCardProps {
    id: string;
    title: string;
    address: string;
    city: string;
    area: string;
    price: number;
    currency?: string;
    propertyType: 'shared_room' | 'full_house';
    imageUrl?: string;
    bedrooms?: number;
    bathrooms?: number;
    availableBeds?: number;
    totalBeds?: number;
    amenities?: string[];
    isVerified?: boolean;
    isFeatured?: boolean;
    statuses?: PropertyStatus[];
    compatibilityScore?: number;
    isBestMatch?: boolean;
    isFavorite?: boolean;
    isHighlighted?: boolean;
    onClick?: () => void;
    onFavoriteToggle?: (id: string, next: boolean) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const statusLabel: Record<PropertyStatus, string> = {
    new: 'New',
    popular: 'Popular',
    bestPrice: 'Best price',
};

const statusClasses: Record<PropertyStatus, string> = {
    new: 'bg-emerald-500 text-white',
    popular: 'bg-orange-500 text-white',
    bestPrice: 'bg-sky-500 text-white',
};

const formatPrice = (amount: number): string => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${Math.round(amount / 1000)}K`;
    return amount.toString();
};

const scoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-700';
    if (score >= 60) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
    id,
    title,
    city,
    area,
    price,
    currency = 'PKR',
    propertyType,
    imageUrl,
    bedrooms,
    bathrooms,
    availableBeds,
    totalBeds,
    amenities = [],
    isVerified = false,
    isFeatured = false,
    statuses = [],
    compatibilityScore,
    isBestMatch = false,
    isFavorite = false,
    isHighlighted = false,
    onClick,
    onFavoriteToggle,
    onMouseEnter,
    onMouseLeave,
}) => {
    const [favorite, setFavorite] = useState<boolean>(isFavorite);

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = !favorite;
        setFavorite(next);
        onFavoriteToggle?.(id, next);
    };

    const resolvedImage = imageUrl
        ? imageUrl.startsWith('/uploads/')
            ? `${ASSETS_URL}${imageUrl}`
            : imageUrl
        : undefined;

    const Wrapper: React.ElementType = onClick ? 'button' : 'div';

    return (
        <Wrapper
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={[
                'group relative w-full text-left bg-white rounded-2xl overflow-hidden',
                'border transition-all duration-200',
                'shadow-[0_1px_3px_0_rgb(0_0_0_/_0.08),_0_1px_2px_-1px_rgb(0_0_0_/_0.06)]',
                'hover:-translate-y-0.5 hover:shadow-lg',
                isHighlighted
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-neutral-200 hover:border-neutral-300',
                onClick ? 'cursor-pointer' : '',
            ].join(' ')}
        >
            {/* ------------- Image area ------------- */}
            <div className="relative w-full aspect-[3/2] bg-neutral-100 overflow-hidden">
                {resolvedImage ? (
                    <img
                        src={resolvedImage}
                        alt={title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
                        No Image
                    </div>
                )}

                {/* Status pills (top-left) */}
                <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                    {isFeatured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500 text-white text-[11px] font-semibold shadow-sm">
                            <Star size={11} fill="currentColor" /> Featured
                        </span>
                    )}
                    {statuses.slice(0, 2).map((s) => (
                        <span
                            key={s}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-sm ${statusClasses[s]}`}
                        >
                            {statusLabel[s]}
                        </span>
                    ))}
                    <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-sm ${propertyType === 'shared_room'
                                ? 'bg-primary-500 text-white'
                                : 'bg-neutral-900 text-white'
                            }`}
                    >
                        {propertyType === 'shared_room' ? 'Shared Room' : 'Full House'}
                    </span>
                </div>

                {/* Favorite button (top-right) */}
                {onFavoriteToggle !== undefined || true ? (
                    <button
                        type="button"
                        onClick={handleFavoriteClick}
                        aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                        className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white backdrop-blur rounded-full shadow-sm transition-transform hover:scale-110"
                    >
                        <Heart
                            size={16}
                            className={
                                favorite
                                    ? 'text-red-500 fill-red-500'
                                    : 'text-neutral-700'
                            }
                        />
                    </button>
                ) : null}

                {/* Compatibility score + Best Match (bottom-right of image) */}
                {compatibilityScore != null && (
                    <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1">
                        <div
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm ${scoreColor(
                                compatibilityScore
                            )}`}
                        >
                            {compatibilityScore}% Match
                        </div>
                        {isBestMatch && (
                            <div className="px-2 py-0.5 rounded-md bg-violet-600 text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                                <Star size={10} fill="currentColor" /> Best Match
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ------------- Content area ------------- */}
            <div className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-neutral-900 truncate flex-1">
                        {title}
                    </h3>
                    {isVerified && (
                        <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700"
                            title="Admin verified"
                        >
                            <BadgeCheck size={14} className="text-emerald-600" />
                            Verified
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 text-sm text-neutral-500">
                    <MapPin size={13} className="shrink-0" />
                    <span className="truncate">
                        {area}, {city}
                    </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-neutral-600 mt-0.5">
                    {propertyType === 'full_house' ? (
                        <>
                            {bedrooms != null && (
                                <span className="inline-flex items-center gap-1">
                                    <Bed size={14} /> {bedrooms} Bed
                                </span>
                            )}
                            {bathrooms != null && (
                                <span className="inline-flex items-center gap-1">
                                    <Bath size={14} /> {bathrooms} Bath
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="inline-flex items-center gap-1">
                            <Bed size={14} /> {availableBeds} of {totalBeds} beds
                        </span>
                    )}
                </div>

                {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {amenities.slice(0, 3).map((amenity) => (
                            <Badge key={amenity} variant="neutral" size="sm">
                                {amenity}
                            </Badge>
                        ))}
                        {amenities.length > 3 && (
                            <Badge variant="neutral" size="sm">
                                +{amenities.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                <div className="flex items-baseline gap-1 mt-2 pt-2 border-t border-neutral-100">
                    <span className="text-xl font-bold text-primary-500">
                        {currency} {formatPrice(price)}
                    </span>
                    <span className="text-xs text-neutral-500">/month</span>
                </div>
            </div>
        </Wrapper>
    );
};

export default PropertyCard;
