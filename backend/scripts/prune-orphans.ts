/**
 * Delete records whose owner or subject no longer exists.
 *
 * Why this exists: deleting users (users:cleanup) and wiping properties
 * (seed --clear-all) never touched the documents that point AT them, so
 * payments, bookings and conversations survived with dangling references.
 * They surface in the admin panel as rows reading "Unknown" / "—" that no
 * action can resolve, because the thing they describe is gone.
 *
 *   npm run db:prune              # DRY RUN — reports what would go
 *   npm run db:prune -- --confirm # actually delete
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { User } from '../src/models/User';
import { Property } from '../src/models/Property';
import { Payment } from '../src/models/Payment';
import { Booking } from '../src/models/Booking';
import { Conversation } from '../src/models/Conversation';
import { Message } from '../src/models/Message';
import { DocumentModel } from '../src/models/Document';
import { Agreement } from '../src/models/Agreement';
import { RoommateProfile } from '../src/models/RoommateProfile';

type Model = mongoose.Model<any>;

/** Each rule: a collection, and the reference fields that must still resolve. */
const RULES: { name: string; model: Model; refs: { field: string; target: Model }[] }[] = [
    { name: 'payments', model: Payment as Model, refs: [
        { field: 'tenant', target: User as Model },
        { field: 'property', target: Property as Model },
    ] },
    { name: 'bookings', model: Booking as Model, refs: [
        { field: 'tenant', target: User as Model },
        { field: 'property', target: Property as Model },
    ] },
    { name: 'agreements', model: Agreement as Model, refs: [
        { field: 'booking', target: Booking as Model },
    ] },
    { name: 'conversations', model: Conversation as Model, refs: [] },
    { name: 'messages', model: Message as Model, refs: [
        { field: 'sender', target: User as Model },
    ] },
    { name: 'documents', model: DocumentModel as Model, refs: [
        { field: 'user', target: User as Model },
    ] },
    { name: 'roommateprofiles', model: RoommateProfile as Model, refs: [
        { field: 'user', target: User as Model },
    ] },
];

async function findOrphans(rule: typeof RULES[number]): Promise<mongoose.Types.ObjectId[]> {
    const docs = await rule.model.find({}).select(rule.refs.map((r) => r.field).join(' ')).lean();
    const orphans: mongoose.Types.ObjectId[] = [];

    for (const doc of docs as any[]) {
        for (const ref of rule.refs) {
            const value = doc[ref.field];
            // A missing reference is a schema question, not rot — only a
            // reference that points at something deleted counts as an orphan.
            if (value && !(await ref.target.exists({ _id: value }))) {
                orphans.push(doc._id);
                break;
            }
        }
    }

    return orphans;
}

async function main(): Promise<void> {
    const confirm = process.argv.includes('--confirm');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roomify';

    await mongoose.connect(mongoUri.replace(/\blocalhost\b/g, '127.0.0.1'));
    console.log('✅ Connected to MongoDB\n');

    let totalOrphans = 0;

    for (const rule of RULES) {
        if (rule.refs.length === 0) continue;

        const orphans = await findOrphans(rule);
        const total = await rule.model.countDocuments();
        totalOrphans += orphans.length;

        console.log(`${rule.name.padEnd(16)} ${String(orphans.length).padStart(4)} orphaned of ${total}`);

        if (confirm && orphans.length > 0) {
            await rule.model.deleteMany({ _id: { $in: orphans } });
        }
    }

    // A conversation with fewer than two surviving participants is unusable.
    const conversations = await Conversation.find({}).select('participants').lean();
    const deadConversations: mongoose.Types.ObjectId[] = [];
    for (const convo of conversations as any[]) {
        const alive = await User.countDocuments({ _id: { $in: convo.participants ?? [] } });
        if (alive < 2) deadConversations.push(convo._id);
    }
    totalOrphans += deadConversations.length;
    console.log(`${'conversations'.padEnd(16)} ${String(deadConversations.length).padStart(4)} orphaned of ${conversations.length}`);

    if (confirm && deadConversations.length > 0) {
        await Conversation.deleteMany({ _id: { $in: deadConversations } });
        await Message.deleteMany({ conversation: { $in: deadConversations } });
    }

    if (!confirm) {
        console.log(`\n🔎 DRY RUN — ${totalOrphans} orphaned record(s) found, nothing deleted.`);
        console.log('   Re-run with:  npm run db:prune -- --confirm\n');
    } else {
        console.log(`\n🗑  Deleted ${totalOrphans} orphaned record(s).\n`);
    }

    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error('❌ Prune failed:', err);
    await mongoose.disconnect();
    process.exit(1);
});
