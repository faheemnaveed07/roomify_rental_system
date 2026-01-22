import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRoommateProfile extends Document {
    user: Types.ObjectId;
    isActive: boolean;
    bio: string;
    occupation: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    budget: {
        min: number;
        max: number;
        currency: string;
    };
    preferredLocations: string[];
    moveInDate: Date;
    lifestyle: {
        sleepSchedule: 'early_bird' | 'night_owl' | 'flexible';
        workSchedule: 'work_from_home' | 'office' | 'hybrid' | 'student';
        cleanlinessLevel: 1 | 2 | 3 | 4 | 5;
        noiseLevel: 'quiet' | 'moderate' | 'social';
        guestsFrequency: 'never' | 'rarely' | 'sometimes' | 'often';
        cookingFrequency: 'never' | 'rarely' | 'sometimes' | 'daily';
    };
    preferences: {
        smokingPreference: 'smoker' | 'non_smoker' | 'outdoor_only' | 'no_preference';
        petPreference: 'has_pets' | 'loves_pets' | 'no_pets' | 'no_preference';
        dietaryPreference: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'halal' | 'no_preference';
        genderPreference: 'male' | 'female' | 'any';
        ageRangePreference: {
            min: number;
            max: number;
        };
    };
    interests: string[];
    languages: string[];
    quizResponses: {
        questionId: string;
        question: string;
        answer: string;
        weight: number;
    }[];
    compatibilityScore: Map<string, number>;
    createdAt: Date;
    updatedAt: Date;
}

const roommateProfileSchema = new Schema<IRoommateProfile>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
            default: '',
        },
        occupation: {
            type: String,
            required: [true, 'Occupation is required'],
            trim: true,
        },
        age: {
            type: Number,
            required: [true, 'Age is required'],
            min: [18, 'Must be at least 18 years old'],
            max: [100, 'Age cannot exceed 100'],
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: [true, 'Gender is required'],
        },
        budget: {
            min: {
                type: Number,
                required: [true, 'Minimum budget is required'],
                min: 0,
            },
            max: {
                type: Number,
                required: [true, 'Maximum budget is required'],
            },
            currency: {
                type: String,
                default: 'PKR',
            },
        },
        preferredLocations: [
            {
                type: String,
                trim: true,
            },
        ],
        moveInDate: {
            type: Date,
            required: [true, 'Move-in date is required'],
        },
        lifestyle: {
            sleepSchedule: {
                type: String,
                enum: ['early_bird', 'night_owl', 'flexible'],
                default: 'flexible',
            },
            workSchedule: {
                type: String,
                enum: ['work_from_home', 'office', 'hybrid', 'student'],
                default: 'office',
            },
            cleanlinessLevel: {
                type: Number,
                min: 1,
                max: 5,
                default: 3,
            },
            noiseLevel: {
                type: String,
                enum: ['quiet', 'moderate', 'social'],
                default: 'moderate',
            },
            guestsFrequency: {
                type: String,
                enum: ['never', 'rarely', 'sometimes', 'often'],
                default: 'sometimes',
            },
            cookingFrequency: {
                type: String,
                enum: ['never', 'rarely', 'sometimes', 'daily'],
                default: 'sometimes',
            },
        },
        preferences: {
            smokingPreference: {
                type: String,
                enum: ['smoker', 'non_smoker', 'outdoor_only', 'no_preference'],
                default: 'no_preference',
            },
            petPreference: {
                type: String,
                enum: ['has_pets', 'loves_pets', 'no_pets', 'no_preference'],
                default: 'no_preference',
            },
            dietaryPreference: {
                type: String,
                enum: ['vegetarian', 'non_vegetarian', 'vegan', 'halal', 'no_preference'],
                default: 'no_preference',
            },
            genderPreference: {
                type: String,
                enum: ['male', 'female', 'any'],
                default: 'any',
            },
            ageRangePreference: {
                min: {
                    type: Number,
                    default: 18,
                },
                max: {
                    type: Number,
                    default: 60,
                },
            },
        },
        interests: [
            {
                type: String,
                trim: true,
            },
        ],
        languages: [
            {
                type: String,
                trim: true,
            },
        ],
        quizResponses: [
            {
                questionId: String,
                question: String,
                answer: String,
                weight: {
                    type: Number,
                    default: 1,
                },
            },
        ],
        compatibilityScore: {
            type: Map,
            of: Number,
            default: new Map(),
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
roommateProfileSchema.index({ user: 1 });
roommateProfileSchema.index({ isActive: 1 });
roommateProfileSchema.index({ 'budget.min': 1, 'budget.max': 1 });
roommateProfileSchema.index({ preferredLocations: 1 });
roommateProfileSchema.index({ gender: 1, 'preferences.genderPreference': 1 });

export const RoommateProfile = mongoose.model<IRoommateProfile>(
    'RoommateProfile',
    roommateProfileSchema
);

export default RoommateProfile;
