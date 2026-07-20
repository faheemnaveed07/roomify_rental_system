/**
 * Move a few seeded listings back into the review queue.
 *
 * Seeded properties are published straight to `active`, so the admin approval
 * queue starts empty and looks broken. Real submissions always arrive as
 * `pending_verification`, so this only exists to give the queue something to
 * work on without re-seeding (which would wipe uploads made while testing).
 *
 *   npm run queue:pending            # one listing per landlord
 *   npm run queue:pending -- --count 5
 *   npm run queue:pending -- --revert   # push them all back to active
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Property } from '../src/models/Property';
import { PropertyStatus } from '@shared/types/property.types';

dotenv.config({ path: path.join(__dirname, '../.env') });

const args = process.argv.slice(2);
const revert = args.includes('--revert');
const countArg = args.indexOf('--count');
const limit = countArg !== -1 ? Number(args[countArg + 1]) : null;

async function main(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roomify';
    await mongoose.connect(mongoUri.replace(/\blocalhost\b/g, '127.0.0.1'));
    console.log('Connected to MongoDB');

    if (revert) {
        const result = await Property.updateMany(
            { status: PropertyStatus.PENDING_VERIFICATION },
            { $set: { status: PropertyStatus.ACTIVE } }
        );
        console.log(`Reverted ${result.modifiedCount} listing(s) to active.`);
        await mongoose.disconnect();
        return;
    }

    let ids: mongoose.Types.ObjectId[];

    if (limit) {
        const docs = await Property.find({ status: PropertyStatus.ACTIVE })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('_id');
        ids = docs.map((d) => d._id as mongoose.Types.ObjectId);
    } else {
        // One per landlord, so the queue shows a spread of owners.
        const grouped = await Property.aggregate<{ _id: mongoose.Types.ObjectId; first: mongoose.Types.ObjectId }>([
            { $match: { status: PropertyStatus.ACTIVE } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$owner', first: { $first: '$_id' } } },
        ]);
        ids = grouped.map((g) => g.first);
    }

    if (ids.length === 0) {
        console.log('No active listings to move.');
        await mongoose.disconnect();
        return;
    }

    const result = await Property.updateMany(
        { _id: { $in: ids } },
        {
            $set: { status: PropertyStatus.PENDING_VERIFICATION },
            $unset: { 'verificationStatus.adminApproved': '', 'verificationStatus.verifiedAt': '', 'verificationStatus.verifiedBy': '' },
        }
    );

    const pending = await Property.countDocuments({ status: PropertyStatus.PENDING_VERIFICATION });
    console.log(`Moved ${result.modifiedCount} listing(s) into review. Queue now holds ${pending}.`);

    await mongoose.disconnect();
}

main().catch((error) => {
    console.error('queue-pending failed:', error);
    process.exit(1);
});
