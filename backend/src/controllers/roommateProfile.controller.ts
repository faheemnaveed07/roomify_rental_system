import { Request, Response, NextFunction } from 'express';
import { RoommateProfile } from '../models/RoommateProfile';
import { ApiResponse } from '@shared/types/api.types';

export class RoommateProfileController {
    /**
     * POST /roommate-profile
     * Create a new roommate profile for the authenticated tenant.
     */
    async createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const existing = await RoommateProfile.findOne({ user: userId });
            if (existing) {
                res.status(409).json({
                    success: false,
                    message: 'Roommate profile already exists. Use PUT to update it.',
                });
                return;
            }

            const profile = new RoommateProfile({ ...req.body, user: userId });
            await profile.save();

            const response: ApiResponse = {
                success: true,
                message: 'Roommate profile created successfully',
                data: profile.toObject(),
            };
            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /roommate-profile
     * Get the authenticated user's roommate profile.
     */
    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const profile = await RoommateProfile.findOne({ user: userId }).lean();
            if (!profile) {
                res.status(404).json({
                    success: false,
                    message: 'No roommate profile found',
                    data: null,
                });
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Profile fetched successfully',
                data: profile,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /roommate-profile
     * Update the authenticated user's roommate profile.
     */
    async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            // Strip fields that must not be updated externally
            const body = { ...req.body };
            ['user', '_id', 'compatibilityScore', 'quizResponses'].forEach((key) => {
                delete body[key];
            });

            const profile = await RoommateProfile.findOneAndUpdate(
                { user: userId },
                { $set: body },
                { new: true, runValidators: true }
            ).lean();

            if (!profile) {
                res.status(404).json({
                    success: false,
                    message: 'No roommate profile found. Create one first.',
                });
                return;
            }

            // The person's answers just changed, so every cached score involving
            // them is stale: clear this profile's own cache and remove its entry
            // from everyone else's. (Nothing ever invalidated these before, so
            // matches kept showing pre-edit numbers.)
            const profileId = String(profile._id);
            await Promise.all([
                RoommateProfile.updateOne(
                    { _id: profileId },
                    { $set: { compatibilityScore: {} } }
                ),
                RoommateProfile.updateMany(
                    { [`compatibilityScore.${profileId}`]: { $exists: true } },
                    { $unset: { [`compatibilityScore.${profileId}`]: '' } }
                ),
            ]).catch(() => { /* cache hygiene only — never block the update */ });

            const response: ApiResponse = {
                success: true,
                message: 'Profile updated successfully',
                data: profile,
            };
            res.json(response);
        } catch (error) {
            next(error);
        }
    }
}

export const roommateProfileController = new RoommateProfileController();
