import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Property } from '../src/models/Property';
import { PropertyStatus } from '@shared/types/property.types';

dotenv.config({ path: path.join(__dirname, '../.env') });

const approveAllProperties = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roomify';
        await mongoose.connect(mongoUri.replace(/\blocalhost\b/g, '127.0.0.1'));
        console.log('Connected to MongoDB');

        const result = await Property.updateMany(
            { status: PropertyStatus.PENDING_VERIFICATION },
            {
                $set: {
                    status: PropertyStatus.ACTIVE,
                    'verificationStatus.adminApproved': true,
                    'verificationStatus.verifiedAt': new Date()
                }
            }
        );

        console.log(`Approved ${result.modifiedCount} properties.`);
        process.exit(0);
    } catch (error) {
        console.error('Error approving properties:', error);
        process.exit(1);
    }
};

approveAllProperties();
