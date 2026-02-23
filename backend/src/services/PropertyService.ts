import { Types, FilterQuery, UpdateQuery } from 'mongoose';
import { Property, IPropertyDocument } from '../models/Property';
import {
    IProperty,
    IPropertyCreate,
    IPropertyUpdate,
    IPropertyFilter,
    IPropertySearchResult,
    PropertyStatus,
} from '@shared/types/property.types';
import { PaginationQuery } from '@shared/types/api.types';
import { logger } from '../utils/logger';

export class PropertyService {
    async create(ownerId: string, propertyData: IPropertyCreate): Promise<IPropertyDocument> {
        const property = await Property.create({
            ...propertyData,
            owner: new Types.ObjectId(ownerId),
            location: {
                ...propertyData.location,
                type: 'Point',
                coordinates: [propertyData.location.coordinates[0], propertyData.location.coordinates[1]],
            },
            status: PropertyStatus.PENDING_VERIFICATION,
        });

        logger.info(`Property created: ${property._id} by owner: ${ownerId}`);
        return property;
    }

    async getById(propertyId: string): Promise<IPropertyDocument | null> {
        const property = await Property.findById(propertyId)
            .populate('owner', 'firstName lastName email phone avatar cnicVerified')
            .exec();

        if (property) {
            property.views += 1;
            await property.save();
        }

        return property;
    }

    async update(
        propertyId: string,
        ownerId: string,
        updateData: IPropertyUpdate
    ): Promise<IPropertyDocument | null> {
        const property = await Property.findOneAndUpdate(
            { _id: propertyId, owner: ownerId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (property) {
            logger.info(`Property updated: ${propertyId}`);
        }

        return property;
    }

    async delete(propertyId: string, ownerId: string): Promise<boolean> {
        const result = await Property.findOneAndDelete({
            _id: propertyId,
            owner: ownerId,
        });

        if (result) {
            logger.info(`Property deleted: ${propertyId}`);
            return true;
        }

        return false;
    }

    async search(
        filters: IPropertyFilter,
        pagination: PaginationQuery
    ): Promise<IPropertySearchResult> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = pagination;

        const query: FilterQuery<IPropertyDocument> = {
            status: PropertyStatus.ACTIVE,
        };

        if (filters.q) {
            const regex = { $regex: filters.q, $options: 'i' };
            query.$or = [
                { title: regex },
                { 'location.city': regex },
                { 'location.area': regex },
                { 'location.address': regex },
            ];
        }

        // Apply filters
        if (filters.city && filters.city.toLowerCase() !== 'all') {
            query['location.city'] = { $regex: filters.city, $options: 'i' };
        }

        if (filters.area) {
            query['location.area'] = { $regex: filters.area, $options: 'i' };
        }

        if (filters.propertyType && filters.propertyType.toLowerCase() !== 'all') {
            query.propertyType = filters.propertyType;
        }

        if (filters.minRent || filters.maxRent) {
            query['rent.amount'] = {};
            if (filters.minRent) query['rent.amount'].$gte = filters.minRent;
            if (filters.maxRent) query['rent.amount'].$lte = filters.maxRent;
        }

        if (filters.minBedrooms) {
            query['fullHouseDetails.bedrooms'] = { $gte: filters.minBedrooms };
        }

        if (filters.maxBedrooms) {
            query['fullHouseDetails.bedrooms'] = {
                ...query['fullHouseDetails.bedrooms'],
                $lte: filters.maxBedrooms,
            };
        }

        if (filters.amenities && filters.amenities.length > 0) {
            query.amenities = { $all: filters.amenities };
        }

        if (filters.genderPreference) {
            query['sharedRoomDetails.genderPreference'] = filters.genderPreference;
        }

        if (filters.availableFrom) {
            query['availability.availableFrom'] = { $lte: filters.availableFrom };
        }

        if (filters.furnished !== undefined) {
            query['fullHouseDetails.furnishingStatus'] = filters.furnished
                ? { $in: ['furnished', 'semi-furnished'] }
                : 'unfurnished';
        }

        const skip = (page - 1) * limit;
        const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        let queryBuilder;

        // Geo-spatial search
        if (filters.nearLocation) {
            const { longitude, latitude, maxDistanceKm } = filters.nearLocation;
            queryBuilder = Property.find({
                ...query,
                'location.coordinates': {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude],
                        },
                        $maxDistance: maxDistanceKm * 1000,
                    },
                },
            });
        } else {
            queryBuilder = Property.find(query);
        }

        const [results, total] = await Promise.all([
            queryBuilder
                .populate('owner', 'firstName lastName avatar cnicVerified')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            Property.countDocuments(query),
        ]);

        const properties = (results as any[]).map(doc => ({
            ...doc,
            _id: doc._id.toString(),
            owner: typeof doc.owner === 'object' && doc.owner !== null ? {
                ...doc.owner,
                _id: (doc.owner as any)._id?.toString()
            } : doc.owner
        })) as unknown as IProperty[];

        const totalPages = Math.ceil(total / limit);

        return {
            properties,
            total,
            page,
            limit,
            totalPages,
        };
    }

    async getByOwner(
        ownerId: string,
        pagination: PaginationQuery
    ): Promise<IPropertySearchResult> {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;

        const [results, total] = await Promise.all([
            Property.find({ owner: ownerId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            Property.countDocuments({ owner: ownerId }),
        ]);

        const properties = (results as any[]).map(doc => ({
            ...doc,
            _id: doc._id.toString()
        })) as unknown as IProperty[];

        return {
            properties,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findNearby(
        longitude: number,
        latitude: number,
        maxDistanceKm: number,
        limit = 10
    ): Promise<IPropertyDocument[]> {
        return Property.findNearby(longitude, latitude, maxDistanceKm).limit(limit);
    }

    async updateStatus(
        propertyId: string,
        status: PropertyStatus,
        adminId?: string
    ): Promise<IPropertyDocument | null> {
        const update: UpdateQuery<IPropertyDocument> = { status };

        if (status === PropertyStatus.ACTIVE && adminId) {
            update['verificationStatus.adminApproved'] = true;
            update['verificationStatus.verifiedAt'] = new Date();
            update['verificationStatus.verifiedBy'] = new Types.ObjectId(adminId);
        }

        const property = await Property.findByIdAndUpdate(propertyId, update, { new: true });

        if (property) {
            logger.info(`Property status updated: ${propertyId} to ${status}`);
        }

        return property;
    }

    async incrementInquiries(propertyId: string): Promise<void> {
        await Property.findByIdAndUpdate(propertyId, { $inc: { inquiries: 1 } });
    }

    async getFeatured(limit = 6): Promise<IPropertyDocument[]> {
        return Property.find({ status: PropertyStatus.ACTIVE })
            .sort({ views: -1, inquiries: -1 })
            .limit(limit)
            .populate('owner', 'firstName lastName avatar')
            .exec();
    }

    async getStatistics(ownerId?: string): Promise<Record<string, number>> {
        const match = ownerId ? { owner: new Types.ObjectId(ownerId) } : {};

        const stats = await Property.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const result: Record<string, number> = {
            total: 0,
            active: 0,
            pending: 0,
            rented: 0,
            inactive: 0,
        };

        stats.forEach((stat) => {
            result[stat._id] = stat.count;
            result.total += stat.count;
        });

        return result;
    }
}

export const propertyService = new PropertyService();

export default PropertyService;
