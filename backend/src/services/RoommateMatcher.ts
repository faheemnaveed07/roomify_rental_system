import { RoommateProfile, IRoommateProfile } from '../models/RoommateProfile';
import { logger } from '../utils/logger';

interface CompatibilityBreakdown {
    category: string;
    score: number;
    weight: number;
    weightedScore: number;
}

interface CompatibilityResult {
    userId: string;
    matchedUserId: string;
    overallScore: number;
    breakdown: CompatibilityBreakdown[];
}

interface MatchingWeights {
    lifestyle: number;
    preferences: number;
    budget: number;
    location: number;
    schedule: number;
}

const DEFAULT_WEIGHTS: MatchingWeights = {
    lifestyle: 0.25,
    preferences: 0.25,
    budget: 0.20,
    location: 0.15,
    schedule: 0.15,
};

export class RoommateMatcher {
    private weights: MatchingWeights;

    constructor(weights: Partial<MatchingWeights> = {}) {
        this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    }

    /**
     * Calculate compatibility score between two roommate profiles (0-100)
     */
    async calculateCompatibility(
        profileId1: string,
        profileId2: string
    ): Promise<CompatibilityResult> {
        const [profile1, profile2] = await Promise.all([
            RoommateProfile.findById(profileId1).populate('user', 'firstName lastName'),
            RoommateProfile.findById(profileId2).populate('user', 'firstName lastName'),
        ]);

        if (!profile1 || !profile2) {
            throw new Error('One or both profiles not found');
        }

        const breakdown: CompatibilityBreakdown[] = [];

        // Calculate individual category scores
        const lifestyleScore = this.calculateLifestyleScore(profile1, profile2);
        breakdown.push({
            category: 'Lifestyle',
            score: lifestyleScore,
            weight: this.weights.lifestyle,
            weightedScore: lifestyleScore * this.weights.lifestyle,
        });

        const preferencesScore = this.calculatePreferencesScore(profile1, profile2);
        breakdown.push({
            category: 'Preferences',
            score: preferencesScore,
            weight: this.weights.preferences,
            weightedScore: preferencesScore * this.weights.preferences,
        });

        const budgetScore = this.calculateBudgetScore(profile1, profile2);
        breakdown.push({
            category: 'Budget',
            score: budgetScore,
            weight: this.weights.budget,
            weightedScore: budgetScore * this.weights.budget,
        });

        const locationScore = this.calculateLocationScore(profile1, profile2);
        breakdown.push({
            category: 'Location',
            score: locationScore,
            weight: this.weights.location,
            weightedScore: locationScore * this.weights.location,
        });

        const scheduleScore = this.calculateScheduleScore(profile1, profile2);
        breakdown.push({
            category: 'Schedule',
            score: scheduleScore,
            weight: this.weights.schedule,
            weightedScore: scheduleScore * this.weights.schedule,
        });

        // Calculate overall weighted score
        const overallScore = Math.round(
            breakdown.reduce((sum, item) => sum + item.weightedScore, 0)
        );

        // Store compatibility score in both profiles
        await this.storeCompatibilityScore(profile1, profile2._id.toString(), overallScore);
        await this.storeCompatibilityScore(profile2, profile1._id.toString(), overallScore);

        logger.info(`Compatibility calculated: ${profileId1} <-> ${profileId2}: ${overallScore}`);

        return {
            userId: profile1.user.toString(),
            matchedUserId: profile2.user.toString(),
            overallScore,
            breakdown,
        };
    }

    /**
     * Find top matches for a given profile
     */
    async findMatches(
        profileId: string,
        limit = 10,
        minScore = 50
    ): Promise<CompatibilityResult[]> {
        const profile = await RoommateProfile.findById(profileId);
        if (!profile) {
            throw new Error('Profile not found');
        }

        // Get all active profiles except the current one
        const candidates = await RoommateProfile.find({
            _id: { $ne: profileId },
            isActive: true,
        });

        const results: CompatibilityResult[] = [];

        for (const candidate of candidates) {
            try {
                // Check if we already have a cached score
                const cachedScore = profile.compatibilityScore.get(candidate._id.toString());

                if (cachedScore !== undefined && cachedScore >= minScore) {
                    results.push({
                        userId: profile.user.toString(),
                        matchedUserId: candidate.user.toString(),
                        overallScore: cachedScore,
                        breakdown: [],
                    });
                } else if (cachedScore === undefined) {
                    // Calculate new score
                    const result = await this.calculateCompatibility(
                        profileId,
                        candidate._id.toString()
                    );
                    if (result.overallScore >= minScore) {
                        results.push(result);
                    }
                }
            } catch (error) {
                logger.error(`Error calculating match for ${candidate._id}:`, error);
            }
        }

        // Sort by score descending and limit
        return results
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, limit);
    }

    /**
     * Calculate lifestyle compatibility (sleep, cleanliness, noise, etc.)
     */
    private calculateLifestyleScore(
        profile1: IRoommateProfile,
        profile2: IRoommateProfile
    ): number {
        let score = 0;
        let factors = 0;

        // Sleep schedule
        if (profile1.lifestyle.sleepSchedule === profile2.lifestyle.sleepSchedule) {
            score += 100;
        } else if (
            profile1.lifestyle.sleepSchedule === 'flexible' ||
            profile2.lifestyle.sleepSchedule === 'flexible'
        ) {
            score += 70;
        } else {
            score += 30;
        }
        factors++;

        // Cleanliness level (1-5 scale)
        const cleanlinessDiff = Math.abs(
            profile1.lifestyle.cleanlinessLevel - profile2.lifestyle.cleanlinessLevel
        );
        score += Math.max(0, 100 - cleanlinessDiff * 25);
        factors++;

        // Noise level
        if (profile1.lifestyle.noiseLevel === profile2.lifestyle.noiseLevel) {
            score += 100;
        } else if (
            profile1.lifestyle.noiseLevel === 'moderate' ||
            profile2.lifestyle.noiseLevel === 'moderate'
        ) {
            score += 60;
        } else {
            score += 20;
        }
        factors++;

        // Guests frequency
        const guestMap: Record<string, number> = {
            never: 0,
            rarely: 1,
            sometimes: 2,
            often: 3,
        };
        const guestDiff = Math.abs(
            guestMap[profile1.lifestyle.guestsFrequency] -
            guestMap[profile2.lifestyle.guestsFrequency]
        );
        score += Math.max(0, 100 - guestDiff * 33);
        factors++;

        return Math.round(score / factors);
    }

    /**
     * Calculate preferences compatibility (smoking, pets, diet, gender)
     */
    private calculatePreferencesScore(
        profile1: IRoommateProfile,
        profile2: IRoommateProfile
    ): number {
        let score = 0;
        let factors = 0;

        // Smoking preference
        if (
            profile1.preferences.smokingPreference === 'no_preference' ||
            profile2.preferences.smokingPreference === 'no_preference' ||
            profile1.preferences.smokingPreference === profile2.preferences.smokingPreference
        ) {
            score += 100;
        } else if (
            (profile1.preferences.smokingPreference === 'non_smoker' &&
                profile2.preferences.smokingPreference === 'smoker') ||
            (profile1.preferences.smokingPreference === 'smoker' &&
                profile2.preferences.smokingPreference === 'non_smoker')
        ) {
            score += 0; // Strong incompatibility
        } else {
            score += 50;
        }
        factors++;

        // Pet preference
        if (
            profile1.preferences.petPreference === 'no_preference' ||
            profile2.preferences.petPreference === 'no_preference' ||
            profile1.preferences.petPreference === profile2.preferences.petPreference
        ) {
            score += 100;
        } else if (
            (profile1.preferences.petPreference === 'no_pets' &&
                profile2.preferences.petPreference === 'has_pets') ||
            (profile1.preferences.petPreference === 'has_pets' &&
                profile2.preferences.petPreference === 'no_pets')
        ) {
            score += 0;
        } else {
            score += 60;
        }
        factors++;

        // Gender preference
        if (
            profile1.preferences.genderPreference === 'any' ||
            profile2.preferences.genderPreference === 'any'
        ) {
            score += 100;
        } else if (
            profile1.preferences.genderPreference === profile2.gender &&
            profile2.preferences.genderPreference === profile1.gender
        ) {
            score += 100;
        } else {
            score += 0;
        }
        factors++;

        // Age range preference
        const age1InRange =
            profile1.age >= profile2.preferences.ageRangePreference.min &&
            profile1.age <= profile2.preferences.ageRangePreference.max;
        const age2InRange =
            profile2.age >= profile1.preferences.ageRangePreference.min &&
            profile2.age <= profile1.preferences.ageRangePreference.max;

        if (age1InRange && age2InRange) {
            score += 100;
        } else if (age1InRange || age2InRange) {
            score += 50;
        } else {
            score += 20;
        }
        factors++;

        return Math.round(score / factors);
    }

    /**
     * Calculate budget compatibility
     */
    private calculateBudgetScore(
        profile1: IRoommateProfile,
        profile2: IRoommateProfile
    ): number {
        const overlap = this.calculateRangeOverlap(
            profile1.budget.min,
            profile1.budget.max,
            profile2.budget.min,
            profile2.budget.max
        );

        if (overlap > 0.8) return 100;
        if (overlap > 0.6) return 80;
        if (overlap > 0.4) return 60;
        if (overlap > 0.2) return 40;
        if (overlap > 0) return 20;
        return 0;
    }

    /**
     * Calculate location preference compatibility
     */
    private calculateLocationScore(
        profile1: IRoommateProfile,
        profile2: IRoommateProfile
    ): number {
        if (
            profile1.preferredLocations.length === 0 ||
            profile2.preferredLocations.length === 0
        ) {
            return 50; // Neutral if no location preference
        }

        const locations1 = profile1.preferredLocations.map((l) => l.toLowerCase());
        const locations2 = profile2.preferredLocations.map((l) => l.toLowerCase());

        const commonLocations = locations1.filter((l) => locations2.includes(l));
        const totalUnique = new Set([...locations1, ...locations2]).size;

        if (commonLocations.length === 0) return 0;

        return Math.round((commonLocations.length / totalUnique) * 100);
    }

    /**
     * Calculate schedule compatibility
     */
    private calculateScheduleScore(
        profile1: IRoommateProfile,
        profile2: IRoommateProfile
    ): number {
        let score = 0;

        // Work schedule compatibility
        if (profile1.lifestyle.workSchedule === profile2.lifestyle.workSchedule) {
            score += 50;
        } else {
            // Some schedules are more compatible than others
            const compatiblePairs = [
                ['work_from_home', 'work_from_home'],
                ['office', 'office'],
                ['hybrid', 'hybrid'],
                ['work_from_home', 'student'],
                ['office', 'student'],
            ];

            const isCompatible = compatiblePairs.some(
                (pair) =>
                    (pair[0] === profile1.lifestyle.workSchedule &&
                        pair[1] === profile2.lifestyle.workSchedule) ||
                    (pair[1] === profile1.lifestyle.workSchedule &&
                        pair[0] === profile2.lifestyle.workSchedule)
            );

            score += isCompatible ? 30 : 10;
        }

        // Move-in date compatibility (within 2 weeks = 100%, within month = 70%, etc.)
        const dateDiff = Math.abs(
            profile1.moveInDate.getTime() - profile2.moveInDate.getTime()
        );
        const daysDiff = dateDiff / (1000 * 60 * 60 * 24);

        if (daysDiff <= 14) {
            score += 50;
        } else if (daysDiff <= 30) {
            score += 35;
        } else if (daysDiff <= 60) {
            score += 20;
        } else {
            score += 5;
        }

        return score;
    }

    /**
     * Calculate overlap between two ranges (0-1)
     */
    private calculateRangeOverlap(
        min1: number,
        max1: number,
        min2: number,
        max2: number
    ): number {
        const overlapStart = Math.max(min1, min2);
        const overlapEnd = Math.min(max1, max2);

        if (overlapStart > overlapEnd) return 0;

        const overlapLength = overlapEnd - overlapStart;
        const totalRange = Math.max(max1, max2) - Math.min(min1, min2);

        return overlapLength / totalRange;
    }

    /**
     * Store compatibility score in profile
     */
    private async storeCompatibilityScore(
        profile: IRoommateProfile,
        matchedProfileId: string,
        score: number
    ): Promise<void> {
        profile.compatibilityScore.set(matchedProfileId, score);
        await profile.save();
    }

    /**
     * Clear cached compatibility scores for a profile
     */
    async clearCache(profileId: string): Promise<void> {
        const profile = await RoommateProfile.findById(profileId);
        if (profile) {
            profile.compatibilityScore.clear();
            await profile.save();
            logger.info(`Compatibility cache cleared for profile: ${profileId}`);
        }
    }
}

export const roommateMatcher = new RoommateMatcher();

export default RoommateMatcher;
