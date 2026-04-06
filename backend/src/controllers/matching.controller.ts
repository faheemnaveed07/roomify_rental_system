import { Request, Response, NextFunction } from 'express';
import { Property } from '../models/Property';
import { roommateMatcher } from '../services/RoommateMatcher';
import { PropertyStatus } from '@shared/types/property.types';
import { ApiResponse } from '@shared/types/api.types';

export class MatchingController {
    /**
     * GET /matching/properties
     * Returns all active properties with compatibility scores for the authenticated user.
     * If user has no roommate profile, returns { hasProfile: false, properties: [] }.
     */
    async getMatchedProperties(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const {
                city,
                propertyType,
                minPrice,
                maxPrice,
                page = '1',
                limit = '20',
            } = req.query;

            // Build a filter similar to PropertyService.search
            const query: Record<string, any> = { status: PropertyStatus.ACTIVE };

            if (city && (city as string).toLowerCase() !== 'all') {
                query['location.city'] = { $regex: city, $options: 'i' };
            }
            if (propertyType && (propertyType as string).toLowerCase() !== 'all') {
                query.propertyType = propertyType;
            }
            if (minPrice || maxPrice) {
                query['rent.amount'] = {};
                if (minPrice) query['rent.amount'].$gte = Number(minPrice);
                if (maxPrice) query['rent.amount'].$lte = Number(maxPrice);
            }

            const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
            const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
            const skip = (pageNum - 1) * limitNum;

            const [properties, total] = await Promise.all([
                Property.find(query)
                    .populate('owner', 'firstName lastName avatar cnicVerified')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum)
                    .exec(),
                Property.countDocuments(query),
            ]);

            const scores = await roommateMatcher.matchPropertiesForUser(userId, properties);

            const totalPages = Math.ceil(total / limitNum);

            if (!scores) {
                // No roommate profile
                const response: ApiResponse = {
                    success: true,
                    message: 'Properties fetched (no roommate profile)',
                    data: {
                        hasProfile: false,
                        properties: properties.map((p) => p.toObject()),
                        scores: [],
                        total,
                        page: pageNum,
                        limit: limitNum,
                        totalPages,
                    },
                };
                res.json(response);
                return;
            }

            // Build a scoreMap for quick lookup
            const scoreMap = new Map(scores.map((s) => [s.propertyId, s]));

            // Sort properties by score descending
            const sortedProperties = [...properties].sort((a, b) => {
                const sa = scoreMap.get(a._id.toString())?.overallScore ?? 0;
                const sb = scoreMap.get(b._id.toString())?.overallScore ?? 0;
                return sb - sa;
            });

            const response: ApiResponse = {
                success: true,
                message: 'Matched properties fetched',
                data: {
                    hasProfile: true,
                    properties: sortedProperties.map((p) => p.toObject()),
                    scores,
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages,
                },
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /matching/property/:propertyId
     * Returns compatibility score + breakdown for a single property.
     */
    async getPropertyScore(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { propertyId } = req.params;
            const property = await Property.findById(propertyId).exec();

            if (!property) {
                res.status(404).json({ success: false, message: 'Property not found' });
                return;
            }

            const score = await roommateMatcher.scorePropertyForUser(userId, property);

            const response: ApiResponse = {
                success: true,
                message: 'Property score fetched',
                data: {
                    hasProfile: score !== null,
                    score: score ?? null,
                },
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}

export const matchingController = new MatchingController();
