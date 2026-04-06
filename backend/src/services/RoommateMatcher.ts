import { RoommateProfile, IRoommateProfile } from '../models/RoommateProfile';
import { IPropertyDocument } from '../models/Property';
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

// NEW: Property compatibility types
export interface PropertyCompatibilityBreakdown {
    category: string;
    score: number;
    weight: number;
    weightedScore: number;
}

export interface PropertyCompatibilityResult {
    propertyId: string;
    overallScore: number;
    breakdown: PropertyCompatibilityBreakdown[];
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

    // ─────────────────────────────────────────────────────────────────
    // NEW: Profile-to-Property Matching
    // ─────────────────────────────────────────────────────────────────

    /**
     * Calculate how well a roommate profile matches a property.
     * Reuses the same weighted-category philosophy as roommate matching.
     *
     * Categories & weights (sum = 1.0):
     *   Budget:      0.30  — rent within profile budget range
     *   Location:    0.25  — property city/area in preferred locations
     *   Preferences: 0.25  — smoking/pets rules alignment
     *   Lifestyle:   0.10  — gender pref (shared rooms), availability
     *   Schedule:    0.10  — move-in date closeness
     */
    calculatePropertyCompatibility(
        profile: IRoommateProfile,
        property: IPropertyDocument
    ): PropertyCompatibilityResult {
        const weights = {
            budget: 0.30,
            location: 0.25,
            preferences: 0.25,
            lifestyle: 0.10,
            schedule: 0.10,
        };

        const breakdown: PropertyCompatibilityBreakdown[] = [];

        // 1. Budget
        const budgetScore = this.calcPropertyBudgetScore(profile, property);
        breakdown.push({
            category: 'Budget',
            score: budgetScore,
            weight: weights.budget,
            weightedScore: budgetScore * weights.budget,
        });

        // 2. Location
        const locationScore = this.calcPropertyLocationScore(profile, property);
        breakdown.push({
            category: 'Location',
            score: locationScore,
            weight: weights.location,
            weightedScore: locationScore * weights.location,
        });

        // 3. Preferences (rules alignment)
        const preferencesScore = this.calcPropertyPreferencesScore(profile, property);
        breakdown.push({
            category: 'Preferences',
            score: preferencesScore,
            weight: weights.preferences,
            weightedScore: preferencesScore * weights.preferences,
        });

        // 4. Lifestyle (gender, room type)
        const lifestyleScore = this.calcPropertyLifestyleScore(profile, property);
        breakdown.push({
            category: 'Lifestyle',
            score: lifestyleScore,
            weight: weights.lifestyle,
            weightedScore: lifestyleScore * weights.lifestyle,
        });

        // 5. Schedule (move-in date proximity)
        const scheduleScore = this.calcPropertyScheduleScore(profile, property);
        breakdown.push({
            category: 'Schedule',
            score: scheduleScore,
            weight: weights.schedule,
            weightedScore: scheduleScore * weights.schedule,
        });

        const overallScore = Math.round(
            breakdown.reduce((sum, item) => sum + item.weightedScore, 0)
        );

        return {
            propertyId: property._id.toString(),
            overallScore,
            breakdown,
        };
    }

    /**
     * Score all provided properties against a user's roommate profile.
     * Returns sorted results (highest score first).
     * If the user has no profile, returns null.
     */
    async matchPropertiesForUser(
        userId: string,
        properties: IPropertyDocument[]
    ): Promise<PropertyCompatibilityResult[] | null> {
        const profile = await RoommateProfile.findOne({ user: userId, isActive: true });
        if (!profile) return null;

        const results = properties.map((prop) =>
            this.calculatePropertyCompatibility(profile, prop)
        );
        results.sort((a, b) => b.overallScore - a.overallScore);
        return results;
    }

    /**
     * Score a single property for a user. Returns null if no profile.
     */
    async scorePropertyForUser(
        userId: string,
        property: IPropertyDocument
    ): Promise<PropertyCompatibilityResult | null> {
        const profile = await RoommateProfile.findOne({ user: userId, isActive: true });
        if (!profile) return null;
        return this.calculatePropertyCompatibility(profile, property);
    }

    /**
     * Budget: How well does the property rent fit the user's budget range?
     */
    private calcPropertyBudgetScore(
        profile: IRoommateProfile,
        property: IPropertyDocument
    ): number {
        const rent = property.rent?.amount ?? 0;
        const { min, max } = profile.budget;

        if (rent >= min && rent <= max) return 100; // perfect fit
        if (rent < min) {
            // Cheaper than min — still good but slightly off
            const gap = min - rent;
            const tolerance = min * 0.3;
            return gap <= tolerance ? 80 : 60;
        }
        // Over budget
        const overBy = rent - max;
        const tolerance = max * 0.15;
        if (overBy <= tolerance) return 60;
        const tolerance2 = max * 0.40;
        if (overBy <= tolerance2) return 30;
        return 10;
    }

    /**
     * Location: Does the property city/area appear in preferred locations?
     */
    private calcPropertyLocationScore(
        profile: IRoommateProfile,
        property: IPropertyDocument
    ): number {
        if (!profile.preferredLocations || profile.preferredLocations.length === 0) {
            return 50; // neutral — no preference set
        }
        const preferred = profile.preferredLocations.map((l) => l.toLowerCase().trim());
        const city = (property.location?.city || '').toLowerCase().trim();
        const area = (property.location?.area || '').toLowerCase().trim();

        if (preferred.includes(city) && preferred.includes(area)) return 100;
        if (preferred.includes(area)) return 90;
        if (preferred.includes(city)) return 70;

        // Partial match — check if any preferred location is a substring
        const anyPartial = preferred.some(
            (loc) => city.includes(loc) || area.includes(loc) || loc.includes(city) || loc.includes(area)
        );
        return anyPartial ? 40 : 0;
    }

    /**
     * Preferences: Do the property rules align with user smoking/pet preferences?
     */
    private calcPropertyPreferencesScore(
        profile: IRoommateProfile,
        property: IPropertyDocument
    ): number {
        let score = 0;
        let factors = 0;

        // Smoking
        const smokingAllowed = property.rules?.smokingAllowed ?? false;
        const userSmokingPref = profile.preferences.smokingPreference;
        if (userSmokingPref === 'no_preference') {
            score += 100;
        } else if (userSmokingPref === 'smoker' || userSmokingPref === 'outdoor_only') {
            score += smokingAllowed ? 100 : 40;
        } else {
            // non_smoker
            score += smokingAllowed ? 20 : 100;
        }
        factors++;

        // Pets
        const petsAllowed = property.rules?.petsAllowed ?? false;
        const userPetPref = profile.preferences.petPreference;
        if (userPetPref === 'no_preference') {
            score += 100;
        } else if (userPetPref === 'has_pets' || userPetPref === 'loves_pets') {
            score += petsAllowed ? 100 : 30;
        } else {
            // no_pets
            score += petsAllowed ? 30 : 100;
        }
        factors++;

        // Visitors
        const visitorsAllowed = property.rules?.visitorsAllowed ?? true;
        const guestFreq = profile.lifestyle.guestsFrequency;
        if (guestFreq === 'often' || guestFreq === 'sometimes') {
            score += visitorsAllowed ? 100 : 30;
        } else {
            score += 100; // rarely/never — doesn't matter
        }
        factors++;

        return Math.round(score / factors);
    }

    /**
     * Lifestyle: Gender preference match for shared rooms; room type match.
     */
    private calcPropertyLifestyleScore(
        profile: IRoommateProfile,
        property: IPropertyDocument
    ): number {
        const propType = property.propertyType;

        if (propType === 'shared_room') {
            const propGenderPref = property.sharedRoomDetails?.genderPreference || 'any';
            const userGenderPref = profile.preferences.genderPreference;
            const userGender = profile.gender;

            let genderScore = 100;
            // Check if the property gender pref excludes the user
            if (propGenderPref !== 'any' && propGenderPref !== userGender) {
                genderScore = 0; // hard mismatch
            } else if (userGenderPref !== 'any' && propGenderPref !== 'any' && userGenderPref !== propGenderPref) {
                genderScore = 30;
            }

            // Bed availability
            const availBeds = property.sharedRoomDetails?.availableBeds ?? 0;
            const availScore = availBeds > 0 ? 100 : 20;

            return Math.round((genderScore + availScore) / 2);
        }

        // Full property — lifestyle is neutral
        return 70;
    }

    /**
     * Schedule: How close is the user's desired move-in to property availability?
     */
    private calcPropertyScheduleScore(
        profile: IRoommateProfile,
        property: IPropertyDocument
    ): number {
        const profileDate = new Date(profile.moveInDate).getTime();
        const propDate = property.availability?.availableFrom
            ? new Date(property.availability.availableFrom).getTime()
            : Date.now();

        // Property should be available on or before move-in
        if (propDate <= profileDate) {
            const daysEarly = (profileDate - propDate) / (1000 * 60 * 60 * 24);
            if (daysEarly <= 30) return 100;
            if (daysEarly <= 90) return 70;
            return 50; // available way too early
        }

        // Property available after desired move-in
        const daysLate = (propDate - profileDate) / (1000 * 60 * 60 * 24);
        if (daysLate <= 14) return 80;
        if (daysLate <= 30) return 50;
        if (daysLate <= 60) return 25;
        return 10;
    }
}

export const roommateMatcher = new RoommateMatcher();

export default RoommateMatcher;
