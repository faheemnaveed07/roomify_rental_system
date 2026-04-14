// ─── Roommate Profile Types ──────────────────────────────────────────────────

export type SleepSchedule = 'early_bird' | 'night_owl' | 'flexible';
export type WorkSchedule = 'work_from_home' | 'office' | 'hybrid' | 'student';
export type CleanlinessLevel = 1 | 2 | 3 | 4 | 5;
export type NoiseLevel = 'quiet' | 'moderate' | 'social';
export type GuestsFrequency = 'never' | 'rarely' | 'sometimes' | 'often';
export type CookingFrequency = 'never' | 'rarely' | 'sometimes' | 'daily';
export type SmokingPreference = 'smoker' | 'non_smoker' | 'outdoor_only' | 'no_preference';
export type PetPreference = 'has_pets' | 'loves_pets' | 'no_pets' | 'no_preference';
export type DietaryPreference = 'vegetarian' | 'non_vegetarian' | 'vegan' | 'halal' | 'no_preference';
export type GenderPreference = 'male' | 'female' | 'any';
export type Gender = 'male' | 'female' | 'other';

export interface IBudget {
    min: number;
    max: number;
    currency: string;
}

export interface ILifestyle {
    sleepSchedule: SleepSchedule;
    workSchedule: WorkSchedule;
    cleanlinessLevel: CleanlinessLevel;
    noiseLevel: NoiseLevel;
    guestsFrequency: GuestsFrequency;
    cookingFrequency: CookingFrequency;
}

export interface IAgeRange {
    min: number;
    max: number;
}

export interface IPreferences {
    smokingPreference: SmokingPreference;
    petPreference: PetPreference;
    dietaryPreference: DietaryPreference;
    genderPreference: GenderPreference;
    ageRangePreference: IAgeRange;
}

/** Shape submitted from the wizard form */
export interface IRoommateProfileForm {
    bio: string;
    occupation: string;
    age: number;
    gender: Gender;
    moveInDate: string; // ISO date string
    budget: IBudget;
    preferredLocations: string[];
    lifestyle: ILifestyle;
    preferences: IPreferences;
    interests: string[];
    languages: string[];
}

/** Shape returned by the API */
export interface IRoommateProfileResponse extends IRoommateProfileForm {
    _id: string;
    user: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

/** Score breakdown item returned by matching service */
export interface IScoreBreakdown {
    category: string;
    score: number;
    weight: number;
    weightedScore: number;
}

/** Full property score object from matching API */
export interface IPropertyCompatibilityScore {
    propertyId: string;
    overallScore: number;
    breakdown: IScoreBreakdown[];
}
