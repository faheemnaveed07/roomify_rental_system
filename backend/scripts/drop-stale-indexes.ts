/**
 * Drop indexes that the schema no longer declares.
 *
 * Mongoose creates indexes on boot but never removes ones you deleted from the
 * schema, so a bad index keeps enforcing itself on the live database long after
 * the code stopped asking for it.
 *
 * Currently drops:
 *   conversations.participants_1_property_1 (unique) — unique on an array field
 *   indexes one key per participant, so the first conversation about a property
 *   reserved (landlord, property) and every later tenant enquiry on that listing
 *   failed with E11000. The schema now declares the same index without unique.
 *
 *   npm run db:fix-indexes              # DRY RUN
 *   npm run db:fix-indexes -- --confirm
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const STALE: { collection: string; index: string; reason: string }[] = [
    {
        collection: 'conversations',
        index: 'participants_1_property_1',
        reason: 'unique on an array field — blocked a second tenant per listing',
    },
];

async function main(): Promise<void> {
    const confirm = process.argv.includes('--confirm');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roomify';

    await mongoose.connect(mongoUri.replace(/\blocalhost\b/g, '127.0.0.1'));
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db!;

    for (const target of STALE) {
        const indexes = await db.collection(target.collection).indexes();
        const found = indexes.find((i) => i.name === target.index);

        if (!found) {
            console.log(`${target.collection}.${target.index} — already gone`);
            continue;
        }

        // Only the unique variant is the problem; the plain lookup index that
        // replaces it has the same name and must survive.
        if (!found.unique) {
            console.log(`${target.collection}.${target.index} — present but not unique, leaving it`);
            continue;
        }

        console.log(`${target.collection}.${target.index} — unique, needs dropping (${target.reason})`);

        if (confirm) {
            await db.collection(target.collection).dropIndex(target.index);
            console.log('   dropped; Mongoose will recreate it non-unique on next boot');
        }
    }

    if (!confirm) {
        console.log('\n🔎 DRY RUN — nothing changed.');
        console.log('   Re-run with:  npm run db:fix-indexes -- --confirm\n');
    }

    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error('❌ Index fix failed:', err);
    await mongoose.disconnect();
    process.exit(1);
});
