/**
 * Remove leftover legacy accounts and (re)create a clean admin.
 *
 * Why this exists: `seed.ts --clear-all` wipes every property but only deletes
 * users whose email ends in @demo.com, so accounts created by hand before the
 * reset survive with no listings attached. This script clears those out so the
 * database contains only seeded demo accounts plus one known admin.
 *
 * Usage:
 *   npm run users:cleanup              # DRY RUN — shows what would be deleted
 *   npm run users:cleanup -- --confirm # actually delete
 *
 * Admin credentials can be overridden:
 *   ADMIN_EMAIL=you@domavi.pk ADMIN_PASSWORD='Str0ngPass!' npm run users:cleanup -- --confirm
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { User } from '../src/models/User';
import { Property } from '../src/models/Property';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@demo.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Demo@1234';

/** Accounts we keep: anything seeded (@demo.com) plus the admin itself. */
const KEEP_EMAIL_PATTERN = /@demo\.com$/i;

async function main(): Promise<void> {
    const confirm = process.argv.includes('--confirm');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roomify';

    await mongoose.connect(mongoUri.replace(/\blocalhost\b/, '127.0.0.1'));
    console.log('✅ Connected to MongoDB\n');

    // ── 1. Find legacy (non-seed) accounts ──────────────────────────────────
    const legacy = await User.find({
        email: { $not: KEEP_EMAIL_PATTERN },
    }).select('email role createdAt');

    console.log(`Found ${legacy.length} legacy account(s) (not @demo.com):`);
    for (const u of legacy) {
        const owned = await Property.countDocuments({ owner: u._id });
        console.log(`   • ${u.email.padEnd(34)} role=${String(u.role).padEnd(9)} listings=${owned}`);
    }

    if (legacy.length === 0) {
        console.log('   (nothing to clean)');
    }

    if (!confirm) {
        console.log('\n🔎 DRY RUN — nothing was deleted.');
        console.log('   Re-run with:  npm run users:cleanup -- --confirm\n');
        await mongoose.disconnect();
        return;
    }

    // ── 2. Delete them (and any listings they still own) ────────────────────
    const legacyIds = legacy.map((u) => u._id);
    if (legacyIds.length > 0) {
        const props = await Property.deleteMany({ owner: { $in: legacyIds } });
        const users = await User.deleteMany({ _id: { $in: legacyIds } });
        console.log(`\n🗑  Deleted ${users.deletedCount} user(s) and ${props.deletedCount} orphaned listing(s)`);
    }

    // ── 3. Ensure a clean admin ─────────────────────────────────────────────
    // Always pass the PLAINTEXT password — the User model's pre('save') hook
    // hashes it exactly once (pre-hashing here would double-hash and break login).
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
        existing.role = 'admin' as never;
        existing.status = 'active' as never;
        existing.emailVerified = true;
        existing.password = ADMIN_PASSWORD;
        await existing.save();
        console.log(`🛡  Admin reset: ${ADMIN_EMAIL}`);
    } else {
        await User.create({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            firstName: 'Domavi',
            lastName: 'Admin',
            phone: '03000000000',
            role: 'admin',
            status: 'active',
            emailVerified: true,
        });
        console.log(`🛡  Admin created: ${ADMIN_EMAIL}`);
    }

    const remaining = await User.countDocuments();
    console.log(`\n✅ Done. ${remaining} user(s) remain.`);
    console.log(`   Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}\n`);

    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error('❌ Cleanup failed:', err);
    await mongoose.disconnect();
    process.exit(1);
});
