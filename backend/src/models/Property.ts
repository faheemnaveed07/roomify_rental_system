import mongoose, { Schema, Document, Model } from 'mongoose'; // 'Types' removed as it was unused
import { IProperty, PropertyType, PropertyStatus, Amenity } from '@shared/types/property.types';

// Fix for TS2320: Omit _id from IProperty to avoid conflict with Mongoose Document _id
export interface IPropertyDocument extends Document, Omit<IProperty, '_id'> {
    _id: mongoose.Types.ObjectId;
}

interface IPropertyModel extends Model<IPropertyDocument> {
    findNearby(
        longitude: number,
        latitude: number,
        maxDistanceKm: number
    ): any; // Changed to 'any' or Query type to allow .limit() chaining in Service
}

const locationSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        area: {
            type: String,
            required: true,
        },
        postalCode: {
            type: String,
        },
    },
    { _id: false }
);

const sharedRoomDetailsSchema = new Schema(
    {
        totalBeds: {
            type: Number,
            required: true,
            min: 1,
        },
        availableBeds: {
            type: Number,
            required: true,
            min: 0,
        },
        currentOccupants: {
            type: Number,
            default: 0,
        },
        genderPreference: {
            type: String,
            enum: ['male', 'female', 'any'],
            default: 'any',
        },
        occupantDetails: [
            {
                name: String,
                age: Number,
                occupation: String,
            },
        ],
    },
    { _id: false }
);

const fullHouseDetailsSchema = new Schema(
    {
        bedrooms: {
            type: Number,
            required: true,
            min: 1,
        },
        bathrooms: {
            type: Number,
            required: true,
            min: 1,
        },
        floors: {
            type: Number,
            default: 1,
        },
        parkingSpaces: {
            type: Number,
            default: 0,
        },
        furnishingStatus: {
            type: String,
            enum: ['furnished', 'semi-furnished', 'unfurnished'],
            default: 'unfurnished',
        },
    },
    { _id: false }
);

const propertySchema = new Schema<IPropertyDocument>(
    {
        owner: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: [true, 'Property must have an owner'],
        },
        title: {
            type: String,
            required: [true, 'Property title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Property description is required'],
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        propertyType: {
            type: String,
            enum: Object.values(PropertyType),
            required: [true, 'Property type is required'],
        },
        status: {
            type: String,
            enum: Object.values(PropertyStatus),
            default: PropertyStatus.PENDING_VERIFICATION,
        },
        location: {
            type: locationSchema,
            required: [true, 'Property location is required'],
        },
        rent: {
            amount: {
                type: Number,
                required: [true, 'Rent amount is required'],
                min: [0, 'Rent cannot be negative'],
            },
            currency: {
                type: String,
                default: 'PKR',
            },
            paymentFrequency: {
                type: String,
                enum: ['monthly', 'quarterly', 'yearly'],
                default: 'monthly',
            },
            securityDeposit: {
                type: Number,
                default: 0,
            },
        },
        size: {
            value: {
                type: Number,
                required: [true, 'Property size is required'],
            },
            unit: {
                type: String,
                enum: ['sqft', 'sqm', 'marla', 'kanal'],
                default: 'sqft',
            },
        },
        images: [
            {
                url: String,
                publicId: String,
                isPrimary: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        amenities: [
            {
                type: String,
                enum: Object.values(Amenity),
            },
        ],
        sharedRoomDetails: sharedRoomDetailsSchema,
        fullHouseDetails: fullHouseDetailsSchema,
        rules: {
            petsAllowed: { type: Boolean, default: false },
            smokingAllowed: { type: Boolean, default: false },
            visitorsAllowed: { type: Boolean, default: true },
            additionalRules: [String],
        },
        availability: {
            isAvailable: { type: Boolean, default: true },
            availableFrom: { type: Date, default: Date.now },
            minimumStay: { type: Number, default: 1 },
        },
        views: { type: Number, default: 0 },
        inquiries: { type: Number, default: 0 },
        verificationStatus: {
            ownershipVerified: { type: Boolean, default: false },
            documentsUploaded: { type: Boolean, default: false },
            adminApproved: { type: Boolean, default: false },
            verifiedAt: Date,
            verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
propertySchema.index({ 'location.coordinates': '2dsphere' });
propertySchema.index({ owner: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ 'rent.amount': 1 });
propertySchema.index({ 'location.city': 1, 'location.area': 1 });

// Virtual for primary image
propertySchema.virtual('primaryImage').get(function () {
    const property = this as any;
    const primary = property.images?.find((img: any) => img.isPrimary);
    return primary?.url || property.images?.[0]?.url || null;
});

// Static method for geo-spatial search
propertySchema.statics.findNearby = function (
    longitude: number,
    latitude: number,
    maxDistanceKm: number
) {
    return this.find({
        'location.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude],
                },
                $maxDistance: maxDistanceKm * 1000,
            },
        },
        status: PropertyStatus.ACTIVE,
    });
};

export const Property: IPropertyModel = mongoose.model<IPropertyDocument, IPropertyModel>(
    'Property',
    propertySchema
);

export default Property;