import { Request, Response, NextFunction } from 'express';
import { Property } from '../models/Property';
import { RoommateProfile } from '../models/RoommateProfile';
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

            // Rank FIRST, paginate SECOND. Paginating by createdAt before
            // scoring meant page 1 showed the NEWEST listings with scores
            // stamped on, not the BEST matches; a 95% match created a month
            // ago could sit on page 3. Score the whole candidate pool (capped),
            // sort by compatibility, then slice the page out of that ranking.
            const POOL_CAP = 300;
            const allProperties = await Property.find(query)
                .populate('owner', 'firstName lastName avatar cnicVerified')
                .sort({ createdAt: -1 })
                .limit(POOL_CAP)
                .exec();

            const scores = await roommateMatcher.matchPropertiesForUser(userId, allProperties);

            const total = allProperties.length;
            const totalPages = Math.ceil(total / limitNum);

            if (!scores) {
                // No roommate profile: plain newest-first page
                const pageProperties = allProperties.slice(skip, skip + limitNum);
                const response: ApiResponse = {
                    success: true,
                    message: 'Properties fetched (no roommate profile)',
                    data: {
                        hasProfile: false,
                        properties: pageProperties.map((p) => p.toObject()),
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

            // Sort the FULL pool by score, then take this page's slice.
            const scoreMap = new Map(scores.map((s) => [s.propertyId, s]));
            const ranked = [...allProperties].sort((a, b) => {
                const sa = scoreMap.get(a._id.toString())?.overallScore ?? 0;
                const sb = scoreMap.get(b._id.toString())?.overallScore ?? 0;
                return sb - sa;
            });
            const pageProperties = ranked.slice(skip, skip + limitNum);
            const pageScores = pageProperties
                .map((p) => scoreMap.get(p._id.toString()))
                .filter((s): s is NonNullable<typeof s> => Boolean(s));

            const response: ApiResponse = {
                success: true,
                message: 'Matched properties fetched',
                data: {
                    hasProfile: true,
                    properties: pageProperties.map((p) => p.toObject()),
                    scores: pageScores,
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

    /**
     * GET /matching/roommates
     * Ranked, mutually gender-compatible roommate candidates for the caller,
     * each with the full category breakdown. This is the person-to-person
     * matcher — previously implemented but never exposed over the API.
     */
    async getRoommateMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const profile = await RoommateProfile.findOne({ user: userId, isActive: true });
            if (!profile) {
                res.json({
                    success: true,
                    message: 'No roommate profile yet',
                    data: { hasProfile: false, matches: [] },
                } as ApiResponse);
                return;
            }

            const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20));
            const minScore = Math.max(0, parseInt(String(req.query.minScore ?? '40'), 10) || 40);

            const results = await roommateMatcher.findMatches(profile._id.toString(), limit, minScore);

            // Enrich each match with the candidate's public profile card data.
            const candidateProfiles = await RoommateProfile.find({
                user: { $in: results.map((r) => r.matchedUserId) },
            })
                .populate('user', 'firstName lastName avatar cnicVerified')
                .select('user age gender occupation bio budget interests languages preferredLocations moveInDate lifestyle')
                .lean();

            const byUser = new Map(candidateProfiles.map((p: any) => [String(p.user?._id ?? p.user), p]));
            const matches = results
                .map((r) => {
                    const candidate = byUser.get(r.matchedUserId);
                    if (!candidate) return null;
                    return {
                        overallScore: r.overallScore,
                        breakdown: r.breakdown,
                        candidate,
                    };
                })
                .filter(Boolean);

            res.json({
                success: true,
                message: 'Roommate matches fetched',
                data: { hasProfile: true, matches },
            } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }
}

export const matchingController = new MatchingController();
