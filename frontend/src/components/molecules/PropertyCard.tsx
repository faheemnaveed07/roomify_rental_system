import React from 'react';
import { Badge, VerificationBadge } from '../atoms/Badge';
import { colors, spacing, borderRadius } from '../../styles/theme';

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
    onClick?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
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
    onClick,
}) => {
    const cardStyles: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.white,
        borderRadius: borderRadius['xl'],
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        overflow: 'hidden',
        transition: 'transform 200ms, box-shadow 200ms',
        cursor: onClick ? 'pointer' : 'default',
    };

    const imageContainerStyles: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        paddingTop: '66.67%', // 3:2 aspect ratio
        backgroundColor: colors.neutral[200],
        overflow: 'hidden',
    };

    const imageStyles: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    };

    const badgeContainerStyles: React.CSSProperties = {
        position: 'absolute',
        top: spacing[3],
        left: spacing[3],
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[1],
    };

    const contentStyles: React.CSSProperties = {
        padding: spacing[4],
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[2],
    };

    const titleStyles: React.CSSProperties = {
        fontSize: '1.125rem',
        fontWeight: 600,
        color: colors.neutral[900],
        margin: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    };

    const locationStyles: React.CSSProperties = {
        fontSize: '0.875rem',
        color: colors.neutral[500],
        display: 'flex',
        alignItems: 'center',
        gap: spacing[1],
    };

    const detailsRowStyles: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: spacing[4],
        fontSize: '0.875rem',
        color: colors.neutral[600],
    };

    const priceStyles: React.CSSProperties = {
        display: 'flex',
        alignItems: 'baseline',
        gap: spacing[1],
        marginTop: spacing[2],
    };

    const priceAmountStyles: React.CSSProperties = {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: colors.primary[500],
    };

    const priceUnitStyles: React.CSSProperties = {
        fontSize: '0.875rem',
        color: colors.neutral[500],
    };

    const amenitiesStyles: React.CSSProperties = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing[1],
        marginTop: spacing[2],
    };

    const formatPrice = (amount: number): string => {
        if (amount >= 100000) {
            return `${(amount / 100000).toFixed(1)}L`;
        }
        if (amount >= 1000) {
            return `${(amount / 1000).toFixed(0)}K`;
        }
        return amount.toString();
    };

    const LocationIcon = () => (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
                d="M7 7.5C7.82843 7.5 8.5 6.82843 8.5 6C8.5 5.17157 7.82843 4.5 7 4.5C6.17157 4.5 5.5 5.17157 5.5 6C5.5 6.82843 6.17157 7.5 7 7.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M7 12.5C9 10.5 11.5 8.31371 11.5 6C11.5 3.51472 9.48528 1.5 7 1.5C4.51472 1.5 2.5 3.51472 2.5 6C2.5 8.31371 5 10.5 7 12.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
            />
        </svg>
    );

    return (
        <div
            style={cardStyles}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div style={imageContainerStyles}>
                {imageUrl ? (
                    <img src={imageUrl} alt={title} style={imageStyles} />
                ) : (
                    <div
                        style={{
                            ...imageStyles,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.neutral[400],
                        }}
                    >
                        No Image
                    </div>
                )}
                <div style={badgeContainerStyles}>
                    {isFeatured && <Badge variant="secondary">Featured</Badge>}
                    <Badge variant={propertyType === 'shared_room' ? 'primary' : 'neutral'}>
                        {propertyType === 'shared_room' ? 'Shared Room' : 'Full House'}
                    </Badge>
                </div>
            </div>

            <div style={contentStyles}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={titleStyles}>{title}</h3>
                    <VerificationBadge isVerified={isVerified} />
                </div>

                <div style={locationStyles}>
                    <LocationIcon />
                    <span>{area}, {city}</span>
                </div>

                <div style={detailsRowStyles}>
                    {propertyType === 'full_house' ? (
                        <>
                            <span>{bedrooms} Bed</span>
                            <span>{bathrooms} Bath</span>
                        </>
                    ) : (
                        <span>{availableBeds} of {totalBeds} beds available</span>
                    )}
                </div>

                {amenities.length > 0 && (
                    <div style={amenitiesStyles}>
                        {amenities.slice(0, 3).map((amenity) => (
                            <Badge key={amenity} variant="neutral" size="sm">
                                {amenity}
                            </Badge>
                        ))}
                        {amenities.length > 3 && (
                            <Badge variant="neutral" size="sm">+{amenities.length - 3}</Badge>
                        )}
                    </div>
                )}

                <div style={priceStyles}>
                    <span style={priceAmountStyles}>
                        {currency} {formatPrice(price)}
                    </span>
                    <span style={priceUnitStyles}>/month</span>
                </div>
            </div>
        </div>
    );
};

export default PropertyCard;
